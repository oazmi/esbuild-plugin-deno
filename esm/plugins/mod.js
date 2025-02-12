/** this submodule contains a convenient all-in-one esbuild plugin that combines all other plugins within this library.
 *
 * @module
*/
import { httpPlugin } from "./http.js";
import { importMapPlugin } from "./importmap.js";
import { jsrPlugin } from "./jsr.js";
export const defaultDenoPluginsConfig = { importMap: {} };
/** creates an array esbuild plugins that can resolve imports in the same way deno can.
 *
 * it is effectively a cumulation of the following three plugins (ordered from highest resolving priority to lowest):
 * - {@link importMapPlugin}: provides import-map alias path-resolving for entry-points and esbuild's native resolvers (i.e. when in the default namespace).
 * - {@link httpPlugin}: provides `http://` and `https://` path-resolving and resource-fetching loader.
 * - {@link jsrPlugin}: provides a `jsr:` to `https://jsr.io/` path-resolver.
*/
export const denoPlugins = (config) => {
    const { importMap } = { ...defaultDenoPluginsConfig, ...config };
    return [
        importMapPlugin({ importMap }),
        httpPlugin({ globalImportMap: importMap }),
        jsrPlugin({ globalImportMap: importMap }),
    ];
};
