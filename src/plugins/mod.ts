/** this submodule contains a convenient all-in-one esbuild plugin that combines all other plugins within this library.
 * 
 * @module
*/

import { defaultGetCwd, isAbsolutePath, resolvePathFactory } from "../deps.js"
import { entryPlugin, type EntryPluginSetupConfig } from "./filters/entry.js"
import { httpPlugin } from "./filters/http.js"
import { jsrPlugin } from "./filters/jsr.js"
import { npmPlugin } from "./filters/npm.js"
import { type ImportMapResolverConfig, resolverPlugin, type ResolverPluginSetupConfig } from "./resolvers.js"
import { defaultEsbuildNamespaces, type EsbuildPlugin } from "./typedefs.js"


/** the configuration interface for the deno esbuild plugins suite {@link denoPlugins}. */
export interface DenoPluginsConfig extends Pick<EntryPluginSetupConfig, "pluginData">, Pick<ResolverPluginSetupConfig, "log"> {
	/** {@inheritDoc ImportMapResolverConfig.globalImportMap} */
	globalImportMap: ImportMapResolverConfig["globalImportMap"]

	/** provide an optional function (or a static `string`) that returns the absolute path to the current working directory.
	 * make sure that it always returns a posix-style path (i.e. uses "/" for directory separator, and not "\\").
	 * 
	 * if this is left `undefined`, then we will leave it up to your runtime-environment's working-directory/path (provided by {@link defaultGetCwd}).
	 * here is a summary of what that would entail:
	 * - for system-bound-runtimes (node, deno, bun): it will use `process.cwd()` or `Deno.cwd()`.
	 * - for web-bound-runtimes (webpage, worker, extension): it will use `window.location.href` or `globalThis.runtime.getURL("")`.
	 * 
	 * > [!important]
	 * > note that if you will be bundling code that imports from npm-packages,
	 * > you **must** have your `./node_modules/` folder directly under the working-directory that you provide in this field.
	*/
	getCwd: (() => string) | string

	/** specify which `namespace`s should be intercepted by this suite of plugins.
	 * all other `namespace`s will not be processed.
	 * 
	 * adding your custom plugin's namespace here could be useful if you would like your plugin to receive pre-resolved absolute paths,
	 * instead of having to resolve the paths yourself by joining paths and inspecting `pluginData`.
	 * 
	 * @defaultValue `[undefined, "", "file"]`
	*/
	acceptNamespaces: Array<string | undefined>
}

const defaultDenoPluginsConfig: DenoPluginsConfig = {
	pluginData: {},
	log: false,
	globalImportMap: {},
	getCwd: defaultGetCwd,
	acceptNamespaces: defaultEsbuildNamespaces,
}

/** creates an array esbuild plugins that can resolve imports in the same way deno can.
 * 
 * it is effectively a cumulation of the following three plugins (ordered from highest resolving priority to lowest):
 * - {@link entryPlugin}: provides `pluginData` to all entry-points and their dependencies,
 *   in addition to pre-resolving all paths implicitly through the {@link resolverPlugin}.
 * - {@link httpPlugin}: provides `http://`, `https://`, and `file://` path-resolving and resource-fetching loader.
 * - {@link jsrPlugin}: provides a `jsr:` to `https://jsr.io/` path-resolver.
 * - {@link npmPlugin}: provides a resolver that strips away `npm:` specifier prefixes,
 *   so that package-resources can be obtained from your `./node_modules/` folder.
 * - {@link resolverPlugin}: a namespaced plugin that provides the backbone pipeline for resolving the paths of all of the plugins above.
*/
export const denoPlugins = (config?: Partial<DenoPluginsConfig>): [
	entry_plugin: EsbuildPlugin,
	http_plugin: EsbuildPlugin,
	jsr_plugin: EsbuildPlugin,
	npm_plugin: EsbuildPlugin,
	resolver_pipeline_plugin: EsbuildPlugin,
] => {
	const
		{ acceptNamespaces, getCwd, globalImportMap, log, pluginData } = { ...defaultDenoPluginsConfig, ...config },
		resolvePath = resolvePathFactory(getCwd, isAbsolutePath)

	return [
		entryPlugin({ pluginData, acceptNamespaces }),
		httpPlugin({ acceptNamespaces }),
		jsrPlugin({ acceptNamespaces }),
		npmPlugin({ acceptNamespaces }),
		resolverPlugin({
			log,
			importMap: { globalImportMap: globalImportMap },
			relativePath: { resolvePath: resolvePath },
		}),
	]
}
