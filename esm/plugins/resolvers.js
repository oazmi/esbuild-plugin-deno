/** this submodule contains a namespaced esbuild plugin that resolves paths based on the three strategies:
 * _runtime-package_ resolution, _import-map_ resolution, and _absolute-path_ resolution.
 *
 * > [!note]
 * > the default namespace you should use in your plugins to call this pipeline of resolvers is {@link PLUGIN_NAMESPACE.RESOLVER_PIPELINE}.
 * > otherwise, if you want, you can customize the namespace of this plugin by specifying it in the `config.namespace` option.
 *
 * below is a summary what the path resolution procedure of this plugin entails, given a certain esbuild input {@link OnResolveArgs | `args`}:
 * 1. first, if {@link WorkspacePackage | `args.pluginData.runtimePackage`} exists,
 *    then the plugin tries to resolve the input `args.path` through the use of the {@link WorkspacePackage.resolveImport} method.
 *    - if it succeeds (i.e. `args.path` was an alias/import-map specified in the package file),
 *      then the resolved path, along with the original `args.pluginData`, is returned.
 *    - if it fails, then it tries to resolve the input `args.path` against any potential workspace package directories (specified in the `deno.json` config),
 *      through the use of the {@link WorkspacePackage.resolveWorkspaceImport} method.
 *    - otherwise, if workspace resolution fails, then the next path resolution takes place (import-map).
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
 *    > under the hood, this function uses the {@link EsbuildNativeResolver} class that initializes a mock build process,
 *    > which lets us indirectly query esbuild for the resolved path to the resource (if any).
 * 4. finally, when all else has failed and we've made it to here, and `args.path` is a relative path:
 *    - then we'll simply compute the absolute path of the input `args.path` by combining it with `args.importer`, and `args.resolveDir`.
 *      - if neither of those two arguments are non-empty strings, then we will resort to using esbuild's `absWorkingDir` build option.
 *      - if `absWorkingDir` was itself not specified, then we will fallback to the runtime's current-working-directory as the base directory of `args.path`.
 *    - and again, the original `args.pluginData` is returned along with the result, so that the child dependencies can inherit it.
 *
 * @module
*/
import { array_isArray, DEBUG, defaultResolvePath, ensureEndSlash, isAbsolutePath, isCertainlyRelativePath, joinPaths, noop, pathToPosixPath } from "../deps.js";
import { resolvePathFromImportMap } from "../importmap/mod.js";
import { EsbuildNativeResolver } from "../misc/esbuild_native_resolver.js";
import { logLogger } from "./funcdefs.js";
import { PLUGIN_NAMESPACE } from "./typedefs.js";
const defaultRuntimePackageResolverConfig = {
    enabled: true,
}, defaultImportMapResolverConfig = {
    enabled: true,
    globalImportMap: {},
}, defaultNodeModulesResolverConfig = {
    enabled: true,
}, defaultRelativePathResolverConfig = {
    enabled: true,
    resolvePath: defaultResolvePath,
    isAbsolutePath: isAbsolutePath,
};
const defaultResolverPluginSetupConfig = {
    runtimePackage: defaultRuntimePackageResolverConfig,
    importMap: defaultImportMapResolverConfig,
    nodeModules: defaultNodeModulesResolverConfig,
    relativePath: defaultRelativePathResolverConfig,
    namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
    log: false,
};
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
 * import { PLUGIN_NAMESPACE } from "./typedefs.ts"
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
export const resolverPluginSetup = (config) => {
    const { runtimePackage: _runtimePackageResolverConfig, importMap: _importMapResolverConfig, nodeModules: _nodeModulesResolverConfig, relativePath: _relativePathResolverConfig, namespace: plugin_ns, log, } = { ...defaultResolverPluginSetupConfig, ...config };
    const runtimePackageResolverConfig = { ...defaultRuntimePackageResolverConfig, ..._runtimePackageResolverConfig }, importMapResolverConfig = { ...defaultImportMapResolverConfig, ..._importMapResolverConfig }, nodeModulesResolverConfig = { ...defaultNodeModulesResolverConfig, ..._nodeModulesResolverConfig }, relativePathResolverConfig = { ...defaultRelativePathResolverConfig, ..._relativePathResolverConfig }, logFn = log ? (log === true ? logLogger : log) : undefined, 
    // a non-empty string namespace is required if the file is not an absolute path on the filesystem.
    output_ns = "discard-this-namespace", plugin_filter = /.*/;
    return async (build) => {
        // if `build.initialOptions.absWorkingDir` is itself a relative path, then we'll resolve it relative to the current-working-directory,
        // via the `resolvePath` function inside of the `relativePathResolver`.
        const absWorkingDir = ensureEndSlash(pathToPosixPath(build.initialOptions.absWorkingDir ?? "./"));
        const externalResourceSet = new Set(build.initialOptions.external);
        // before everything, we will ensure that the `path` being resolved is not among the external modules.
        const externalPathResolver = (externalResourceSet.size <= 0) ? noop : async (args) => {
            const { path, pluginData = {} } = args, is_external = externalResourceSet.has(path);
            if (DEBUG.LOG && logFn) {
                logFn(`[external-path]    checking: ${path}` + (!is_external ? ""
                    : `\n>> successfully verified the path to be external`));
            }
            return is_external ? {
                path,
                external: true,
                namespace: output_ns,
                pluginData: { ...pluginData },
            } : undefined;
        };
        // first comes the runtime-package-manager resolver, if it is enabled, that is.
        const runtimePackageResolver = (runtimePackageResolverConfig.enabled === false) ? noop : async (args) => {
            if (args.pluginData?.resolverConfig?.useRuntimePackage === false) {
                return;
            }
            const { path, pluginData = {} } = args, runtimePackage = pluginData.runtimePackage, 
            // if the input `path` is an import being performed inside of a package, in addition to not being a relative import,
            // then use the package manager to resolve the imported path.
            resolved_result = runtimePackage && !isCertainlyRelativePath(path)
                ? (runtimePackage.resolveImport(path) ?? runtimePackage.resolveWorkspaceImport(path))
                : undefined, [resolved_path, resolved_package] = array_isArray(resolved_result)
                ? resolved_result
                : [resolved_result, runtimePackage];
            if (DEBUG.LOG && logFn) {
                logFn(`[runtime-package] resolving: ${path}` + (!resolved_path ? ""
                    : `\n>> successfully resolved to: ${resolved_path}`));
            }
            return resolved_path ? {
                path: resolved_path,
                namespace: output_ns,
                pluginData: { ...pluginData, runtimePackage: resolved_package },
            } : undefined;
        };
        // second attempt at resolving the path is made by the import-map and global-import-map resolver (if it is enabled).
        const { globalImportMap } = importMapResolverConfig;
        const importMapResolver = (importMapResolverConfig.enabled === false) ? noop : async (args) => {
            if (args.pluginData?.resolverConfig?.useImportMap === false) {
                return;
            }
            const { path, pluginData = {} } = args, importMap = { ...globalImportMap, ...pluginData.importMap }, 
            // if the input `path` is an import being performed inside of a package, in addition to not being a relative import,
            // then use the package manager to resolve the imported path.
            resolved_path = resolvePathFromImportMap(path, importMap);
            if (DEBUG.LOG && logFn) {
                logFn(`[import-map]      resolving: ${path}` + (!resolved_path ? ""
                    : `\n>> successfully resolved to: ${resolved_path}`));
            }
            return resolved_path ? {
                path: resolved_path,
                namespace: output_ns,
                pluginData: { ...pluginData },
            } : undefined;
        };
        // third attempt at resolving the path should be made by esbuild's native `node_modules` resolver.
        const { resolvePath, isAbsolutePath } = relativePathResolverConfig;
        const node_modules_resolver = new EsbuildNativeResolver(build.esbuild, build.initialOptions);
        build.onEnd(async () => { await node_modules_resolver.stop(); });
        const nodeModulesResolver = (nodeModulesResolverConfig.enabled === false) ? noop : async (args) => {
            const { path, resolveDir, importer, pluginData = {} } = args;
            if (pluginData.resolverConfig?.useNodeModules === false) {
                return;
            }
            // for the sake of speed, we don't bother esbuild for resolving relative paths,
            // since the next resolver (`relativePathResolver`) will do this simple task much faster, without reading the filesystem.
            if ((pluginData.resolverConfig?.useRelativePath !== false)
                && (isCertainlyRelativePath(path) || isAbsolutePath(path))) {
                return;
            }
            const resolve_dir = resolvePath(ensureEndSlash(resolveDir ? resolveDir : absWorkingDir)), module_path_alias = pathToPosixPath(path), native_results_promise = node_modules_resolver.resolve(module_path_alias, {
                importer,
                resolveDir: resolve_dir,
            });
            const { path: resolved_path, namespace: _0, pluginData: _1, ...rest_results } = await (native_results_promise
                .catch(() => { return {}; }));
            if (DEBUG.LOG && logFn) {
                logFn(`[node-module]     resolving: ${path}` + (!resolved_path ? ""
                    : `\n>> successfully resolved to: ${resolved_path}`));
            }
            return resolved_path ? {
                ...rest_results,
                path: resolved_path,
                namespace: output_ns,
                pluginData: { ...pluginData },
            } : undefined;
        };
        // final attempt at resolving the path is made by simply joining potentially relative paths with the `importer` (if enabled).
        const relativePathResolver = (relativePathResolverConfig.enabled === false) ? noop : async (args) => {
            if (args.pluginData?.resolverConfig?.useRelativePath === false) {
                return;
            }
            const { path, importer, resolveDir, pluginData = {} } = args, resolve_dir = resolvePath(ensureEndSlash(resolveDir ? resolveDir : absWorkingDir)), dir = isAbsolutePath(importer)
                ? importer
                : joinPaths(resolve_dir, importer), resolved_path = resolvePath(path, dir ? dir : undefined);
            if (DEBUG.LOG && logFn) {
                logFn(`[absolute-path]   resolving: ${path}` + (!resolved_path ? "" :
                    `\n>> successfully resolved to: ${resolved_path}`));
            }
            return {
                path: resolved_path,
                namespace: output_ns,
                pluginData: { ...pluginData },
            };
        };
        build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, externalPathResolver);
        build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, runtimePackageResolver);
        build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, importMapResolver);
        build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, nodeModulesResolver);
        build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, relativePathResolver);
    };
};
/** {@inheritDoc resolverPluginSetup} */
export const resolverPlugin = (config) => {
    return {
        name: "oazmi-plugindata-resolvers",
        setup: resolverPluginSetup(config),
    };
};
