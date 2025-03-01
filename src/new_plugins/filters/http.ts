/** an esbuild plugin that fetches and loads `"http://"`, `"https://"`, and `"file://"` resources.
 * 
 * @module
*/

import type { esbuild } from "../../deps.ts"
import { urlLoaderFactory } from "../../plugins/funcdefs.ts"
import type { CommonPluginLoaderConfig } from "../../plugins/typedefs.ts"
import { defaultEsbuildNamespaces, type OnResolveArgs, type OnResolveCallback, PLUGIN_NAMESPACE } from "../typedefs.ts"
import type { entryPlugin } from "./entry.ts"


/** configuration options for the {@link httpPluginSetup} and {@link httpPlugin} functions. */
export interface HttpPluginSetupConfig {
	/** the regex filters which the plugin's resolvers should use for the interception of resource-paths.
	 * 
	 * @defaultValue `[/^https?\:\/\//, /^file\:\/\//]` (captures `"http://"`, `"https://"`, and `"file://"` uris)
	*/
	filters: RegExp[]

	/** specify the namespace that the http plugin's loader should use.
	 * 
	 * > [!caution]
	 * > it is best if you don't modify it to something besides the default value {@link PLUGIN_NAMESPACE.LOADER_HTTP},
	 * > as this plugin relies on the entry-plugin's prior intervention to have relative-paths and import-map paths resolved to a full http path.
	*/
	namespace: string

	/** the default loader that the plugin's loader should use for unidentified content types.
	 * 
	 * if you would like to use esbuild's _own_ default loader, set the value to `"default"`.
	 * 
	 * @defaultValue `"copy"`
	*/
	defaultLoader: esbuild.Loader

	/** only accept the following subset of loaders when auto content-detection is used for guessing the loader type.
	 * 
	 * > [!note]
	 * > if there is no intersection between the set of guessed loaders, and this set of `acceptLoaders`,
	 * > then the default loader ({@link defaultLoader}) will be used as a fallback.
	 * 
	 * @defaultValue `undefined` (i.e. all available esbuild loaders)
	*/
	acceptLoaders?: undefined | Array<esbuild.Loader>

	/** specify which `namespace`s should be intercepted by the http-point plugin.
	 * all other `namespace`s will not be processed by this plugin.
	 * 
	 * if you have a plugin with a custom loader that works under some `"custom-namespace"`,
	 * you can include your `"custom-namespace"` here, so that if it performs an http-import,
	 * that import path will be captured by this plugin, and then consequently fetched by this plugin's http-loader.
	 * but do note that the namespace of the loaded resource will switch to this plugin's loader {@link namespace}
	 * (which defaults to {@link PLUGIN_NAMESPACE.LOADER_HTTP}), instead of your `"custom-namespace"`.
	 * 
	 * @defaultValue `[undefined, "", "file"]` (also this plugin's {@link namespace} gets added later on)
	*/
	acceptNamespaces: Array<string | undefined>
}

export const defaultHttpPluginSetupConfig: HttpPluginSetupConfig = {
	filters: [/^https?\:\/\//, /^file\:\/\//],
	namespace: PLUGIN_NAMESPACE.LOADER_HTTP,
	acceptNamespaces: defaultEsbuildNamespaces,
	defaultLoader: "copy",
	acceptLoaders: undefined,
}

/** this plugin intercepts `"http://"`, `"https://"`, and `"file://"` resource paths and redirects them to the {@link PLUGIN_NAMESPACE.LOADER_HTTP} namespace,
 * where they can be fetched and loaded by a dedicated loader.
 * 
 * the loader function tries to guess the resource's `loader` type by inspecting its `"content-type"` http-header and/or its path extension/suffix.
 * 
 * > [!important]
 * > you are generally expected to have the {@link entryPlugin} in your list of esbuild plugins (preferably in the beginning) for this plugin to function correctly.
 * > the resolver portion of this plugin is intentionally made to be super basic, so that all it does is redirect absolute urls to its loader's namespace.
 * > this means that the resolver in this plugin will not carry out relative-path/import-map/package-alias resolution.
 * > which is why you should have the {@link entryPlugin} loaded, in order for these various path resolutions to take place.
 * 
 * TODO: maybe I should also create a standalone http plugin in the future that will not rely on {@link entryPlugin},
 *   in case someone really just wants to use a single http plugin without all the fancy entry-point plugin-data injection.
 *   although, then it would not be recommended to use that standalone version along side an {@link entryPlugin},
 *   since it will lead to some redundant ping-pongging (but the final resolved result will remain unchanged).
*/
export const httpPluginSetup = (config: Partial<HttpPluginSetupConfig> = {}): esbuild.Plugin["setup"] => {
	const
		{ acceptLoaders, defaultLoader, filters, namespace: plugin_ns, acceptNamespaces: _acceptNamespaces } = { ...defaultHttpPluginSetupConfig, ...config },
		acceptNamespaces = new Set([..._acceptNamespaces, plugin_ns]),
		pluginLoaderConfig: CommonPluginLoaderConfig = { acceptLoaders, defaultLoader, namespace: plugin_ns }

	return (async (build: esbuild.PluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions

		const httpResolver: OnResolveCallback = async (args: OnResolveArgs) => {
			// skip resolving any `namespace` that we do not accept
			if (!acceptNamespaces.has(args.namespace)) { return }
			const { path, pluginData } = args
			return { path, pluginData, namespace: plugin_ns }
		}

		filters.forEach((filter) => {
			build.onResolve({ filter }, httpResolver)
		})
		build.onLoad({ filter: /.*/, namespace: plugin_ns }, urlLoaderFactory(pluginLoaderConfig))
	})
}

/** {@inheritDoc httpPluginSetup} */
export const httpPlugin = (config?: Partial<HttpPluginSetupConfig>): esbuild.Plugin => {
	return {
		name: "oazmi-http-plugin",
		setup: httpPluginSetup(config),
	}
}
