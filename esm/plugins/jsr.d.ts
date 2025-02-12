/** an esbuild plugin that resolves [jsr:](https://jsr.io) package imports.
 *
 * @module
*/
import { type esbuild } from "../deps.js";
import type { CommonPluginResolverConfig } from "./typedefs.js";
export interface JsrPluginSetupConfig {
    filters: RegExp[];
    globalImportMap?: CommonPluginResolverConfig["globalImportMap"];
    resolvePath: CommonPluginResolverConfig["resolvePath"];
}
export declare const jsrPluginSetup: (config?: Partial<JsrPluginSetupConfig>) => esbuild.Plugin["setup"];
/** {@inheritDoc jsrPluginSetup} */
export declare const jsrPlugin: (config?: Partial<JsrPluginSetupConfig>) => esbuild.Plugin;
//# sourceMappingURL=jsr.d.ts.map