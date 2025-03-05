/** an esbuild plugin that strips away `npm:` specifiers,
 * and indirectly resolves the npm-package resource path through the {@link resolverPlugin}.
 *
 * @module
*/
import { defaultGetCwd, ensureEndSlash, escapeLiteralStringForRegex, isString, parsePackageUrl, pathToPosixPath, replacePrefix } from "../../deps.js";
import { defaultEsbuildNamespaces, PLUGIN_NAMESPACE } from "../typedefs.js";
const defaultNpmPluginSetupConfig = {
    specifiers: ["npm:"],
    sideEffects: "auto",
    autoInstall: true,
    acceptNamespaces: defaultEsbuildNamespaces,
    resolveDir: {
        path: defaultGetCwd,
        prioritizeAbsWorkingDir: true,
    },
};
/** this plugin lets you redirect resource-paths beginning with an `"npm:"` specifier to your local `node_modules` folder.
 * after that, the module resolution task is carried by esbuild (for which you must ensure that you've ran `npm install`).
 * check the interface {@link NpmPluginSetupConfig} to understand what configuration options are available to you.
 *
 * example: `"npm:@oazmi/kitchensink@^0.9.8"` will be redirected to `"@oazmi/kitchensink"`.
 * and yes, the version number does currently get lost as a result.
 * so you'll have to pray that esbuild ends up in the `node_modules` folder consisting of the correct version, otherwise, rip.
*/
export const npmPluginSetup = (config = {}) => {
    const { specifiers, sideEffects, autoInstall, acceptNamespaces: _acceptNamespaces, resolveDir: _initialResolveDir } = { ...defaultNpmPluginSetupConfig, ...config }, acceptNamespaces = new Set([..._acceptNamespaces, PLUGIN_NAMESPACE.LOADER_HTTP]), forcedSideEffectsMode = isString(sideEffects) ? undefined : sideEffects, initialResolveDir = { ...defaultNpmPluginSetupConfig.resolveDir, ..._initialResolveDir };
    return (async (build) => {
        // TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
        //   if they have an extension entry for the url path that we're loading
        const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions, fallbackResolveDir = ensureEndSlash(pathToPosixPath((absWorkingDir && initialResolveDir.prioritizeAbsWorkingDir)
            ? absWorkingDir
            : initialResolveDir.path));
        const npmSpecifierResolverFactory = (specifier) => (async (args) => {
            // skip resolving any `namespace` that we do not accept
            if (!acceptNamespaces.has(args.namespace)) {
                return;
            }
            const { path, pluginData = {}, resolveDir = "", namespace: original_ns, ...rest_args } = args, well_formed_npm_package_alias = replacePrefix(path, specifier, "npm:"), { scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias), resolved_npm_package_alias = `${scope ? "@" + scope + "/" : ""}${pkg}${pathname === "/" ? "" : pathname}`, 
            // NOTE:
            //   it is absolutely necessary for the `resolveDir` argument to exist when resolving an npm package, otherwise esbuild will not know where to look for the node module.
            //   this is why when there is no `resolveDir` available, we will use either the absolute-working-directory or the current-working-directory as a fallback.
            //   you may wonder why the `resolveDir` would disappear, and that's because our other plugins don't bother with setting/preserving this option in their loaders,
            //   which is why it disappears when the path being resolved comes from an importer that was resolved by one of these plugins' loader.
            // TODO:
            //   my technique may not be ideal because if an npm-package were to go through one of my plugins (i.e. loaded via one of my plugins),
            //   then the original `resoveDir`, which should be inside the npm-package's directory will be lost, and we will end up wrongfully pointing to our `cwd()`.
            //   in such case, esbuild will not find the dependencies that these npm-packages might require.
            //   thus in the future, you should make sure that your loader plugins preserve this value and pass it down.
            // TODO:
            //   version presrvation is also an issue, since the version that will actually end up being used is whatever is available in `node_modules`,
            //   instead of the `desired_version`. unless we ask deno to install/import that specific version to our `node_modules`.
            resolve_dir = resolveDir === "" ? fallbackResolveDir : resolveDir, 
            // below, we flush away any previous import-map and runtime-package manager stored in the plugin-data,
            // as we will need to reset them for the current self-contained npm package's scope.
            { importMap: _0, runtimePackage: _1, resolverConfig: _2, ...restPluginData } = pluginData;
            const abs_result = await build.resolve(resolved_npm_package_alias, {
                ...rest_args,
                resolveDir: resolve_dir,
                namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
                pluginData: { ...restPluginData, resolverConfig: { useNodeModules: true } },
            });
            if (forcedSideEffectsMode !== undefined) {
                abs_result.sideEffects = forcedSideEffectsMode;
            }
            // esbuild's native loaders only operate on the default `""` and `"file"` namespaces,
            // which is why we don't restore back the `original_ns` namespace.
            abs_result.namespace = "";
            return abs_result;
        });
        specifiers.forEach((specifier) => {
            const filter = new RegExp(`^${escapeLiteralStringForRegex(specifier)}`);
            build.onResolve({ filter }, npmSpecifierResolverFactory(specifier));
        });
    });
};
/** {@inheritDoc npmPluginSetup} */
export const npmPlugin = (config) => {
    return {
        name: "oazmi-npm-plugin",
        setup: npmPluginSetup(config),
    };
};
