/** this filter plugin intercepts all entities and makes them sequentially pass through three resolvers,
 * so that an absolute path to the resource can be acquired in the best possible way (citation needed).
 *
 * > [!important]
 * > you **must** include the {@link resolverPlugin} somewhere in your esbuild build-options,
 * > otherwise this plugin will not be able to resolve to absolute paths on its own,
 * > and all efforts of this plugin will pretty much be for naught.
 *
 * ## details
 *
 * an explanation of the operations performed by each of the three resolvers follows:
 *
 * ### 1. initial plugin-data injector
 *
 * this resolver simply inserts the user's {@link EntryPluginSetupConfig.initialPluginData} to **all** entry-points which lack an `args.pluginData`.
 * but when {@link EntryPluginSetupConfig.forceInitialPluginData} is `true`, the entry-points with existing pluginData will be overwritten.
 *
 * it is through this resolver that things like {@link CommonPluginData.importMap | import-maps}
 * and the {@link CommonPluginData.runtimePackage | deno-package-resolver} get inserted into the entry-point resources,
 * and then seeded into their dependencies.
 *
 * ### 2. plugin-data inheritor
 *
 * a fundamental problem (design choice?) with esbuild is that resource's `pluginData` **does not** propagate to the child-dependencies,
 * when esbuild's native resolvers and loaders process the resource.
 * this problem of stripping away valuable `pluginData` can also occur in external plugins that are not designed mindfully.
 *
 * as a consequence, we would not be able to embed import-maps and runtime-package-resolvers that can be picked up by dependencies.
 *
 * thus, to counteract this issue, this resolver inspects the `pluginData` of every resolved entity, stores it in a dictionary for book-keeping,
 * and then, when a dependency-resource comes along with its plugin-data stripped away (i.e. `args.pluginData === undefined`),
 * this resolver inserts its dependent's (`args.importer`) plugin-data.
 * in effect, this resolver permits inheritance of plugin-data when it is stripped away.
 *
 * ### 3. absolute-path resolution
 *
 * finally, we come to the resolver which implicitly calls the namespaced resolvers of the {@link resolverPlugin},
 * which is a pipeline that can resolve {@link CommonPluginData.importMap | import-maps},
 * {@link CommonPluginData.runtimePackage | deno-packages},
 * {@link nodeModulesResolverFactory | node-packages (`node_modules`)},
 * and perform generic path-joining, in order to get the absolute path (doesn't have to be filesystem path) to the resource.
 *
 * most resolvers of the {@link resolverPlugin} require {@link CommonPluginData | `pluginData`} to be useful.
 * which is why we have to ensure its availability and inheritance through the two prior resolvers,
 * in order for the {@link resolverPlugin} to be effective.
 *
 * ---
 *
 * > [!tip]
 * > while the placement order of the {@link resolverPlugin} does not matter (invariant behavior),
 * > placing it at the front would reduce the number of redundant `onResolve` callbacks received by this plugin,
 * > which then need to be bounced-back to prevent an indefinite `onResolve` recursion.
 * >
 * > you may wonder how this plugin does not spiral into an endless recursion of `onResolve` callbacks,
 * > when it uses the "capture-all" filter that spans throughout all namespaces, meanwhile using `build.resove()`.
 * >
 * > that's because upon the interception of a new entity, we insert a unique `symbol` marker into the `pluginData`,
 * > which when detected again, halts the plugin from processing it further (by returning `undefined`).
 * >
 * > moreover, this plugin validates that the `args.namespace` it receives must be one of `[undefined, "", "file"]`
 * > (see {@link defaultEsbuildNamespaces}), otherwise it will terminate processing it any further.
 * > this check is put in place to prevent this plugin from treading into the territory of other plugins' namespaces,
 * > which would potentially ruin their logic and `pluginData`.
 *
 * @module
*/
import { type WorkspacePackage } from "../../packageman/base.js";
import type { CommonPluginData, EsbuildPlugin, EsbuildPluginSetup } from "../typedefs.js";
/** this is a slightly modified version of {@link CommonPluginData},
 * which accepts a path or url to your "deno.json" file under the `runtimePackage` property.
*/
export interface InitialPluginData extends Omit<CommonPluginData, "runtimePackage"> {
    /** specify your project's top-level runtime package manager,
     * so that your project's import and export aliases can be resolved appropriately.
     *
     * there are several ways for you to specify your runtime package for package-resolution support:
     * - provide an existing {@link WorkspacePackage} object.
     * - provide a path `string` or `URL` to the package json(c) file (such as "deno.json", "jsr.jsonc", "package.json", etc...).
     * - provide a directory-path `string` or `URL` (**must** end with a trailing slash `"/"`) where a package json(c) file exists,
     *   and the plugin will scan for the following files at that location in the provided order:
     *   - `"deno.json"`, `"deno.jsonc"`, `"jsr.json"`, `"jsr.jsonc"`, `"package.json"`, `"package.jsonc"`.
    */
    runtimePackage?: WorkspacePackage<any> | URL | string;
}
/** configuration options for the {@link entryPluginSetup} esbuild-setup factory function. */
export interface EntryPluginSetupConfig {
    /** specify the regex filters to use for your initial-data-injection and path-resolver plugin.
     *
     * @defaultValue `[RegExp(".*"),]` (captures all input entities)
    */
    filters: RegExp[];
    /** {@inheritDoc InitialPluginData} */
    initialPluginData?: Partial<InitialPluginData>;
    /** specify the mode for forcefully inserting {@link initialPluginData} into `args.pluginData` of all entry-points:
     * - `false`: don't insert {@link initialPluginData} into entry-points with existing `args.pluginData`.
     * - `true`: equivalent to the `"overwrite"` option.
     * - `"overwrite"`: discard any existing `args.pluginData`, and replace it with {@link initialPluginData}.
     * - `"merge"`: join the old plugin-data and the initial plugin-data in the following way: `{ ...initialPluginData, ...args.pluginData }`.
     *
     * @defaultValue `false`
    */
    forceInitialPluginData: boolean | "merge" | "overwrite";
    /** specify if `pluginData` should be passed down from an resource to its dependency-resources,
     * if they have been stripped off of their plugin data (i.e. `dependency_args.pluginData === undefined`).
     *
     * > [!note]
     * > you might be questioning _why would the dependency-resource lose the plugin data that its importer had?_
     * >
     * > the reason is that esbuild's native resolvers and loaders strip away plugin data when any resource goes through them.
     * > (i.e. esbuild does not propagate the plugin data on its own if it resolves or loads something)
     * > moreover, poorly written plugins may do the same.
     * > which is why this option helps you retrieve lost plugin data from the parent dependent resource (the `args.importer`).
     *
     * > [!important]
     * > generally, you would always want this to be left as `true`.
     * > otherwise, npm-packages and local-files, that are implicitly resolved by esbuild in this library,
     * > will lose their access to the {@link CommonPluginData.importMap | import-maps} and {@link CommonPluginData.runtimePackage | deno-package-resolver}.
     *
     * @defaultValue `true`
    */
    enableInheritPluginData: boolean;
    /** enable scanning of parental/ancestral directories of your project's
     * {@link InitialPluginData.runtimePackage | base directory (`initialPluginData.runtimePackage`)},
     * so that all relevant workspace packages up the directory tree can be discovered and cached.
     *
     * this would permit the resolution of workspace package aliases that are not directly mentioned in your "deno.json" package file.
     *
     * @defaultValue `false`
    */
    scanAncestralWorkspaces: boolean;
    /** specify which `namespace`s should be intercepted by the entry-point plugin.
     * all other `namespace`s will not be processed by this plugin.
     *
     * if you want your plugin to receive pre-resolved absolute paths under some `namespace`,
     * instead of having to resolve the path yourself by joining paths and inspecting `pluginData`,
     * then simply include it in this configuration property.
     *
     * @defaultValue `[undefined, "", "file"]` (also {@link PLUGIN_NAMESPACE.LOADER_HTTP} gets added later on)
    */
    acceptNamespaces: Array<string | undefined>;
}
/** this filter plugin intercepts all entities, injects and propagates plugin-data (if the entity is an entry-point, or a dependency with no plugin-data),
 * and then makes them go through the {@link resolverPlugin} set of resolvers, in order to obtain the absolute path to the resource.
 *
 * for an explanation, see detailed comments of this submodule: {@link "plugins/filters/entry"}.
*/
export declare const entryPluginSetup: (config?: Partial<EntryPluginSetupConfig>) => EsbuildPluginSetup;
/** {@inheritDoc entryPluginSetup} */
export declare const entryPlugin: (config?: Partial<EntryPluginSetupConfig>) => EsbuildPlugin;
//# sourceMappingURL=entry.d.ts.map