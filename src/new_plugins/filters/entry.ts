import { normalizePath } from "../../deps.ts"
import type { CommonPluginData, EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, OnResolveArgs } from "../typedefs.ts"
import { defaultEsbuildNamespaces, resolversPluginNamespace } from "../typedefs.ts"


/** configuration options for the {@link entryPluginSetup} esbuild-setup factory function. */
export interface EntryPluginSetupConfig {
	/** specify the regex filters to use for your initial-data-injection and path-resolver plugin.
	 * 
	 * @defaultValue `[RegExp(".*"),]` (captures all input entities)
	*/
	filters: RegExp[]

	/** {@inheritDoc CommonPluginData} */
	pluginData?: Partial<CommonPluginData>

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
}

const defaultEntryPluginSetup: EntryPluginSetupConfig = {
	filters: [/.*/],
	pluginData: undefined,
	captureDependencies: true,
}

/** TODO: add description */
export const entryPluginSetup = (config?: Partial<EntryPluginSetupConfig>): EsbuildPluginSetup => {
	const
		{ filters, pluginData: initialPluginData, captureDependencies } = { ...defaultEntryPluginSetup, ...config },
		captured_resolved_paths = new Set<string>(),
		ALREADY_CAPTURED_BY_INJECTOR: unique symbol = Symbol(),
		ALREADY_CAPTURED_BY_RESOLVER: unique symbol = Symbol()

	return async (build: EsbuildPluginBuild) => {
		const entryPluginDataInjector = async (args: OnResolveArgs) => {
			// if the plugin marker already exists for this entity, then we've already processed it once,
			// therefore we should return `undefined` so that we don't end in an infinite onResolve recursion.
			// this way, the next resolver registered to esbuild (or its native resolver) will take up the task for resolving this entity.
			if ((args.pluginData ?? {})[ALREADY_CAPTURED_BY_INJECTOR]) { return }
			// NOTE: for some reason, not specifying the `namespace` in the `build.onResolve` function, or setting it to just `""` will capture ALL namespaces!
			//   which is why it is absolutely essential to use the validation below,
			//   otherwise these resolvers will even capture the `resolversPluginNamespace` namespace, resulting in an infinite loop.
			if (!defaultEsbuildNamespaces.includes(args.namespace)) { return }
			const
				{ path, pluginData = {}, ...rest_args } = args,
				merged_plugin_data = { ...initialPluginData, ...pluginData, [ALREADY_CAPTURED_BY_INJECTOR]: true },
				{ kind, importer } = rest_args

			// if the `kind` is not an entrypoint, nor is the `importer` one of the files that has been previously captured for initial-data injection,
			// then skip, since this plugin is intended to insert plugin data only to entry points, and their dependencies.
			if (kind !== "entry-point" && !captured_resolved_paths.has(normalizePath(importer))) { return }

			// below, we implicitly (hope to) call the `absolutePathResolver`, so long as no other "capture-all" plugin exists before this plugin.
			const resolved_result = await build.resolve(path, { ...rest_args, pluginData: merged_plugin_data })
			// if esbuild's native resolver had resolved the `path`, then the `merged_plugin_data` that we just inserted WILL be lost.
			// i.e. `resolved_result.pluginData === undefined` if esbuild's native resolver took care of the path-resolution.
			// in such cases, we would like to re-insert our `merged_plugin_data` again, before returning the result
			if (resolved_result.pluginData === undefined) { resolved_result.pluginData = merged_plugin_data }
			// if we intend to capture the dependencies of this entity for `pluginData` injection operation,
			// then we must add this entity's path to `captured_resolved_paths`, so that entities with the same `args.importer`
			// can be identified as dependencies of this entity, and thereby be injected.
			if (captureDependencies) { captured_resolved_paths.add(normalizePath(resolved_result.path)) }
			// NOTICE: unlike `absolutePathResolver`, we intentionally do not remove the `ALREADY_CAPTURED_BY_INJECTOR` marker from the result,
			//   because any plugin-data preserving loader-function or resolver-function will also keep our injected `pluginData` intact,
			//   hence there would be no need to re-inject the plugin-data (since it might also break stuff, like if we intentionally omit a plugin data in a loader).
			//   however, for non-plugin-data preserving plugins (such as esbuild's native loader and resolvers), they would strip away our marker themselves,
			//   leading us to re-inject the initial plugin-data upon its re-discovery (or the discovery of one of its dependencies).
			return resolved_result
		}

		const absolutePathResolver = async (args: OnResolveArgs) => {
			if ((args.pluginData ?? {})[ALREADY_CAPTURED_BY_RESOLVER]) { return }
			if (!defaultEsbuildNamespaces.includes(args.namespace)) { return }
			const
				{ path, namespace: original_ns, ...rest_args } = args,
				abs_result = await build.resolve(path, { ...rest_args, namespace: resolversPluginNamespace })
			const
				{ path: abs_path, pluginData: abs_pluginData = {}, namespace: _0 } = abs_result,
				next_pluginData = { ...abs_pluginData, [ALREADY_CAPTURED_BY_RESOLVER]: true },
				resolved_result = await build.resolve(abs_path, { ...rest_args, namespace: original_ns, pluginData: next_pluginData })
			// if esbuild's native resolver had resolved the `path`, then the `merged_plugin_data` that we just inserted WILL be lost.
			// i.e. `resolved_result.pluginData === undefined` if esbuild's native resolver took care of the path-resolution.
			// in such cases, we would like to re-insert our `merged_plugin_data` again, before returning the result
			if (resolved_result.pluginData === undefined) { resolved_result.pluginData = next_pluginData }
			// we must also disable the `ALREADY_CAPTURED_BY_RESOLVER` marker, since the `resolved_result` is ready to go to the loader,
			// however, we don't want the dependencies (which will inherit the `pluginData`) to have their capture marker set to `true`,
			// since they haven't actually been captured by this resolver yet.
			return resolved_result
		}

		for (const filter of filters) {
			build.onResolve({ filter }, entryPluginDataInjector)
			build.onResolve({ filter }, absolutePathResolver)
		}
	}
}

/** {@inheritDoc entryPluginSetup} */
export const entryPlugin = (config?: Partial<EntryPluginSetupConfig>): EsbuildPlugin => {
	return {
		name: "oazmi-entry",
		setup: entryPluginSetup(config),
	}
}
