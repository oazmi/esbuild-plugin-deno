/** an esbuild plugin that resolves [jsr:](https://jsr.io) package imports to http-references.
 *
 * you will need the {@link httpPlugin} plugin to be loaded into your list of esbuild plugins,
 * for the remote content to be resolved and fetched.
 *
 * @module
*/
import { ensureStartDotSlash, parsePackageUrl } from "../../deps.js";
import { DenoPackage } from "../../packageman/deno.js";
import { defaultEsbuildNamespaces, PLUGIN_NAMESPACE } from "../typedefs.js";
const defaultJsrPluginSetupConfig = {
    filters: [/^jsr\:/],
    acceptNamespaces: defaultEsbuildNamespaces,
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
    const { filters, acceptNamespaces: _acceptNamespaces } = { ...defaultJsrPluginSetupConfig, ...config }, acceptNamespaces = new Set([..._acceptNamespaces, PLUGIN_NAMESPACE.LOADER_HTTP]);
    return async (build) => {
        // TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
        //   if they have an extension entry for the url path that we're loading
        const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions;
        const jsrSpecifierResolver = async (args) => {
            // skip resolving any `namespace` that we do not accept
            if (!acceptNamespaces.has(args.namespace)) {
                return;
            }
            const { path, pluginData = {}, ...rest_args } = args, 
            // below, we flush away any previous import-map and runtime-package manager stored in the plugin-data,
            // as we will need to reset them for the current jsr package's new scope. 
            { importMap: _0, runtimePackage: _1, resolverConfig = {}, ...restPluginData } = pluginData, 
            // TODO: I'm not following the idea below, but may have to in the future if problems arise due to symbols:
            // > we also strip away all symbols from the remaining plugin data, since I use symbols as a means of identifying if an entity had previously visited the same resolver.
            // restPluginData = Object.fromEntries(Object.entries(_restPluginData)),
            runtimePackage = await DenoPackage.fromUrl(path), relative_alias_pathname = parsePackageUrl(path).pathname, relative_alias = relative_alias_pathname === "/" ? "." : ensureStartDotSlash(relative_alias_pathname), import_config = { baseAliasDir: "" }, path_url = runtimePackage.resolveExport(relative_alias, import_config);
            // TODO: I believe workspace resolution (the commented line below) is not needed here, because the resolvers-plugin will take care of it. (but I could be wrong)
            // ?? runtimePackage.resolveWorkspaceExport(relative_alias, import_config)?.[0]
            // TODO: maybe instead of throwing a js error, we should return a result to esbuild with the message embedded in `result.errors[0]`.
            if (!path_url) {
                throw new Error(`failed to resolve the path "${path}" from the deno package: "jsr:${runtimePackage.getName()}@${runtimePackage.getVersion()}"`);
            }
            // the `build.resolve` call made below implicitly gets resolved by our http plugin, and eventually gets loaded by it too.
            return build.resolve(path_url, {
                ...rest_args,
                pluginData: {
                    ...restPluginData,
                    runtimePackage,
                    // we don't want node-resolution occurring inside of the jsr-package.
                    // however, any dependency in the jsr-package that uses the "npm:" specifier will be resolved correctly via the npm-plugin,
                    // and inside of that npm-package, the node-resolution will be re-enabled.
                    resolverConfig: { ...resolverConfig, useNodeModules: false },
                },
            });
        };
        filters.forEach((filter) => {
            build.onResolve({ filter }, jsrSpecifierResolver);
        });
    };
};
/** {@inheritDoc jsrPluginSetup} */
export const jsrPlugin = (config) => {
    return {
        name: "oazmi-jsr-plugin",
        setup: jsrPluginSetup(config),
    };
};
