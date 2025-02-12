/** a multi-purpose esbuild plugin for bundling libraries and web-apps with Deno. */

export { httpPlugin } from "./plugins/http.js"
export type { HttpPluginSetupConfig } from "./plugins/http.js"
export { importMapPlugin } from "./plugins/importmap.js"
export type { ImportMapPluginSetupConfig } from "./plugins/importmap.js"
export { jsrPlugin } from "./plugins/jsr.js"
export type { JsrPluginSetupConfig } from "./plugins/jsr.js"
export { denoPlugins } from "./plugins/mod.js"
export type { DenoPluginsConfig } from "./plugins/mod.js"

