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
/** this plugin lets you resolve [jsr-package](https://jsr.io) resources (which begin with the `"jsr:"` specifier) to an `"https://"` url path.
 * after that, the {@link httpPlugin} will re-resolve the url, and then load/fetch the desired resource.
 * check the interface {@link JsrPluginSetupConfig} to understand what configuration options are available to you.
 *
 * example: `"jsr:@oazmi/kitchensink@^0.9.8/pathman"` will be resolved to `"https://jsr.io/@oazmi/kitchensink/0.9.8/src/pathman.ts"`.
 * in addition, the import-map resolver of the package will be saved into `pluginData.runtimePackage`,
 * allowing for subsequent imports from within this package to be resolved via `pluginData.runtimePackage.resolveImport(...)`.
*/
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
