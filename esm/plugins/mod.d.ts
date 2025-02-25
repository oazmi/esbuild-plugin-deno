/** this submodule contains a convenient all-in-one esbuild plugin that combines all other plugins within this library.
 *
 * @module
*/
import type { esbuild } from "../deps.js";
import { type ImportMapPluginSetupConfig } from "./importmap.js";
import { type DenoInitialPluginData } from "./initialdata.js";
/** the configuration interface for the deno esbuild plugins suite {@link denoPlugins}. */
export interface DenoPluginsConfig extends Pick<ImportMapPluginSetupConfig, "importMap">, Pick<DenoInitialPluginData, "runtimePackage"> {
    /** provide an optional function (or a static `string`) that returns the absolute path to the current working directory.
     * make sure that it always returns a posix-style path (i.e. uses "/" for directory separator, and not "\\").
     *
     * if this is left `undefined`, then we will leave it up to your runtime-environment's working-directory/path (provided by {@link getRuntimeCwd}).
     * here is a summary of what that would entail:
     * - for system-bound-runtimes (node, deno, bun): it will use `process.cwd()` or `Deno.cwd()`.
     * - for web-bound-runtimes (webpage, worker, extension): it will use `window.location.href` or `globalThis.runtime.getURL("")`.
     *
     * > [!important]
     * > note that if you will be bundling code that imports from npm-packages,
     * > you **must** have your `./node_modules/` folder directly under the working-directory that you provide in this field.
    */
    getCwd: (() => string) | string;
}
export declare const defaultDenoPluginsConfig: DenoPluginsConfig;
/** creates an array esbuild plugins that can resolve imports in the same way deno can.
 *
 * it is effectively a cumulation of the following three plugins (ordered from highest resolving priority to lowest):
 * - {@link importMapPlugin}: provides import-map alias path-resolving for entry-points and esbuild's native resolvers (i.e. when in the default namespace).
 * - {@link httpPlugin}: provides `http://` and `https://` path-resolving and resource-fetching loader.
 * - {@link jsrPlugin}: provides a `jsr:` to `https://jsr.io/` path-resolver.
 * - {@link npmSpecifierPlugin}: provides a resolver that strips away `npm:` specifier prefixes.
*/
export declare const denoPlugins: (config?: Partial<DenoPluginsConfig>) => [deno_initialdata_plugin: esbuild.Plugin, importmap_plugin: esbuild.Plugin, http_plugin: esbuild.Plugin, jsr_plugin: esbuild.Plugin, npm_specifier_plugin: esbuild.Plugin];
//# sourceMappingURL=mod.d.ts.map