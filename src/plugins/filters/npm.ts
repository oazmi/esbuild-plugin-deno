/** an esbuild plugin that strips away `npm:` specifiers,
 * and indirectly resolves the npm-package resource path through the {@link resolverPlugin}.
 * 
 * @module
*/

import { DEBUG, defaultGetCwd, dom_decodeURI, ensureEndSlash, escapeLiteralStringForRegex, execShellCommand, getUriScheme, identifyCurrentRuntime, isObject, isString, joinPaths, normalizePath, parsePackageUrl, pathToPosixPath, promise_outside, replacePrefix, RUNTIME, type DeepPartial } from "../../deps.ts"
import { ensureLocalPath, logLogger, syncTaskQueueFactory } from "../funcdefs.ts"
import { nodeModulesResolverFactory, type resolverPlugin } from "../resolvers.ts"
import type { CommonPluginData, EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, LoggerFunction, OnResolveArgs, OnResolveCallback } from "../typedefs.ts"
import { defaultEsbuildNamespaces, DIRECTORY, PLUGIN_NAMESPACE } from "../typedefs.ts"


/** acceptable directory formats for specifying your "resolve directory" for scanning and traversing `"./node_modules/"` folders. */
export type NodeModuleDirFormat = (string | URL | DIRECTORY)

/** these options let you precisely customize how and where your missing npm-packages should get installed. */
export interface NpmAutoInstallCliConfig {
	/** specify the working-directory where your `npm` {@link command} should be invoked,
	 * so that your package will get installed to `${dir}/node_modules/`.
	 * 
	 * note that a trailing slash is always added to `dir` if it's missing it, and you can also provide a non-normalized path,
	 * or relative paths with respect to esbuild's `absWorkingDir` (which fallbacks to the runtime's current-working-directory if `undefined`).
	 * 
	 * furthermore, you should **not** add this directory to the {@link NpmPluginSetupConfig.nodeModulesDirs} array,
	 * because the plugin **will** add this `dir` to the beginning of that array internally.
	 * 
	 * @defaultValue `DIRECTORY.ABS_WORKING_DIR`
	*/
	dir: NodeModuleDirFormat

	/** a function which should accept the package name-and-version string (such as `"react@17 - 19"`),
	 * and then return a cli command, that when executed, will install the npm-package to the `${dir}/node_modules/` folder.
	 * 
	 * note that you _can_ technically change the directory where the command is executed using `cd`,
	 * however if you down a subdirectory (for instance `cd ./temp/ && npm install "${package_name_and_version}" --no-save`),
	 * then the installed package will not be discoverable by esbuild's node-resolution-algorithm, because it only traverses upwards.
	 * thus, you may only navigate to ancestral directories (such as `cd ../temp/ && npm install "${package_name_and_version}" --no-save`),
	 * for the new package to be discoverable by esbuild.
	 * 
	 * @defaultValue ```(package_name_and_version: string) => (`npm install "${package_name_and_version}" --no-save`)```
	*/
	command: (package_name_and_version: string) => string

	/** enable logging of the npm-package installation command, when DEBUG.LOG is ennabled. */
	log?: boolean | LoggerFunction
}

const defaultNpmAutoInstallCliConfig: NpmAutoInstallCliConfig = {
	dir: DIRECTORY.ABS_WORKING_DIR,
	command: (package_name_and_version: string) => (`npm install "${package_name_and_version}" --no-save`),
}

/** this is a synchronous task queuer that executes task-functions sequentially.
 * we need this in order to ensure that only ONE shell process is instantiated at a time to execute `npm install` or equivalent.
 * this is because otherwise, multiple `npm install` commands running on the same directory will cause conflicts in your filesystem read and write operation.
 * this problem of multiple installation combating over the same set of files is very evident in large projects that require multiple auto installations,
 * resulting in corrupted/missing files even after installation.
*/
const sync_task_queuer = syncTaskQueueFactory()

/** this is a global dictionary that dictates which npm-libraries have been installed through the `autoInstall`er.
 * this ensures that:
 * - the same library is not queued for installation twice or more, due to two or more entries requesting for the same package almost simultaneously.
 * - a partially installed package's resolvable resource (i.e. when installation is in progress) will wait to resolve until the package is fully installed.
 *   this is because we don't want the resolvable resource to be loaded, which will in turn require the resolution of relative-resources,
 *   which may not exist at the moment (since installation is in progress), causing the output path provided by resolver-pipeline's relative-path resolver to not load and fail.
*/
const packageAvailability = new Map<string, Promise<void>>()

/** configuration options for the {@link npmPluginSetup} and {@link npmPlugin} functions. */
export interface NpmPluginSetupConfig {
	/** provide a list of prefix specifiers used for npm packages.
	 * 
	 * @defaultValue `["npm:"]`
	*/
	specifiers: string[]

	/** specify the side-effects potential of all npm-packages.
	 * - `true`: this would mark all packages as having side-effects, resulting in basically no tree-shaking (large bundle size).
	 * - `false`: this would mark all packages being side-effects free, allowing for tree-shaking to take place and reducing bundle size.
	 * - `"auto"`: this would let esbuild decide which packages are side-effect free,
	 *   by probing into the package's `package.json` file and searching for the `"sideEffects"` field.
	 *   however, since many unseasoned package authors do not know about this field (i.e. me), the lack of it makes esbuild default to `false`.
	 *   which is in effect results in a larger bundled code size.
	 * 
	 * TODO: in the future, I would like to probe into the `package.json` file of the package myself (by deriving its path from the `resolved_path`),
	 *   and then determine weather or not the `"sideEffects"` field is actually present.
	 *   if it isn't then we will default to `false` if this config option is set to `"defaultFalse"`,
	 *   or default to `true` if this config option is set to `"defaultTrue"`.
	 *   (esbuild exhibits the `"defaultTrue"` behavior by default anyway, so this specific option selection will be kind of redundant).
	 * TODO: since in effect the `"auto"` option is equivalent to `"defaultTrue"`, I'm uncertain whether I should even keep the `"auto"` option.
	 * 
	 * @defaultValue `"auto"`
	*/
	sideEffects: boolean | "auto" | "defaultFalse" | "defaultTrue"

	/** auto install missing npm-package (the executed action/technique will vary based on the js-runtime-environment).
	 * 
	 * ### options
	 * 
	 * - `false`: missing npm-packages are not installed.
	 *   this will result in esbuild's build process to terminate, since the missing package will not be resolvable.
	 * 
	 * - `true`: equivalent to the `"auto-cli"` option.
	 * 
	 * - `"auto-cli"`: a cli-command will be picked depend on your js-runtime:
	 *   - for Deno, the cli-command of the `"deno"` option will be executed.
	 *   - for Bun, the cli-command of the `"bun"` option will be executed.
	 *   - for Nodejs, the cli-command of the `"npm"` option will be executed.
	 * 
	 * - `"auto"`: the technique picked will depend on your js-runtime:
	 *   - for Deno and Bun, the `"dynamic"` option will be chosen.
	 *   - for Nodejs, the `"npm"` option will be chosen.
	 * 
	 * - `"dynamic"`: a dynamic "on-the-fly" import will be performed,
	 *   forcing your runtime to cache the npm-package in a local `"./node_modules/"` directory.
	 *   > [!warning]
	 *   > the underlying technique for the `"dynamic"` option used will only work for Deno and Bun, but not Nodejs.
	 *   > 
	 *   > moreover, you will **need** to have a certain configurations for this option to work on Deno and Bun:
	 *   > - for Deno, your project's "deno.json" file's `"nodeModulesDir"` should be set to `"auto"`,
	 *   >   so that a local `"./node_modules/"` folder will be created for installed packages.
	 *   > - for Bun, your project's directory, or one of its ancesteral directory, must contain a `"./node_modules/"` folder,
	 *   >   so that bun will opt for node-package-resolution instead of its default bun-style-resolution.
	 *   >   TODO: I haven't actually tried it on bun, and I'm only speculating based on the information here:
	 *   >   [link](https://bun.sh/docs/runtime/autoimport)
	 * 
	 * - `"npm"`: this will run the `npm install "${pkg}" --no-save` cli-command in your `absWorkingDir`.
	 *   > [!note]
	 *   > the `--no-save` flag warrants that your `package.json` file will not be modified (nor created if lacking) when a package is being installed.
	 * 
	 * - `"deno"`: this will run the `deno cache --no-config --node-modules-dir="auto" --allow-scripts "npm:${pkg}"` cli-command in your `absWorkingDir`.
	 *   > [!note]
	 *   > - `deno cache` installs the package, but without modifying (or creating) the "deno.json" file.
	 *   > - the `--no-config` option prevents deno from reading the "deno.json" (and "deno.lock") config file that may exist in an ancesteral directory of the desired installation directory,
	 *   >   thereby changing the location where the `"./node_modules/"` installation occurs.
	 *   >   moreover, giving deno access to the config file makes it reload all dependency modules listed in the "deno.json", not just our requested module alone.
	 *   >   this can be extremely annoying at times, and especially annoying when verifying the behavior of the plugins.
	 *   > - the `--node-modules-dir="auto"` flag ensures that the package is installed under the `absWorkingDir` directory's `"./node_modules/"` subdirectory,
	 *   >   instead of the global cache directory (which uses a non-node-module compatible layout).
	 *   > - the `--allow-scripts` flag permits `preinstall` and `postinstall` [lifecycle scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts#life-cycle-scripts) to run.
	 * 
	 * - `"deno-noscript"`: this will run the `deno cache --no-config --node-modules-dir="auto" "${pkg}"` cli-command in your `absWorkingDir`.
	 *   > [!note]
	 *   > this is different from the `"deno"` option because it does not permit the execution of `preinstall` and `postinstall` lifecycle scripts.
	 *   > lifecycle scripts could pose a security thread, but some popular packages that bind to native binaries (such as `npm:sqlite3`) require it.
	 * 
	 * - `"bun"`: this will run the `bun install "${pkg}" --no-save` cli-command in your `absWorkingDir`.
	 *   > [!note]
	 *   > the `--no-save` flag warrants that your `package.json` file will not be modified (nor created if lacking) when a package is being installed.
	 * 
	 * - `"pnpm"`: this will run the `pnpm install "${pkg}"` cli-command in your `absWorkingDir`.
	 *   > [!caution]
	 *   > since the `--no-save` flag is not supported in pnpm (see [issue#1237](https://github.com/pnpm/pnpm/issues/1237)),
	 *   > your `package.json` file will either get modified, or a new one will get created if it does not exist.
	 * 
	 * - for any other custom cli-command, or to use an alternate installation directory,
	 *   you may provide an object that adheres to the {@link NpmAutoInstallCliConfig} interface.
	 * 
	 * @defaultValue `true`
	*/
	autoInstall: boolean | "auto-cli" | "auto" | "dynamic" | "npm" | "deno" | "deno-noscript" | "bun" | "pnpm" | Partial<NpmAutoInstallCliConfig>

	/** specify which `namespace`s should be intercepted by the npm-specifier-plugin.
	 * all other `namespace`s will not be processed by this plugin.
	 * 
	 * if you have a plugin with a custom loader that works under some `"custom-namespace"`,
	 * you can include your `"custom-namespace"` here, so that if it performs an npm-specifier import,
	 * that import path will be captured by this plugin, and then consequently fetched by the http-loader plugin.
	 * but do note that the namespace of the loaded resource will switch to the http-plugin's loader {@link namespace}
	 * (which defaults to {@link PLUGIN_NAMESPACE.LOADER_HTTP}), instead of your `"custom-namespace"`.
	 * 
	 * @defaultValue `[undefined, "", "file"]` (also this plugin's {@link namespace} gets added later on)
	*/
	acceptNamespaces: Array<string | undefined>

	/** specify which directories should be used for scanning for npm-packages inside of various `node_modules` folders.
	 * 
	 * here, you may provide a collection of:
	 * - absolute filesystem paths (`string`).
	 * - paths relative to your current working directory (`string` beginning with "./" or "../").
	 * - file-uris which being with the `"file://"` protocol (`string` or `URL`).
	 * - or one of the accepted special directory enums in {@link DIRECTORY}.
	 * 
	 * each directory that you provide here will be used by esbuild's native resolver as a starting point for scanning for `node_modules` npm-packages,
	 * and it will work upwards from there until the root of your drive is reached,
	 * and until all `"./node_modules/"` folders up the directory tree have been scanned.
	 * 
	 * > [!tip]
	 * > to understand how the scanning works, and to defer for inefficient redundant scanning,
	 * > refer to the underlying scanner function's documentation: {@link findResolveDirOfNpmPackageFactory}.
	 * 
	 * @defaultValue `[DIRECTORY.ABS_WORKING_DIR]` (equivalent to `[DIRECTORY.ABS_WORKING_DIR, DIRECTORY.CWD]`)
	*/
	nodeModulesDirs: NodeModuleDirFormat[]


	/** enable logging of resolved npm-package's path, when {@link DEBUG.LOG} is ennabled.
	 * 
	 * when set to `true`, the logs will show up in your console via `console.log()`.
	 * you may also provide your own custom logger function if you wish.
	 * 
	 * @defaultValue `false`
	*/
	log: boolean | LoggerFunction
}

const defaultNpmPluginSetupConfig: NpmPluginSetupConfig = {
	specifiers: ["npm:"],
	sideEffects: "auto",
	autoInstall: true,
	acceptNamespaces: defaultEsbuildNamespaces,
	nodeModulesDirs: [DIRECTORY.ABS_WORKING_DIR],
	log: false,
}

/** this plugin lets you redirect resource-paths beginning with an `"npm:"` specifier to your local `node_modules` folder.
 * after that, the module resolution task is carried by esbuild (for which you must ensure that you've ran `npm install`).
 * check the interface {@link NpmPluginSetupConfig} to understand what configuration options are available to you.
 * 
 * example: `"npm:@oazmi/kitchensink@^0.9.8"` will be redirected to `"@oazmi/kitchensink"`.
 * and yes, the version number does currently get lost as a result.
 * so you'll have to pray that esbuild ends up in the `node_modules` folder consisting of the correct version, otherwise, rip.
*/
export const npmPluginSetup = (config: DeepPartial<NpmPluginSetupConfig> = {}): EsbuildPluginSetup => {
	const
		{ specifiers, sideEffects, autoInstall: _autoInstall, acceptNamespaces: _acceptNamespaces, nodeModulesDirs, log } = { ...defaultNpmPluginSetupConfig, ...config },
		logFn = log ? (log === true ? logLogger : log) : undefined,
		acceptNamespaces = new Set([..._acceptNamespaces, PLUGIN_NAMESPACE.LOADER_HTTP]),
		forcedSideEffectsMode = isString(sideEffects) ? undefined : sideEffects,
		autoInstall = autoInstallOptionToNpmAutoInstallCliConfig(_autoInstall)

	// if the npm-package installation directory has been specified for the installation cli-command,
	// then prepend that path to `nodeModulesDirs`, so that the `validResolveDirFinder` function
	// (which relies on esbuild's native node-module resolution) will be able locate the newly installed package.
	if (isObject(autoInstall)) { nodeModulesDirs.unshift(autoInstall.dir) }

	return (async (build: EsbuildPluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const
			{ absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions,
			cwd = ensureEndSlash(defaultGetCwd),
			abs_working_dir = absWorkingDir ? ensureEndSlash(pathToPosixPath(absWorkingDir)) : defaultGetCwd,
			dir_path_converter = (dir_path: NodeModuleDirFormat): string => {
				switch (dir_path) {
					case DIRECTORY.CWD: return cwd
					case DIRECTORY.ABS_WORKING_DIR: return abs_working_dir
					default: return pathOrUrlToLocalPathConverter(dir_path)
				}
			},
			node_modules_dirs = [...(new Set(nodeModulesDirs.map(dir_path_converter)))],
			validResolveDirFinder = findResolveDirOfNpmPackageFactory(build),
			autoInstallConfig = isObject(autoInstall)
				? { dir: dir_path_converter(autoInstall.dir), command: autoInstall.command, log } satisfies NpmAutoInstallCliConfig
				: autoInstall

		const npmSpecifierResolverFactory = (specifier: string): OnResolveCallback => (async (args: OnResolveArgs) => {
			// skip resolving any `namespace` that we do not accept
			if (!acceptNamespaces.has(args.namespace)) { return }
			const
				{ path, pluginData = {}, resolveDir = "", namespace: original_ns, ...rest_args } = args,
				well_formed_npm_package_alias = replacePrefix(path, specifier, "npm:")!,
				{ scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias),
				npm_package_name = (scope ? "@" + scope + "/" : "") + pkg,
				resolved_npm_package_alias = `${npm_package_name}${pathname === "/" ? "" : pathname}`,
				// below, we flush away any previous import-map and runtime-package manager stored in the plugin-data,
				// as we will need to reset them for the current self-contained npm package's scope.
				{ importMap: _0, runtimePackage: _1, resolverConfig: _2, ...restPluginData } = pluginData,
				// NOTE:
				//   it is absolutely necessary for the `resolveDir` argument to exist when resolving an npm package, otherwise esbuild will not know where to look for the node module.
				//   this is why when there is no `resolveDir` available, we will use either the absolute-working-directory or the current-working-directory as a fallback.
				//   you may wonder why the `resolveDir` would disappear, and that's because our other plugins don't bother with setting/preserving this option in their loaders,
				//   which is why it disappears when the path being resolved comes from an importer that was resolved by one of these plugins' loader.
				// TODO:
				//   version presrvation is also an issue, since the version that will actually end up being used is whatever is available in `node_modules`,
				//   instead of the `desired_version`. unless we ask deno to install/import that specific version to our `node_modules`.
				scan_resolve_dir: string[] = resolveDir === "" ? node_modules_dirs : [resolveDir, ...node_modules_dirs]

			// first, we will ensure that we wait for the npm-package if its installation is underway
			let
				package_availability_promise = packageAvailability.get(npm_package_name),
				package_availability_promise_resolver: (undefined | (() => void)) = undefined
			if (!package_availability_promise) {
				// this is the first time we've encountered this package, so we must create a new promise for its availability,
				// to stop subsequent attempts at resolving this package from succeeding _before_ this request has been resolved first (which may involve auto-installation).
				const [promise, resolve] = promise_outside<void>()
				packageAvailability.set(npm_package_name, (package_availability_promise = promise))
				package_availability_promise_resolver = resolve
			} else {
				// if this package awas encounter previously (via a different resource), then wait for its availability to be confirmed.
				await package_availability_promise
			}

			// we now let esbuild scan and traverse multiple directories in search for our desired npm-package.
			// if we don't initially land on a hit (i.e. none of the directories lead to the desired package),
			// then if the `autoInstall` option is enabled, we will invoke deno/bun.npm/pnpm to install the npm-package (either via the cli, or dynamic-import).
			// hopefully that will lead to the package now being available under some `"./node_modules/"` directory, for esbuild to discover it.
			let valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir)
			if (!valid_resolve_dir && autoInstallConfig) {
				// below, `sync_task_queuer` ensures that only one instance of a new terminal is running, to avoid parallel `npm install`s from occurring.
				await sync_task_queuer(installNpmPackage, well_formed_npm_package_alias, autoInstallConfig)
				valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir)
			}
			if (!valid_resolve_dir) {
				(logFn ?? logLogger)(
					`[npmPlugin]: WARNING! no valid "resolveDir" directory was found to contain the npm package named "${resolved_npm_package_alias}"`,
					`\n\twe will still continue with the path resolution (in case the global-import-map may alter the situation),`,
					`\n\tbut it is almost guaranteed not to work if the current-working-directory was already part of the scanned directories.`,
				)
			}
			// by this point, the auto-installation would have taken place if necessary.
			// so, if this was the first encounter of this package, then we better signal that it is now available.
			package_availability_promise_resolver?.()

			const abs_result = await build.resolve(resolved_npm_package_alias, {
				...rest_args,
				resolveDir: valid_resolve_dir,
				namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
				pluginData: { ...restPluginData, resolverConfig: { useRuntimePackage: false, useImportMap: false, useNodeModules: true } } satisfies CommonPluginData,
			})
			const resolved_path = abs_result.path
			if (DEBUG.LOG && logFn) {
				logFn(`[npmPlugin]       resolving: "${path}", with resolveDir: "${valid_resolve_dir}"` + (!resolved_path ? ""
					: `\n>> successfully resolved to: ${resolved_path}`
				))
			}

			// if the user wants to force side-effect-free mode for all packages, then do so.
			if (forcedSideEffectsMode !== undefined) { abs_result.sideEffects = forcedSideEffectsMode }
			// esbuild's native loaders only operate on the default `""` and `"file"` namespaces,
			// which is why we don't restore back the `original_ns` namespace.
			abs_result.namespace = ""
			return abs_result
		})

		specifiers.forEach((specifier) => {
			const filter = new RegExp(`^${escapeLiteralStringForRegex(specifier)}`)
			build.onResolve({ filter }, npmSpecifierResolverFactory(specifier))
		})
	})
}

/** {@inheritDoc npmPluginSetup} */
export const npmPlugin = (config?: Partial<NpmPluginSetupConfig>): EsbuildPlugin => {
	return {
		name: "oazmi-npm-plugin",
		setup: npmPluginSetup(config),
	}
}

const pathOrUrlToLocalPathConverter = (dir_path_or_url: Exclude<NodeModuleDirFormat, DIRECTORY>): string => {
	const
		path = isString(dir_path_or_url) ? dir_path_or_url : dir_path_or_url.href,
		path_schema = getUriScheme(path),
		dir_path = normalizePath(ensureEndSlash(path_schema === "relative"
			? joinPaths(ensureEndSlash(defaultGetCwd), path)
			: path
		))
	switch (path_schema) {
		case "local":
		case "relative":
		case "file":
			return ensureLocalPath(dir_path)
		default: throw new Error(`expected a filesystem path, or a "file://" url, but received the incompatible uri scheme "${path_schema}".`)
	}
}

/** the signature of the function returned by {@link findResolveDirOfNpmPackageFactory}.
 * 
 * this function makes esbuild scan multiple directories in search for an npm-package inside of some `"./node_modules/"` folder.
 * the first valid directory, in which the npm-package was scanned for was successful, will be returned.
 * 
 * @param package_name the name of the npm-package to search for in the list of directories to scan.
 * @param directories_to_scan the list of parent directories in which the `"./node_modules/"` scanning should be performed.
 *   note to **not** include directories which are an ancestor to another directory in the list.
 *   this is because esbuild traverses up the directory tree when searching for the npm-package in various `"./node_modules/"` folders.
 *   thus it would be redundant to include ancesteral directories.
 *   moreover, you may also provide `file://` urls (in either `string` or `URL` format), instead of a filesystem path.
 * @returns if the requested npm-package was found in one of the listed directories,
 *   then that directory's absolute path will be returned, otherwise `undefined` will be returned.
*/
export type FindResolveDirOfNpmPackage_FunctionSignature = (
	package_name: string,
	directories_to_scan: (string | URL)[],
) => Promise<string | undefined>

/** generate a function that makes esbuild scan multiple directories in search for an npm-package inside of some `"./node_modules/"` folder.
 * the first valid directory, in which the npm-package was scanned for was successful, will be returned.
 * 
 * @param build the esbuild "build" object that's available inside of esbuild plugin setup functions.
 *   for mock testing, you can also provide a stub like this: `const build = { esbuild }`.
 *   follow the example below that makes use of a similar stub.
 * 
 * @example
 * ```ts ignore
 * import * as esbuild from "npm:esbuild@0.25.0"
 * 
 * const build = { esbuild }
 * const myPackageDirScanner = findResolveDirOfNpmPackageFactory(build)
 * const my_package_resolve_dir = await myPackageDirScanner("@oazmi/tsignal", [
 * 	"D:/temp/node/",
 * 	"file:///d:/sdk/cache/",
 * ])
 * 
 * console.log(`the "@oazmi/tsignal" package can be located when resolveDir is set to:`, my_package_resolve_dir)
 * ```
*/
export const findResolveDirOfNpmPackageFactory = (build: EsbuildPluginBuild): FindResolveDirOfNpmPackage_FunctionSignature => {
	const node_modules_resolver = nodeModulesResolverFactory({ absWorkingDir: undefined }, build)

	const validateNodeModuleExists = async (abs_resolve_dir: string, node_module_package_name: string): Promise<boolean> => {
		const result = await node_modules_resolver({
			path: node_module_package_name,
			importer: "",
			resolveDir: abs_resolve_dir,
		})
		return (result.path ?? "") !== "" ? true : false
	}

	return async (
		node_module_package_name_to_search: string,
		node_module_parent_directories_to_scan: (string | URL)[],
	): Promise<string | undefined> => {
		const abs_local_directories = node_module_parent_directories_to_scan.map(pathOrUrlToLocalPathConverter)
		for (const abs_resolve_dir of abs_local_directories) {
			const node_module_was_found = await validateNodeModuleExists(abs_resolve_dir, node_module_package_name_to_search)
			if (node_module_was_found) { return abs_resolve_dir }
		}
	}
}

const
	current_js_runtime = identifyCurrentRuntime(),
	package_installation_command_deno: NpmAutoInstallCliConfig["command"] = (package_name_and_version: string) => (`deno cache --node-modules-dir="auto" --allow-scripts --no-config "npm:${package_name_and_version}"`),
	package_installation_command_deno_noscript: NpmAutoInstallCliConfig["command"] = (package_name_and_version: string) => (`deno cache --node-modules-dir="auto" --no-config "npm:${package_name_and_version}"`),
	package_installation_command_npm: NpmAutoInstallCliConfig["command"] = (package_name_and_version: string) => (`npm install "${package_name_and_version}" --no-save`),
	package_installation_command_bun: NpmAutoInstallCliConfig["command"] = (package_name_and_version: string) => (`bun install "${package_name_and_version}" --no-save`),
	package_installation_command_pnpm: NpmAutoInstallCliConfig["command"] = (package_name_and_version: string) => (`pnpm install "${package_name_and_version}"`)

const autoInstallOptionToNpmAutoInstallCliConfig = (option?: Partial<NpmPluginSetupConfig["autoInstall"]>): (undefined | "dynamic" | NpmAutoInstallCliConfig) => {
	if (!option) { return undefined }
	if (isObject(option)) { return { ...defaultNpmAutoInstallCliConfig, ...option } }
	switch (option) {
		case "auto": return (current_js_runtime === RUNTIME.DENO || current_js_runtime === RUNTIME.BUN)
			? "dynamic"
			: autoInstallOptionToNpmAutoInstallCliConfig("npm")
		case true:
		case "auto-cli": switch (current_js_runtime) {
			case RUNTIME.DENO: return autoInstallOptionToNpmAutoInstallCliConfig("deno")
			case RUNTIME.BUN: return autoInstallOptionToNpmAutoInstallCliConfig("bun")
			case RUNTIME.NODE: return autoInstallOptionToNpmAutoInstallCliConfig("npm")
			default: throw new Error("ERROR! cli-installation of npm-packages is not possible on web-browser runtimes.")
		}
		case "dynamic": return "dynamic"
		case "deno": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_deno }
		case "deno-noscript": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_deno_noscript }
		case "bun": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_bun }
		case "npm": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_npm }
		case "pnpm": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_pnpm }
		default: return undefined
	}
}

/** see {@link NpmAutoInstallCliConfig} and {@link NpmPluginSetupConfig.autoInstall} for details on how to customize. */
export type InstallNpmPackageConfig = "dynamic" | NpmAutoInstallCliConfig & { dir: string | URL }

/** this function installs an npm-package to your project's `"./node_modules/"` folder.
 * see {@link NpmAutoInstallCliConfig} and {@link NpmPluginSetupConfig.autoInstall} for details on how to customize.
 * 
 * > [!caution]
 * > make sure that you run only a SINGLE instance of this function at a time.
 * > that's because running multiple installations in parallel on the same working-directory will corrupt shared files.
 * > 
 * > this becomes very evident in larger projects when multiple `npm install` commands are run in parallel,
 * > resulting in only a few of them actually successfully installing,
 * > while the rest are either partially installed, or ignored altogether.
 * > 
 * > to mitigate this issue, run your multiple `npm install` commands through a synchronous task queuer,
 * > like the one that can be generated from the {@link syncTaskQueueFactory} utility function in this library.
*/
export const installNpmPackage = async (package_name: string, config: InstallNpmPackageConfig): Promise<void> => {
	switch (current_js_runtime) {
		case RUNTIME.DENO:
		case RUNTIME.BUN:
		case RUNTIME.NODE: {
			return config === "dynamic"
				? installNpmPackageDynamic(package_name)
				: installNpmPackageCli(package_name, config)
		}
		default:
			throw new Error("ERROR! npm-package installation is not possible on web-browser runtimes.")
	}
}

/** this function executes a cli command to install an npm-package.
 * see {@link NpmAutoInstallCliConfig} and {@link NpmPluginSetupConfig.autoInstall} for details on how to customize.
*/
export const installNpmPackageCli = async (package_name: string, config: Exclude<InstallNpmPackageConfig, string>): Promise<void> => {
	const
		{ command, dir, log } = config,
		logFn = log ? (log === true ? logLogger : log) : undefined,
		pkg_pseudo_url = parsePackageUrl(package_name.startsWith("npm:") ? package_name : ("npm:" + package_name)),
		pkg_name_and_version = pkg_pseudo_url.host,
		cli_command = command(pkg_name_and_version)
	if (DEBUG.LOG && logFn) {
		logFn(`[npmPlugin]      installing: "${package_name}", in directory "${dir}"\n>>    using the cli-command: \`${cli_command}\``)
	}
	await execShellCommand(current_js_runtime, cli_command, { cwd: dir })
}

/** this function indirectly makes the deno or bun runtimes automatically install an npm-package.
 * doing so will hopefully make it available under your project's `"./node_modules/"` directory,
 * allowing esbuild to access it when bundling code.
 * 
 * > [!important]
 * > for the npm-package to be installed to your project's directory,
 * > you **must** have the `"nodeModulesDir"` field set to `"auto"` in your project's "deno.json" configuration file.
 * > otherwise, the package will get cached in deno's cache directory which uses a different file structure from `node_modules`,
 * > making it impossible for esbuild to traverse through it to discover the package natively.
*/
export const installNpmPackageDynamic = async (package_name: string): Promise<void> => {
	const
		pkg_pseudo_url = parsePackageUrl(package_name.startsWith("npm:") ? package_name : ("npm:" + package_name)),
		pkg_import_url = pkg_pseudo_url.href
			.replace(/^npm\:[\/\\]*/, "npm:")
			.slice(0, pkg_pseudo_url.pathname === "/" ? -1 : undefined),
		// NOTE: we must decode the href uri, because deno will not accept version strings that are uri-encoded.
		dynamic_export_script = `export * as myLib from "${dom_decodeURI(pkg_import_url)}"`,
		dynamic_export_script_blob = new Blob([dynamic_export_script], { type: "text/javascript" }),
		dynamic_export_script_url = URL.createObjectURL(dynamic_export_script_blob)
	// now we perform a phony import, to force deno to cache this npm-package as a dependency inside of your `${cwd}/node_modules/`.
	await import(dynamic_export_script_url)
	return
}
