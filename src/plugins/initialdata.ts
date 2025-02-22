/** this submodule provides an esbuild plugin that applies a specific plugin data to all entry-points,
 * and then leaves it for other plugins to resolve.
 * 
 * TODO: should I rename this submodule to "initial d" to increase nipponjin-weebness levels?
 *   it would be a missed opportunity if I don't.
 * 
 * @module
*/

import { normalizePath, type esbuild } from "../deps.ts"


/** a symbol that gets implanted into resolving-entry's `pluginData`,
 * that indicates that it has been captured by the initial-data plugin's resolver once,
 * so that it does not infinitely continue getting captured by it recuresively
 * (since the resolver's filter is set to capture all paths by default).
*/
export const CAPTURED_ALREADY: unique symbol = Symbol()

/** the generic `pluginData` interface used by the initial-data plugin.
 * 
 * it adds a unique symbol marker (of generic type `CapturedMarker`) to the `args.pluginData`,
 * so as to detect whether the entity that it has received is already being processed by a previous initial-data resolver call.
 * this prevents an infinite `onResolve` recursion in the initial-data plugin,
 * which is necessary since it uses the capture all filter (`RegExp(".*")`) by default (thereby intercepting all `onResolve` calls).
*/
type InitialPluginData<CapturedMarker extends symbol> = {
	[marker in CapturedMarker]?: boolean
} & { [key: string]: any }

/** the configuration interface for the {@link onResolveInitialDataFactory} function. */
export interface ResolveInitialDataFactoryConfig<T = any> {
	/** the initial data that should be implanted onto the entrypoints. */
	pluginData: T

	/** provide a unique symbol that will be implanted into the entity's {@link esbuild.OnResolveArgs.PluginData},
	 * so that subsequent calls to the same initial-data path-resolver will terminate early, in order to avoid infinite recursion.
	 * 
	 * @defaultValue {@link CAPTURED_ALREADY}
	*/
	pluginDataMarker: symbol

	/** specify if you wish for the dependencies of the captured `"entry-points"` to be captured as well?
	 * 
	 * _why_? you ask? that's because esbuild's native loaders do not propagate the `pluginData` passed by the resolver, onto the dependency entities.
	 * this means that the initial-data will be lost when a dependency of an entry-point is being resolved, due to esbuild's native loader not preserving it.
	 * thus, our plugin will have to keep track of which entities it has already pushed its initial-data onto,
	 * and then be on the lookout for dependency entities that come from an importer file that has had the initial-data injected into it,
	 * so that this dependency entity can also be injected with the same initial-data.
	 * 
	 * if you don't want the initial-data to be injected onto the entry-point's dependencies (and deep grandchildren dependencies),
	 * make sure to turn off this option, otherwise it'll be enabled by default.
	 * 
	 * @defaultValue `true`
	*/
	captureDependencies: boolean

	/** aside from the `pluginData`, you can provide additional path-resolution-args to override when `build.resolve`
	 * is called inside the body of {@link onResolveInitialDataFactory}, so that you can mutate properties of the entrypoint.
	 * 
	 * for instance:
	 * - setting `onResolveArgs.namespace = "oazmi-http"` will mean that you've effectively redirected the path resolution to the `"oazmi-http"` namespace.
	 *   this can be a tactic to redirect all desired inputs to a specific namespace for resolution.
	 * - setting `onResolveArgs.resolveDir` can let you specify the `"node_modules"`'s parent directory in which esbuild should scan for npm imports.
	 * 
	 * @defaultValue `{}` (no overwrites applied)
	*/
	onResolveArgs?: Partial<Omit<esbuild.OnResolveArgs, "pluginData" | "path">>
}

/** the configuration interface for the initial-data esbuild plugin {@link initialDataPluginSetup}. */
export interface InitialDataPluginSetupConfig<T = any> extends ResolveInitialDataFactoryConfig<T> {
	/** specify the regex filter to use for your initial-data-injection plugin.
	 * 
	 * @defaultValue `RegExp(".*")` (captures all input entities)
	*/
	filter: esbuild.OnResolveOptions["filter"]

	/** specify the namespace filter to use for your initial-data-injection plugin.
	 * 
	 * @defaultValue `undefined` (captures all inputs in the default namespace, which is either `"file"`, `""`, or `undefined`)
	*/
	inputNamespace?: esbuild.OnResolveOptions["namespace"]
}

const defaultResolveInitialDataFactoryConfig: ResolveInitialDataFactoryConfig<any> = {
	pluginData: {},
	pluginDataMarker: CAPTURED_ALREADY,
	captureDependencies: true,
	onResolveArgs: {},
}

const defaultInitialDataPluginSetupConfig: InitialDataPluginSetupConfig<any> = {
	...defaultResolveInitialDataFactoryConfig,
	filter: /.*/,
	inputNamespace: undefined,
}

const onResolveInitialDataFactory = <T>(config: Partial<ResolveInitialDataFactoryConfig<T>>, build: esbuild.PluginBuild) => {
	const
		{ pluginData: initialPluginData, pluginDataMarker, captureDependencies, onResolveArgs } = { ...defaultResolveInitialDataFactoryConfig, ...config },
		captured_resolved_paths = new Set<string>()

	return async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult | undefined> => {
		const
			{ path, pluginData = {}, ...rest_args } = args,
			merged_plugin_data = { ...initialPluginData, ...pluginData } as InitialPluginData<typeof pluginDataMarker>,
			{ kind, importer } = rest_args

		// if the `kind` is not an entrypoint, nor is the `importer` one of the files that has been previously captured for initial-data injection,
		// then skip, since this plugin is intended to insert plugin data only to entry points, and their dependencies.
		if (kind !== "entry-point" && !captured_resolved_paths.has(normalizePath(importer))) { return undefined }

		// if the plugin marker already exists for this entity, then we've already processed it once,
		// therefore we should return `undefined` so that we don't end in an infinite onResolve recursion.
		// this way, the next resolver registered to esbuild (or its native resolver) will take up the task for resolving this entity.
		if (merged_plugin_data[pluginDataMarker]) { return undefined }
		merged_plugin_data[pluginDataMarker] = true

		const resolved_result = await build.resolve(path, { ...rest_args, ...onResolveArgs, pluginData: merged_plugin_data })
		// once again, if esbuild's native resolver resolved the `path`, then the `merged_plugin_data` that we just inserted will be lost.
		// i.e. `resolved_result.pluginData === undefined` if esbuild's native resolver took care of the path-resolution.
		// in such cases, we would like to re-insert our `merged_plugin_data` again, before returning the result
		if (resolved_result.pluginData === undefined) { resolved_result.pluginData = merged_plugin_data }
		if (captureDependencies) { captured_resolved_paths.add(normalizePath(resolved_result.path)) }
		return { ...resolved_result, pluginData: merged_plugin_data }
	}
}

/** setup function for an initial-data plugin.
 * 
 * the initial-data plugin will intercept all `onResolve` calls made by esbuild _once_,
 * and insert the user's desired `pluginData` to each entrypoint (i.e. when `args.kind === "entrypoint"`).
 * after that, the entity's path will then be passed onto other plugins (or esbuild's native resolver) for resolution.
 * 
 * for details on how to configure, see {@link InitialDataPluginSetupConfig}.
 * 
 * > [!tip]
 * > you may wonder, how does this plugin not end up in a recursive infinite loop of `onResolve` calls, when it captures everything?
 * > 
 * > the way it works is that the first time an entity is encountered, we insert a unique symbol ({@link CAPTURED_ALREADY}) inside `args.pluginData`.
 * > and upon the discovery of the same symbol in a recursive/subsequent call, we terminate the path-resolution (by returning `undefined`),
 * > so that esbuild uses the next available path-resolver for this entity.
*/
export const initialDataPluginSetup = <T = any>(config: Partial<InitialDataPluginSetupConfig<T>> = {}): esbuild.Plugin["setup"] => {
	const
		{ filter, inputNamespace, ...rest_config } = { ...defaultInitialDataPluginSetupConfig, ...config },
		pluginResolverConfig: Partial<ResolveInitialDataFactoryConfig<T>> = rest_config

	return (async (build: esbuild.PluginBuild): Promise<void> => {
		const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions

		build.onResolve({ filter, namespace: inputNamespace }, onResolveInitialDataFactory(pluginResolverConfig, build))
	})
}

/** {@inheritDoc initialDataPluginSetup} */
export const initialDataPlugin = <T = any>(config?: Partial<InitialDataPluginSetupConfig<T>>): esbuild.Plugin => {
	return {
		name: "oazmi-initialdata-plugin",
		setup: initialDataPluginSetup<T>(config),
	}
}
