/** this submodule contains a namespaced esbuild plugin that resolves paths based on the three strategies:
 * _runtime-package_ resolution, _import-map_ resolution, and _absolute-path_ resolution.
 *
 * > [!note]
 * > the default namespace you should use in your plugins to call this pipeline of resolvers is {@link PLUGIN_NAMESPACE.RESOLVER_PIPELINE}.
 * > otherwise, if you want, you can customize the namespace of this plugin by specifying it in the `config.namespace` option.
 *
 * below is a summary what the path resolution procedure of this plugin entails, given a certain esbuild input {@link OnResolveArgs | `args`}:
 * 1. first, if {@link RuntimePackage | `args.pluginData.runtimePackage`} exists,
 *    then the plugin tries to resolve the input `args.path` through the use of the {@link RuntimePackage.resolveImport} method.
 *    - if it succeeds (i.e. `args.path` was an alias/import-map specified in the package file),
 *      then the resolved path, along with the original `args.pluginData`, is returned.
 *    - otherwise, if it fails, then the next path resolution takes place (import-map).
 * 2. next, if either {@link ImportMap | `args.pluginData.importMap`} exists,
 *    or {@link ImportMapResolverConfig.globalImportMap | `config.importMap.globalImportMap`} exists,
 *    then the plugin will try to resolve the input `args.path` with respect to these import-maps,
 *    through the use of the {@link resolvePathFromImportMap} function.
 *    - if it succeeds (i.e. `args.path` was part of the import-map(s)),
 *      then the resolved path, along with the original `args.pluginData`, is returned.
 *    - otherwise, if it fails, then the next path resolution will take place (node-modules).
 * 3. up ahead, we let esbuild's native resolver give a shot at resolving `args.path` as a node-module package,
 *    if and only if the path is neither a relative path (i.e. doesn't begin with `"./"` or `"../"`),
 *    nor is it an absolute path (such as "http://example.com/...", or "C:/users/...").
 *    this is because these scenarios can be handled much quicker by the next path-resolver that follows this one
 *    (since that one does not perform filesystem read/scan operations, unlike esbuild's native resolver).
 *    - if it succeeds (i.e. `args.path` was indeed some package inside some `"./node_modules/"` folder up the directory tree),
 *      then the resolved absolute filesystem path of the resource will be returned.
 *    - otherwise, if it fails, then the next path resolution will take place (path-joining).
 *    > [!tip]
 *    > under the hood, this function uses the {@link nodeModulesResolverFactory} function that initializes a mock build process,
 *    > which lets us indirectly query esbuild for the resolved path to the resource (if any).
 * 4. finally, when all else has failed and we've made it to here, and `args.path` is a relative path:
 *    - then we'll simply compute the absolute path of the input `args.path` by combining it with `args.importer`, and `args.resolveDir`.
 *      - if neither of those two arguments are non-empty strings, then we will resort to using esbuild's `absWorkingDir` build option.
 *      - if `absWorkingDir` was itself not specified, then we will fallback to the runtime's current-working-directory as the base directory of `args.path`.
 *    - and again, the original `args.pluginData` is returned along with the result, so that the child dependnecies can inherit it.
 *
 * @module
*/
import { type DeepPartial } from "../deps.js";
import type { ImportMap } from "../importmap/typedefs.js";
import type { EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, LoggerFunction, OnResolveResult } from "./typedefs.js";
import { type OnResolveArgs } from "./typedefs.js";
/** configuration for the runtime-package resolver in {@link resolverPluginSetup},
 * which operates on the {@link CommonPluginData.runtimePackage} plugin-data property.
*/
export interface RuntimePackageResolverConfig {
    /** enable or disable runtime-package (such as "deno.json") alias resolution.
     *
     * @defaultValue `true` (enabled)
    */
    enabled: boolean;
}
/** configuration for the import-map resolver in {@link resolverPluginSetup},
 * which operates on the {@link CommonPluginData.importMap} plugin-data property.
*/
export interface ImportMapResolverConfig {
    /** enable or disable import-map resolution.
     *
     * @defaultValue `true` (enabled)
    */
    enabled: boolean;
    /** specify a global import-map for aliases to resources.
     *
     * the full import-map within the body of the resolver function will be a merger between _this_ global import-map,
     * and the import-map acquired from the plugin data (i.e. {@link CommonPluginData.importMap}).
     * the plugin data's import-map will take a higher priority in case of conflicting key (i.e. same alias key but different absolute path values).
     *
     * the resolve function will always look for a match for `args.path` inside of the import-map,
     * before resolving it with respect to the current importer or resolve-directory (i.e. `args.importer` or `args.resolveDir`).
     *
     * @defaultValue `{}` (empty object/dictionary)
    */
    globalImportMap: ImportMap;
}
/** configuration for esbuild's native `node_modules` resolver in {@link resolverPluginSetup}. */
export interface NodeModulesResolverConfig {
    /** enable or disable `node_modules` resolution.
     *
     * @defaultValue `true` (enabled).
     *   however, the default `pluginData.resolverConfig.useNodeModules` option is set to `false`,
     *   meaning that it will only work when the user explicitly sets their `pluginData.resolverConfig.useNodeModules` to `true`.
    */
    enabled: boolean;
}
/** configuration for the relative-path resolver in {@link resolverPluginSetup}. */
export interface RelativePathResolverConfig {
    /** enable or disable relative path resolution.
     *
     * @defaultValue `true` (enabled)
    */
    enabled: boolean;
    /** a function that joins/resolves path segments to an absolute path (i.e. a path that the plugin itself can recognize as an absolute path).
     *
     * typically, only two or one segments are provided at a time, but it's better if your function accepts variable number of segments.
    */
    resolvePath: (...segments: string[]) => string;
    /** a function that declares whether or not a given path segment is an absolute path (i.e. the plugin itself recognizes it as an absolute path). */
    isAbsolutePath: (segment: string) => boolean;
}
/** configuration options for the {@link resolverPluginSetup} esbuild-setup factory function. */
export interface ResolverPluginSetupConfig {
    /** {@inheritDoc RuntimePackageResolverConfig} */
    runtimePackage: RuntimePackageResolverConfig;
    /** {@inheritDoc ImportMapResolverConfig} */
    importMap: ImportMapResolverConfig;
    /** {@inheritDoc NodeModulesResolverConfig} */
    nodeModules: NodeModulesResolverConfig;
    /** {@inheritDoc RelativePathResolverConfig} */
    relativePath: RelativePathResolverConfig;
    /** specify the input-namespace on which the resolver-pipeline will operate on.
     *
     * > [!caution]
     * > it is best if you don't modify it to something besides the default value {@link PLUGIN_NAMESPACE.RESOLVER_PIPELINE},
     * > as the filter-category plugins rely on that specific namespace to have their intercepted entities resolved as absolute-paths.
    */
    namespace: string;
    /** enable logging of the input arguments and resolved paths, when {@link DEBUG.LOG} is ennabled.
     *
     * when set to `true`, the logs will show up in your console via `console.log()`.
     * you may also provide your own custom logger function if you wish.
     *
     * @defaultValue `false`
    */
    log: boolean | LoggerFunction;
}
/** this is a 4-in-1 namespaced-plugin that assists in resolving esbuild paths,
 * based on {@link CommonPluginData | `pluginData`}, esbuild's native-resolver, and relative path resolver.
 *
 * for details on what gets resolved an how, refer to the documentation comments of this submodule ({@link "plugins/resolvers"}).
 *
 * the way it is intended to be used is by being called indirectly via `build.resolve`, after specifying the correct namespace of this plugin.
 *
 * @example
 * ```ts
 * import type { EsbuildPlugin, EsbuildPluginBuild, OnLoadArgs, OnResolveArgs } from "./typedefs.ts"
 * import { PLUGIN_NAMESPACE.RESOLVER_PIPELINE } from "./typedefs.ts"
 *
 * const THIS_plugins_namespace = PLUGIN_NAMESPACE.RESOLVER_PIPELINE // == "oazmi-resolver-pipeline"
 *
 * const myShinyPlugin: EsbuildPlugin = {
 * 	name: "my-shiny-plugin",
 * 	setup: (build: EsbuildPluginBuild) => {
 * 		const everything_shiny_filter = /\.shiny$/
 *
 * 		build.onResolve({ filter: everything_shiny_filter }, async (args: OnResolveArgs) => {
 * 			const { path, ...rest_args } = args
 * 			const result = await build.resolve(path, { ...rest_args, namespace: THIS_plugins_namespace })
 * 			if (result) {
 * 				const {
 * 					path: absolute_path,
 * 					pluginData: useful_plugindata,
 * 					// there will be a temporary namespace that you MUST drop.
 * 					// the reason why it exists is because esbuild forbids the use of the default namespace,
 * 					// unless the path is explicitly an absolute filesystem path.
 * 					// so paths that begin with "http://", "file://", "jsr:", etc... are all invalidated by esbuild if `namespace = ""`.
 * 					namespace: _drop_the_temp_namespace,
 * 					...rest_result
 * 				} = result
 * 				return {
 * 					path: absolute_path,
 * 					pluginData: useful_plugindata,
 * 					namespace: "my-shiny-namespace",
 * 					...rest_result,
 * 				}
 * 			}
 * 		})
 *
 * 		build.onLoad({ filter: RegExp(".*"), namespace: "my-shiny-namespace" }, async (args: OnLoadArgs) => {
 * 			const { path, pluginData } = args
 * 			const contents = "" // load your shiny stuff here
 * 			return { contents, loader: "ts", pluginData }
 * 		})
 * 	}
 * }
 * ```
*/
export declare const resolverPluginSetup: (config?: DeepPartial<ResolverPluginSetupConfig>) => EsbuildPluginSetup;
/** {@inheritDoc resolverPluginSetup} */
export declare const resolverPlugin: (config?: DeepPartial<ResolverPluginSetupConfig>) => EsbuildPlugin;
/** an interface to configure the {@link nodeModulesResolverFactory} function. */
export interface NodeModulesResolverFactoryConfig {
    /** the fallback resolve-dir path which should be used in place of `args.resolveDir` and `args.importer`, if neither are available.
     * the `absWorkingDir` path will generally correspond to your project's directory (i.e. current working directory).
    */
    absWorkingDir?: string;
}
/** this factory function creates a path-resolver function that mimics esbuild's native-resolver's behavior.
 *
 * the slyish way how it works is that we create a new build process to query esbuild what it would hypothetically do if so and so input arguments were given,
 * then through a custom inner plugin, we capture esbuild's response (the resolved path), and return it back to the user.
 *
 * > [!note]
 * > the internal resolver function accepts `"file://"` uris for the following list of {@link OnResolveArgs} fields,
 * > and converts them to local paths for esbuild to understand:
 * > - `path`
 * > - `resolveDir`
 * > - `importer`
 * >
 * > with this feature, you won't have to worry about file-uris at all.
*/
export declare const nodeModulesResolverFactory: (config: NodeModulesResolverFactoryConfig, build: EsbuildPluginBuild) => ((args: Pick<OnResolveArgs, "path" | "resolveDir" | "importer">) => Promise<OnResolveResult>);
//# sourceMappingURL=resolvers.d.ts.map