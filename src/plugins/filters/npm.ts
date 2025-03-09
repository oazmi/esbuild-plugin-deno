/** an esbuild plugin that strips away `npm:` specifiers,
 * and indirectly resolves the npm-package resource path through the {@link resolverPlugin}.
 * 
 * @module
*/

import { DEBUG, defaultGetCwd, dom_decodeURI, ensureEndSlash, escapeLiteralStringForRegex, execShellCommand, getUriScheme, identifyCurrentRuntime, isString, joinPaths, parsePackageUrl, pathToPosixPath, replacePrefix, RUNTIME, type DeepPartial } from "../../deps.ts"
import { ensureLocalPath, logLogger } from "../funcdefs.ts"
import { nodeModulesResolverFactory, type resolverPlugin } from "../resolvers.ts"
import type { CommonPluginData, EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, LoggerFunction, OnResolveArgs, OnResolveCallback } from "../typedefs.ts"
import { defaultEsbuildNamespaces, PLUGIN_NAMESPACE } from "../typedefs.ts"


/** an enum that represents special directories to use in {@link NpmPluginSetupConfig.nodeModulesDirs}. */
export const enum DIRECTORY {
	/** represents your js-runtime's current working directory (acquired via {@link defaultGetCwd}). */
	CWD = 0,

	/** represents the `absWorkingDir` option provided to your esbuild build config.
	 * 
	 * note that if esbuild's `absWorkingDir` option was not specified,
	 * then the package scanner will fallback to  the current working director (i.e. {@link DIRECTORY.CWD}).
	*/
	ABS_WORKING_DIR = 1,
}

/** acceptable directory formats for specifying your "resolve directory" for scanning and traversing `"./node_modules/"` folders. */
export type NodeModuleDirFormat = (string | URL | DIRECTORY)

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
	 * > [!warning]
	 * > the underlying technique used for this option will only work for Deno and Bun, but not Nodejs.
	 * > 
	 * > moreover, you will **need** to have a certain configurations for this option to work on Deno and Bun:
	 * > - for Deno, your project's "deno.json" file's `"nodeModulesDir"` should be set to `"auto"`,
	 * >   so that a local `"./node_modules/"` folder will be created for installed packages.
	 * > - for Bun, your project's directory, or one of its ancesteral directory, must contain a `"./node_modules/"` folder,
	 * >   so that bun will opt for node-package-resolution instead of its default bun-style-resolution.
	 * >   TODO: I haven't actually tried it on bun, and I'm only speculating based on the information here:
	 * >   [link](https://bun.sh/docs/runtime/autoimport)
	 * > 
	 * 
	 * TODO: add the ability to set a custom directory in which the installation should take place.
	 *   right now, it defaults to using the `absWorkingDir`, with the `defaultGetCwd` as a fallback.
	 * 
	 * TODO: add the ability to set which installation method should be used.
	 *   for instance, `"npm-cli"`, `"deno-cli"`, `"bun-cli"`,
	 *   `"dynamic"` (i.e. on-the-fly import caching), or `"auto"` (equivalent to `true`).
	 * 
	 * @defaultValue `true`
	*/
	autoInstall: boolean

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
		{ specifiers, sideEffects, autoInstall, acceptNamespaces: _acceptNamespaces, nodeModulesDirs, log } = { ...defaultNpmPluginSetupConfig, ...config },
		logFn = log ? (log === true ? logLogger : log) : undefined,
		acceptNamespaces = new Set([..._acceptNamespaces, PLUGIN_NAMESPACE.LOADER_HTTP]),
		forcedSideEffectsMode = isString(sideEffects) ? undefined : sideEffects

	return (async (build: EsbuildPluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const
			{ absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions,
			cwd = ensureEndSlash(defaultGetCwd),
			abs_working_dir = absWorkingDir ? ensureEndSlash(pathToPosixPath(absWorkingDir)) : defaultGetCwd,
			node_modules_dirs = nodeModulesDirs.map((dir_path): string => {
				switch (dir_path) {
					case DIRECTORY.CWD: return cwd
					case DIRECTORY.ABS_WORKING_DIR: return abs_working_dir
					default: return pathOrUrlToLocalPathConverter(dir_path)
				}
			}),
			validResolveDirFinder = findResolveDirOfNpmPackageFactory(build)

		const npmSpecifierResolverFactory = (specifier: string): OnResolveCallback => (async (args: OnResolveArgs) => {
			// skip resolving any `namespace` that we do not accept
			if (!acceptNamespaces.has(args.namespace)) { return }
			const
				{ path, pluginData = {}, resolveDir = "", namespace: original_ns, ...rest_args } = args,
				well_formed_npm_package_alias = replacePrefix(path, specifier, "npm:")!,
				{ scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias),
				resolved_npm_package_alias = `${scope ? "@" + scope + "/" : ""}${pkg}${pathname === "/" ? "" : pathname}`,
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

			// we now let esbuild scan and traverse multiple directories in search for our desired npm-package.
			// if we don't initially land on a hit (i.e. none of the directories lead to the desired package),
			// then if the `autoInstall` option is enabled, we will indirectly invoke deno to install the npm-package.
			// hopefully that will lead to the package now being available under some `"./node_modules/"` directory,
			// assuming that `"nodeModulesDir"` is set to `"auto"` in the current deno-runtime's "deno.json" config file.
			// otherwise the package will not be installed in `node_modules` fashion, and esbuild will not be able to discover it.
			let valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir)
			if (!valid_resolve_dir && autoInstall) {
				await installNpmPackage(well_formed_npm_package_alias, abs_working_dir)
				valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir)
			}
			if (!valid_resolve_dir) {
				(logFn ?? logLogger)(
					`[npmPlugin]: WARNING! no valid "resolveDir" directory was found to contain the npm package named "${resolved_npm_package_alias}"`,
					`\n\twe will still continue with the path resolution (in case the global-import-map may alter the situation),`,
					`\n\tbut it is almost guaranteed not to work if the current-working-directory was already part of the scanned directories.`,
				)
			}

			const abs_result = await build.resolve(resolved_npm_package_alias, {
				...rest_args,
				resolveDir: valid_resolve_dir,
				namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
				pluginData: { ...restPluginData, resolverConfig: { useNodeModules: true } } satisfies CommonPluginData,
			})
			const resolved_path = abs_result.path
			if (DEBUG.LOG && logFn) {
				logFn(`[npmPlugin]       resolving: "${path}", with resolveDir: "${valid_resolve_dir}"` + (!resolved_path ? ""
					: `\n>> successfully resolved to: ${resolved_path}`
				))
			}

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
		dir_path = ensureEndSlash(path_schema === "relative"
			? joinPaths(ensureEndSlash(defaultGetCwd), path)
			: path
		)
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

/** this function installs an npm-package to your project's `"./node_modules/"` folder.
 * the method of installation will depend on your javascript runtime:
 * - for Deno and Bun, the {@link denoInstallNpmPackage} function will be invoked,
 *   which will perform a dynamic import of the said package so that it gets cached onto the filesystem.
 * - for Nodejs, the {@link npmInstallNpmPackage} function will be invoked,
 *   which will execute a shell command for the installation.
*/
export const installNpmPackage = async (package_name: string, cwd: string = defaultGetCwd): Promise<void> => {
	switch (identifyCurrentRuntime()) {
		case RUNTIME.DENO:
		case RUNTIME.BUN:
			logLogger("[npmPlugin]: deno/bun is installing the missing npm-package:", package_name)
			return denoInstallNpmPackage(package_name)
		case RUNTIME.NODE:
			logLogger("[npmPlugin]: npm is installing the missing npm-package:", package_name)
			return npmInstallNpmPackage(package_name, cwd)
		default:
			throw new Error("ERROR! npm-package installation is not possible on web-browser runtimes.")
	}
}

/** this function executes the `npm install ${package_name} --no-save` command, in the provided `cwd` directory,
 * to install the desired npm-package in that directory's `"./node_modules/"` folder,
 * so that it will become available for esbuild to bundle.
 * 
 * the `--no-save` flag warrants that your `package.json` file will not be modified (nor created if lacking) to add this package as dependency.
*/
export const npmInstallNpmPackage = async (package_name: string, cwd: string = defaultGetCwd): Promise<void> => {
	const
		pkg_pseudo_url = parsePackageUrl(package_name.startsWith("npm:") ? package_name : ("npm:" + package_name)),
		pkg_name_and_version = pkg_pseudo_url.host
	await execShellCommand(identifyCurrentRuntime(), `npm install "${pkg_name_and_version}" --no-save`, { cwd })
}

/** this function indirectly makes the deno runtime automatically install an npm-package.
 * doing so will hopefully make it available under your project's `"./node_modules/"` directory,
 * allowing esbuild to access it when bundling code.
 * 
 * > [!important]
 * > for the npm-package to be installed to your project's directory,
 * > you **must** have the `"nodeModulesDir"` field set to `"auto"` in your project's "deno.json" configuration file.
 * > otherwise, the package will get cached in deno's cache directory which uses a different file structure from `node_modules`,
 * > making it impossible for esbuild to traverse through it to discover the package natively.
*/
export const denoInstallNpmPackage = async (package_name: string): Promise<void> => {
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
