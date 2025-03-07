/** a multi-purpose esbuild plugin for bundling libraries and web-apps with Deno. */

export { entryPlugin } from "./plugins/filters/entry.ts"
export type { EntryPluginSetupConfig } from "./plugins/filters/entry.ts"
export { httpPlugin } from "./plugins/filters/http.ts"
export type { HttpPluginSetupConfig } from "./plugins/filters/http.ts"
export { jsrPlugin } from "./plugins/filters/jsr.ts"
export type { JsrPluginSetupConfig } from "./plugins/filters/jsr.ts"
export { DIRECTORY, npmPlugin } from "./plugins/filters/npm.ts"
export type { NpmPluginSetupConfig } from "./plugins/filters/npm.ts"
export { denoPlugins } from "./plugins/mod.ts"
export type { DenoPluginsConfig } from "./plugins/mod.ts"
export { resolverPlugin } from "./plugins/resolvers.ts"
export type { ResolverPluginSetupConfig } from "./plugins/resolvers.ts"
export type * from "./plugins/typedefs.ts"
export { allEsbuildLoaders, defaultEsbuildNamespaces } from "./plugins/typedefs.ts"

