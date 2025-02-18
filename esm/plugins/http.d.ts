/** an esbuild plugin that resolves and loads http/https references.
 *
 * @module
*/
import { type esbuild } from "../deps.js";
import type { CommonPluginLoaderConfig, CommonPluginResolverConfig } from "./typedefs.js";
/** configuration options for the {@link httpPluginSetup} and {@link httpPlugin} functions. */
export interface HttpPluginSetupConfig extends Pick<CommonPluginLoaderConfig, "acceptLoaders" | "defaultLoader">, Pick<CommonPluginResolverConfig, "globalImportMap" | "namespace" | "resolvePath"> {
    /** the regex filters which the plugin's resolvers should use for the initial interception of resource-paths.
     *
     * @defaultValue `[/^https?\:\/\//, /^file\:\/\//]` (captures `"http://"`, `"https://"`, and `"file://"` uris)
    */
    filters: RegExp[];
}
export declare const defaultHttpPluginSetupConfig: HttpPluginSetupConfig;
/** this plugin intercepts `"http://"` and `"https://"` resource paths,
 * resolves them if they're from an http importer script, then fetches the requested http resource,
 * and finally tries guessing the resource's `loader` type by inspecting its `"content-type"` http-header and/or its path extension/suffix.
*/
export declare const httpPluginSetup: (config?: Partial<HttpPluginSetupConfig>) => esbuild.Plugin["setup"];
/** {@inheritDoc httpPluginSetup} */
export declare const httpPlugin: (config?: Partial<HttpPluginSetupConfig>) => esbuild.Plugin;
//# sourceMappingURL=http.d.ts.map