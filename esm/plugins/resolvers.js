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
import { DEBUG, defaultResolvePath, ensureEndSlash, ensureFileUrlIsLocalPath, getUriScheme, isAbsolutePath, joinPaths, noop, pathToPosixPath, promise_outside, resolveAsUrl } from "../deps.js";
import { resolvePathFromImportMap } from "../importmap/mod.js";
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
export const resolverPluginSetup = (config) => {
    const { runtimePackage: _runtimePackageResolverConfig, importMap: _importMapResolverConfig, nodeModules: _nodeModulesResolverConfig, relativePath: _relativePathResolverConfig, namespace: plugin_ns, log, } = { ...defaultResolverPluginSetupConfig, ...config };
    const runtimePackageResolverConfig = { ...defaultRuntimePackageResolverConfig, ..._runtimePackageResolverConfig }, importMapResolverConfig = { ...defaultImportMapResolverConfig, ..._importMapResolverConfig }, nodeModulesResolverConfig = { ...defaultNodeModulesResolverConfig, ..._nodeModulesResolverConfig }, relativePathResolverConfig = { ...defaultRelativePathResolverConfig, ..._relativePathResolverConfig }, logFn = log ? (log === true ? logLogger : log) : undefined, 
    // a non-empty string namespace is required if the file is not an absolute path on the filesystem.
    output_ns = "discard-this-namespace", plugin_filter = /.*/;
    return async (build) => {
        // if `build.initialOptions.absWorkingDir` is itself a relative path, then we'll resolve it relative to the current-working-directory,
        // via the `resolvePath` function inside of the `relativePathResolver`.
        const absWorkingDir = pathToPosixPath(build.initialOptions.absWorkingDir ?? "./");
        // first comes the runtime-package-manager resolver, if it is enabled, that is.
        const runtimePackageResolver = (runtimePackageResolverConfig.enabled === false) ? noop : async (args) => {
            if (args.pluginData?.resolverConfig?.useRuntimePackage === false) {
                return;
            }
            const { path, pluginData = {} } = args, runtimePackage = pluginData.runtimePackage, 
            // if the input `path` is an import being performed inside of a package, in addition to not being a relative import,
            // then use the package manager to resolve the imported path.
            resolved_path = runtimePackage && !path.startsWith("./") && !path.startsWith("../")
                ? runtimePackage.resolveImport(path)
                : undefined;
            if (DEBUG.LOG && logFn) {
                logFn(`[runtime-package] resolving: ${path}` + (!resolved_path ? ""
                    : `\n>> successfully resolved to: ${resolved_path}`));
            }
            return resolved_path ? {
                path: resolved_path,
                namespace: output_ns,
                pluginData: { ...pluginData },
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
        const node_modules_resolver = nodeModulesResolverFactory({ absWorkingDir: resolvePath(ensureEndSlash(absWorkingDir)) }, build);
        const nodeModulesResolver = (nodeModulesResolverConfig.enabled === false) ? noop : async (args) => {
            const { path, resolveDir, importer, pluginData = {} } = args;
            if (pluginData.resolverConfig?.useNodeModules === false) {
                return;
            }
            // for the sake of speed, we don't bother esbuild for resolving relative paths,
            // since the next resolver (`relativePathResolver`) will do this simple task much faster, without reading the filesystem.
            if ((pluginData.resolverConfig?.useRelativePath !== false)
                && (path.startsWith("./") || path.startsWith("../") || isAbsolutePath(path))) {
                return;
            }
            const resolve_dir = resolvePath(ensureEndSlash(resolveDir ? resolveDir : absWorkingDir)), module_path_alias = pathToPosixPath(path), native_results_promise = node_modules_resolver({
                importer,
                path: module_path_alias,
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
export const nodeModulesResolverFactory = (config, build) => {
    const { absWorkingDir } = config;
    const internalPluginSetup = (config) => {
        return (build) => {
            const ALREADY_CAPTURED = Symbol(), plugin_ns = "the-void", { resolve, reject, resolveDir, importer = "" } = config, 
            // below, in case the original `importer` had used a "file://" uri, we convert it back into a local path,
            // otherwise we strip away the importer, since it will not be suitable for usage as `resolveDir`,
            // since esbuild only understands local filesystem paths - no file/http uris.
            importer_path_scheme = getUriScheme(importer), importer_dir_as_file_uri = (importer_path_scheme === "local" || importer_path_scheme === "file")
                ? resolveAsUrl("./", importer).href
                : undefined, resolve_dir = importer_dir_as_file_uri ?? resolveDir;
            if (DEBUG.ASSERT && resolve_dir === "") {
                logLogger(`[nodeModulesResolverFactory]: WARNING! received an empty resolve directory ("args.resolveDir").`, `\n\twe will fallback to esbuild's current-working-directory for filling in the "resolveDir" value,`, `\n\thowever, you must be using the "nodeModulesResolverFactory" function incorrectly to have encountered this situation.`, `\n\tremember, the purpose of this function is to scan for a node-module, starting from a directory that YOU provide.`);
            }
            build.onResolve({ filter: /.*/ }, async (args) => {
                if (args.pluginData?.[ALREADY_CAPTURED] === true) {
                    return;
                }
                const { path, external, namespace, sideEffects, suffix } = await build.resolve(ensureFileUrlIsLocalPath(args.path), {
                    kind: "entry-point",
                    resolveDir: ensureFileUrlIsLocalPath(resolve_dir !== "" ? resolve_dir : args.resolveDir),
                    pluginData: { [ALREADY_CAPTURED]: true },
                });
                resolve({ path: pathToPosixPath(path), external, namespace, sideEffects, suffix });
                return { path: "does-not-matter.js", namespace: plugin_ns };
            });
            build.onLoad({ filter: /.*/, namespace: plugin_ns }, () => ({ contents: "", loader: "empty" }));
        };
    };
    return async (args) => {
        const { path, resolveDir: _resolveDir = "", importer } = args, resolveDir = _resolveDir === "" ? (absWorkingDir ?? "") : _resolveDir, [promise, resolve, reject] = promise_outside(), internalPlugin = {
            name: "native-esbuild-resolver-capture",
            setup: internalPluginSetup({ resolve, reject, resolveDir, importer }),
        };
        await (build.esbuild.build({
            entryPoints: [path],
            absWorkingDir: absWorkingDir,
            bundle: false,
            minify: false,
            write: false,
            outdir: "./temp/",
            plugins: [internalPlugin],
        })).catch(() => { reject("esbuild's native resolver failed to resolve the path"); });
        return promise;
    };
};
