import { defaultResolvePath, ensureEndSlash, ensureStartDotSlash, type esbuild, isAbsolutePath, joinPaths, type MaybePromise, noop, pathToPosixPath } from "../deps.ts"
import { resolvePathFromImportMap } from "../importmap/mod.ts"
import type { ImportMap } from "../importmap/typedefs.ts"
import type { RuntimePackage } from "../packageman/base.ts"


export interface RuntimePackageResolverConfig {
	/** enable or disable runtime-package (such as "deno.json") alias resolution.
	 * 
	 * @defaultValue `true` (enabled)
	*/
	enabled: boolean
	// initialRuntimePackage: RuntimePackage<any>
	// external: string[]
	// subnamespace: string
}

export interface ImportMapResolverConfig {
	/** enable or disable import-map resolution.
	 * 
	 * @defaultValue `true` (enabled)
	*/
	enabled: boolean
	globalImportMap: ImportMap
	// initialImportMap: ImportMap
	// subnamespace: string
}

export interface NodeModulesResolverConfig {
	/** enable or disable `node_module` resolution.
	 * 
	 * @defaultValue `false` (disabled) - TODO: this needs to be worked on
	*/
	enabled: boolean
	// external: string[]
	// subnamespace: string
}

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

	// subnamespace: string
}

const
	defaultRuntimePackageResolverConfig: RuntimePackageResolverConfig = {
		enabled: true,
		// subnamespace: "packageman",
	},
	defaultImportMapResolverConfig: ImportMapResolverConfig = {
		enabled: true,
		globalImportMap: {},
		// initialImportMap: {},
		// subnamespace: "importmap",
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

export interface Config {
	runtimePackage: RuntimePackageResolverConfig
	importMap: ImportMapResolverConfig
	nodeModules: NodeModulesResolverConfig
	relativePath: RelativePathResolverConfig
	filters: RegExp[]
	namespace: string
}

const defaultConfig: Config = {
	runtimePackage: defaultRuntimePackageResolverConfig,
	importMap: defaultImportMapResolverConfig,
	nodeModules: defaultNodeModulesResolverConfig,
	relativePath: defaultRelativePathResolverConfig,
	filters: [/.*/],
	namespace: "oazmi-resolvers-pipeline",
}

interface CommonPluginData {
	runtimePackage?: RuntimePackage<any>
	importMap?: ImportMap
}

// TODO: fix the implementation in kitchensink
type DeepPartial<T> = T extends (Function | Array<any> | String | BigInt | Number | Boolean | Symbol)
	? T : T extends Record<string, any>
	? { [P in keyof T]?: DeepPartial<T[P]> } : T

type OnResolveCallback = (args: esbuild.OnResolveArgs) => MaybePromise<esbuild.OnResolveResult | null | undefined>

export const resolverPluginSetup = (config?: DeepPartial<Config>): esbuild.Plugin["setup"] => {
	const {
		runtimePackage: _runtimePackageResolverConfig,
		importMap: _importMapResolverConfig,
		nodeModules: _nodeModulesResolverConfig,
		relativePath: _relativePathResolverConfig,
		filters,
		namespace: plugin_ns,
	} = { ...defaultConfig, ...config }
	const
		runtimePackageResolverConfig = { ...defaultRuntimePackageResolverConfig, ..._runtimePackageResolverConfig },
		importMapResolverConfig = { ...defaultImportMapResolverConfig, ..._importMapResolverConfig },
		nodeModulesResolverConfig = { ...defaultNodeModulesResolverConfig, ..._nodeModulesResolverConfig },
		relativePathResolverConfig = { ...defaultRelativePathResolverConfig, ..._relativePathResolverConfig },
		// a non-empty string namespace is required if the file is not an absolute path on the filesystem.
		outputNamespace = "discard-this-namespace"

	return async (build: esbuild.PluginBuild): Promise<void> => {
		// first comes the runtime-package-manager resolver, if it is enabled, that is.
		const runtimePackageResolver: OnResolveCallback = (runtimePackageResolverConfig.enabled === false) ? noop : async (args) => {
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
				namespace: outputNamespace,
				pluginData: { ...pluginData } satisfies CommonPluginData
			} : undefined
		}

		// second attempt at resolving the path is made by the import-map and global-import-map resolver (if it is enabled).
		const { globalImportMap } = importMapResolverConfig
		const importMapResolver: OnResolveCallback = (importMapResolverConfig.enabled === false) ? noop : async (args) => {
			const
				{ path, pluginData = {} } = args,
				importMap = { ...globalImportMap, ...pluginData.importMap } as ImportMap,
				// if the input `path` is an import being performed inside of a package, in addition to not being a relative import,
				// then use the package manager to resolve the imported path.
				resolved_path = resolvePathFromImportMap(path, importMap)
			return resolved_path ? {
				path: resolved_path,
				namespace: outputNamespace,
				pluginData: { ...pluginData } satisfies CommonPluginData
			} : undefined
		}

		// TODO: third attempt at resolving the path should be made by esbuild's native `node_modules` resolver, but that will be implemented later.
		const nodeModulesResolver: OnResolveCallback = (nodeModulesResolverConfig.enabled === false) ? noop : async (args) => {
			console.warn(`TODO: a namespaced wrapper for esbuild's native resolver for "node_modules" packages/aliases has not been implemented yet.`)
			return undefined
		}

		// final attempt at resolving the path is made by simply joining potentially relative paths with the `importer` (if enabled).
		const { resolvePath, isAbsolutePath } = relativePathResolverConfig
		const relativePathResolver: OnResolveCallback = (relativePathResolverConfig.enabled === false) ? noop : async (args) => {
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
				namespace: outputNamespace,
				pluginData: { ...pluginData } satisfies CommonPluginData
			}
		}

		for (const filter of filters) {
			build.onResolve({ filter, namespace: plugin_ns }, runtimePackageResolver)
			build.onResolve({ filter, namespace: plugin_ns }, importMapResolver)
			build.onResolve({ filter, namespace: plugin_ns }, nodeModulesResolver)
			build.onResolve({ filter, namespace: plugin_ns }, relativePathResolver)
		}
	}
}
