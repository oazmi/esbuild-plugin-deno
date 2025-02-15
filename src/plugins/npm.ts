/** an esbuild plugin that simply strips away `npm:` specifiers, so that esbuild (or some other plugin) can resolve it naturally.
 * 
 * @module
*/

import { defaultResolvePath, type esbuild, escapeLiteralStringForRegex, parsePackageUrl, replacePrefix } from "../deps.ts"
import type { CommonPluginData, CommonPluginResolverConfig } from "./typedefs.ts"


export interface NpmSpecifierPluginSetupConfig {
	specifiers: string[],
	globalImportMap?: CommonPluginResolverConfig["globalImportMap"]
	// TODO: we will need to redirect esbuild to the user's preferred `cwd` that contains the `./node_modules/` folder.
	//   but how do we do that?
	resolvePath: CommonPluginResolverConfig["resolvePath"]
}

const defaultNpmSpecifierPluginSetupConfig: NpmSpecifierPluginSetupConfig = {
	specifiers: ["npm:"],
	globalImportMap: undefined,
	resolvePath: defaultResolvePath,
}

export const npmSpecifierPluginSetup = (config: Partial<NpmSpecifierPluginSetupConfig> = {}): esbuild.Plugin["setup"] => {
	const { specifiers, globalImportMap, resolvePath } = { ...defaultNpmSpecifierPluginSetupConfig, ...config }

	return (async (build: esbuild.PluginBuild): Promise<void> => {
		// TODO: we must prioritize the user's `loader` preference over our `guessHttpResponseLoaders`,
		//   if they have an extension entry for the url path that we're loading
		const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions

		specifiers.forEach((specifier) => {
			const filter = new RegExp(`^${escapeLiteralStringForRegex(specifier)}`)

			build.onResolve({ filter }, async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult> => {
				const
					{ path, pluginData, ...rest_args } = args,
					well_formed_npm_package_alias = replacePrefix(path, specifier, "npm:")!,
					{ scope, pkg, pathname } = parsePackageUrl(well_formed_npm_package_alias),
					resolved_npm_package_path = `${scope ? "@" + scope + "/" : ""}${pkg}${pathname === "/" ? "" : pathname}`,
					{ importMap: _0, runtimePackage: _1, ...restPluginData } = (pluginData ?? {}) as CommonPluginData,
					runtimePackage = undefined

				return build.resolve(resolved_npm_package_path, {
					...rest_args,
					pluginData: {
						importMap: globalImportMap,
						runtimePackage,
						...restPluginData,
					},
				})
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
