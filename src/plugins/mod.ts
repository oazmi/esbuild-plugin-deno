/** this submodule contains a convenient all-in-one esbuild plugin that combines all other plugins within this library.
 * 
 * @module
*/

import type { esbuild } from "../deps.ts"
import { httpPlugin } from "./http.ts"
import { importMapPlugin, type ImportMapPluginSetupConfig } from "./importmap.ts"
import { jsrPlugin } from "./jsr.ts"


/** the configuration interface for the deno esbuild plugins suite {@link denoPlugins}. */
export interface DenoPluginsConfig extends Pick<ImportMapPluginSetupConfig, "importMap"> { }

export const defaultDenoPluginsConfig: DenoPluginsConfig = { importMap: {} }

/** creates an array esbuild plugins that can resolve imports in the same way deno can.
 * 
 * it is effectively a cumulation of the following three plugins (ordered from highest resolving priority to lowest):
 * - {@link importMapPlugin}: provides import-map alias path-resolving for entry-points and esbuild's native resolvers (i.e. when in the default namespace).
 * - {@link httpPlugin}: provides `http://` and `https://` path-resolving and resource-fetching loader.
 * - {@link jsrPlugin}: provides a `jsr:` to `https://jsr.io/` path-resolver.
*/
export const denoPlugins = (config?: Partial<DenoPluginsConfig>): [
	importmap_plugin: esbuild.Plugin,
	http_plugin: esbuild.Plugin,
	jsr_plugin: esbuild.Plugin,
] => {
	const { importMap } = { ...defaultDenoPluginsConfig, ...config }
	return [
		importMapPlugin({ importMap }),
		httpPlugin({ globalImportMap: importMap }),
		jsrPlugin({ globalImportMap: importMap }),
	]
}
