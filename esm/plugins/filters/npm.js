/** an esbuild plugin that strips away `npm:` specifiers,
 * and indirectly resolves the npm-package resource path through the {@link resolverPlugin}.
 *
 * @module
*/
import { array_isEmpty, DEBUG, defaultGetCwd, dom_decodeURI, ensureEndSlash, ensureFileUrlIsLocalPath, escapeLiteralStringForRegex, execShellCommand, getUriScheme, identifyCurrentRuntime, isObject, isString, joinPaths, normalizePath, object_entries, object_fromEntries, parsePackageUrl, pathToPosixPath, promise_outside, replacePrefix, RUNTIME } from "../../deps.js";
import { entryPointsToImportMapEntries, logLogger, syncTaskQueueFactory } from "../funcdefs.js";
import { nodeModulesResolverFactory } from "../resolvers.js";
import { defaultEsbuildNamespaces, DIRECTORY, PLUGIN_NAMESPACE } from "../typedefs.js";
const defaultNpmAutoInstallCliConfig = {
    dir: DIRECTORY.ABS_WORKING_DIR,
    command: (package_name_and_version) => (`npm install "${package_name_and_version}" --no-save`),
};
/** this is a synchronous task queuer that executes task-functions sequentially.
 * we need this in order to ensure that only ONE shell process is instantiated at a time to execute `npm install` or equivalent.
 * this is because otherwise, multiple `npm install` commands running on the same directory will cause conflicts in your filesystem read and write operation.
 * this problem of multiple installation combating over the same set of files is very evident in large projects that require multiple auto installations,
 * resulting in corrupted/missing files even after installation.
*/
const sync_task_queuer = syncTaskQueueFactory();
/** this is a global dictionary that dictates which npm-libraries have been installed through the `autoInstall`er.
 * this ensures that:
 * - the same library is not queued for installation twice or more, due to two or more entries requesting for the same package almost simultaneously.
 * - a partially installed package's resolvable resource (i.e. when installation is in progress) will wait to resolve until the package is fully installed.
 *   this is because we don't want the resolvable resource to be loaded, which will in turn require the resolution of relative-resources,
 *   which may not exist at the moment (since installation is in progress), causing the output path provided by resolver-pipeline's relative-path resolver to not load and fail.
*/
const packageAvailability = new Map();
const npm_prefix = "npm:";
const defaultNpmPluginSetupConfig = {
    specifiers: [npm_prefix],
    sideEffects: "auto",
    autoInstall: true,
    peerDependencies: {},
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
    const { specifiers, sideEffects, autoInstall: _autoInstall, peerDependencies: _peerDependencies, acceptNamespaces: _acceptNamespaces, nodeModulesDirs, log } = { ...defaultNpmPluginSetupConfig, ...config }, logFn = log ? (log === true ? logLogger : log) : undefined, acceptNamespaces = new Set([..._acceptNamespaces, PLUGIN_NAMESPACE.LOADER_HTTP]), forcedSideEffectsMode = isString(sideEffects) ? undefined : sideEffects, autoInstall = autoInstallOptionToNpmAutoInstallCliConfig(_autoInstall), 
    // we have to use `as EsbuildEntryPointsType` below because the `DeepPartial` utility type converts `ImportMap` type to `Partial<ImportMap>`.
    peerDependenciesImportMap = object_fromEntries(entryPointsToImportMapEntries(_peerDependencies).map(([alias, pkg_name]) => {
        // the alias must never contain the "npm:" prefix, and the package name must always be prefixed with "npm:".
        // TODO: furthermore, we must prepare a set of two aliases: one with a leading slash after the alias name, and one without.
        const well_formed_alias_with_version_and_path = replacePrefix(alias, npm_prefix, "") ?? alias, { scope: alias_scope, pkg: alias_pkg } = parsePackageUrl(npm_prefix + well_formed_alias_with_version_and_path), well_formed_alias = (alias_scope ? "@" + alias_scope + "/" : "") + alias_pkg, well_formed_pkg_with_version_and_path = (replacePrefix(pkg_name, npm_prefix, "") ?? pkg_name), { host: well_formed_pkg_with_version } = parsePackageUrl(npm_prefix + well_formed_pkg_with_version_and_path);
        return [well_formed_alias, (npm_prefix + well_formed_pkg_with_version)];
    }));
    // if the npm-package installation directory has been specified for the installation cli-command,
    // then prepend that path to `nodeModulesDirs`, so that the `validResolveDirFinder` function
    // (which relies on esbuild's native node-module resolution) will be able locate the newly installed package.
    if (isObject(autoInstall)) {
        nodeModulesDirs.unshift(autoInstall.dir);
    }
    return (async (build) => {
        // TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
        //   if they have an extension entry for the url path that we're loading
        const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions, cwd = ensureEndSlash(defaultGetCwd), abs_working_dir = absWorkingDir ? ensureEndSlash(pathToPosixPath(absWorkingDir)) : defaultGetCwd, dir_path_converter = (dir_path) => {
            switch (dir_path) {
                case DIRECTORY.CWD: return cwd;
                case DIRECTORY.ABS_WORKING_DIR: return abs_working_dir;
                default: return pathOrUrlToLocalPathConverter(dir_path);
            }
        }, node_modules_dirs = [...(new Set(nodeModulesDirs.map(dir_path_converter)))], validResolveDirFinder = findResolveDirOfNpmPackageFactory(build), autoInstallConfig = isObject(autoInstall)
            ? { dir: dir_path_converter(autoInstall.dir), command: autoInstall.command, log }
            : autoInstall;
        // first of all, we auto install any peer dependencies specified by the user
        if (autoInstallConfig) {
            build.onStart(async () => {
                const is_dynamic_installation = autoInstallConfig === "dynamic", well_formed_peer_deps = object_entries(peerDependenciesImportMap);
                if (!array_isEmpty(well_formed_peer_deps) && DEBUG.LOG && logFn) {
                    logFn(`[npmPlugin] peer-dependency: the following peer dependencies were specified:`, peerDependenciesImportMap);
                }
                for (const [alias, pkg_name] of well_formed_peer_deps) {
                    const { host: pkg_with_version, version: desired_version } = parsePackageUrl(pkg_name), no_aliasing_is_being_performed = desired_version === undefined
                        ? (alias === pkg_with_version)
                        : pkg_with_version.startsWith(alias + "@"), 
                    // see "https://stackoverflow.com/a/56134858" for how package aliasing works
                    pkg_aliased_installation_string = `${alias}@npm:${pkg_with_version}`, pkg_installation_string = (no_aliasing_is_being_performed || is_dynamic_installation)
                        ? pkg_with_version
                        : pkg_aliased_installation_string;
                    if (!no_aliasing_is_being_performed && is_dynamic_installation) {
                        (logFn ?? logLogger)(`[npmPlugin]: WARNING! auto peer dependency package installation under an aliased name is not possible with "autoInstall" set to "dynamic".`, `\n\tthis will very likely lead to a broken import. please set "autoInstall" to one of the cli options, such as "auto-cli".`, `\n\twarning generated for the peer dependency package: "${pkg_name}", with alias: "${alias}".`);
                    }
                    await sync_task_queuer(installNpmPackage, pkg_installation_string, autoInstallConfig);
                }
            });
        }
        const npmSpecifierResolverFactory = (specifier) => (async (args) => {
            // skip resolving any `namespace` that we do not accept
            if (!acceptNamespaces.has(args.namespace)) {
                return;
            }
            const { path, pluginData = {}, resolveDir = "", namespace: original_ns, ...rest_args } = args, well_formed_npm_package_alias = replacePrefix(path, specifier, npm_prefix), { scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias), npm_package_name = (scope ? "@" + scope + "/" : "") + pkg, resolved_npm_package_alias = `${npm_package_name}${pathname === "/" ? "" : pathname}`, 
            // below, we flush away any previous import-map and runtime-package manager stored in the plugin-data,
            // as we will need to reset them for the current self-contained npm package's scope.
            { importMap: _0, runtimePackage: _1, resolverConfig: originalResolverConfig, ...restPluginData } = pluginData, 
            // NOTE:
            //   it is absolutely necessary for the `resolveDir` argument to exist when resolving an npm package, otherwise esbuild will not know where to look for the node module.
            //   this is why when there is no `resolveDir` available, we will use either the absolute-working-directory or the current-working-directory as a fallback.
            //   you may wonder why the `resolveDir` would disappear, and that's because our other plugins don't bother with setting/preserving this option in their loaders,
            //   which is why it disappears when the path being resolved comes from an importer that was resolved by one of these plugins' loader.
            // TODO:
            //   version presrvation is also an issue, since the version that will actually end up being used is whatever is available in `node_modules`,
            //   instead of the `desired_version`. unless we ask deno to install/import that specific version to our `node_modules`.
            scan_resolve_dir = resolveDir === "" ? node_modules_dirs : [resolveDir, ...node_modules_dirs];
            // first, we will ensure that we wait for the npm-package if its installation is underway
            let package_availability_promise = packageAvailability.get(npm_package_name), package_availability_promise_resolver = undefined;
            if (!package_availability_promise) {
                // this is the first time we've encountered this package, so we must create a new promise for its availability,
                // to stop subsequent attempts at resolving this package from succeeding _before_ this request has been resolved first (which may involve auto-installation).
                const [promise, resolve] = promise_outside();
                packageAvailability.set(npm_package_name, (package_availability_promise = promise));
                package_availability_promise_resolver = resolve;
            }
            else {
                // if this package awas encounter previously (via a different resource), then wait for its availability to be confirmed.
                await package_availability_promise;
            }
            // we now let esbuild scan and traverse multiple directories in search for our desired npm-package.
            // if we don't initially land on a hit (i.e. none of the directories lead to the desired package),
            // then if the `autoInstall` option is enabled, we will invoke deno/bun.npm/pnpm to install the npm-package (either via the cli, or dynamic-import).
            // hopefully that will lead to the package now being available under some `"./node_modules/"` directory, for esbuild to discover it.
            let valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir);
            if (!valid_resolve_dir && autoInstallConfig) {
                // below, `sync_task_queuer` ensures that only one instance of a new terminal is running, to avoid parallel `npm install`s from occurring.
                await sync_task_queuer(installNpmPackage, well_formed_npm_package_alias, autoInstallConfig);
                valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir);
            }
            if (!valid_resolve_dir) {
                (logFn ?? logLogger)(`[npmPlugin]: WARNING! no valid "resolveDir" directory was found to contain the npm package named "${resolved_npm_package_alias}"`, `\n\twe will still continue with the path resolution (in case the global-import-map may alter the situation),`, `\n\tbut it is almost guaranteed not to work if the current-working-directory was already part of the scanned directories.`);
            }
            // by this point, the auto-installation would have taken place if necessary.
            // so, if this was the first encounter of this package, then we better signal that it is now available.
            package_availability_promise_resolver?.();
            const abs_result = await build.resolve(resolved_npm_package_alias, {
                ...rest_args,
                resolveDir: valid_resolve_dir,
                namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
                pluginData: { ...restPluginData, resolverConfig: { useRuntimePackage: false, useImportMap: false, useNodeModules: true } },
            });
            const resolved_path = abs_result.path;
            if (DEBUG.LOG && logFn) {
                logFn(`[npmPlugin]       resolving: "${path}", with resolveDir: "${valid_resolve_dir}"` + (!resolved_path ? ""
                    : `\n>> successfully resolved to: ${resolved_path}`));
            }
            // if the user wants to force side-effect-free mode for all packages, then do so.
            if (forcedSideEffectsMode !== undefined) {
                abs_result.sideEffects = forcedSideEffectsMode;
            }
            // esbuild's native loaders only operate on the default `""` and `"file"` namespaces,
            // which is why we don't restore back the `original_ns` namespace.
            abs_result.namespace = "";
            // we also go back to using the original configuration of import-maps, in case the user has a few global import-maps specified.
            // TODO: merge `peerDependenciesImportMap` with import-map.
            Object.assign(abs_result.pluginData.resolverConfig, { ...originalResolverConfig, useRuntimePackage: false, useNodeModules: true });
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
    const path = isString(dir_path_or_url) ? dir_path_or_url : dir_path_or_url.href, path_schema = getUriScheme(path), dir_path = normalizePath(ensureEndSlash(path_schema === "relative"
        ? joinPaths(ensureEndSlash(defaultGetCwd), path)
        : path));
    switch (path_schema) {
        case "local":
        case "relative":
        case "file":
            return ensureFileUrlIsLocalPath(dir_path);
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
const current_js_runtime = identifyCurrentRuntime(), package_installation_command_deno = (package_name_and_version) => (`deno cache --node-modules-dir="auto" --allow-scripts --no-config "npm:${package_name_and_version}"`), package_installation_command_deno_noscript = (package_name_and_version) => (`deno cache --node-modules-dir="auto" --no-config "npm:${package_name_and_version}"`), package_installation_command_npm = (package_name_and_version) => (`npm install "${package_name_and_version}" --no-save`), package_installation_command_bun = (package_name_and_version) => (`bun install "${package_name_and_version}" --no-save`), package_installation_command_pnpm = (package_name_and_version) => (`pnpm install "${package_name_and_version}"`);
const autoInstallOptionToNpmAutoInstallCliConfig = (option) => {
    if (!option) {
        return undefined;
    }
    if (isObject(option)) {
        return { ...defaultNpmAutoInstallCliConfig, ...option };
    }
    switch (option) {
        case "auto": return (current_js_runtime === RUNTIME.DENO || current_js_runtime === RUNTIME.BUN)
            ? "dynamic"
            : autoInstallOptionToNpmAutoInstallCliConfig("npm");
        case true:
        case "auto-cli": switch (current_js_runtime) {
            case RUNTIME.DENO: return autoInstallOptionToNpmAutoInstallCliConfig("deno");
            case RUNTIME.BUN: return autoInstallOptionToNpmAutoInstallCliConfig("bun");
            case RUNTIME.NODE: return autoInstallOptionToNpmAutoInstallCliConfig("npm");
            default: throw new Error("ERROR! cli-installation of npm-packages is not possible on web-browser runtimes.");
        }
        case "dynamic": return "dynamic";
        case "deno": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_deno };
        case "deno-noscript": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_deno_noscript };
        case "bun": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_bun };
        case "npm": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_npm };
        case "pnpm": return { dir: DIRECTORY.ABS_WORKING_DIR, command: package_installation_command_pnpm };
        default: return undefined;
    }
};
/** this function installs an npm-package to your project's `"./node_modules/"` folder.
 * see {@link NpmAutoInstallCliConfig} and {@link NpmPluginSetupConfig.autoInstall} for details on how to customize.
 *
 * > [!caution]
 * > make sure that you run only a SINGLE instance of this function at a time.
 * > that's because running multiple installations in parallel on the same working-directory will corrupt shared files.
 * >
 * > this becomes very evident in larger projects when multiple `npm install` commands are run in parallel,
 * > resulting in only a few of them actually successfully installing,
 * > while the rest are either partially installed, or ignored altogether.
 * >
 * > to mitigate this issue, run your multiple `npm install` commands through a synchronous task queuer,
 * > like the one that can be generated from the {@link syncTaskQueueFactory} utility function in this library.
*/
export const installNpmPackage = async (package_name, config) => {
    switch (current_js_runtime) {
        case RUNTIME.DENO:
        case RUNTIME.BUN:
        case RUNTIME.NODE: {
            return config === "dynamic"
                ? installNpmPackageDynamic(package_name)
                : installNpmPackageCli(package_name, config);
        }
        default:
            throw new Error("ERROR! npm-package installation is not possible on web-browser runtimes.");
    }
};
/** this function executes a cli command to install an npm-package.
 * see {@link NpmAutoInstallCliConfig} and {@link NpmPluginSetupConfig.autoInstall} for details on how to customize.
*/
export const installNpmPackageCli = async (package_name, config) => {
    const { command, dir, log } = config, logFn = log ? (log === true ? logLogger : log) : undefined, pkg_pseudo_url = parsePackageUrl(package_name.startsWith(npm_prefix) ? package_name : (npm_prefix + package_name)), pkg_name_and_version = pkg_pseudo_url.host, 
    // TODO: I should ideally use a more robust way to detect package name aliasing ("@my/alias@npm:@scope/pkg@version"), but for now, this will do. 
    is_using_package_aliasing = pkg_name_and_version.includes("@npm:"), cli_command = command(is_using_package_aliasing ? package_name : pkg_name_and_version);
    if (DEBUG.LOG && logFn) {
        logFn(`[npmPlugin]      installing: "${package_name}", in directory "${dir}"\n>>    using the cli-command: \`${cli_command}\``);
    }
    await execShellCommand(current_js_runtime, cli_command, { cwd: dir });
};
/** this function indirectly makes the deno or bun runtimes automatically install an npm-package.
 * doing so will hopefully make it available under your project's `"./node_modules/"` directory,
 * allowing esbuild to access it when bundling code.
 *
 * > [!important]
 * > for the npm-package to be installed to your project's directory,
 * > you **must** have the `"nodeModulesDir"` field set to `"auto"` in your project's "deno.json" configuration file.
 * > otherwise, the package will get cached in deno's cache directory which uses a different file structure from `node_modules`,
 * > making it impossible for esbuild to traverse through it to discover the package natively.
*/
export const installNpmPackageDynamic = async (package_name) => {
    const pkg_pseudo_url = parsePackageUrl(package_name.startsWith(npm_prefix) ? package_name : (npm_prefix + package_name)), pkg_import_url = pkg_pseudo_url.href
        .replace(/^npm\:[\/\\]*/, npm_prefix)
        .slice(0, pkg_pseudo_url.pathname === "/" ? -1 : undefined), 
    // NOTE: we must decode the href uri, because deno will not accept version strings that are uri-encoded.
    dynamic_export_script = `export * as myLib from "${dom_decodeURI(pkg_import_url)}"`, dynamic_export_script_blob = new Blob([dynamic_export_script], { type: "text/javascript" }), dynamic_export_script_url = URL.createObjectURL(dynamic_export_script_blob);
    // now we perform a phony import, to force deno to cache this npm-package as a dependency inside of your `${cwd}/node_modules/`.
    await import(dynamic_export_script_url);
    return;
};
