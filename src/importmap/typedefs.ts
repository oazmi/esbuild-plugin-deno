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
 * 
 * ### Rules for import maps
 * 
 * here are some rules that your import map record should follow:
 * (copied from [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap#module_specifier_map)):
 * - none of the _keys_ may be empty.
 * - all of the _values_ must be strings, defining either a valid absolute url or a valid relative url string that starts with `"/"`, `"./"`, or `"../"`.
 * - if a _key_ ends with `"/"`, then the corresponding value must also end with `"/"`.
 *   a key with a trailing `"/"` can be used as a prefix for when mapping (or remapping) modules addresses.
 * - the object properties' ordering is irrelevant; if multiple keys can match the module specifier, the most specific key is used.
 *   in other words, a specifier "olive/branch/" would match before "olive/".
 * - any path that is being matched against an import-map _will_ be normalized before being matched.
 *   this means that the path `"./foo/../js/app.js"` will be normalized and transformed to `"./js/app.js"`,
 *   before a suitable match is looked up in the import-map.
 * - your import-map's keys should be **always** be pre-normalized.
 *   this is because a non-normalized key, such as `"hello/earth/../to/./this/world.txt"`, will never match any possible input path,
 *   because the input path will always be normalized first, thereby becoming un-matchable with any un-normalized key.
 *   so, the correct thing to do would be to ensure that your import-map keys are normalize before hand.
 *   (in the example here, the normalized version of the key would be `"hello/to/this/world.txt"`)
*/
export type ImportMap = Record<string, string>

