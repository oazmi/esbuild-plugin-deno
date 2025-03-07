/** an esbuild plugin that strips away `npm:` specifiers,
 * and indirectly resolves the npm-package resource path through the {@link resolverPlugin}.
 *
 * @module
*/
import { DEBUG, defaultGetCwd, ensureEndSlash, escapeLiteralStringForRegex, execShellCommand, fileUrlToLocalPath, getUriScheme, identifyCurrentRuntime, isString, joinPaths, parsePackageUrl, pathToPosixPath, replacePrefix, RUNTIME } from "../../deps.js";
import { nodeModulesResolverFactory } from "../resolvers.js";
import { defaultEsbuildNamespaces, PLUGIN_NAMESPACE } from "../typedefs.js";
/** an enum that represents special directories to use in {@link NpmPluginSetupConfig.nodeModulesDirs}. */
export var DIRECTORY;
(function (DIRECTORY) {
    /** represents your js-runtime's current working directory (acquired via {@link defaultGetCwd}). */
    DIRECTORY[DIRECTORY["CWD"] = 0] = "CWD";
    /** represents the `absWorkingDir` option provided to your esbuild build config.
     *
     * note that if esbuild's `absWorkingDir` option was not specified,
     * then the package scanner will fallback to  the current working director (i.e. {@link DIRECTORY.CWD}).
    */
    DIRECTORY[DIRECTORY["ABS_WORKING_DIR"] = 1] = "ABS_WORKING_DIR";
})(DIRECTORY || (DIRECTORY = {}));
const defaultNpmPluginSetupConfig = {
    specifiers: ["npm:"],
    sideEffects: "auto",
    autoInstall: true,
    acceptNamespaces: defaultEsbuildNamespaces,
    nodeModulesDirs: [DIRECTORY.ABS_WORKING_DIR],
    log: false,
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
    const { specifiers, sideEffects, autoInstall, acceptNamespaces: _acceptNamespaces, nodeModulesDirs, log } = { ...defaultNpmPluginSetupConfig, ...config }, acceptNamespaces = new Set([..._acceptNamespaces, PLUGIN_NAMESPACE.LOADER_HTTP]), forcedSideEffectsMode = isString(sideEffects) ? undefined : sideEffects;
    return (async (build) => {
        // TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
        //   if they have an extension entry for the url path that we're loading
        const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions, cwd = ensureEndSlash(defaultGetCwd), abs_working_dir = absWorkingDir ? ensureEndSlash(pathToPosixPath(absWorkingDir)) : defaultGetCwd, node_modules_dirs = nodeModulesDirs.map((dir_path) => {
            switch (dir_path) {
                case DIRECTORY.CWD: return cwd;
                case DIRECTORY.ABS_WORKING_DIR: return abs_working_dir;
                default: return pathOrUrlToLocalPathConverter(dir_path);
            }
        }), validResolveDirFinder = findResolveDirOfNpmPackageFactory(build);
        const npmSpecifierResolverFactory = (specifier) => (async (args) => {
            // skip resolving any `namespace` that we do not accept
            if (!acceptNamespaces.has(args.namespace)) {
                return;
            }
            const { path, pluginData = {}, resolveDir = "", namespace: original_ns, ...rest_args } = args, well_formed_npm_package_alias = replacePrefix(path, specifier, "npm:"), { scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias), resolved_npm_package_alias = `${scope ? "@" + scope + "/" : ""}${pkg}${pathname === "/" ? "" : pathname}`, 
            // below, we flush away any previous import-map and runtime-package manager stored in the plugin-data,
            // as we will need to reset them for the current self-contained npm package's scope.
            { importMap: _0, runtimePackage: _1, resolverConfig: _2, ...restPluginData } = pluginData, 
            // NOTE:
            //   it is absolutely necessary for the `resolveDir` argument to exist when resolving an npm package, otherwise esbuild will not know where to look for the node module.
            //   this is why when there is no `resolveDir` available, we will use either the absolute-working-directory or the current-working-directory as a fallback.
            //   you may wonder why the `resolveDir` would disappear, and that's because our other plugins don't bother with setting/preserving this option in their loaders,
            //   which is why it disappears when the path being resolved comes from an importer that was resolved by one of these plugins' loader.
            // TODO:
            //   version presrvation is also an issue, since the version that will actually end up being used is whatever is available in `node_modules`,
            //   instead of the `desired_version`. unless we ask deno to install/import that specific version to our `node_modules`.
            scan_resolve_dir = resolveDir === "" ? node_modules_dirs : [resolveDir, ...node_modules_dirs];
            // we now let esbuild scan and traverse multiple directories in search for our desired npm-package.
            // if we don't initially land on a hit (i.e. none of the directories lead to the desired package),
            // then if the `autoInstall` option is enabled, we will indirectly invoke deno to install the npm-package.
            // hopefully that will lead to the package now being available under some `"./node_modules/"` directory,
            // assuming that `"nodeModulesDir"` is set to `"auto"` in the current deno-runtime's "deno.json" config file.
            // otherwise the package will not be installed in `node_modules` fashion, and esbuild will not be able to discover it.
            let valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir);
            if (!valid_resolve_dir && autoInstall) {
                await installNpmPackage(well_formed_npm_package_alias, abs_working_dir);
                valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir);
            }
            if (!valid_resolve_dir) {
                console.log(`[npmPlugin]: WARNING! no valid "resolveDir" directory was found to contain the npm package named "${resolved_npm_package_alias}"`, `\n\twe will still continue with the path resolution (in case the global-import-map may alter the situation),`, `\n\tbut it is almost guaranteed not to work if the current-working-directory was already part of the scanned directories.`);
            }
            const abs_result = await build.resolve(resolved_npm_package_alias, {
                ...rest_args,
                resolveDir: valid_resolve_dir,
                namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
                pluginData: { ...restPluginData, resolverConfig: { useNodeModules: true } },
            });
            const resolved_path = abs_result.path;
            if (DEBUG.LOG && log) {
                console.log("[npmPlugin]       resolving:", path, "with resolveDir:", valid_resolve_dir);
                if (resolved_path) {
                    console.log(">> successfully resolved to:", resolved_path);
                }
            }
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
const pathOrUrlToLocalPathConverter = (dir_path_or_url) => {
    const dir_path = ensureEndSlash(isString(dir_path_or_url) ? dir_path_or_url : dir_path_or_url.href), path_schema = getUriScheme(dir_path);
    switch (path_schema) {
        case "local": return dir_path;
        case "relative": return joinPaths(ensureEndSlash(defaultGetCwd), dir_path);
        case "file": return fileUrlToLocalPath(new URL(dir_path));
        default: throw new Error(`expected a filesystem path, or a "file://" url, but received the incompatible uri scheme "${path_schema}".`);
    }
};
/** generate a function that makes esbuild scan multiple directories in search for an npm-package inside of some `"./node_modules/"` folder.
 * the first valid directory, in which the npm-package was scanned for was successful, will be returned.
 *
 * @param build the esbuild "build" object that's available inside of esbuild plugin setup functions.
 *   for mock testing, you can also provide a stub like this: `const build = { esbuild }`.
 *   follow the example below that makes use of a similar stub.
 *
 * @example
 * ```ts ignore
 * import * as esbuild from "npm:esbuild@0.25.0"
 *
 * const build = { esbuild }
 * const myPackageDirScanner = findResolveDirOfNpmPackageFactory(build)
 * const my_package_resolve_dir = await myPackageDirScanner("@oazmi/tsignal", [
 * 	"D:/temp/node/",
 * 	"file:///d:/sdk/cache/",
 * ])
 *
 * console.log(`the "@oazmi/tsignal" package can be located when resolveDir is set to:`, my_package_resolve_dir)
 * ```
*/
export const findResolveDirOfNpmPackageFactory = (build) => {
    const node_modules_resolver = nodeModulesResolverFactory({ absWorkingDir: undefined }, build);
    const validateNodeModuleExists = async (abs_resolve_dir, node_module_package_name) => {
        const result = await node_modules_resolver({
            path: node_module_package_name,
            importer: "",
            resolveDir: abs_resolve_dir,
        });
        return (result.path ?? "") !== "" ? true : false;
    };
    return async (node_module_package_name_to_search, node_module_parent_directories_to_scan) => {
        const abs_local_directories = node_module_parent_directories_to_scan.map(pathOrUrlToLocalPathConverter);
        for (const abs_resolve_dir of abs_local_directories) {
            const node_module_was_found = await validateNodeModuleExists(abs_resolve_dir, node_module_package_name_to_search);
            if (node_module_was_found) {
                return abs_resolve_dir;
            }
        }
    };
};
/** this function installs an npm-package to your project's `"./node_modules/"` folder.
 * the method of installation will depend on your javascript runtime:
 * - for Deno and Bun, the {@link denoInstallNpmPackage} function will be invoked,
 *   which will perform a dynamic import of the said package so that it gets cached onto the filesystem.
 * - for Nodejs, the {@link npmInstallNpmPackage} function will be invoked,
 *   which will execute a shell command for the installation.
*/
export const installNpmPackage = async (package_name, cwd = defaultGetCwd) => {
    switch (identifyCurrentRuntime()) {
        case RUNTIME.DENO:
        case RUNTIME.BUN:
            console.log("[npmPlugin]: deno/bun is installing the missing npm-package:", package_name);
            return denoInstallNpmPackage(package_name);
        case RUNTIME.NODE:
            console.log("[npmPlugin]: npm is installing the missing npm-package:", package_name);
            return npmInstallNpmPackage(package_name, cwd);
        default:
            throw new Error("ERROR! npm-package installation is not possible on web-browser runtimes.");
    }
};
/** this function executes the `npm install ${package_name} --no-save` command, in the provided `cwd` directory,
 * to install the desired npm-package in that directory's `"./node_modules/"` folder,
 * so that it will become available for esbuild to bundle.
 *
 * the `--no-save` flag warrants that your `package.json` file will not be modified (nor created if lacking) to add this package as dependency.
*/
export const npmInstallNpmPackage = async (package_name, cwd = defaultGetCwd) => {
    const pkg_pseudo_url = parsePackageUrl(package_name.startsWith("npm:") ? package_name : ("npm:" + package_name)), pkg_name_and_version = pkg_pseudo_url.host;
    await execShellCommand(identifyCurrentRuntime(), `npm install ${pkg_name_and_version} --no-save`, { cwd });
};
/** this function indirectly makes the deno runtime automatically install an npm-package.
 * doing so will hopefully make it available under your project's `"./node_modules/"` directory,
 * allowing esbuild to access it when bundling code.
 *
 * > [!important]
 * > for the npm-package to be installed to your project's directory,
 * > you **must** have the `"nodeModulesDir"` field set to `"auto"` in your project's "deno.json" configuration file.
 * > otherwise, the package will get cached in deno's cache directory which uses a different file structure from `node_modules`,
 * > making it impossible for esbuild to traverse through it to discover the package natively.
*/
export const denoInstallNpmPackage = async (package_name) => {
    const pkg_pseudo_url = parsePackageUrl(package_name.startsWith("npm:") ? package_name : ("npm:" + package_name)), pkg_import_url = pkg_pseudo_url.href
        .replace(/^npm\:[\/\\]*/, "npm:")
        .slice(0, pkg_pseudo_url.pathname === "/" ? -1 : undefined), dynamic_export_script = `export * as myLib from "${pkg_import_url}"`, dynamic_export_script_blob = new Blob([dynamic_export_script], { type: "text/javascript" }), dynamic_export_script_url = URL.createObjectURL(dynamic_export_script_blob);
    // now we perform a phony import, to force deno to cache this npm-package as a dependency inside of your `${cwd}/node_modules/`.
    await import(dynamic_export_script_url);
    return;
};
