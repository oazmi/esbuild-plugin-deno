/** an esbuild plugin that resolves [jsr:](https://jsr.io) package imports.
 * 
 * @module
*/

import { type esbuild, defaultResolvePath, ensureStartDotSlash, parsePackageUrl } from "../deps.ts"
import { DenoPackage } from "../packageman/deno.ts"
import type { httpPlugin } from "./http.ts"
import type { CommonPluginData, CommonPluginResolverConfig } from "./typedefs.ts"


/** configuration options for the {@link jsrPluginSetup} and {@link jsrPlugin} functions. */
export interface JsrPluginSetupConfig extends Pick<CommonPluginResolverConfig, "globalImportMap" | "resolvePath"> {
	/** the regex filters which the plugin's resolvers should use for the initial interception of resource-paths.
	 * 
	 * TODO: this might be error-prone, since my `parsePackageUrl` function requires the specifier to be `"jsr:"`.
	 *   a better approach might be to use a `specifiers` field, similar to the npm-plugin's `config.specifiers` option.
	 *   but it does come with the downside that the specifier will always be entriely replaced with `"jsr:"`.
	 * 
	 * @defaultValue `[/^jsr\:/]` (captures `"jsr:"` uris)
	*/
	filters: RegExp[]
}

const defaultJsrPluginSetupConfig: JsrPluginSetupConfig = {
	filters: [/^jsr\:/],
	globalImportMap: undefined,
	resolvePath: defaultResolvePath,
}

/** this plugin lets you resolve [jsr-package](https://jsr.io) resources (which begin with the `"jsr:"` specifier) to an `"https://"` url path.
 * after that, the {@link httpPlugin} will re-resolve the url, and then load/fetch the desired resource.
 * check the interface {@link JsrPluginSetupConfig} to understand what configuration options are available to you.
 * 
 * example: `"jsr:@oazmi/kitchensink@^0.9.8/pathman"` will be resolved to `"https://jsr.io/@oazmi/kitchensink/0.9.8/src/pathman.ts"`.
 * in addition, the import-map resolver of the package will be saved into `pluginData.runtimePackage`,
 * allowing for subsequent imports from within this package to be resolved via `pluginData.runtimePackage.resolveImport(...)`.
*/
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
					{ importMap: _0, runtimePackage: _1, ...restPluginData } = (pluginData ?? {}) as CommonPluginData,
					runtimePackage = await DenoPackage.fromUrl(path),
					relative_alias_pathname = parsePackageUrl(path).pathname,
					relative_alias = relative_alias_pathname === "/" ? "." : ensureStartDotSlash(relative_alias_pathname),
					path_url = runtimePackage.resolveExport(relative_alias, { baseAliasDir: "" })
				if (!path_url) { throw new Error(`failed to resolve the path "${path}" from the deno package: "jsr:${runtimePackage.getName()}@${runtimePackage.getVersion()}"`) }
				return build.resolve(path_url, {
					...rest_args,
					pluginData: {
						importMap: globalImportMap,
						runtimePackage,
						...restPluginData,
					},
				})
			})
		})
	})
}

/** {@inheritDoc jsrPluginSetup} */
export const jsrPlugin = (config?: Partial<JsrPluginSetupConfig>): esbuild.Plugin => {
	return {
		name: "oazmi-jsr-plugin",
		setup: jsrPluginSetup(config),
	}
}
