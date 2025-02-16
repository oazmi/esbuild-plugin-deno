/** an esbuild plugin that simply strips away `npm:` specifiers, so that esbuild (or some other plugin) can resolve it naturally.
 * 
 * @module
*/

import { DEBUG, defaultResolvePath, ensureEndSlash, type esbuild, escapeLiteralStringForRegex, isString, parsePackageUrl, pathToPosixPath, replacePrefix } from "../deps.js"
import type { CommonPluginData, CommonPluginResolverConfig } from "./typedefs.js"


export interface NpmSpecifierPluginSetupConfig {
	/** provide a list of prefix specifiers used for npm packages.
	 * 
	 * @defaultValue `["npm:"]`
	*/
	specifiers: string[]

	/** {@inheritDoc CommonPluginResolverConfig.globalImportMap} */
	globalImportMap?: CommonPluginResolverConfig["globalImportMap"]

	// TODO: we will need to redirect esbuild to the user's preferred `cwd` that contains the `./node_modules/` folder. but how do we do that?
	/** {@inheritDoc CommonPluginResolverConfig.resolvePath} */
	resolvePath: CommonPluginResolverConfig["resolvePath"]

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
	*/
	sideEffects: boolean | "auto" | "defaultFalse" | "defaultTrue"

	/** auto install missing npm-package (the executed action/technique will vary based on the js-runtime-environment).
	 * 
	 * TODO: needs to be implemented. see details in `/todo.md`, under pre-version `0.2.0`.
	*/
	autoInstall: boolean
}

const defaultNpmSpecifierPluginSetupConfig: NpmSpecifierPluginSetupConfig = {
	specifiers: ["npm:"],
	globalImportMap: undefined,
	resolvePath: defaultResolvePath,
	sideEffects: "auto",
	autoInstall: true,
}

const log = false

export const npmSpecifierPluginSetup = (config: Partial<NpmSpecifierPluginSetupConfig> = {}): esbuild.Plugin["setup"] => {
	const
		{ specifiers, globalImportMap, resolvePath, sideEffects, autoInstall } = { ...defaultNpmSpecifierPluginSetupConfig, ...config },
		forcedSideEffectsMode = isString(sideEffects) ? undefined : sideEffects

	return (async (build: esbuild.PluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const
			{ absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions,
			fallbackResolveDir = absWorkingDir ? ensureEndSlash(pathToPosixPath(absWorkingDir)) : resolvePath("./")

		specifiers.forEach((specifier) => {
			const filter = new RegExp(`^${escapeLiteralStringForRegex(specifier)}`)

			build.onResolve({ filter }, async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult> => {
				const
					{ path, pluginData, resolveDir = "", ...rest_args } = args,
					well_formed_npm_package_alias = replacePrefix(path, specifier, "npm:")!,
					{ scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias),
					resolved_npm_package_alias = `${scope ? "@" + scope + "/" : ""}${pkg}${pathname === "/" ? "" : pathname}`,
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
					{ importMap: _0, runtimePackage: _1, originalNamespace: _2, ...restPluginData } = (pluginData ?? {}) as CommonPluginData,
					runtimePackage = undefined

				if (DEBUG.LOG && log) { console.log(`[oazmi-npm-specifier-plugin] onResolve:`, { path, resolve_dir, resolved_npm_package_alias, args }) }

				const resolved_result = await build.resolve(resolved_npm_package_alias, {
					resolveDir: resolve_dir,
					...rest_args,
					pluginData: {
						importMap: globalImportMap,
						runtimePackage,
						...restPluginData,
					},
				})
				if (forcedSideEffectsMode !== undefined) { resolved_result.sideEffects = forcedSideEffectsMode }
				return resolved_result
			})
		})
	})
}

/** {@inheritDoc npmSpecifierPluginSetup} */
export const npmSpecifierPlugin = (config?: Partial<NpmSpecifierPluginSetupConfig>): esbuild.Plugin => {
	return {
		name: "oazmi-npm-specifier-plugin",
		setup: npmSpecifierPluginSetup(config),
	}
}
