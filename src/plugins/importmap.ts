/** an esbuild plugin that provides a global import map for specifying aliases.
 * 
 * @module
*/

import type { esbuild } from "../deps.ts"
import { resolvePathFromImportMap } from "../importmap/funcdefs.ts"
import type { ImportMap } from "../importmap/typedefs.ts"


/** a symbol that gets implanted into resolving-entry's `pluginData`,
 * that indicates that it has been captured by the global-import-map resolver once,
 * so that it does not infinitely continue getting captured by it recuresively
 * (since the resolver's filter is set to capture all paths by default).
*/
export const CAPTURED_ALREADY = Symbol()

/** the generic `pluginData` interface used by the import map plugin.
 * 
 * it adds a unique symbol marker (of generic type `CapturedMarker`) to the `args.pluginData`,
 * so as to detect whether the entity that it has received is already being processed by a previous import-map resolver call.
 * this prevents an infinite `onResolve` recursion in the import-map plugin,
 * which is necessary since it uses the capture all filter (`RegExp(".*")`) by default (thereby intercepting all `onResolve` calls).
*/
type ImportMapPluginData<CapturedMarker extends symbol> = {
	[marker in CapturedMarker]?: boolean
} & { [key: string]: any }

/** the configuration interface for the resolve import-map factory function {@link onResolveImportMapFactory}. */
export interface ResolveImportMapFactoryConfig {
	/** specify the import-map to use for resolving aliases. to read more about import-maps check out {@link ImportMap}.
	 * 
	 * @defaultValue `{}` (empty object/dictionary)
	*/
	importMap: ImportMap

	/** provide a unique symbol that will be implanted into the entity's {@link esbuild.OnResolveArgs.PluginData},
	 * so that subsequent calls to the same import-map path-resolver will terminate early, in order to avoid infinite recursion.
	 * 
	 * @defaultValue {@link CAPTURED_ALREADY}
	*/
	pluginDataMarker: symbol

	/** specify an optional namespace to assign to entity being resolved, **if** it does happen to be part of your {@link importMap}.
	 * if the input entity's path is not part of the import-map, then this namespace will not be assigned.
	 * 
	 * @defaultValue `undefined`
	*/
	namespace?: esbuild.OnResolveResult["namespace"]
}

const defaultResolveImportMapFactoryConfig: ResolveImportMapFactoryConfig = {
	importMap: {},
	pluginDataMarker: CAPTURED_ALREADY,
	namespace: undefined,
}

/** the configuration interface for the import-map esbuild plugin {@link importMapPluginSetup}. */
export interface ImportMapPluginSetupConfig {
	/** {@inheritDoc ResolveImportMapFactoryConfig.importMap} */
	importMap: ResolveImportMapFactoryConfig["importMap"]

	/** {@inheritDoc ResolveImportMapFactoryConfig.pluginDataMarker} */
	pluginDataMarker?: ResolveImportMapFactoryConfig["pluginDataMarker"]

	/** {@inheritDoc ResolveImportMapFactoryConfig.namespace} */
	outputNamespace?: ResolveImportMapFactoryConfig["namespace"]

	/** specify the regex filter to use for your import-map path-resolver plugin.
	 * 
	 * @defaultValue `RegExp(".*")` (captures all input entities)
	*/
	filter: esbuild.OnResolveOptions["filter"]

	/** specify the namespace filter to use for your import-map path-resolver plugin.
	 * 
	 * @defaultValue `undefined` (captures all inputs in the default namespace, which is either `"file"`, `""`, or `undefined`)
	*/
	inputNamespace?: esbuild.OnResolveOptions["namespace"]
}

const defaultImportMapPluginSetupConfig: ImportMapPluginSetupConfig = {
	filter: /.*/,
	inputNamespace: undefined,
	importMap: {},
	pluginDataMarker: undefined,
	outputNamespace: undefined,
}

// TODO: in the future, maybe it will be a good idea to make it so that you could set a subset of preferred loaders to use for a particular import map entry.

/** a factory function to create a {@link esbuild.PluginBuild.onResolve} callback for the import-map plugin, with tweakable configuration. */
const onResolveImportMapFactory = (config: Partial<ResolveImportMapFactoryConfig>, build: esbuild.PluginBuild) => {
	const { importMap, pluginDataMarker, namespace } = { ...defaultResolveImportMapFactoryConfig, ...config }

	return async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult | undefined> => {
		const {
			path,
			pluginData = {} as ImportMapPluginData<typeof pluginDataMarker>,
			...rest_args
		} = args
		// if the plugin marker already exists for this entity, then we've already processed it once,
		// therefore we should return `undefined` so that we don't end in an infinite onResolve recursion.
		// this way, the next resolver registered to esbuild (or its native resolver) will take up the task for resolving this entity.
		if (pluginData[pluginDataMarker]) { return undefined }
		pluginData[pluginDataMarker] = true
		const resolved_path = resolvePathFromImportMap(path, importMap)
		// if this path is not part of the import map, simply ignore it by returning `undefined`, so that esbuild switches to the next path-resolver.
		if (resolved_path === undefined) { return undefined }
		const resolved_result = await build.resolve(resolved_path, { pluginData, ...rest_args })
		// if an output namespace was provided, then we'll overwrite the resolved one with our own desired `namespace`.
		if (namespace) { resolved_result.namespace = namespace }
		return resolved_result
	}
}

/** setup function for a global import-map plugin.
 * 
 * global import-maps will intercept all `onResolve` calls made by esbuild _once_,
 * before handing the entity in question to some other plugin to resolve (or letting esbuild do its native resolution).
 * if the entity's path (`args.path`) is a part of the import-map in the config ({@link ImportMapPluginSetupConfig.importMap}),
 * then this plugin will transform its path before handing it over to some other plugin to resolve.
 * 
 * for details on how to configure, see {@link ImportMapPluginSetupConfig}.
 * 
 * > [!tip]
 * > you may wonder, how does this plugin not end up in a recursive infinite loop of `onResolve` calls, when it captures everything?
 * > 
 * > the way it works is that the first time an entity is encountered, we insert a unique symbol ({@link CAPTURED_ALREADY}) inside `args.pluginData`.
 * > and upon the discovery of the same symbol in a recursive/subsequent call, we terminate the path-resolution (by returning `undefined`),
 * > so that esbuild uses the next available path-resolver for this entity.
*/
export const importMapPluginSetup = (config: Partial<ImportMapPluginSetupConfig> = {}): esbuild.Plugin["setup"] => {
	const
		{ filter, importMap, pluginDataMarker, inputNamespace, outputNamespace } = { ...defaultImportMapPluginSetupConfig, ...config },
		pluginResolverConfig: Partial<ResolveImportMapFactoryConfig> = { importMap, pluginDataMarker, namespace: outputNamespace }

	return (async (build: esbuild.PluginBuild): Promise<void> => {
		const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions

		build.onResolve({ filter, namespace: inputNamespace }, onResolveImportMapFactory(pluginResolverConfig, build))
	})
}
