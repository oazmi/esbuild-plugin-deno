/** an esbuild plugin that resolves [jsr:](https://jsr.io) package imports.
 * 
 * @module
*/

import { type esbuild, defaultResolvePath, ensureEndSlash, ensureStartDotSlash, joinPaths, json_stringify, parsePackageUrl } from "../deps.ts"
import { DenoPackageMetadata } from "../importmap/deno.ts"
import { resolvePathFromImportMap } from "../importmap/funcdefs.ts"
import type { CommonPluginData, CommonPluginResolverConfig } from "./typedefs.ts"


interface JsrPluginSetupConfig {
	filters: RegExp[]
	globalImportMap?: CommonPluginResolverConfig["globalImportMap"]
	resolvePath: CommonPluginResolverConfig["resolvePath"]
}

const defaultJsrPluginSetupConfig: JsrPluginSetupConfig = {
	filters: [/^jsr\:/],
	globalImportMap: undefined,
	resolvePath: defaultResolvePath,
}

export const jsrPluginSetup = (config: Partial<JsrPluginSetupConfig> = {}): esbuild.Plugin["setup"] => {
	const { filters, globalImportMap, resolvePath } = { ...defaultJsrPluginSetupConfig, ...config }

	return (async (build: esbuild.PluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions

		filters.forEach((filter) => {
			build.onResolve({ filter }, async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult> => {
				const
					{ path, pluginData, ...rest_args } = args,
					{ importMap: _0, ...restPluginData } = (pluginData ?? {}) as CommonPluginData,
					package_meta = await DenoPackageMetadata.fromUrl(path),
					name = package_meta.getName(),
					version = package_meta.getVersion(),
					base_url = `https://jsr.io/${name}/${version}`,
					internal_map = package_meta.getInternalMap(base_url),
					relative_alias_pathname = parsePackageUrl(path).pathname,
					relative_alias = relative_alias_pathname === "/" ? "." : ensureStartDotSlash(relative_alias_pathname),
					relative_path = resolvePathFromImportMap(relative_alias, package_meta.getCustomExportMap({ baseAliasDir: "./", basePathDir: "./" }))
				if (!relative_path) { throw new Error(`failed to resolve the path "${path}" from the export-map:\n${json_stringify(package_meta.getExportMap())}`) }
				const
					path_url = joinPaths(ensureEndSlash(base_url), relative_path),
					importMap = { ...globalImportMap, ...internal_map }
				return build.resolve(path_url, { ...rest_args, pluginData: { importMap, ...restPluginData } })
			})
		})
	})
}
