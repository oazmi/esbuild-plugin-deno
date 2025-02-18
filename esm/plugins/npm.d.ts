/** an esbuild plugin that simply strips away `npm:` specifiers, so that esbuild (or some other plugin) can resolve it naturally.
 *
 * @module
*/
import { type esbuild } from "../deps.js";
import type { CommonPluginResolverConfig } from "./typedefs.js";
/** configuration options for the {@link npmSpecifierPluginSetup} and {@link npmSpecifierPlugin} functions. */
export interface NpmSpecifierPluginSetupConfig {
    /** provide a list of prefix specifiers used for npm packages.
     *
     * @defaultValue `["npm:"]`
    */
    specifiers: string[];
    /** {@inheritDoc CommonPluginResolverConfig.globalImportMap} */
    globalImportMap?: CommonPluginResolverConfig["globalImportMap"];
    /** {@inheritDoc CommonPluginResolverConfig.resolvePath} */
    resolvePath: CommonPluginResolverConfig["resolvePath"];
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
     * TODO: needs to be implemented. see details in `/todo.md`, under pre-version `0.2.0`.
     *
     * @defaultValue `true`
    */
    autoInstall: boolean;
}
/** this plugin lets you redirect resource-paths beginning with an `"npm:"` specifier to your local `node_modules` folder.
 * after that, the module resolution task is carried by esbuild (for which you must ensure that you've ran `npm install`).
 * check the interface {@link NpmSpecifierPluginSetupConfig} to understand what configuration options are available to you.
 *
 * example: `"npm:@oazmi/kitchensink@^0.9.8"` will be redirected to `"@oazmi/kitchensink"`.
 * and yes, the version number does currently get lost as a result.
 * so you'll have to pray that esbuild ends up in the `node_modules` folder consisting of the correct version, otherwise, rip.
*/
export declare const npmSpecifierPluginSetup: (config?: Partial<NpmSpecifierPluginSetupConfig>) => esbuild.Plugin["setup"];
/** {@inheritDoc npmSpecifierPluginSetup} */
export declare const npmSpecifierPlugin: (config?: Partial<NpmSpecifierPluginSetupConfig>) => esbuild.Plugin;
//# sourceMappingURL=npm.d.ts.map