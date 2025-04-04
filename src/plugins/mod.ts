/** this submodule contains a convenient all-in-one esbuild plugin that combines all other plugins within this library.
 * 
 * @module
*/

import { defaultGetCwd, isAbsolutePath, resolveResourcePathFactory } from "../deps.js"
import { entryPlugin, type EntryPluginSetupConfig } from "./filters/entry.js"
import { httpPlugin } from "./filters/http.js"
import { jsrPlugin } from "./filters/jsr.js"
import { npmPlugin, type NpmPluginSetupConfig } from "./filters/npm.js"
import { type ImportMapResolverConfig, resolverPlugin, type ResolverPluginSetupConfig } from "./resolvers.js"
import { defaultEsbuildNamespaces, DIRECTORY, type EsbuildPlugin } from "./typedefs.js"


export { DIRECTORY } from "./typedefs.js"

/** the configuration interface for the deno esbuild plugins suite {@link denoPlugins}. */
export interface DenoPluginsConfig extends
	Pick<EntryPluginSetupConfig, "initialPluginData">,
	Pick<ResolverPluginSetupConfig, "log">,
	Pick<NpmPluginSetupConfig, "autoInstall" | "peerDependencies" | "nodeModulesDirs">,
	Pick<ImportMapResolverConfig, "globalImportMap"> {
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
	 * 
	 * TODO: this option is currently not respected by `npmPlugin`'s `DIRECTORY.CWD`, since it uses the actual cwd (acquired via `defaultGetCwd`).
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

	/** specify which subset of plugins should log when {@link log} is enabled.
	 * 
	 * @defaultValue `["npm", "resolver"]` (the npm-plugin, and the resolvers-pipeline plugin will log, but the http-plugin will not)
	*/
	logFor: Array<"npm" | "http" | "resolver">
}

const defaultDenoPluginsConfig: DenoPluginsConfig = {
	initialPluginData: undefined,
	log: false,
	logFor: ["npm", "resolver"],
	autoInstall: true,
	peerDependencies: {},
	nodeModulesDirs: [DIRECTORY.ABS_WORKING_DIR],
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
		{ acceptNamespaces, autoInstall, getCwd, globalImportMap, log, logFor, peerDependencies, nodeModulesDirs, initialPluginData } = { ...defaultDenoPluginsConfig, ...config },
		resolvePath = resolveResourcePathFactory(getCwd, isAbsolutePath)

	return [
		entryPlugin({ initialPluginData, acceptNamespaces }),
		httpPlugin({ acceptNamespaces, log: logFor.includes("http") ? log : false }),
		jsrPlugin({ acceptNamespaces }),
		npmPlugin({ acceptNamespaces, autoInstall, peerDependencies, nodeModulesDirs, log: logFor.includes("npm") ? log : false }),
		resolverPlugin({
			log: logFor.includes("resolver") ? log : false,
			importMap: { globalImportMap: globalImportMap },
			relativePath: { resolvePath: resolvePath },
		}),
	]
}
