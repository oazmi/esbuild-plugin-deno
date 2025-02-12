/** a submodule containing common utility functions used by most plugins.
 *
 * @module
*/
import { type esbuild } from "../deps.js";
import type { CommonPluginLoaderConfig, CommonPluginResolverConfig } from "./typedefs.js";
/** a factory function that returns a general purpose path resolver function for your esbuild plugin, tuned to your specific `config`.
 *
 * given a certain esbuild {@link esbuild.OnResolveArgs | `args`}, and your expected resolved {@link esbuild.OnResolveResult | `result`}
 * here is what the returned resolver function takes care of:
 * 1. figure out the absolute resolved `result.path`:
 * - if `args.parse` is an absolute path (i.e. when `config.isAbsolutePath(args.parse) === true`), then it will be returned as is.
 * - if `args.parse` is a relative path (i.e. when `config.isAbsolutePath(args.parse) === false`), then:
 *   - we figure out the absolute parent directory `dir`, by:
 *     - joining `args.importer` with `args.resolveDir` (via `config.resolvePath`) if `args.importer` is not absolute.
 *     - otherwise set `dir` to `args.importer` if it is absolute.
 *   - join `dir` with `args.parse` using `config.resolvePath` and return it as `result.path`.
 * 2. take care of namespace:
 * - set `result.namespace` to `config.namespace`
 * - backup the  original namespace `args.namespace` to `config.pluginData.originalNamespace`
 * 3. inherit import maps from plugin data:
 * - set `result.pluginData.importMap` to `args.pluginData.importMap` (which is originally set by the loaders of our typical plugin)
 *
 * @param config provide a configuration for this factory function.
 * @returns a path resolver function that can be passed to {@link esbuild.PluginBuild.onResolve}.
 *   the resolver function will resolve any relative paths to absolute ones, and set the namespace to `config.namespace`.
*/
export declare const onResolveFactory: (config: CommonPluginResolverConfig) => ((args: esbuild.OnResolveArgs) => Promise<esbuild.OnResolveResult>);
/** a path resolution factory function for {@link esbuild.PluginBuild.onResolve},
 * similar to {@link onResolveFactory}, but it "unhooks" any current `args.namespace`.
 *
 * given a certain esbuild {@link esbuild.OnResolveArgs | `args`}, and your expected resolved {@link esbuild.OnResolveResult | `result`},
 * here is how the returned resolver function works:
 * 1. strips out the current `args.namespace` and replaces it with the backedup original one in `args.pluginData.originalNamespace`
 *    (assuming it exists, otherwise the namespace will become `undefined`).
 * 2. the absolute path of the input `args` is resolved using the same mechanism in the returned function of the {@link onResolveFactory} factory.
 * 3. we call {@link build["resolve"] | `build.resolve`} with the `namespace` set to `args.pluginData.originalNamespace`,
 *    so that it resolves naturally, by giving other plugins the chance to intercept it (including esbuild's native file resolution and built-in "node_module" resolution).
 * 4. the naturally resolved `result` is then returned, thereby changing the potential `build.onLoad` loader function that esbuild will then call
 *    (that's because `result.namespace` could possibly shift to something different from the initial `arg.namespace`,
 *    thereby our plugin's path-resolution and path-loading will not remain in a continuous cycle of the same namespace,
 *    since it'll give other plugins the chance to resolve and load it as well).
 *
 * @param config provide a configuration similar to the configuration provided to the {@link unResolveFactory} function that you are trying to "unresolve"/"unhook" from.
 * @param build provide the current plugin setup's `build: esbuild.PluginBuild` parameter,
 *   so that returned unresolver function can call `build.resolve(...)` in order to acquire the natural resolved results from potentially external plugins (or the native behavior).
 * @returns a path resolver function, under a specific `namespace`, that can be passed to {@link esbuild.PluginBuild.onResolve}, so that the namespace can be stripped away,
 *   and so that the path and `args` can be resolved naturally by other plugins or by esbuild's file native resolver.
*/
export declare const unResolveFactory: (config: CommonPluginResolverConfig, build: esbuild.PluginBuild) => ((args: esbuild.OnResolveArgs) => Promise<esbuild.OnResolveResult>);
/** a factory function that returns a general purpose url content loading function for your esbuild plugin, tuned to your specific `config`.
 *
 * for the content to be correctly fetched and loaded, your `args.path` **must** be in one of the following formats:
 * - an `"http://"` or an `"https://"` url
 * - a `"file://"` url
 * - or, an absolute local file path (such as `"/home/bin/..."` or `"C:/Users/..."`)
 *
 * make sure that the path is **not** a relative path (even if it's relative to the current working directory).
 *
 * > [!important]
 * > esbuild identifies redundant/duplicate resources by their _resolved path_ and _namespace_ .
 * > if the same resource is being bundled but with either a different resolved path, or under a different namespace,
 * > then esbuild will consider them to be separate resources, instead of being one and the same.
 * > thus, it is extremely crucial that you prepare a uniquely-idenfifiable resolved path in the plugin's resolver,
 * > rather than delaying its resolution in the plugin's loader.
 * >
 * > in other words, for best results minifiable results, you should resolve the following things in the plugin's resolver, rather than the plugin's loader:
 * > - a path that is an alias inside the current import map, should be resolved to absolute an path (i.e. preferebly an `http://` or `file://` path)
 * > - jsr and npm specifiers (such as `jsr:@scope/package/pathname`) should also be resolved to http paths.
 * > - if you are caching jsr/npm/http resources on your local filesystem, you should _still_ resolve the resources by their absolute http paths,
 * >   and then check for the cached resource's existence in the filesystem inside the plugin's loader function.
 * >   do not _resolve_ to a local filesystem path if cached resources are detected, since it will break equivalency of referenced resource's resolved path.
 * >
 * > typically, the unique key that esbuild uses for identifiying redundant/duplicate resource references is of the following template:
 * > `${resolver_result.namespace}:${resolver_result.path}`
 * >
 * > where `resolver_result` is of kind {@link esbuild.OnResolveResult}.
 * >
 * > this key also becomes the key of the resource in the output metadata object (if it is enabled).
 *
 * > [!caution]
 * > based on some logging tests, I've verified that esbuild does indeed memorize the result of an `onLoad`'s callback.
 * > this means that it is possible for inconsistencies to occur in your `pluginData`, when the dependency paths are being resolved.
 * > but I will say that it is hard to imagine if this could ever become an issue, since the dependencies will also be loaded _only once_ .
 * > although, the next time something other than the original dependant, requires the same dependency file,
 * > the new `pluginData` (i.e. potentially different) of the new dependant will not be conveyed to the loader (since its results are cached by esbuild).
 *
 * @param config provide a configuration to customize some aspects of the returned loader function.
 * @returns a url loader function that can be passed to {@link esbuild.PluginBuild.onLoad},
 *   so that it can fetch the contents of url-based paths when esbuild intercept
*/
export declare const urlLoaderFactory: (config: CommonPluginLoaderConfig) => ((args: esbuild.OnLoadArgs) => Promise<esbuild.OnLoadResult>);
//# sourceMappingURL=funcdefs.d.ts.map