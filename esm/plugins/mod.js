/** this submodule contains a convenient all-in-one esbuild plugin that combines all other plugins within this library.
 *
 * @module
*/
import { defaultGetCwd, isAbsolutePath, resolvePathFactory } from "../deps.js";
import { httpPlugin } from "./http.js";
import { importMapPlugin } from "./importmap.js";
import { denoInitialDataPlugin } from "./initialdata.js";
import { jsrPlugin } from "./jsr.js";
import { npmSpecifierPlugin } from "./npm.js";
export const defaultDenoPluginsConfig = {
    runtimePackage: undefined,
    importMap: {},
    getCwd: defaultGetCwd,
};
/** creates an array esbuild plugins that can resolve imports in the same way deno can.
 *
 * it is effectively a cumulation of the following three plugins (ordered from highest resolving priority to lowest):
 * - {@link importMapPlugin}: provides import-map alias path-resolving for entry-points and esbuild's native resolvers (i.e. when in the default namespace).
 * - {@link httpPlugin}: provides `http://` and `https://` path-resolving and resource-fetching loader.
 * - {@link jsrPlugin}: provides a `jsr:` to `https://jsr.io/` path-resolver.
 * - {@link npmSpecifierPlugin}: provides a resolver that strips away `npm:` specifier prefixes.
*/
export const denoPlugins = (config) => {
    const { runtimePackage, importMap, getCwd } = { ...defaultDenoPluginsConfig, ...config }, resolvePath = resolvePathFactory(getCwd, isAbsolutePath);
    return [
        denoInitialDataPlugin({ pluginData: { runtimePackage } }),
        importMapPlugin({ importMap }),
        httpPlugin({ globalImportMap: importMap, resolvePath }),
        jsrPlugin({ globalImportMap: importMap, resolvePath }),
        npmSpecifierPlugin({ globalImportMap: importMap, resolvePath }),
    ];
};
