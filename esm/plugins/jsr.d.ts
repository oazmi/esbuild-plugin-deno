/** an esbuild plugin that resolves [jsr:](https://jsr.io) package imports.
 *
 * @module
*/
import { type esbuild } from "../deps.js";
import type { CommonPluginResolverConfig } from "./typedefs.js";
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
    filters: RegExp[];
}
/** this plugin lets you resolve [jsr-package](https://jsr.io) resources (which begin with the `"jsr:"` specifier) to an `"https://"` url path.
 * after that, the {@link httpPlugin} will re-resolve the url, and then load/fetch the desired resource.
 * check the interface {@link JsrPluginSetupConfig} to understand what configuration options are available to you.
 *
 * example: `"jsr:@oazmi/kitchensink@^0.9.8/pathman"` will be resolved to `"https://jsr.io/@oazmi/kitchensink/0.9.8/src/pathman.ts"`.
 * in addition, the import-map resolver of the package will be saved into `pluginData.runtimePackage`,
 * allowing for subsequent imports from within this package to be resolved via `pluginData.runtimePackage.resolveImport(...)`.
*/
export declare const jsrPluginSetup: (config?: Partial<JsrPluginSetupConfig>) => esbuild.Plugin["setup"];
/** {@inheritDoc jsrPluginSetup} */
export declare const jsrPlugin: (config?: Partial<JsrPluginSetupConfig>) => esbuild.Plugin;
//# sourceMappingURL=jsr.d.ts.map