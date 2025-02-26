import type { esbuild, MaybePromise } from "../deps.ts"
import type { ImportMap } from "../importmap/typedefs.ts"
import type { RuntimePackage } from "../packageman/base.ts"
import type { resolverPlugin } from "./resolvers.ts"


export const resolversPluginNamespace = "oazmi-resolvers-pipeline"

/** this is the common plugin data utilized by the resolvers in {@link resolverPlugin} esbuild-plugin. */
export interface CommonPluginData {
	/** specifies the current scope's import-map aliases.
	 * the keys of this object hold the aliased name of the import, while the values hold the absolute path of the referenced resource.
	 * 
	 * for further reading on import maps, see {@link ImportMap}.
	*/
	importMap?: ImportMap

	/** specifies the current scope's runtime package manager (such as deno, jsr, npm, node, etc...),
	 * so that the package's own import and export aliases can be resolved appropriately.
	*/
	runtimePackage?: RuntimePackage<any>

	/** you may control which resolvers to disable through the use of this property. */
	resolverConfig?: {
		/** enable or disable import-map resolution for the current entity.
		 * 
		 * @defaultValue `true` (enabled)
		*/
		useImportMap?: boolean

		/** enable or disable runtime-package resolution (such as "deno.json") for the current entity.
		 * 
		 * @defaultValue `true` (enabled)
		*/
		useRuntimePackage?: boolean

		/** enable or disable `node_modules` file resolution for the current entity.
		 * 
		 * @defaultValue `true` (enabled)
		*/
		useNodeModules?: boolean

		/** enable or disable relative-path to absolute-path resolution for the current entity.
		 * 
		 * @defaultValue `true` (enabled)
		*/
		useRelativePath?: boolean
	}
}

// TODO: fix the implementation in kitchensink
export type DeepPartial<T> = T extends (Function | Array<any> | String | BigInt | Number | Boolean | Symbol)
	? T : T extends Record<string, any>
	? { [P in keyof T]?: DeepPartial<T[P]> } : T

export type OnResolveArgs = Omit<esbuild.OnResolveArgs, "pluginData"> & { pluginData?: CommonPluginData }
export type OnLoadArgs = Omit<esbuild.OnLoadArgs, "pluginData"> & { pluginData?: CommonPluginData }
export type OnResolveCallback = (args: OnResolveArgs) => MaybePromise<esbuild.OnResolveResult | null | undefined>
export type OnLoadCallback = (args: OnLoadArgs) => MaybePromise<esbuild.OnLoadResult | null | undefined>
export type EsbuildPlugin = esbuild.Plugin
export type EsbuildPluginSetup = esbuild.Plugin["setup"]
export type EsbuildPluginBuild = esbuild.PluginBuild
