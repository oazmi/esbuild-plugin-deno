/** this submodule provides an esbuild plugin that applies a specific plugin data to all entry-points,
 * and then leaves it for other plugins to resolve.
 *
 * TODO: should I rename this submodule to "initial d" to increase nipponjin-weebness levels?
 *   it would be a missed opportunity if I don't.
 *
 * @module
*/
import { defaultResolvePath, isAbsolutePath, isString, normalizePath, resolveAsUrl } from "../deps.js";
import { RuntimePackage } from "../packageman/base.js";
import { DenoPackage } from "../packageman/deno.js";
import { unResolveFactory } from "./funcdefs.js";
/** a symbol that gets implanted into resolving-entry's `pluginData`,
 * that indicates that it has been captured by the initial-data plugin's resolver once,
 * so that it does not infinitely continue getting captured by it recuresively
 * (since the resolver's filter is set to capture all paths by default).
*/
export const CAPTURED_ALREADY = Symbol();
const defaultResolveInitialDataFactoryConfig = {
    pluginData: {},
    pluginDataMarker: CAPTURED_ALREADY,
    captureDependencies: true,
    onResolveArgs: {},
};
const defaultInitialDataPluginSetupConfig = {
    ...defaultResolveInitialDataFactoryConfig,
    filters: [/.*/],
    namespace: undefined,
};
const onResolveInitialDataFactory = (config, build) => {
    const { pluginData: initialPluginData, pluginDataMarker, captureDependencies, onResolveArgs } = { ...defaultResolveInitialDataFactoryConfig, ...config }, captured_resolved_paths = new Set();
    return async (args) => {
        const { path, pluginData = {}, ...rest_args } = args, merged_plugin_data = { ...initialPluginData, ...pluginData }, { kind, importer } = rest_args;
        // if the `kind` is not an entrypoint, nor is the `importer` one of the files that has been previously captured for initial-data injection,
        // then skip, since this plugin is intended to insert plugin data only to entry points, and their dependencies.
        if (kind !== "entry-point" && !captured_resolved_paths.has(normalizePath(importer))) {
            return undefined;
        }
        // if the plugin marker already exists for this entity, then we've already processed it once,
        // therefore we should return `undefined` so that we don't end in an infinite onResolve recursion.
        // this way, the next resolver registered to esbuild (or its native resolver) will take up the task for resolving this entity.
        if (merged_plugin_data[pluginDataMarker]) {
            return undefined;
        }
        merged_plugin_data[pluginDataMarker] = true;
        const resolved_result = await build.resolve(path, { ...rest_args, ...onResolveArgs, pluginData: merged_plugin_data });
        // once again, if esbuild's native resolver resolved the `path`, then the `merged_plugin_data` that we just inserted will be lost.
        // i.e. `resolved_result.pluginData === undefined` if esbuild's native resolver took care of the path-resolution.
        // in such cases, we would like to re-insert our `merged_plugin_data` again, before returning the result
        if (resolved_result.pluginData === undefined) {
            resolved_result.pluginData = merged_plugin_data;
        }
        if (captureDependencies) {
            captured_resolved_paths.add(normalizePath(resolved_result.path));
        }
        return { ...resolved_result, pluginData: merged_plugin_data };
    };
};
/** setup function for an initial-data plugin.
 *
 * the initial-data plugin will intercept all `onResolve` calls made by esbuild _once_,
 * and insert the user's desired `pluginData` to each entrypoint (i.e. when `args.kind === "entrypoint"`).
 * after that, the entity's path will then be passed onto other plugins (or esbuild's native resolver) for resolution.
 *
 * for details on how to configure, see {@link InitialDataPluginSetupConfig}.
 *
 * > [!tip]
 * > you may wonder, how does this plugin not end up in a recursive infinite loop of `onResolve` calls, when it captures everything?
 * >
 * > the way it works is that the first time an entity is encountered, we insert a unique symbol ({@link CAPTURED_ALREADY}) inside `args.pluginData`.
 * > and upon the discovery of the same symbol in a recursive/subsequent call, we terminate the path-resolution (by returning `undefined`),
 * > so that esbuild uses the next available path-resolver for this entity.
*/
export const initialDataPluginSetup = (config = {}) => {
    const { filters, namespace, ...rest_config } = { ...defaultInitialDataPluginSetupConfig, ...config }, pluginResolverConfig = rest_config;
    return (async (build) => {
        const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions;
        filters.forEach((filter) => {
            build.onResolve({ filter, namespace }, onResolveInitialDataFactory(pluginResolverConfig, build));
        });
    });
};
/** {@inheritDoc initialDataPluginSetup} */
export const initialDataPlugin = (config) => {
    return {
        name: "oazmi-initialdata-plugin",
        setup: initialDataPluginSetup(config),
    };
};
const defaultDenoInitialDataPluginSetupConfig = {
    ...defaultInitialDataPluginSetupConfig,
    resolvePath: defaultResolvePath,
    isAbsolutePath: isAbsolutePath,
};
export const denoInitialDataPluginSetup = (config = {}) => {
    const { filters, namespace, ...rest_config_1 } = { ...defaultDenoInitialDataPluginSetupConfig, ...config }, { isAbsolutePath, resolvePath, log: _0, globalImportMap: _1, ...rest_config_2 } = rest_config_1, { pluginData, ...partialPluginResolverConfig } = rest_config_2, initial_plugin_data_promise = commonPluginResolverConfig_to_denoInitialPluginData({ isAbsolutePath, resolvePath }, pluginData);
    return (async (build) => {
        const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions, initial_plugin_data = await initial_plugin_data_promise, pluginResolverConfig = { ...partialPluginResolverConfig, pluginData: initial_plugin_data };
        filters.forEach((filter) => {
            build.onResolve({ filter, namespace }, onResolveInitialDataFactory(pluginResolverConfig, build));
            build.onResolve({ filter, namespace }, async (args) => {
                const { path, pluginData = {}, ...rest_args } = args, runtimePackage = pluginData.runtimePackage;
                if (runtimePackage && !path.startsWith("./") && !path.startsWith("../")) {
                    // if the input `path` is an import being performed inside of a package, in addition to not being a relative import,
                    // then use the package manager to resolve the imported path.
                    const resolved_path = runtimePackage.resolveImport(path);
                    if (resolved_path) {
                        return build.resolve(resolved_path, { ...rest_args, pluginData, namespace: "oazmi-temp-namespace-1" });
                    }
                }
                return undefined;
            });
            build.onResolve({ filter: /.*/, namespace: "oazmi-temp-namespace-1" }, unResolveFactory({ isAbsolutePath, resolvePath, namespace: "" }, build));
        });
    });
};
/** {@inheritDoc denoInitialDataPluginSetup} */
export const denoInitialDataPlugin = (config) => {
    return {
        name: "oazmi-deno-initialdata-plugin",
        setup: denoInitialDataPluginSetup(config),
    };
};
export const commonPluginResolverConfig_to_denoInitialPluginData = async (config, plugin_data = {}) => {
    const { isAbsolutePath, resolvePath } = config, { runtimePackage } = plugin_data, denoPackage = runtimePackage === undefined ? undefined
        : runtimePackage instanceof RuntimePackage ? runtimePackage
            : await DenoPackage.fromUrl(isString(runtimePackage)
                ? resolveAsUrl(isAbsolutePath(runtimePackage)
                    ? runtimePackage
                    : resolvePath(runtimePackage))
                : runtimePackage);
    return { ...plugin_data, runtimePackage: denoPackage };
};
