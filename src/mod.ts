/** a multi-purpose esbuild plugin for bundling libraries and web-apps with Deno. */

export { httpPlugin } from "./plugins/http.ts"
export type { HttpPluginSetupConfig } from "./plugins/http.ts"
export { importMapPlugin } from "./plugins/importmap.ts"
export type { ImportMapPluginSetupConfig } from "./plugins/importmap.ts"
export { jsrPlugin } from "./plugins/jsr.ts"
export type { JsrPluginSetupConfig } from "./plugins/jsr.ts"

