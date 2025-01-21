/** an esbuild plugin that resolves and loads http/https references.
 * 
 * @module
*/

import { type esbuild, defaultResolvePath, ensureEndSlash, ensureStartDotSlash, isAbsolutePath, joinPaths, json_stringify, resolveAsUrl } from "../deps.ts"
import { guessHttpResponseLoaders } from "../loadermap/mod.ts"
import type { CommonPluginData } from "./typedefs.ts"


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

	return (async (build: esbuild.PluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions

		// this function resolves the absolute http href link of the provided args
		const resolveHttp = async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult> => {
			// `args.path` is absolute when the entity is an entry point
			// `args.path` is _possibly_ relative when the entity is imported by a another entity
			const
				{ path, resolveDir, importer, kind, namespace, pluginData } = args,
				dir = isAbsolutePath(importer)
					? importer
					: joinPaths(ensureEndSlash(resolveDir), importer),
				resolved_path = isAbsolutePath(path) ? path : resolvePath(dir, ensureStartDotSlash(path)),
				originalNamespace = namespace,
				importMap = {}
			// console.log("resolveHttp", { path, resolved_path, resolveDir, importer, kind, namespace, pluginData })
			return {
				path: resolved_path,
				namespace: plugin_ns,
				pluginData: { originalNamespace, importMap, ...pluginData } satisfies CommonPluginData
			}
		}

		// this function un-does the http `namespace`, and allows other plugins to potentially intercept the pure absolute path.
		const unresolveHttp = async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult> => {
			const {
				path,
				namespace: _0,
				pluginData: {
					originalNamespace,
					importMap,
					...restPluginData
				} = {} satisfies Partial<CommonPluginData>,
				...rest_args
			} = args
			const
				namespace = originalNamespace,
				{ path: resolved_abs_path, namespace: _1, pluginData: _2, ...rest_resolved_args } = await resolveHttp({ path, namespace, ...rest_args, pluginData: { importMap } })
			// console.log("unresolveHttp", { resolved_abs_path, _1, _2, resolveDir: rest_args.resolveDir, ...rest_resolved_args })
			return build.resolve(resolved_abs_path!, {
				...rest_args,
				...rest_resolved_args,
				namespace: originalNamespace,
				pluginData: { importMap, ...restPluginData },
			})
		}

		build.onResolve({ filter: /^https?\:\/\// }, resolveHttp)
		build.onResolve({ filter: /.*/, namespace: plugin_ns }, unresolveHttp)
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
