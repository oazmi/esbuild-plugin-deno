/** an esbuild plugin that resolves and loads http/https references.
 * 
 * @module
*/

import { type esbuild, defaultResolvePath, isAbsolutePath } from "../deps.ts"
import { onResolveFactory, unResolveFactory, urlLoaderFactory } from "./funcdefs.ts"
import type { CommonPluginLoaderConfig, CommonPluginResolverConfig } from "./typedefs.ts"


export interface HttpPluginSetupConfig {
	defaultLoader: esbuild.Loader
	filters: RegExp[]
	namespace: string
	resolvePath: (...segments: string[]) => string
}

export const defaultHttpPluginSetupConfig: HttpPluginSetupConfig = {
	defaultLoader: "copy",
	filters: [/^https?\:\/\//, /^file\:\/\//],
	namespace: "oazmi-http",
	resolvePath: defaultResolvePath,
}

export const httpPluginSetup = (config: Partial<HttpPluginSetupConfig> = {}): esbuild.Plugin["setup"] => {
	const
		{ resolvePath, defaultLoader, filters, namespace: plugin_ns } = { ...defaultHttpPluginSetupConfig, ...config },
		pluginResolverConfig: CommonPluginResolverConfig = { isAbsolutePath, namespace: plugin_ns, resolvePath },
		pluginLoaderConfig: CommonPluginLoaderConfig = { defaultLoader, namespace: plugin_ns }

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
