/** an esbuild plugin that resolves and loads http/https references.
 * 
 * @module
*/

import { type esbuild, defaultResolvePath, isAbsolutePath, json_stringify, resolveAsUrl } from "../deps.ts"
import { guessHttpResponseLoaders } from "../loadermap/mod.ts"
import { onResolveFactory, unResolveFactory } from "./funcdefs.ts"
import type { CommonPluginSetupConfig } from "./typedefs.ts"


export interface HttpPluginSetupConfig {
	defaultLoader: esbuild.Loader
	namespace: string
	resolvePath: (...segments: string[]) => string
}

export const defaultHttpPluginSetupConfig: HttpPluginSetupConfig = {
	defaultLoader: "copy",
	namespace: "oazmi-http",
	resolvePath: defaultResolvePath,
}

export const httpPluginSetup = (config: Partial<HttpPluginSetupConfig> = {}): esbuild.Plugin["setup"] => {
	const { resolvePath, defaultLoader, namespace: plugin_ns } = { ...defaultHttpPluginSetupConfig, ...config }
	const pluginResolverConfig: CommonPluginSetupConfig = { defaultLoader: "default", isAbsolutePath, namespace: plugin_ns, resolvePath }

	return (async (build: esbuild.PluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions

		build.onResolve({ filter: /^https?\:\/\// }, onResolveFactory(pluginResolverConfig))
		build.onResolve({ filter: /.*/, namespace: plugin_ns }, unResolveFactory(pluginResolverConfig, build))
		build.onLoad({ filter: /.*/, namespace: plugin_ns }, async (args: esbuild.OnLoadArgs) => {
			// `args.path` is absolute when the entity is an entry point
			// `args.path` is _possibly_ relative when the entity is imported by a another entity
			const
				{ path, pluginData } = args,
				path_url = resolveAsUrl(resolvePath(path)),
				response = await fetch(path_url)
			if (!response.ok) {
				throw new Error(`[oazmi-http-plugin] ERROR: network fetch response was not ok (${response.status}). response header:\n${json_stringify(response.headers)}`)
			}
			// console.log("loadHttp", { path, pluginData })
			const
				loaders = guessHttpResponseLoaders(response),
				preferred_loader = loaders.at(0) ?? defaultLoader,
				contents = await response.bytes()
			// console.log("loadHttp", { loaders, preferred_loader })
			return {
				contents,
				loader: preferred_loader,
				// unfortunately, if we set the `resolveDir` to anything but an empty string, then it will be appended to the
				// previous `resolveDir` of the resolver. even if provide an absolute path value to it, it still joins it up.
				// I think the intention behind `resolveDir` is to set the OUTPUT relative directory,
				// and not that we're trying to specify the current working/loading directory.
				// but it still doesn't work (i.e. I am unable to manipulate the output dir via this option).
				// resolveDir: resolveAsUrl("./", path).href,
				pluginData,
			}
		})
	})
}
