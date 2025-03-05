/** this filter plugin intercepts all entities, injects plugin-data (if the entrity is an entry-point, or a dependency thereof),
 * and then makes them go through the {@link resolverPlugin} set of resolvers, in order to obtain the absolute path to the resource.
 *
 * > [!important]
 * > you **must** include the {@link resolverPlugin} somewhere in your esbuild build-options,
 * > otherwise this plugin will not be able to resolve any path on its own.
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
import { RuntimePackage } from "../../packageman/base.js";
import type { CommonPluginData, EsbuildPlugin, EsbuildPluginSetup } from "../typedefs.js";
/** this is a slightly modified version of {@link CommonPluginData},
 * which accepts a path or url to your "deno.json" file under the `runtimePackage` property.
*/
export interface InitialPluginData extends Omit<CommonPluginData, "runtimePackage"> {
    /** specify your project's top-level runtime package manager object,
     * or provide the path to the package json(c) file (such as "deno.json", "jsr.jsonc", "package.json", etc...),
     * so that your project's import and export aliases can be resolved appropriately.
    */
    runtimePackage?: RuntimePackage<any> | URL | string;
}
/** configuration options for the {@link entryPluginSetup} esbuild-setup factory function. */
export interface EntryPluginSetupConfig {
    /** specify the regex filters to use for your initial-data-injection and path-resolver plugin.
     *
     * @defaultValue `[RegExp(".*"),]` (captures all input entities)
    */
    filters: RegExp[];
    /** {@inheritDoc InitialPluginData} */
    pluginData?: Partial<InitialPluginData>;
    /** specify if you wish for the dependencies of the captured `"entry-points"` to be captured as well?
     *
     * _why_? you ask? that's because esbuild's native loaders do not propagate the `pluginData` passed by the resolver, onto the dependency entities.
     * this means that the initial-data will be lost when a dependency of an entry-point is being resolved, due to esbuild's native loader not preserving it.
     * thus, our plugin will have to keep track of which entities it has already pushed its initial-data onto,
     * and then be on the lookout for dependency entities that come from an importer file that has had the initial-data injected into it,
     * so that this dependency entity can also be injected with the same initial-data.
     *
     * if you don't want the initial-data to be injected onto the entry-point's dependencies (and deep grandchildren dependencies),
     * make sure to turn off this option, otherwise it'll be enabled by default.
     *
     * @defaultValue `true`
    */
    captureDependencies: boolean;
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
/** this filter plugin intercepts all entities, injects plugin-data (if the entrity is an entry-point, or a dependency thereof),
 * and then makes them go through the {@link resolverPlugin} set of resolvers, in order to obtain the absolute path to the resource.
 *
 * for more details see the submodule comments: {@link "plugins/filters/entry"}.
*/
export declare const entryPluginSetup: (config?: Partial<EntryPluginSetupConfig>) => EsbuildPluginSetup;
/** {@inheritDoc entryPluginSetup} */
export declare const entryPlugin: (config?: Partial<EntryPluginSetupConfig>) => EsbuildPlugin;
//# sourceMappingURL=entry.d.ts.map