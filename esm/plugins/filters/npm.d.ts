/** an esbuild plugin that strips away `npm:` specifiers,
 * and indirectly resolves the npm-package resource path through the {@link resolverPlugin}.
 *
 * @module
*/
import { type DeepPartial } from "../../deps.js";
import type { EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, LoggerFunction } from "../typedefs.js";
import { DIRECTORY } from "../typedefs.js";
/** acceptable directory formats for specifying your "resolve directory" for scanning and traversing `"./node_modules/"` folders. */
export type NodeModuleDirFormat = (string | URL | DIRECTORY);
/** these options let you precisely customize how and where your missing npm-packages should get installed. */
export interface NpmAutoInstallCliConfig {
    /** specify the working-directory where your `npm` {@link command} should be invoked,
     * so that your package will get installed to `${dir}/node_modules/`.
     *
     * note that a trailing slash is always added to `dir` if it's missing it, and you can also provide a non-normalized path,
     * or relative paths with respect to esbuild's `absWorkingDir` (which fallbacks to the runtime's current-working-directory if `undefined`).
     *
     * furthermore, you should **not** add this directory to the {@link NpmPluginSetupConfig.nodeModulesDirs} array,
     * because the plugin **will** add this `dir` to the beginning of that array internally.
     *
     * @defaultValue `DIRECTORY.ABS_WORKING_DIR`
    */
    dir: NodeModuleDirFormat;
    /** a function which should accept the package name-and-version string (such as `"react@17 - 19"`),
     * and then return a cli command, that when executed, will install the npm-package to the `${dir}/node_modules/` folder.
     *
     * note that you _can_ technically change the directory where the command is executed using `cd`,
     * however if you down a subdirectory (for instance `cd ./temp/ && npm install "${package_name_and_version}" --no-save`),
     * then the installed package will not be discoverable by esbuild's node-resolution-algorithm, because it only traverses upwards.
     * thus, you may only navigate to ancestral directories (such as `cd ../temp/ && npm install "${package_name_and_version}" --no-save`),
     * for the new package to be discoverable by esbuild.
     *
     * @defaultValue ```(package_name_and_version: string) => (`npm install "${package_name_and_version}" --no-save`)```
    */
    command: (package_name_and_version: string) => string;
    /** enable logging of the npm-package installation command, when DEBUG.LOG is ennabled. */
    log?: boolean | LoggerFunction;
}
/** configuration options for the {@link npmPluginSetup} and {@link npmPlugin} functions. */
export interface NpmPluginSetupConfig {
    /** provide a list of prefix specifiers used for npm packages.
     *
     * @defaultValue `["npm:"]`
    */
    specifiers: string[];
    /** specify the side-effects potential of all npm-packages.
     * - `true`: this would mark all packages as having side-effects, resulting in basically no tree-shaking (large bundle size).
     * - `false`: this would mark all packages being side-effects free, allowing for tree-shaking to take place and reducing bundle size.
     * - `"auto"`: this would let esbuild decide which packages are side-effect free,
     *   by probing into the package's `package.json` file and searching for the `"sideEffects"` field.
     *   however, since many unseasoned package authors do not know about this field (i.e. me), the lack of it makes esbuild default to `false`.
     *   which is in effect results in a larger bundled code size.
     *
     * TODO: in the future, I would like to probe into the `package.json` file of the package myself (by deriving its path from the `resolved_path`),
     *   and then determine weather or not the `"sideEffects"` field is actually present.
     *   if it isn't then we will default to `false` if this config option is set to `"defaultFalse"`,
     *   or default to `true` if this config option is set to `"defaultTrue"`.
     *   (esbuild exhibits the `"defaultTrue"` behavior by default anyway, so this specific option selection will be kind of redundant).
     * TODO: since in effect the `"auto"` option is equivalent to `"defaultTrue"`, I'm uncertain whether I should even keep the `"auto"` option.
     *
     * @defaultValue `"auto"`
    */
    sideEffects: boolean | "auto" | "defaultFalse" | "defaultTrue";
    /** auto install missing npm-package (the executed action/technique will vary based on the js-runtime-environment).
     *
     * ### options
     *
     * - `false`: missing npm-packages are not installed.
     *   this will result in esbuild's build process to terminate, since the missing package will not be resolvable.
     *
     * - `true`: equivalent to the `"auto-cli"` option.
     *
     * - `"auto-cli"`: a cli-command will be picked depend on your js-runtime:
     *   - for Deno, the cli-command of the `"deno"` option will be executed.
     *   - for Bun, the cli-command of the `"bun"` option will be executed.
     *   - for Nodejs, the cli-command of the `"npm"` option will be executed.
     *
     * - `"auto"`: the technique picked will depend on your js-runtime:
     *   - for Deno and Bun, the `"dynamic"` option will be chosen.
     *   - for Nodejs, the `"npm"` option will be chosen.
     *
     * - `"dynamic"`: a dynamic "on-the-fly" import will be performed,
     *   forcing your runtime to cache the npm-package in a local `"./node_modules/"` directory.
     *   > [!warning]
     *   > the underlying technique for the `"dynamic"` option used will only work for Deno and Bun, but not Nodejs.
     *   >
     *   > moreover, you will **need** to have a certain configurations for this option to work on Deno and Bun:
     *   > - for Deno, your project's "deno.json" file's `"nodeModulesDir"` should be set to `"auto"`,
     *   >   so that a local `"./node_modules/"` folder will be created for installed packages.
     *   > - for Bun, your project's directory, or one of its ancesteral directory, must contain a `"./node_modules/"` folder,
     *   >   so that bun will opt for node-package-resolution instead of its default bun-style-resolution.
     *   >   TODO: I haven't actually tried it on bun, and I'm only speculating based on the information here:
     *   >   [link](https://bun.sh/docs/runtime/autoimport)
     *
     * - `"npm"`: this will run the `npm install "${pkg}" --no-save` cli-command in your `absWorkingDir`.
     *   > [!note]
     *   > the `--no-save` flag warrants that your `package.json` file will not be modified (nor created if lacking) when a package is being installed.
     *
     * - `"deno"`: this will run the `deno cache --no-config --node-modules-dir="auto" --allow-scripts "npm:${pkg}"` cli-command in your `absWorkingDir`.
     *   > [!note]
     *   > - `deno cache` installs the package, but without modifying (or creating) the "deno.json" file.
     *   > - the `--no-config` option prevents deno from reading the "deno.json" (and "deno.lock") config file that may exist in an ancesteral directory of the desired installation directory,
     *   >   thereby changing the location where the `"./node_modules/"` installation occurs.
     *   >   moreover, giving deno access to the config file makes it reload all dependency modules listed in the "deno.json", not just our requested module alone.
     *   >   this can be extremely annoying at times, and especially annoying when verifying the behavior of the plugins.
     *   > - the `--node-modules-dir="auto"` flag ensures that the package is installed under the `absWorkingDir` directory's `"./node_modules/"` subdirectory,
     *   >   instead of the global cache directory (which uses a non-node-module compatible layout).
     *   > - the `--allow-scripts` flag permits `preinstall` and `postinstall` [lifecycle scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts#life-cycle-scripts) to run.
     *
     * - `"deno-noscript"`: this will run the `deno cache --no-config --node-modules-dir="auto" "${pkg}"` cli-command in your `absWorkingDir`.
     *   > [!note]
     *   > this is different from the `"deno"` option because it does not permit the execution of `preinstall` and `postinstall` lifecycle scripts.
     *   > lifecycle scripts could pose a security thread, but some popular packages that bind to native binaries (such as `npm:sqlite3`) require it.
     *
     * - `"bun"`: this will run the `bun install "${pkg}" --no-save` cli-command in your `absWorkingDir`.
     *   > [!note]
     *   > the `--no-save` flag warrants that your `package.json` file will not be modified (nor created if lacking) when a package is being installed.
     *
     * - `"pnpm"`: this will run the `pnpm install "${pkg}"` cli-command in your `absWorkingDir`.
     *   > [!caution]
     *   > since the `--no-save` flag is not supported in pnpm (see [issue#1237](https://github.com/pnpm/pnpm/issues/1237)),
     *   > your `package.json` file will either get modified, or a new one will get created if it does not exist.
     *
     * - for any other custom cli-command, or to use an alternate installation directory,
     *   you may provide an object that adheres to the {@link NpmAutoInstallCliConfig} interface.
     *
     * @defaultValue `true`
    */
    autoInstall: boolean | "auto-cli" | "auto" | "dynamic" | "npm" | "deno" | "deno-noscript" | "bun" | "pnpm" | Partial<NpmAutoInstallCliConfig>;
    /** specify which `namespace`s should be intercepted by the npm-specifier-plugin.
     * all other `namespace`s will not be processed by this plugin.
     *
     * if you have a plugin with a custom loader that works under some `"custom-namespace"`,
     * you can include your `"custom-namespace"` here, so that if it performs an npm-specifier import,
     * that import path will be captured by this plugin, and then consequently fetched by the http-loader plugin.
     * but do note that the namespace of the loaded resource will switch to the http-plugin's loader {@link namespace}
     * (which defaults to {@link PLUGIN_NAMESPACE.LOADER_HTTP}), instead of your `"custom-namespace"`.
     *
     * @defaultValue `[undefined, "", "file"]` (also this plugin's {@link namespace} gets added later on)
    */
    acceptNamespaces: Array<string | undefined>;
    /** specify which directories should be used for scanning for npm-packages inside of various `node_modules` folders.
     *
     * here, you may provide a collection of:
     * - absolute filesystem paths (`string`).
     * - paths relative to your current working directory (`string` beginning with "./" or "../").
     * - file-uris which being with the `"file://"` protocol (`string` or `URL`).
     * - or one of the accepted special directory enums in {@link DIRECTORY}.
     *
     * each directory that you provide here will be used by esbuild's native resolver as a starting point for scanning for `node_modules` npm-packages,
     * and it will work upwards from there until the root of your drive is reached,
     * and until all `"./node_modules/"` folders up the directory tree have been scanned.
     *
     * > [!tip]
     * > to understand how the scanning works, and to defer for inefficient redundant scanning,
     * > refer to the underlying scanner function's documentation: {@link findResolveDirOfNpmPackageFactory}.
     *
     * @defaultValue `[DIRECTORY.ABS_WORKING_DIR]` (equivalent to `[DIRECTORY.ABS_WORKING_DIR, DIRECTORY.CWD]`)
    */
    nodeModulesDirs: NodeModuleDirFormat[];
    /** enable logging of resolved npm-package's path, when {@link DEBUG.LOG} is ennabled.
     *
     * when set to `true`, the logs will show up in your console via `console.log()`.
     * you may also provide your own custom logger function if you wish.
     *
     * @defaultValue `false`
    */
    log: boolean | LoggerFunction;
}
/** this plugin lets you redirect resource-paths beginning with an `"npm:"` specifier to your local `node_modules` folder.
 * after that, the module resolution task is carried by esbuild (for which you must ensure that you've ran `npm install`).
 * check the interface {@link NpmPluginSetupConfig} to understand what configuration options are available to you.
 *
 * example: `"npm:@oazmi/kitchensink@^0.9.8"` will be redirected to `"@oazmi/kitchensink"`.
 * and yes, the version number does currently get lost as a result.
 * so you'll have to pray that esbuild ends up in the `node_modules` folder consisting of the correct version, otherwise, rip.
*/
export declare const npmPluginSetup: (config?: DeepPartial<NpmPluginSetupConfig>) => EsbuildPluginSetup;
/** {@inheritDoc npmPluginSetup} */
export declare const npmPlugin: (config?: Partial<NpmPluginSetupConfig>) => EsbuildPlugin;
/** the signature of the function returned by {@link findResolveDirOfNpmPackageFactory}.
 *
 * this function makes esbuild scan multiple directories in search for an npm-package inside of some `"./node_modules/"` folder.
 * the first valid directory, in which the npm-package was scanned for was successful, will be returned.
 *
 * @param package_name the name of the npm-package to search for in the list of directories to scan.
 * @param directories_to_scan the list of parent directories in which the `"./node_modules/"` scanning should be performed.
 *   note to **not** include directories which are an ancestor to another directory in the list.
 *   this is because esbuild traverses up the directory tree when searching for the npm-package in various `"./node_modules/"` folders.
 *   thus it would be redundant to include ancesteral directories.
 *   moreover, you may also provide `file://` urls (in either `string` or `URL` format), instead of a filesystem path.
 * @returns if the requested npm-package was found in one of the listed directories,
 *   then that directory's absolute path will be returned, otherwise `undefined` will be returned.
*/
export type FindResolveDirOfNpmPackage_FunctionSignature = (package_name: string, directories_to_scan: (string | URL)[]) => Promise<string | undefined>;
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
export declare const findResolveDirOfNpmPackageFactory: (build: EsbuildPluginBuild) => FindResolveDirOfNpmPackage_FunctionSignature;
/** see {@link NpmAutoInstallCliConfig} and {@link NpmPluginSetupConfig.autoInstall} for details on how to customize. */
export type InstallNpmPackageConfig = "dynamic" | NpmAutoInstallCliConfig & {
    dir: string | URL;
};
/** this function installs an npm-package to your project's `"./node_modules/"` folder.
 * see {@link NpmAutoInstallCliConfig} and {@link NpmPluginSetupConfig.autoInstall} for details on how to customize.
*/
export declare const installNpmPackage: (package_name: string, config: InstallNpmPackageConfig) => Promise<void>;
/** this function executes a cli command to install an npm-package.
 * see {@link NpmAutoInstallCliConfig} and {@link NpmPluginSetupConfig.autoInstall} for details on how to customize.
*/
export declare const installNpmPackageCli: (package_name: string, config: Exclude<InstallNpmPackageConfig, string>) => Promise<void>;
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
export declare const installNpmPackageDynamic: (package_name: string) => Promise<void>;
//# sourceMappingURL=npm.d.ts.map