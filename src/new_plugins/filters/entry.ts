import type { EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, OnResolveArgs } from "../typedefs.ts"
import { defaultEsbuildNamespaces, resolversPluginNamespace } from "../typedefs.ts"


/** configuration options for the {@link entryPluginSetup} esbuild-setup factory function. */
export interface EntryPluginSetupConfig {
	/** specify the regex filters to use for your path-resolver plugin.
	 * 
	 * @defaultValue `[RegExp(".*"),]` (captures all input entities)
	*/
	filters: RegExp[]
}

const defaultEntryPluginSetup: EntryPluginSetupConfig = {
	filters: [/.*/],
}

/** TODO: add description */
export const entryPluginSetup = (config?: Partial<EntryPluginSetupConfig>): EsbuildPluginSetup => {
	const
		{ filters } = { ...defaultEntryPluginSetup, ...config },
		ALREADY_CAPTURED_BY_RESOLVER: unique symbol = Symbol()

	return async (build: EsbuildPluginBuild) => {
		const absolutePathResolver = async (args: OnResolveArgs) => {
			// if the plugin marker already exists for this entity, then we've already processed it once,
			// therefore we should return `undefined` so that we don't end in an infinite onResolve recursion.
			// this way, the next resolver registered to esbuild (or its native resolver) will take up the task for resolving this entity.
			if ((args.pluginData ?? {})[ALREADY_CAPTURED_BY_RESOLVER]) { return }
			// NOTE: for some reason, not specifying the `namespace` in the `build.onResolve` function, or setting it to just `""` will capture ALL namespaces!
			//   which is why it is absolutely essential to use the validation below,
			//   otherwise these resolvers will even capture the `resolversPluginNamespace` namespace, resulting in an infinite loop.
			if (!defaultEsbuildNamespaces.includes(args.namespace)) { return }
			const
				{ path, namespace: original_ns, ...rest_args } = args,
				abs_result = await build.resolve(path, { ...rest_args, namespace: resolversPluginNamespace })
			// if (!abs_result) { return } // such a thing never happens
			const
				{ path: abs_path, pluginData: abs_pluginData = {}, namespace: _0 } = abs_result,
				next_pluginData = { ...abs_pluginData, [ALREADY_CAPTURED_BY_RESOLVER]: true },
				resolved_result = await build.resolve(abs_path, { ...rest_args, namespace: original_ns, pluginData: next_pluginData })
			// if (!resolved_result) { return } // such a thing never happens
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
