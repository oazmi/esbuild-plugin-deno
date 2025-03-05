/** an esbuild plugin that strips away `npm:` specifiers,
 * and indirectly resolves the npm-package resource path through the {@link resolverPlugin}.
 *
 * @module
*/
import type { DeepPartial, EsbuildPlugin, EsbuildPluginSetup } from "../typedefs.js";
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
     * TODO: needs to be implemented. see details in `/todo.md`, under pre-version `0.3.0`.
     *
     * @defaultValue `true`
    */
    autoInstall: boolean;
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
    /** specify the `path` to the directory containing your `"./node_modules/"` folder as a subdirectory.
     *
     * this directory will be used by esbuild's native resolver as a starting point for scanning for `node_modules` npm-packages,
     * and it will work upwards from there on until the root of your drive is reached,
     * and all `"./node_modules/"` folders up the directory tree have been scanned.
     *
     * the `prioritizeAbsWorkingDir` option lets you specify if esbuild's initial `absWorkingDir` build option should take priority over your specified `path`.
     *
     * @defaultValue `{ path: process.cwd(), prioritizeAbsWorkingDir: true }`
    */
    resolveDir: {
        /** the directory path to the parent folder of your `"./node_modules/"` folder.
         *
         * @defaultValue current-working-directory, acquired via {@link defaultGetCwd}
        */
        path: string;
        /** specify if esbuild's initial `absWorkingDir` build option should be used instead of the `path` when it's available.
         *
         * @defaultValue `true`
        */
        prioritizeAbsWorkingDir: boolean;
    };
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
//# sourceMappingURL=npm.d.ts.map