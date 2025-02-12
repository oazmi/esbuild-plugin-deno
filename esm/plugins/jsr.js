/** an esbuild plugin that resolves [jsr:](https://jsr.io) package imports.
 *
 * @module
*/
import { defaultResolvePath, ensureStartDotSlash, parsePackageUrl } from "../deps.js";
import { DenoPackage } from "../packageman/deno.js";
const defaultJsrPluginSetupConfig = {
    filters: [/^jsr\:/],
    globalImportMap: undefined,
    resolvePath: defaultResolvePath,
};
export const jsrPluginSetup = (config = {}) => {
    const { filters, globalImportMap, resolvePath } = { ...defaultJsrPluginSetupConfig, ...config };
    return (async (build) => {
        // TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
        //   if they have an extension entry for the url path that we're loading
        const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions;
        filters.forEach((filter) => {
            build.onResolve({ filter }, async (args) => {
                const { path, pluginData, ...rest_args } = args, { importMap: _0, runtimePackage: _1, ...restPluginData } = (pluginData ?? {}), runtimePackage = await DenoPackage.fromUrl(path), relative_alias_pathname = parsePackageUrl(path).pathname, relative_alias = relative_alias_pathname === "/" ? "." : ensureStartDotSlash(relative_alias_pathname), path_url = runtimePackage.resolveExport(relative_alias, { baseAliasDir: "" });
                if (!path_url) {
                    throw new Error(`failed to resolve the path "${path}" from the deno package: "jsr:${runtimePackage.getName()}@${runtimePackage.getVersion()}"`);
                }
                return build.resolve(path_url, {
                    ...rest_args,
                    pluginData: {
                        importMap: globalImportMap,
                        runtimePackage,
                        ...restPluginData,
                    },
                });
            });
        });
    });
};
/** {@inheritDoc jsrPluginSetup} */
export const jsrPlugin = (config) => {
    return {
        name: "oazmi-jsr-plugin",
        setup: jsrPluginSetup(config),
    };
};
