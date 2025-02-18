/** an esbuild plugin that simply strips away `npm:` specifiers, so that esbuild (or some other plugin) can resolve it naturally.
 *
 * @module
*/
import { DEBUG, defaultResolvePath, ensureEndSlash, escapeLiteralStringForRegex, isString, parsePackageUrl, pathToPosixPath, replacePrefix } from "../deps.js";
const defaultNpmSpecifierPluginSetupConfig = {
    specifiers: ["npm:"],
    globalImportMap: undefined,
    resolvePath: defaultResolvePath,
    sideEffects: "auto",
    autoInstall: true,
};
const log = false;
/** this plugin lets you redirect resource-paths beginning with an `"npm:"` specifier to your local `node_modules` folder.
 * after that, the module resolution task is carried by esbuild (for which you must ensure that you've ran `npm install`).
 * check the interface {@link NpmSpecifierPluginSetupConfig} to understand what configuration options are available to you.
 *
 * example: `"npm:@oazmi/kitchensink@^0.9.8"` will be redirected to `"@oazmi/kitchensink"`.
 * and yes, the version number does currently get lost as a result.
 * so you'll have to pray that esbuild ends up in the `node_modules` folder consisting of the correct version, otherwise, rip.
*/
export const npmSpecifierPluginSetup = (config = {}) => {
    const { specifiers, globalImportMap, resolvePath, sideEffects, autoInstall } = { ...defaultNpmSpecifierPluginSetupConfig, ...config }, forcedSideEffectsMode = isString(sideEffects) ? undefined : sideEffects;
    return (async (build) => {
        // TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
        //   if they have an extension entry for the url path that we're loading
        const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions, fallbackResolveDir = absWorkingDir ? ensureEndSlash(pathToPosixPath(absWorkingDir)) : resolvePath("./");
        specifiers.forEach((specifier) => {
            const filter = new RegExp(`^${escapeLiteralStringForRegex(specifier)}`);
            build.onResolve({ filter }, async (args) => {
                const { path, pluginData, resolveDir = "", ...rest_args } = args, well_formed_npm_package_alias = replacePrefix(path, specifier, "npm:"), { scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias), resolved_npm_package_alias = `${scope ? "@" + scope + "/" : ""}${pkg}${pathname === "/" ? "" : pathname}`, 
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
                resolve_dir = resolveDir === "" ? fallbackResolveDir : resolveDir, { importMap: _0, runtimePackage: _1, originalNamespace: _2, ...restPluginData } = (pluginData ?? {}), runtimePackage = undefined;
                if (DEBUG.LOG && log) {
                    console.log(`[oazmi-npm-specifier-plugin] onResolve:`, { path, resolve_dir, resolved_npm_package_alias, args });
                }
                const resolved_result = await build.resolve(resolved_npm_package_alias, {
                    resolveDir: resolve_dir,
                    ...rest_args,
                    pluginData: {
                        importMap: globalImportMap,
                        runtimePackage,
                        ...restPluginData,
                    },
                });
                if (forcedSideEffectsMode !== undefined) {
                    resolved_result.sideEffects = forcedSideEffectsMode;
                }
                return resolved_result;
            });
        });
    });
};
/** {@inheritDoc npmSpecifierPluginSetup} */
export const npmSpecifierPlugin = (config) => {
    return {
        name: "oazmi-npm-specifier-plugin",
        setup: npmSpecifierPluginSetup(config),
    };
};
