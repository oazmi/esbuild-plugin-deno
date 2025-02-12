/** an esbuild plugin that provides a global import map for specifying aliases.
 *
 * @module
*/
import type { esbuild } from "../deps.js";
import type { ImportMap } from "../importmap/typedefs.js";
/** a symbol that gets implanted into resolving-entry's `pluginData`,
 * that indicates that it has been captured by the global-import-map resolver once,
 * so that it does not infinitely continue getting captured by it recuresively
 * (since the resolver's filter is set to capture all paths by default).
*/
export declare const CAPTURED_ALREADY: unique symbol;
/** the configuration interface for the resolve import-map factory function {@link onResolveImportMapFactory}. */
export interface ResolveImportMapFactoryConfig {
    /** specify the import-map to use for resolving aliases. to read more about import-maps check out {@link ImportMap}.
     *
     * @defaultValue `{}` (empty object/dictionary)
    */
    importMap: ImportMap;
    /** provide a unique symbol that will be implanted into the entity's {@link esbuild.OnResolveArgs.PluginData},
     * so that subsequent calls to the same import-map path-resolver will terminate early, in order to avoid infinite recursion.
     *
     * @defaultValue {@link CAPTURED_ALREADY}
    */
    pluginDataMarker: symbol;
    /** specify an optional namespace to assign to entity being resolved, **if** it does happen to be part of your {@link importMap}.
     * if the input entity's path is not part of the import-map, then this namespace will not be assigned.
     *
     * @defaultValue `undefined`
    */
    namespace?: esbuild.OnResolveResult["namespace"];
}
/** the configuration interface for the import-map esbuild plugin {@link importMapPluginSetup}. */
export interface ImportMapPluginSetupConfig {
    /** {@inheritDoc ResolveImportMapFactoryConfig.importMap} */
    importMap: ResolveImportMapFactoryConfig["importMap"];
    /** {@inheritDoc ResolveImportMapFactoryConfig.pluginDataMarker} */
    pluginDataMarker?: ResolveImportMapFactoryConfig["pluginDataMarker"];
    /** {@inheritDoc ResolveImportMapFactoryConfig.namespace} */
    outputNamespace?: ResolveImportMapFactoryConfig["namespace"];
    /** specify the regex filter to use for your import-map path-resolver plugin.
     *
     * @defaultValue `RegExp(".*")` (captures all input entities)
    */
    filter: esbuild.OnResolveOptions["filter"];
    /** specify the namespace filter to use for your import-map path-resolver plugin.
     *
     * @defaultValue `undefined` (captures all inputs in the default namespace, which is either `"file"`, `""`, or `undefined`)
    */
    inputNamespace?: esbuild.OnResolveOptions["namespace"];
}
/** setup function for a global import-map plugin.
 *
 * global import-maps will intercept all `onResolve` calls made by esbuild _once_,
 * before handing the entity in question to some other plugin to resolve (or letting esbuild do its native resolution).
 * if the entity's path (`args.path`) is a part of the import-map in the config ({@link ImportMapPluginSetupConfig.importMap}),
 * then this plugin will transform its path before handing it over to some other plugin to resolve.
 *
 * for details on how to configure, see {@link ImportMapPluginSetupConfig}.
 *
 * > [!tip]
 * > you may wonder, how does this plugin not end up in a recursive infinite loop of `onResolve` calls, when it captures everything?
 * >
 * > the way it works is that the first time an entity is encountered, we insert a unique symbol ({@link CAPTURED_ALREADY}) inside `args.pluginData`.
 * > and upon the discovery of the same symbol in a recursive/subsequent call, we terminate the path-resolution (by returning `undefined`),
 * > so that esbuild uses the next available path-resolver for this entity.
*/
export declare const importMapPluginSetup: (config?: Partial<ImportMapPluginSetupConfig>) => esbuild.Plugin["setup"];
/** {@inheritDoc importMapPluginSetup} */
export declare const importMapPlugin: (config?: Partial<ImportMapPluginSetupConfig>) => esbuild.Plugin;
//# sourceMappingURL=importmap.d.ts.map