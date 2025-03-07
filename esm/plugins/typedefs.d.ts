import type { esbuild, MaybePromise } from "../deps.js";
import type { ImportMap } from "../importmap/typedefs.js";
import type { RuntimePackage } from "../packageman/base.js";
/** a central enum containing the list of esbuild namespaces used by the plugins in this library. */
export declare const enum PLUGIN_NAMESPACE {
    RESOLVER_PIPELINE = "oazmi-resolver-pipeline",
    LOADER_HTTP = "oazmi-loader-http"
}
/** a list of default namespaces that esbuild uses for native/entry-point resolution. */
export declare const defaultEsbuildNamespaces: (string | undefined)[];
/** a list of all esbuild content type loaders. */
export declare const allEsbuildLoaders: Array<EsbuildLoaderType>;
/** this is the common plugin data utilized by the resolvers in {@link resolverPlugin} esbuild-plugin. */
export interface CommonPluginData {
    /** specifies the current scope's import-map aliases.
     * the keys of this object hold the aliased name of the import, while the values hold the absolute path of the referenced resource.
     *
     * for further reading on import maps, see {@link ImportMap}.
    */
    importMap?: ImportMap;
    /** specifies the current scope's runtime package manager (such as deno, jsr, npm, node, etc...),
     * so that the package's own import and export aliases can be resolved appropriately.
    */
    runtimePackage?: RuntimePackage<any>;
    /** you may control which resolvers to disable through the use of this property. */
    resolverConfig?: {
        /** enable or disable the initial `pluginData` injection (performed by the {@link entryPlugin}) for the current entity.
         * setting this to `false` is needed when switching the scope to a new package,
         * so that your current initial runtime-package and import-maps do not interfere/overwite the intended plugin data.
         * (for instance, this will be needed when moving to a self-contained remote jsr-package scope, away from your filesystem).
         *
         * @defaultValue `true` (enabled)
        */
        useInitialPluginData?: boolean;
        /** enable or disable import-map resolution for the current entity.
         *
         * @defaultValue `true` (enabled)
        */
        useImportMap?: boolean;
        /** enable or disable runtime-package resolution (such as "deno.json") for the current entity.
         *
         * @defaultValue `true` (enabled)
        */
        useRuntimePackage?: boolean;
        /** enable or disable `node_modules` file resolution for the current entity.
         *
         * @defaultValue `true` (enabled)
        */
        useNodeModules?: boolean;
        /** enable or disable relative-path to absolute-path resolution for the current entity.
         *
         * @defaultValue `true` (enabled)
        */
        useRelativePath?: boolean;
    };
    [capture_marker: symbol]: boolean;
}
/** type alias for `esbuild.OnResolveArgs`, slightly tweaked for this library's internal use. */
export type OnResolveArgs = Omit<esbuild.OnResolveArgs, "pluginData"> & {
    pluginData?: CommonPluginData;
};
/** type alias for `esbuild.OnLoadArgs`, slightly tweaked for this library's internal use. */
export type OnLoadArgs = Omit<esbuild.OnLoadArgs, "pluginData"> & {
    pluginData?: CommonPluginData;
};
/** type alias for `esbuild.OnResolveResult`. */
export type OnResolveResult = esbuild.OnResolveResult;
/** type alias for `esbuild.OnLoadResult`. */
export type OnLoadResult = esbuild.OnLoadResult;
/** type alias for the callback function provided to `onResolve` the function (aka `esbuild.PluginBuild["onResolve"]`). */
export type OnResolveCallback = (args: OnResolveArgs) => MaybePromise<OnResolveResult | null | undefined>;
/** type alias for the callback function provided to `OnLoadCallback` the function (aka `esbuild.PluginBuild["OnLoadCallback"]`). */
export type OnLoadCallback = (args: OnLoadArgs) => MaybePromise<OnLoadResult | null | undefined>;
/** type alias for `esbuild.Plugin`. */
export type EsbuildPlugin = esbuild.Plugin;
/** type alias for `esbuild.Plugin["setup"]`. */
export type EsbuildPluginSetup = esbuild.Plugin["setup"];
/** type alias for `esbuild.PluginBuild`. */
export type EsbuildPluginBuild = esbuild.PluginBuild;
/** type alias for `esbuild.Loader`. */
export type EsbuildLoaderType = esbuild.Loader;
//# sourceMappingURL=typedefs.d.ts.map