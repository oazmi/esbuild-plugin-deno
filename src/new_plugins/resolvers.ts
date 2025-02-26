import { defaultResolvePath, ensureEndSlash, ensureStartDotSlash, isAbsolutePath, joinPaths, noop, pathToPosixPath } from "../deps.ts"
import { resolvePathFromImportMap } from "../importmap/mod.ts"
import type { ImportMap } from "../importmap/typedefs.ts"
import type { RuntimePackage } from "../packageman/base.ts"
import type { CommonPluginData, DeepPartial, EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, OnResolveCallback } from "./typedefs.ts"
import { resolversPluginNamespace } from "./typedefs.ts"


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
	 * @defaultValue `false` (disabled) - TODO: this needs to be worked on
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

	/** a function that joins/resolves path segments to an absolute path (i.e. a path that the plugin itself can recognize as an absolute path).
	 * 
	 * typically, only two or one segments are provided at a time, but it's better if your function accepts variable number of segments.
	*/
	resolvePath: (...segments: string[]) => string

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
		// TODO: requires an implementation of the namespaced-esbuild-native-resolver, as specified in `/todo.md`'s bucket list.
		enabled: false,
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
	 * it is best if you don't modify it to something besides the default value {@link resolversPluginNamespace},
	 * as the filter-category plugins rely on that specific namespace to have their intercepted entities resolved as absolute-paths.
	*/
	namespace: string
}

const defaultResolverPluginSetupConfig: ResolverPluginSetupConfig = {
	runtimePackage: defaultRuntimePackageResolverConfig,
	importMap: defaultImportMapResolverConfig,
	nodeModules: defaultNodeModulesResolverConfig,
	relativePath: defaultRelativePathResolverConfig,
	namespace: resolversPluginNamespace,
}

/** this is a 4-in-1 namespaced-plugin that assists in resolving esbuild paths,
 * based on {@link CommonPluginData | `pluginData`}, esbuild's native-resolver, and relative path resolver.
 * 
 * the way it is intended to be used is by being called indirectly via `build.resolve`, after specifying the correct namespace of this plugin.
 * 
 * @example
 * ```ts
 * import type { EsbuildPlugin, EsbuildPluginBuild, OnLoadArgs, OnResolveArgs } from "./typedefs.ts"
 * import { resolversPluginNamespace } from "./typedefs.ts"
 * 
 * const THIS_plugins_namespace = resolversPluginNamespace // == "oazmi-resolvers-pipeline"
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
	} = { ...defaultResolverPluginSetupConfig, ...config }
	const
		runtimePackageResolverConfig = { ...defaultRuntimePackageResolverConfig, ..._runtimePackageResolverConfig },
		importMapResolverConfig = { ...defaultImportMapResolverConfig, ..._importMapResolverConfig },
		nodeModulesResolverConfig = { ...defaultNodeModulesResolverConfig, ..._nodeModulesResolverConfig },
		relativePathResolverConfig = { ...defaultRelativePathResolverConfig, ..._relativePathResolverConfig },
		// a non-empty string namespace is required if the file is not an absolute path on the filesystem.
		output_ns = "discard-this-namespace",
		plugin_filter = /.*/

	return async (build: EsbuildPluginBuild): Promise<void> => {
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
			return resolved_path ? {
				path: resolved_path,
				namespace: output_ns,
				pluginData: { ...pluginData } satisfies CommonPluginData,
			} : undefined
		}

		// TODO: third attempt at resolving the path should be made by esbuild's native `node_modules` resolver, but that will be implemented later.
		const nodeModulesResolver: OnResolveCallback = (nodeModulesResolverConfig.enabled === false) ? noop : async (args) => {
			if (args.pluginData?.resolverConfig?.useNodeModules === false) { return }
			console.warn(`TODO: a namespaced wrapper for esbuild's native resolver for "node_modules" packages/aliases has not been implemented yet.`)
			return undefined
		}

		// final attempt at resolving the path is made by simply joining potentially relative paths with the `importer` (if enabled).
		const { resolvePath, isAbsolutePath } = relativePathResolverConfig
		const relativePathResolver: OnResolveCallback = (relativePathResolverConfig.enabled === false) ? noop : async (args) => {
			if (args.pluginData?.resolverConfig?.useRelativePath === false) { return }
			const
				{ path, importer, resolveDir, pluginData = {} } = args,
				dir = isAbsolutePath(importer)
					? importer
					: joinPaths(ensureEndSlash(resolveDir), importer),
				resolved_path = isAbsolutePath(path)
					? pathToPosixPath(path) // I don't want to see ugly windows back-slashes in the esbuild resolved-path comments and metafile
					: resolvePath(dir, ensureStartDotSlash(path))
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
export const resolverPlugin: EsbuildPlugin = {
	name: "oazmi-plugindata-resolvers",
	setup: resolverPluginSetup(),
}
