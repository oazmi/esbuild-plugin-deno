/** an esbuild plugin that resolves and loads http/https references.
 *
 * @module
*/
import { defaultResolvePath, isAbsolutePath } from "../deps.js";
import { onResolveFactory, unResolveFactory, urlLoaderFactory } from "./funcdefs.js";
export const defaultHttpPluginSetupConfig = {
    acceptLoaders: undefined,
    defaultLoader: "copy",
    filters: [/^https?\:\/\//, /^file\:\/\//],
    globalImportMap: undefined,
    namespace: "oazmi-http",
    resolvePath: defaultResolvePath,
};
export const httpPluginSetup = (config = {}) => {
    const { acceptLoaders, defaultLoader, filters, globalImportMap, namespace: plugin_ns, resolvePath } = { ...defaultHttpPluginSetupConfig, ...config }, pluginResolverConfig = { isAbsolutePath, namespace: plugin_ns, globalImportMap, resolvePath }, pluginLoaderConfig = { acceptLoaders, defaultLoader, namespace: plugin_ns };
    return (async (build) => {
        // TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
        //   if they have an extension entry for the url path that we're loading
        const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions;
        // the placement of the `onResolve` and `onLoader` callbacks is ordered in their natural handling pathway
        filters.forEach((filter) => {
            build.onResolve({ filter }, onResolveFactory(pluginResolverConfig));
        });
        build.onLoad({ filter: /.*/, namespace: plugin_ns }, urlLoaderFactory(pluginLoaderConfig));
        build.onResolve({ filter: /.*/, namespace: plugin_ns }, unResolveFactory(pluginResolverConfig, build));
    });
};
/** {@inheritDoc httpPluginSetup} */
export const httpPlugin = (config) => {
    return {
        name: "oazmi-http-plugin",
        setup: httpPluginSetup(config),
    };
};
