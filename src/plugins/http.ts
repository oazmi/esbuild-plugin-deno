/** an esbuild plugin that resolves and loads http/https references.
 * 
 * @module
*/

import { type esbuild, defaultResolvePath, isAbsolutePath } from "../deps.js"
import { onResolveFactory, unResolveFactory, urlLoaderFactory } from "./funcdefs.js"
import type { CommonPluginLoaderConfig, CommonPluginResolverConfig } from "./typedefs.js"


export interface HttpPluginSetupConfig {
	acceptLoaders?: CommonPluginLoaderConfig["acceptLoaders"]
	defaultLoader: CommonPluginLoaderConfig["defaultLoader"]
	filters: RegExp[]
	globalImportMap?: CommonPluginResolverConfig["globalImportMap"]
	namespace: CommonPluginResolverConfig["namespace"]
	resolvePath: CommonPluginResolverConfig["resolvePath"]
}

export const defaultHttpPluginSetupConfig: HttpPluginSetupConfig = {
	acceptLoaders: undefined,
	defaultLoader: "copy",
	filters: [/^https?\:\/\//, /^file\:\/\//],
	globalImportMap: undefined,
	namespace: "oazmi-http",
	resolvePath: defaultResolvePath,
}

export const httpPluginSetup = (config: Partial<HttpPluginSetupConfig> = {}): esbuild.Plugin["setup"] => {
	const
		{ acceptLoaders, defaultLoader, filters, globalImportMap, namespace: plugin_ns, resolvePath } = { ...defaultHttpPluginSetupConfig, ...config },
		pluginResolverConfig: CommonPluginResolverConfig = { isAbsolutePath, namespace: plugin_ns, globalImportMap, resolvePath },
		pluginLoaderConfig: CommonPluginLoaderConfig = { acceptLoaders, defaultLoader, namespace: plugin_ns }

	return (async (build: esbuild.PluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions

		// the placement of the `onResolve` and `onLoader` callbacks is ordered in their natural handling pathway
		filters.forEach((filter) => {
			build.onResolve({ filter }, onResolveFactory(pluginResolverConfig))
		})
		build.onLoad({ filter: /.*/, namespace: plugin_ns }, urlLoaderFactory(pluginLoaderConfig))
		build.onResolve({ filter: /.*/, namespace: plugin_ns }, unResolveFactory(pluginResolverConfig, build))
	})
}

/** {@inheritDoc httpPluginSetup} */
export const httpPlugin = (config?: Partial<HttpPluginSetupConfig>): esbuild.Plugin => {
	return {
		name: "oazmi-http-plugin",
		setup: httpPluginSetup(config),
	}
}
