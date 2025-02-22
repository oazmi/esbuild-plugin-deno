/** a multi-purpose esbuild plugin for bundling libraries and web-apps with Deno. */

export { httpPlugin } from "./plugins/http.ts"
export type { HttpPluginSetupConfig } from "./plugins/http.ts"
export { importMapPlugin } from "./plugins/importmap.ts"
export type { ImportMapPluginSetupConfig } from "./plugins/importmap.ts"
export { denoInitialDataPlugin } from "./plugins/initialdata.ts"
export type { DenoInitialDataPluginSetupConfig } from "./plugins/initialdata.ts"
export { jsrPlugin } from "./plugins/jsr.ts"
export type { JsrPluginSetupConfig } from "./plugins/jsr.ts"
export { denoPlugins } from "./plugins/mod.ts"
export type { DenoPluginsConfig } from "./plugins/mod.ts"
export { npmSpecifierPlugin } from "./plugins/npm.ts"
export type { NpmSpecifierPluginSetupConfig } from "./plugins/npm.ts"

