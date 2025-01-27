/** contains utility functions for import-maps
 * 
 * @module
*/

import { normalizePath, object_keys } from "../deps.ts"
import type { ImportMap } from "./typedefs.ts"


/** resolve a potential `path_alias` to its absolutely referenced path from an `import_map`.
 * if the input `path_alias` is not a part of the provided `import_map`, then `undefined` will be returned.
 * 
 * for further reading on the specifics of what constitutes an import-map, see the documentation of {@link ImportMap}.
 * 
 * @example
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert"
 * 
 * // aliasing our function for brevity
 * const fn = resolvePathFromImportMap
 * 
 * const my_import_map = {
 * 	// non-directory specifiers (i.e. not used for prefixing)
 * 	"square"                     : "./module/shapes/square.js",
 * 	"circle"                     : "https://example.com/shapes/circle.js",
 * 	"http://shape.com/square.js" : "https://example.com/shapes/square.js",
 * 	"./shapes/circle"            : "/modules/shapes/circle/",
 * 
 * 	// directory specifiers (i.e. used for matching prefixing of path alias)
 * 	"shapes/"                    : "./module/shapes/",
 * 	"other-shapes/"              : "https://example.com/modules/shapes/",
 * 	"other-shapes/triangle/"     : "file:///C:/Users/illuminati/",
 * 	"../modules/shapes/"         : "/modules/shapes/",
 * 
 * 	// incorrect import map value.
 * 	// resolving this key will throw an error because the value should end in a trailing slash,
 * 	// since the key also ends in a trailing slash.
 * 	"modules/css/"               : "/modules/shapes/css",
 * }
 * 
 * assertEquals(
 * 	fn("square", my_import_map),
 * 	"./module/shapes/square.js",
 * )
 * 
 * assertEquals(
 * 	fn("circle", my_import_map),
 * 	"https://example.com/shapes/circle.js",
 * )
 * 
 * // the following is not resolved because the `"circle"` key in `my_import_map` does not end with a trailing slash,
 * // which is a requirement for matching prefix directories.
 * assertEquals(
 * 	fn("circle/bold-circle.js", my_import_map),
 * 	undefined,
 * )
 * 
 * assertEquals(
 * 	fn("http://shape.com/square.js", my_import_map),
 * 	"https://example.com/shapes/square.js",
 * )
 * 
 * // even though there is no exact match of the non-normalized input path here,
 * // once it is normalized inside of the function, it matches the same key as the previous test's.
 * assertEquals(
 * 	fn("http://shape.com/lib/../square.js", my_import_map),
 * 	"https://example.com/shapes/square.js",
 * )
 * 
 * // even relative imports can be thought as path aliases, so long as there is a key for it in `my_import_map`.
 * // moreover, it is permissible for an import-map value to end with a trailing slash, even when its associated key does not.
 * assertEquals(
 * 	fn("./shapes/circle", my_import_map),
 * 	"/modules/shapes/circle/",
 * )
 * 
 * assertEquals(
 * 	fn("shapes/", my_import_map),
 * 	"./module/shapes/",
 * )
 * 
 * assertEquals(
 * 	fn("shapes/rectangle.ts", my_import_map),
 * 	"./module/shapes/rectangle.ts",
 * )
 * 
 * assertEquals(
 * 	fn("other-shapes", my_import_map),
 * 	undefined,
 * )
 * 
 * assertEquals(
 * 	fn("other-shapes/doritos.html", my_import_map),
 * 	"https://example.com/modules/shapes/doritos.html",
 * )
 * 
 * // the path alias is matched with the longest key first,
 * // which is why it resolves to a path different from the prior test's key.
 * assertEquals(
 * 	fn("other-shapes/triangle/doritos.html", my_import_map),
 * 	"file:///C:/Users/illuminati/doritos.html",
 * )
 * 
 * // the value of the key "modules/css/" is invalid (non-specs compliant),
 * // since it does not end with a trailing slash, whereas the key does end with one.
 * assertThrows(() => {
 * 	fn("modules/css/cicle.css", my_import_map)
 * })
 * ```
*/
export const resolvePathFromImportMap = <M extends ImportMap>(path_alias: string, import_map: M): (M[keyof M] | string | undefined) => {
	// first of all, we normalize the `path_alias` to remove any intermediate directory traversal symbols, such as "./" and "../". required by the specification.
	// TODO: below, should I strictly stick to using `normalizePosixPath` instead of `normalizePath`? since the later will not be able to match import-map keys that use backslash directory separators (windows).
	path_alias = normalizePath(path_alias)
	
	// now, we look for an exact match of the `path_alias`. if one is not found, then we do a "longest common directory" match instead.
	const exact_match = import_map[path_alias]
	if (exact_match) { return exact_match as M[keyof M] }

	// finding the longest `import_map` key that matches the input `path_alias` as a prefix.
	// however, we will only match keys that end with a trailing slash ("/"), because that's what the specification permits when mapping prefixes.
	// for details see "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap#mapping_path_prefixes"
	const sorted_import_map_keys = object_keys(import_map)
		.filter((key) => key.endsWith("/"))
		.toSorted((a, b) => (b.length - a.length))
	for (const key of sorted_import_map_keys) {
		if (path_alias.startsWith(key)) {
			const value = import_map[key]
			if (!value.endsWith("/")) {
				throw new Error(`the value ("${value}") of the matched import-map key ("${key}") for the path alias "${path_alias}" MUST end with a trailing slash ("/") to be specification compliant.`)
			}
			return path_alias.replace(key, value)
		}
	}

	// if not matches within the import map are found, then return `undefined`
	return undefined
}
