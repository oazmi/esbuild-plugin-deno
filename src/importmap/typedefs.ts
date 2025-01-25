/** contains type definitions for import map related interfaces.
 * 
 * @module
*/

/** an import map is just a key-value dictionary, where the value is an absolute path to a package's resource,
 * and the key associated with it is an alias used by your code to reference the resource's path.
 * 
 * > [!note]
 * > the all keys that are provided are normalized first, so that a key like "hello/earth/../world" would transform to "hello/world".
 * > further reading on [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap).
 * 
 * @example
 * suppose that you have the following import map:
 * 
 * ```ts
 * const myImportMap: ImportMap = {
 * 	"@scope/lib/some-entry": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts", // this should require the http plugin to resolve
 * 	"type-definitions"     : "jsr:@oazmi/kitchensink@0.9.2/typedefs", // this should require the jsr plugin to resolve
 * 	"build-cli/"           : "jsr:@oazmi/build-tools@0.2.4/cli/",     // reference to a whole directory
 * }
 * ```
 * 
 * then, with this import map, you should hypothetically be able to reference these libraries in your code as the following when bundling:
 * 
 * ```ts ignore
 * import { transposeArray2D }            from "@scope/lib/some-entry"
 * import { Optional, MethodsOf }         from "type-definitions"
 * import type { CliArgs as DocsCliArgs } from "build-cli/docs.ts" // the prefix is part of the import map
 * import type { CliArgs as DistCliArgs } from "build-cli/dist.ts" // the prefix is part of the import map
 * 
 * // your code...
 * ```
*/
export type ImportMap = Record<string, string>

