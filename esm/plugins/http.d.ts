/** an esbuild plugin that resolves and loads http/https references.
 *
 * @module
*/
import { type esbuild } from "../deps.js";
import type { CommonPluginLoaderConfig, CommonPluginResolverConfig } from "./typedefs.js";
export interface HttpPluginSetupConfig {
    acceptLoaders?: CommonPluginLoaderConfig["acceptLoaders"];
    defaultLoader: CommonPluginLoaderConfig["defaultLoader"];
    filters: RegExp[];
    globalImportMap?: CommonPluginResolverConfig["globalImportMap"];
    namespace: CommonPluginResolverConfig["namespace"];
    resolvePath: CommonPluginResolverConfig["resolvePath"];
}
export declare const defaultHttpPluginSetupConfig: HttpPluginSetupConfig;
export declare const httpPluginSetup: (config?: Partial<HttpPluginSetupConfig>) => esbuild.Plugin["setup"];
/** {@inheritDoc httpPluginSetup} */
export declare const httpPlugin: (config?: Partial<HttpPluginSetupConfig>) => esbuild.Plugin;
//# sourceMappingURL=http.d.ts.map