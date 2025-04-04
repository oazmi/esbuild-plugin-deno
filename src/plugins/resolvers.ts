/** this submodule contains a namespaced esbuild plugin that resolves paths based on the three strategies:
 * _runtime-package_ resolution, _import-map_ resolution, and _absolute-path_ resolution.
 * 
 * > [!note]
 * > the default namespace you should use in your plugins to call this pipeline of resolvers is {@link PLUGIN_NAMESPACE.RESOLVER_PIPELINE}.
 * > otherwise, if you want, you can customize the namespace of this plugin by specifying it in the `config.namespace` option.
 * 
 * below is a summary what the path resolution procedure of this plugin entails, given a certain esbuild input {@link OnResolveArgs | `args`}:
 * 1. first, if {@link RuntimePackage | `args.pluginData.runtimePackage`} exists,
 *    then the plugin tries to resolve the input `args.path` through the use of the {@link RuntimePackage.resolveImport} method.
 *    - if it succeeds (i.e. `args.path` was an alias/import-map specified in the package file),
 *      then the resolved path, along with the original `args.pluginData`, is returned.
 *    - otherwise, if it fails, then the next path resolution takes place (import-map).
 * 2. next, if either {@link ImportMap | `args.pluginData.importMap`} exists,
 *    or {@link ImportMapResolverConfig.globalImportMap | `config.importMap.globalImportMap`} exists,
 *    then the plugin will try to resolve the input `args.path` with respect to these import-maps,
 *    through the use of the {@link resolvePathFromImportMap} function.
 *    - if it succeeds (i.e. `args.path` was part of the import-map(s)),
 *      then the resolved path, along with the original `args.pluginData`, is returned.
 *    - otherwise, if it fails, then the next path resolution will take place (node-modules).
 * 3. up ahead, we let esbuild's native resolver give a shot at resolving `args.path` as a node-module package,
 *    if and only if the path is neither a relative path (i.e. doesn't begin with `"./"` or `"../"`),
 *    nor is it an absolute path (such as "http://example.com/...", or "C:/users/...").
 *    this is because these scenarios can be handled much quicker by the next path-resolver that follows this one
 *    (since that one does not perform filesystem read/scan operations, unlike esbuild's native resolver).
 *    - if it succeeds (i.e. `args.path` was indeed some package inside some `"./node_modules/"` folder up the directory tree),
 *      then the resolved absolute filesystem path of the resource will be returned.
 *    - otherwise, if it fails, then the next path resolution will take place (path-joining).
 *    > [!tip]
 *    > under the hood, this function uses the {@link nodeModulesResolverFactory} function that initializes a mock build process,
 *    > which lets us indirectly query esbuild for the resolved path to the resource (if any).
 * 4. finally, when all else has failed and we've made it to here, and `args.path` is a relative path:
 *    - then we'll simply compute the absolute path of the input `args.path` by combining it with `args.importer`, and `args.resolveDir`.
 *      - if neither of those two arguments are non-empty strings, then we will resort to using esbuild's `absWorkingDir` build option.
 *      - if `absWorkingDir` was itself not specified, then we will fallback to the runtime's current-working-directory as the base directory of `args.path`.
 *    - and again, the original `args.pluginData` is returned along with the result, so that the child dependnecies can inherit it.
 * 
 * @module
*/

import { DEBUG, defaultResolvePath, ensureEndSlash, ensureFileUrlIsLocalPath, getUriScheme, isAbsolutePath, joinPaths, noop, pathToPosixPath, promise_outside, resolveAsUrl, type DeepPartial } from "../deps.ts"
import { resolvePathFromImportMap } from "../importmap/mod.ts"
import type { ImportMap } from "../importmap/typedefs.ts"
import type { RuntimePackage } from "../packageman/base.ts"
import { logLogger } from "./funcdefs.ts"
import type { CommonPluginData, EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, LoggerFunction, OnResolveCallback, OnResolveResult } from "./typedefs.ts"
import { PLUGIN_NAMESPACE, type OnResolveArgs } from "./typedefs.ts"


/** configuration for the runtime-package resolver in {@link resolverPluginSetup},
 * which operates on the {@link CommonPluginData.runtimePackage} plugin-data property.
*/
export interface RuntimePackageResolverConfig {
	/** enable or disable runtime-package (such as "deno.json") alias resolution.
	 * 
	 * @defaultValue `true` (enabled)
	*/
	enabled: boolean
}

/** configuration for the import-map resolver in {@link resolverPluginSetup},
 * which operates on the {@link CommonPluginData.importMap} plugin-data property.
*/
export interface ImportMapResolverConfig {
	/** enable or disable import-map resolution.
	 * 
	 * @defaultValue `true` (enabled)
	*/
	enabled: boolean

	/** specify a global import-map for aliases to resources.
	 * 
	 * the full import-map within the body of the resolver function will be a merger between _this_ global import-map,
	 * and the import-map acquired from the plugin data (i.e. {@link CommonPluginData.importMap}).
	 * the plugin data's import-map will take a higher priority in case of conflicting key (i.e. same alias key but different absolute path values).
	 * 
	 * the resolve function will always look for a match for `args.path` inside of the import-map,
	 * before resolving it with respect to the current importer or resolve-directory (i.e. `args.importer` or `args.resolveDir`).
	 * 
	 * @defaultValue `{}` (empty object/dictionary)
	*/
	globalImportMap: ImportMap
}

/** configuration for esbuild's native `node_modules` resolver in {@link resolverPluginSetup}. */
export interface NodeModulesResolverConfig {
	/** enable or disable `node_modules` resolution.
	 * 
	 * @defaultValue `true` (enabled).
	 *   however, the default `pluginData.resolverConfig.useNodeModules` option is set to `false`,
	 *   meaning that it will only work when the user explicitly sets their `pluginData.resolverConfig.useNodeModules` to `true`.
	*/
	enabled: boolean
}

/** configuration for the relative-path resolver in {@link resolverPluginSetup}. */
export interface RelativePathResolverConfig {
	/** enable or disable relative path resolution.
	 * 
	 * @defaultValue `true` (enabled)
	*/
	enabled: boolean

	/** a function that resolves a path segment to an absolute path (i.e. a path that the plugin itself can recognize as an absolute path).
	 * 
	 * this function is utilized by the `relativePathResolver` function inside the plugin's body,
	 * and it will operate independent of what your {@link isAbsolutePath} function is.
	 * this means that you will have to check for absolute paths yourself,
	 * because every resource that will make its way to the `relativePathResolver` will be processed by this `resolvePath` function.
	 * 
	 * in general, there are four checks that your path resolver function should perform in the provided order:
	 * 1. if `path` is `undefined` or an empty string, then the current working directory should be returned.
	 * 2. if the path begins with a leading slash ("/"), you should treat it as a root-path and join it with the `importer`'s domain
	 *    (for instance, the domain of `https://esm.sh/hello/world` would be `https://esm.sh/`).
	 *    but if no `importer` argument is present, then go to the next case (where you'll effectively resolve it as an absolute local unix file path).
	 * 3. if the `path` is an absolute path of some kind, you should simply return it as is, after ensuring posix separators (`"/"`) are being used.
	 * 4. finally, for all remaining cases (i.e. relative paths, which begin with either "./", "../", or a bare file subpath),
	 *    you should join them with their `importer` if it is present, otherwise join them with your current working directory (or `absWorkingDir`).
	 * 
	 * @param path the path of the resource that is being resolved.
	 *   it could be a relative path (i.e. starts with `"./"` or `"../"`),
	 *   or a root-path (i.e. starts with `"/"`), or a pre-existing absolute path (such as `jsr:@std/jsonc/parses`).
	 *   and it may use windows backslashes instead of posix forward slashes, so make sure to handle all of these cases.
	 * @param importer when an importer file is present, this parameter will be provided,
	 *   and you will be expected to join the `importer` with the `path` if the `path` is either relative or a root-path.
	 *   do note that the importer is never an empty string.
	 * @returns the absolute path to the provided resource.
	*/
	resolvePath: (path?: string | undefined, importer?: string | undefined) => string

	/** a function that declares whether or not a given path segment is an absolute path (i.e. the plugin itself recognizes it as an absolute path). */
	isAbsolutePath: (segment: string) => boolean
}

const
	defaultRuntimePackageResolverConfig: RuntimePackageResolverConfig = {
		enabled: true,
	},
	defaultImportMapResolverConfig: ImportMapResolverConfig = {
		enabled: true,
		globalImportMap: {},
	},
	defaultNodeModulesResolverConfig: NodeModulesResolverConfig = {
		enabled: true,
	},
	defaultRelativePathResolverConfig: RelativePathResolverConfig = {
		enabled: true,
		resolvePath: defaultResolvePath,
		isAbsolutePath: isAbsolutePath,
	}

/** configuration options for the {@link resolverPluginSetup} esbuild-setup factory function. */
export interface ResolverPluginSetupConfig {
	/** {@inheritDoc RuntimePackageResolverConfig} */
	runtimePackage: RuntimePackageResolverConfig

	/** {@inheritDoc ImportMapResolverConfig} */
	importMap: ImportMapResolverConfig

	/** {@inheritDoc NodeModulesResolverConfig} */
	nodeModules: NodeModulesResolverConfig

	/** {@inheritDoc RelativePathResolverConfig} */
	relativePath: RelativePathResolverConfig

	/** specify the input-namespace on which the resolver-pipeline will operate on.
	 * 
	 * > [!caution]
	 * > it is best if you don't modify it to something besides the default value {@link PLUGIN_NAMESPACE.RESOLVER_PIPELINE},
	 * > as the filter-category plugins rely on that specific namespace to have their intercepted entities resolved as absolute-paths.
	*/
	namespace: string

	/** enable logging of the input arguments and resolved paths, when {@link DEBUG.LOG} is ennabled.
	 * 
	 * when set to `true`, the logs will show up in your console via `console.log()`.
	 * you may also provide your own custom logger function if you wish.
	 * 
	 * @defaultValue `false`
	*/
	log: boolean | LoggerFunction
}

const defaultResolverPluginSetupConfig: ResolverPluginSetupConfig = {
	runtimePackage: defaultRuntimePackageResolverConfig,
	importMap: defaultImportMapResolverConfig,
	nodeModules: defaultNodeModulesResolverConfig,
	relativePath: defaultRelativePathResolverConfig,
	namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
	log: false,
}

/** this is a 4-in-1 namespaced-plugin that assists in resolving esbuild paths,
 * based on {@link CommonPluginData | `pluginData`}, esbuild's native-resolver, and relative path resolver.
 * 
 * for details on what gets resolved an how, refer to the documentation comments of this submodule ({@link "plugins/resolvers"}).
 * 
 * the way it is intended to be used is by being called indirectly via `build.resolve`, after specifying the correct namespace of this plugin.
 * 
 * @example
 * ```ts
 * import type { EsbuildPlugin, EsbuildPluginBuild, OnLoadArgs, OnResolveArgs } from "./typedefs.ts"
 * import { PLUGIN_NAMESPACE.RESOLVER_PIPELINE } from "./typedefs.ts"
 * 
 * const THIS_plugins_namespace = PLUGIN_NAMESPACE.RESOLVER_PIPELINE // == "oazmi-resolver-pipeline"
 * 
 * const myShinyPlugin: EsbuildPlugin = {
 * 	name: "my-shiny-plugin",
 * 	setup: (build: EsbuildPluginBuild) => {
 * 		const everything_shiny_filter = /\.shiny$/
 * 
 * 		build.onResolve({ filter: everything_shiny_filter }, async (args: OnResolveArgs) => {
 * 			const { path, ...rest_args } = args
 * 			const result = await build.resolve(path, { ...rest_args, namespace: THIS_plugins_namespace })
 * 			if (result) {
 * 				const {
 * 					path: absolute_path,
 * 					pluginData: useful_plugindata,
 * 					// there will be a temporary namespace that you MUST drop.
 * 					// the reason why it exists is because esbuild forbids the use of the default namespace,
 * 					// unless the path is explicitly an absolute filesystem path.
 * 					// so paths that begin with "http://", "file://", "jsr:", etc... are all invalidated by esbuild if `namespace = ""`.
 * 					namespace: _drop_the_temp_namespace,
 * 					...rest_result
 * 				} = result
 * 				return {
 * 					path: absolute_path,
 * 					pluginData: useful_plugindata,
 * 					namespace: "my-shiny-namespace",
 * 					...rest_result,
 * 				}
 * 			}
 * 		})
 * 
 * 		build.onLoad({ filter: RegExp(".*"), namespace: "my-shiny-namespace" }, async (args: OnLoadArgs) => {
 * 			const { path, pluginData } = args
 * 			const contents = "" // load your shiny stuff here
 * 			return { contents, loader: "ts", pluginData }
 * 		})
 * 	}
 * }
 * ```
*/
export const resolverPluginSetup = (config?: DeepPartial<ResolverPluginSetupConfig>): EsbuildPluginSetup => {
	const {
		runtimePackage: _runtimePackageResolverConfig,
		importMap: _importMapResolverConfig,
		nodeModules: _nodeModulesResolverConfig,
		relativePath: _relativePathResolverConfig,
		namespace: plugin_ns,
		log,
	} = { ...defaultResolverPluginSetupConfig, ...config }
	const
		runtimePackageResolverConfig = { ...defaultRuntimePackageResolverConfig, ..._runtimePackageResolverConfig },
		importMapResolverConfig = { ...defaultImportMapResolverConfig, ..._importMapResolverConfig },
		nodeModulesResolverConfig = { ...defaultNodeModulesResolverConfig, ..._nodeModulesResolverConfig },
		relativePathResolverConfig = { ...defaultRelativePathResolverConfig, ..._relativePathResolverConfig },
		logFn = log ? (log === true ? logLogger : log) : undefined,
		// a non-empty string namespace is required if the file is not an absolute path on the filesystem.
		output_ns = "discard-this-namespace",
		plugin_filter = /.*/

	return async (build: EsbuildPluginBuild): Promise<void> => {
		// if `build.initialOptions.absWorkingDir` is itself a relative path, then we'll resolve it relative to the current-working-directory,
		// via the `resolvePath` function inside of the `relativePathResolver`.
		const absWorkingDir = pathToPosixPath(build.initialOptions.absWorkingDir ?? "./")

		// first comes the runtime-package-manager resolver, if it is enabled, that is.
		const runtimePackageResolver: OnResolveCallback = (runtimePackageResolverConfig.enabled === false) ? noop : async (args) => {
			if (args.pluginData?.resolverConfig?.useRuntimePackage === false) { return }
			const
				{ path, pluginData = {} } = args,
				runtimePackage = pluginData.runtimePackage as RuntimePackage<any> | undefined,
				// if the input `path` is an import being performed inside of a package, in addition to not being a relative import,
				// then use the package manager to resolve the imported path.
				resolved_path = runtimePackage && !path.startsWith("./") && !path.startsWith("../")
					? runtimePackage.resolveImport(path)
					: undefined
			if (DEBUG.LOG && logFn) {
				logFn(`[runtime-package] resolving: ${path}` + (!resolved_path ? ""
					: `\n>> successfully resolved to: ${resolved_path}`
				))
			}
			return resolved_path ? {
				path: resolved_path,
				namespace: output_ns,
				pluginData: { ...pluginData } satisfies CommonPluginData,
			} : undefined
		}

		// second attempt at resolving the path is made by the import-map and global-import-map resolver (if it is enabled).
		const { globalImportMap } = importMapResolverConfig
		const importMapResolver: OnResolveCallback = (importMapResolverConfig.enabled === false) ? noop : async (args) => {
			if (args.pluginData?.resolverConfig?.useImportMap === false) { return }
			const
				{ path, pluginData = {} } = args,
				importMap = { ...globalImportMap, ...pluginData.importMap } as ImportMap,
				// if the input `path` is an import being performed inside of a package, in addition to not being a relative import,
				// then use the package manager to resolve the imported path.
				resolved_path = resolvePathFromImportMap(path, importMap)
			if (DEBUG.LOG && logFn) {
				logFn(`[import-map]      resolving: ${path}` + (!resolved_path ? ""
					: `\n>> successfully resolved to: ${resolved_path}`
				))
			}
			return resolved_path ? {
				path: resolved_path,
				namespace: output_ns,
				pluginData: { ...pluginData } satisfies CommonPluginData,
			} : undefined
		}

		// third attempt at resolving the path should be made by esbuild's native `node_modules` resolver.
		const { resolvePath, isAbsolutePath } = relativePathResolverConfig
		const node_modules_resolver = nodeModulesResolverFactory({ absWorkingDir: resolvePath(ensureEndSlash(absWorkingDir)) }, build)
		const nodeModulesResolver: OnResolveCallback = (nodeModulesResolverConfig.enabled === false) ? noop : async (args) => {
			const { path, resolveDir, importer, pluginData = {} } = args
			if (pluginData.resolverConfig?.useNodeModules === false) { return }
			// for the sake of speed, we don't bother esbuild for resolving relative paths,
			// since the next resolver (`relativePathResolver`) will do this simple task much faster, without reading the filesystem.
			if (
				(pluginData.resolverConfig?.useRelativePath !== false)
				&& (path.startsWith("./") || path.startsWith("../") || isAbsolutePath(path))
			) { return }
			const
				resolve_dir = resolvePath(ensureEndSlash(resolveDir ? resolveDir : absWorkingDir)),
				module_path_alias = pathToPosixPath(path),
				native_results_promise = node_modules_resolver({
					importer,
					path: module_path_alias,
					resolveDir: resolve_dir,
				})

			const { path: resolved_path, namespace: _0, pluginData: _1, ...rest_results } = await (native_results_promise
				.catch((): Partial<OnResolveResult> => { return {} })
			)
			if (DEBUG.LOG && logFn) {
				logFn(`[node-module]     resolving: ${path}` + (!resolved_path ? ""
					: `\n>> successfully resolved to: ${resolved_path}`
				))
			}
			return resolved_path ? {
				...rest_results,
				path: resolved_path,
				namespace: output_ns,
				pluginData: { ...pluginData } satisfies CommonPluginData,
			} : undefined
		}

		// final attempt at resolving the path is made by simply joining potentially relative paths with the `importer` (if enabled).
		const relativePathResolver: OnResolveCallback = (relativePathResolverConfig.enabled === false) ? noop : async (args) => {
			if (args.pluginData?.resolverConfig?.useRelativePath === false) { return }
			const
				{ path, importer, resolveDir, pluginData = {} } = args,
				resolve_dir = resolvePath(ensureEndSlash(resolveDir ? resolveDir : absWorkingDir)),
				dir = isAbsolutePath(importer)
					? importer
					: joinPaths(resolve_dir, importer),
				resolved_path = resolvePath(path, dir ? dir : undefined)
			if (DEBUG.LOG && logFn) {
				logFn(`[absolute-path]   resolving: ${path}` + (!resolved_path ? "" :
					`\n>> successfully resolved to: ${resolved_path}`
				))
			}
			return {
				path: resolved_path,
				namespace: output_ns,
				pluginData: { ...pluginData } satisfies CommonPluginData,
			}
		}

		build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, runtimePackageResolver)
		build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, importMapResolver)
		build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, nodeModulesResolver)
		build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, relativePathResolver)
	}
}

/** {@inheritDoc resolverPluginSetup} */
export const resolverPlugin = (config?: DeepPartial<ResolverPluginSetupConfig>): EsbuildPlugin => {
	return {
		name: "oazmi-plugindata-resolvers",
		setup: resolverPluginSetup(config),
	}
}

/** an interface to configure the {@link nodeModulesResolverFactory} function. */
export interface NodeModulesResolverFactoryConfig {
	/** the fallback resolve-dir path which should be used in place of `args.resolveDir` and `args.importer`, if neither are available.
	 * the `absWorkingDir` path will generally correspond to your project's directory (i.e. current working directory).
	*/
	absWorkingDir?: string
}

interface NodeModulesResolverInternalPluginSetupFactoryConfig {
	resolveDir: string
	importer?: string
	resolve: PromiseWithResolvers<OnResolveResult>["resolve"]
	reject: PromiseWithResolvers<OnResolveResult>["reject"]
}

/** this factory function creates a path-resolver function that mimics esbuild's native-resolver's behavior.
 * 
 * the slyish way how it works is that we create a new build process to query esbuild what it would hypothetically do if so and so input arguments were given,
 * then through a custom inner plugin, we capture esbuild's response (the resolved path), and return it back to the user.
 * 
 * > [!note]
 * > the internal resolver function accepts `"file://"` uris for the following list of {@link OnResolveArgs} fields,
 * > and converts them to local paths for esbuild to understand:
 * > - `path`
 * > - `resolveDir`
 * > - `importer`
 * > 
 * > with this feature, you won't have to worry about file-uris at all.
*/
export const nodeModulesResolverFactory = (
	config: NodeModulesResolverFactoryConfig,
	build: EsbuildPluginBuild
): ((args: Pick<OnResolveArgs, "path" | "resolveDir" | "importer">) => Promise<OnResolveResult>) => {
	const { absWorkingDir } = config

	const internalPluginSetup = (config: NodeModulesResolverInternalPluginSetupFactoryConfig): EsbuildPluginSetup => {
		return (build: EsbuildPluginBuild) => {
			const
				ALREADY_CAPTURED = Symbol(),
				plugin_ns = "the-void",
				{ resolve, reject, resolveDir, importer = "" } = config,
				// below, in case the original `importer` had used a "file://" uri, we convert it back into a local path,
				// otherwise we strip away the importer, since it will not be suitable for usage as `resolveDir`,
				// since esbuild only understands local filesystem paths - no file/http uris.
				importer_path_scheme = getUriScheme(importer),
				importer_dir_as_file_uri = (importer_path_scheme === "local" || importer_path_scheme === "file")
					? resolveAsUrl("./", importer).href
					: undefined,
				resolve_dir = importer_dir_as_file_uri ?? resolveDir

			if (DEBUG.ASSERT && resolve_dir === "") {
				logLogger(
					`[nodeModulesResolverFactory]: WARNING! received an empty resolve directory ("args.resolveDir").`,
					`\n\twe will fallback to esbuild's current-working-directory for filling in the "resolveDir" value,`,
					`\n\thowever, you must be using the "nodeModulesResolverFactory" function incorrectly to have encountered this situation.`,
					`\n\tremember, the purpose of this function is to scan for a node-module, starting from a directory that YOU provide.`,
				)
			}

			build.onResolve({ filter: /.*/ }, async (args) => {
				if (args.pluginData?.[ALREADY_CAPTURED] === true) { return }
				const { path, external, namespace, sideEffects, suffix } = await build.resolve(
					ensureFileUrlIsLocalPath(args.path), {
					kind: "entry-point",
					resolveDir: ensureFileUrlIsLocalPath(resolve_dir !== "" ? resolve_dir : args.resolveDir),
					pluginData: { [ALREADY_CAPTURED]: true },
				})
				resolve({ path: pathToPosixPath(path), external, namespace, sideEffects, suffix })
				return { path: "does-not-matter.js", namespace: plugin_ns }
			})

			build.onLoad({ filter: /.*/, namespace: plugin_ns }, () => ({ contents: "", loader: "empty" }))
		}
	}

	return async (args: Pick<OnResolveArgs, "path" | "resolveDir" | "importer">) => {
		const
			{ path, resolveDir: _resolveDir = "", importer } = args,
			resolveDir = _resolveDir === "" ? (absWorkingDir ?? "") : _resolveDir,
			[promise, resolve, reject] = promise_outside<OnResolveResult>(),
			internalPlugin: EsbuildPlugin = {
				name: "native-esbuild-resolver-capture",
				setup: internalPluginSetup({ resolve, reject, resolveDir, importer }),
			}

		await (build.esbuild.build({
			entryPoints: [path],
			absWorkingDir: absWorkingDir,
			bundle: false,
			minify: false,
			write: false,
			outdir: "./temp/",
			plugins: [internalPlugin],
		})).catch(() => { reject("esbuild's native resolver failed to resolve the path") })

		return promise
	}
}
