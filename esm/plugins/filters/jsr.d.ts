/** an esbuild plugin that resolves [jsr:](https://jsr.io) package imports to http-references.
 *
 * you will need the {@link httpPlugin} plugin to be loaded into your list of esbuild plugins,
 * for the remote content to be resolved and fetched.
 *
 * @module
*/
import type { EsbuildPlugin, EsbuildPluginSetup } from "../typedefs.js";
/** configuration options for the {@link jsrPluginSetup} and {@link jsrPlugin} functions. */
export interface JsrPluginSetupConfig {
    /** the regex filters which the plugin's resolvers should use for the initial interception of resource-paths.
     *
     * TODO: this might be error-prone, since my `parsePackageUrl` function requires the specifier to be `"jsr:"`.
     *   a better approach might be to use a `specifiers` field, similar to the npm-plugin's `config.specifiers` option.
     *   but it does come with the downside that the specifier will always be entriely replaced with `"jsr:"`.
     *
     * @defaultValue `[/^jsr\:/]` (captures `"jsr:"` uris)
    */
    filters: RegExp[];
    /** specify which `namespace`s should be intercepted by the jsr-plugin.
     * all other `namespace`s will not be processed by this plugin.
     *
     * if you have a plugin with a custom loader that works under some `"custom-namespace"`,
     * you can include your `"custom-namespace"` here, so that if it performs a jsr-specifier import,
     * that import path will be captured by this plugin, and then consequently fetched by the http-loader plugin.
     * but do note that the namespace of the loaded resource will switch to the http-plugin's loader {@link namespace}
     * (which defaults to {@link PLUGIN_NAMESPACE.LOADER_HTTP}), instead of your `"custom-namespace"`.
     *
     * @defaultValue `[undefined, "", "file"]` (also this plugin's {@link namespace} gets added later on)
    */
    acceptNamespaces: Array<string | undefined>;
}
/** this plugin lets you resolve [jsr-package](https://jsr.io) resources (which begin with the `"jsr:"` specifier) to an `"https://"` url path.
 * after that, the {@link httpPlugin} will re-resolve the url, and then load/fetch the desired resource.
 * check the interface {@link JsrPluginSetupConfig} to understand what configuration options are available to you.
 *
 * example: `"jsr:@oazmi/kitchensink@^0.9.8/pathman"` will be resolved to `"https://jsr.io/@oazmi/kitchensink/0.9.8/src/pathman.ts"`.
 * in addition, the import-map resolver of the package will be saved into `pluginData.runtimePackage`,
 * allowing for subsequent imports from within this package to be resolved via `pluginData.runtimePackage.resolveImport(...)`.
*/
export declare const jsrPluginSetup: (config?: Partial<JsrPluginSetupConfig>) => EsbuildPluginSetup;
/** {@inheritDoc jsrPluginSetup} */
export declare const jsrPlugin: (config?: Partial<JsrPluginSetupConfig>) => EsbuildPlugin;
//# sourceMappingURL=jsr.d.ts.map