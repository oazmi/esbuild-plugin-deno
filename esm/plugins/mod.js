/** this submodule contains a convenient all-in-one esbuild plugin that combines all other plugins within this library.
 *
 * @module
*/
import { defaultGetCwd, isAbsolutePath, resolvePathFactory } from "../deps.js";
import { entryPlugin } from "./filters/entry.js";
import { httpPlugin } from "./filters/http.js";
import { jsrPlugin } from "./filters/jsr.js";
import { DIRECTORY, npmPlugin } from "./filters/npm.js";
import { resolverPlugin } from "./resolvers.js";
import { defaultEsbuildNamespaces } from "./typedefs.js";
export { DIRECTORY } from "./filters/npm.js";
const defaultDenoPluginsConfig = {
    pluginData: {},
    log: false,
    autoInstall: true,
    nodeModulesDirs: [DIRECTORY.ABS_WORKING_DIR],
    globalImportMap: {},
    getCwd: defaultGetCwd,
    acceptNamespaces: defaultEsbuildNamespaces,
};
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
export const denoPlugins = (config) => {
    const { acceptNamespaces, autoInstall, getCwd, globalImportMap, log, nodeModulesDirs, pluginData } = { ...defaultDenoPluginsConfig, ...config }, resolvePath = resolvePathFactory(getCwd, isAbsolutePath);
    return [
        entryPlugin({ pluginData, acceptNamespaces }),
        httpPlugin({ acceptNamespaces }),
        jsrPlugin({ acceptNamespaces }),
        npmPlugin({ acceptNamespaces, autoInstall, log, nodeModulesDirs }),
        resolverPlugin({
            log,
            importMap: { globalImportMap: globalImportMap },
            relativePath: { resolvePath: resolvePath },
        }),
    ];
};
