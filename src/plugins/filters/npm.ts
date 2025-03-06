/** an esbuild plugin that strips away `npm:` specifiers,
 * and indirectly resolves the npm-package resource path through the {@link resolverPlugin}.
 * 
 * @module
*/

import { defaultGetCwd, ensureEndSlash, escapeLiteralStringForRegex, fileUrlToLocalPath, isString, parsePackageUrl, pathToPosixPath, replacePrefix, resolveAsUrl, type DeepPartial } from "../../deps.ts"
import { nodeModulesResolverFactory, resolverPlugin } from "../resolvers.ts"
import type { CommonPluginData, EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, OnResolveArgs, OnResolveCallback } from "../typedefs.ts"
import { defaultEsbuildNamespaces, PLUGIN_NAMESPACE } from "../typedefs.ts"


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
	 * TODO: needs to be implemented. see details in `/todo.md`, under pre-version `0.3.0`.
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

	/** specify the `path` to the directory containing your `"./node_modules/"` folder as a subdirectory.
	 * 
	 * this directory will be used by esbuild's native resolver as a starting point for scanning for `node_modules` npm-packages,
	 * and it will work upwards from there on until the root of your drive is reached,
	 * and all `"./node_modules/"` folders up the directory tree have been scanned.
	 * 
	 * the `prioritizeAbsWorkingDir` option lets you specify if esbuild's initial `absWorkingDir` build option should take priority over your specified `path`.
	 * 
	 * @defaultValue `{ path: process.cwd(), prioritizeAbsWorkingDir: true }`
	*/
	resolveDir: {
		/** the directory path to the parent folder of your `"./node_modules/"` folder.
		 * 
		 * @defaultValue current-working-directory, acquired via {@link defaultGetCwd}
		*/
		path: string

		/** specify if esbuild's initial `absWorkingDir` build option should be used instead of the `path` when it's available.
		 * 
		 * @defaultValue `true`
		*/
		prioritizeAbsWorkingDir: boolean
	}
}

const defaultNpmPluginSetupConfig: NpmPluginSetupConfig = {
	specifiers: ["npm:"],
	sideEffects: "auto",
	autoInstall: true,
	acceptNamespaces: defaultEsbuildNamespaces,
	resolveDir: {
		path: defaultGetCwd,
		prioritizeAbsWorkingDir: true,
	},
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
		{ specifiers, sideEffects, autoInstall, acceptNamespaces: _acceptNamespaces, resolveDir: _initialResolveDir } = { ...defaultNpmPluginSetupConfig, ...config },
		acceptNamespaces = new Set([..._acceptNamespaces, PLUGIN_NAMESPACE.LOADER_HTTP]),
		forcedSideEffectsMode = isString(sideEffects) ? undefined : sideEffects,
		initialResolveDir = { ...defaultNpmPluginSetupConfig.resolveDir, ..._initialResolveDir }

	return (async (build: EsbuildPluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const
			{ absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions,
			fallbackResolveDir = ensureEndSlash(pathToPosixPath((absWorkingDir && initialResolveDir.prioritizeAbsWorkingDir)
				? absWorkingDir
				: initialResolveDir.path
			))

		const npmSpecifierResolverFactory = (specifier: string): OnResolveCallback => (async (args: OnResolveArgs) => {
			// skip resolving any `namespace` that we do not accept
			if (!acceptNamespaces.has(args.namespace)) { return }
			const
				{ path, pluginData = {}, resolveDir = "", namespace: original_ns, ...rest_args } = args,
				well_formed_npm_package_alias = replacePrefix(path, specifier, "npm:")!,
				{ scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias),
				resolved_npm_package_alias = `${scope ? "@" + scope + "/" : ""}${pkg}${pathname === "/" ? "" : pathname}`,
				// NOTE:
				//   it is absolutely necessary for the `resolveDir` argument to exist when resolving an npm package, otherwise esbuild will not know where to look for the node module.
				//   this is why when there is no `resolveDir` available, we will use either the absolute-working-directory or the current-working-directory as a fallback.
				//   you may wonder why the `resolveDir` would disappear, and that's because our other plugins don't bother with setting/preserving this option in their loaders,
				//   which is why it disappears when the path being resolved comes from an importer that was resolved by one of these plugins' loader.
				// TODO:
				//   my technique may not be ideal because if an npm-package were to go through one of my plugins (i.e. loaded via one of my plugins),
				//   then the original `resoveDir`, which should be inside the npm-package's directory will be lost, and we will end up wrongfully pointing to our `cwd()`.
				//   in such case, esbuild will not find the dependencies that these npm-packages might require.
				//   thus in the future, you should make sure that your loader plugins preserve this value and pass it down.
				// TODO:
				//   version presrvation is also an issue, since the version that will actually end up being used is whatever is available in `node_modules`,
				//   instead of the `desired_version`. unless we ask deno to install/import that specific version to our `node_modules`.
				resolve_dir = resolveDir === "" ? fallbackResolveDir : resolveDir,
				// below, we flush away any previous import-map and runtime-package manager stored in the plugin-data,
				// as we will need to reset them for the current self-contained npm package's scope.
				{ importMap: _0, runtimePackage: _1, resolverConfig: _2, ...restPluginData } = pluginData

			const abs_result = await build.resolve(resolved_npm_package_alias, {
				...rest_args,
				resolveDir: resolve_dir,
				namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
				pluginData: { ...restPluginData, resolverConfig: { useNodeModules: true } } satisfies CommonPluginData,
			})

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

/** generate a function that makes esbuild scan multiple directories in search for an npm-package inside of some `"./node_modules/"` folder.
 * the first valid directory, in which the npm-package was scanned for was successful, will be returned.
 * 
 * @param node_module_parent_directories the list of directories in which the scanning should be performed.
 *   note to **not** include directories which are an ancestor to another directory in the list.
 *   this is because esbuild traverses up the directory tree when searching for the npm-package in various `"./node_modules/"` folders.
 *   thus it would be redundant to include ancesteral directories.
 *   moreover, you may also provide `file://` urls (in either `string` or `URL` format), instead of a filesystem path.
 * @param build the esbuild "build" object that's available inside of esbuild plugin setup functions.
 *   for mock testing, you can also provide a stub like this: `const build = { esbuild }`.
 *   follow the example below that makes use of a similar stub.
 * 
 * @example
 * ```ts ignore
 * import * as esbuild from "npm:esbuild@0.25.0"
 * 
 * const build = { esbuild }
 * const myPackageDirScanner = findResolveDirOfNpmPackageFactory([
 * 	"D:/temp/node/",
 * 	"file:///d:/sdk/cache/",
 * ], build)
 * 
 * console.log(`the "@oazmi/tsignal" package is located at:`, await myPackageDirScanner("@oazmi/tsignal"))
 * ```
*/
export const findResolveDirOfNpmPackageFactory = (
	node_module_parent_directories: (string | URL)[],
	build: EsbuildPluginBuild,
): ((node_module_package_name_to_search: string) => Promise<string | undefined>) => {
	const
		node_modules_resolver = nodeModulesResolverFactory({ absWorkingDir: undefined }, build),
		node_module_parent_local_directories = node_module_parent_directories.map((dir_path_or_url) => {
			const abs_local_path = fileUrlToLocalPath(isString(dir_path_or_url)
				? resolveAsUrl("./", ensureEndSlash(dir_path_or_url))
				: dir_path_or_url
			)!
			return abs_local_path
		})

	const validateNodeModuleExists = async (abs_resolve_dir: string, node_module_package_name: string): Promise<boolean> => {
		const result = await node_modules_resolver({
			path: node_module_package_name,
			importer: "",
			resolveDir: abs_resolve_dir,
		})
		return (result.path ?? "") !== "" ? true : false
	}

	return async (node_module_package_name_to_search: string): Promise<string | undefined> => {
		for (const abs_resolve_dir of node_module_parent_local_directories) {
			const node_module_was_found = await validateNodeModuleExists(abs_resolve_dir, node_module_package_name_to_search)
			if (node_module_was_found) { return abs_resolve_dir }
		}
	}
}
