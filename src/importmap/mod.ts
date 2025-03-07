/** contains utility functions for import-maps.
 * 
 * @module
*/

import { ensureEndSlash, ensureStartDotSlash, isAbsolutePath, joinPaths, normalizePath, object_keys, replacePrefix, replaceSuffix } from "../deps.js"
import type { ImportMap, ImportMapResolutionConfig, ImportMapSortedEntries } from "./typedefs.js"


export type * from "./typedefs.js"

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

/** use this compare-function to sort {@link ImportMapSortedEntries | import-map entries} by the key-alias's length, in decreasing order.
 * 
 * @example
 * ```ts
 * import type { ImportMapSortedEntries } from "./typedefs.ts"
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * const my_import_map_entries: ImportMapSortedEntries = [
 * 	["./hello/",       "https://example.com/hello-greetings/"],
 * 	["./hello/world/", "https://example.com/hello-world/"],
 * 	["./hello/abc/",   "https://example.com/hello-abc/"],
 * 	["./hello",        "https://example.com/"],
 * ]
 * 
 * assertEquals(my_import_map_entries.toSorted(compareImportMapEntriesByLength), [
 * 	["./hello/world/", "https://example.com/hello-world/"],
 * 	["./hello/abc/",   "https://example.com/hello-abc/"],
 * 	["./hello/",       "https://example.com/hello-greetings/"],
 * 	["./hello",        "https://example.com/"],
 * ])
 * ```
*/
export const compareImportMapEntriesByLength: Parameters<ImportMapSortedEntries["sort"]>[0] = ([alias_a, path_a], [alias_b, path_b]): number => {
	return alias_b.length - alias_a.length
}

/** the configuration interface of the function {@link resolvePathFromImportMapEntries}. */
export interface ResolvePathFromImportMapEntriesConfig extends ImportMapResolutionConfig {
	/** apply descending-order sorting to the input `export_map_entries`'s alias keys. the sorting is necessary to produce the correct result.
	 * however, if you have the entries pre-sorted, then there is no need for this, and you may set this option to `false` to skip the sorting step.
	 * 
	 * @defaultValue `true`
	*/
	sort: boolean

	/** ensure that the import/export-map's alias directories correspond to path directories as well.
	 * 
	 * @defaultValue `true`
	*/
	errorCheck: boolean
}

const defaultResolvePathFromImportMapEntriesConfig: ResolvePathFromImportMapEntriesConfig = {
	baseAliasDir: "",
	basePathDir: "",
	sort: true,
	errorCheck: true,
}

/** resolve a `path_alias` to its absolutely referenced path from an import map entries.
 * if the input `path_alias` is not a part of the provided `import_map_entries`, then `undefined` will be returned.
 * 
 * for further reading on the specifics of what constitutes an import-map, see the documentation of {@link ImportMap}.
 * 
 * > [!tip]
 * > why use this function when {@link resolvePathFromImportMap} exists?
 * > 
 * > this function has the potential to be faster if you provide pre-sorted `import_map_entries`,
 * > in addition to also providing configuration options for relative paths.
 * 
 * to understand how configure the behavior of the resolver differently, using the optional `config` parameter,
 * check out the documentation comments of {@link ResolvePathFromImportMapEntriesConfig}.
 * but for a summary, here is the breakdown:
 * - `config.baseAliasDir`: if defined (non-empty string),
 *   then the given base directory path will be prepended to all relative path-aliases of your import map entries.
 *   however, this will **not** affect any path-aliases that do not begin with a `"./"` (i.e. non-relative path-aliases).
 * - `config.basePathDir`: if defined (non-empty string),
 *   then the given base directory path will be prepended to the resolved matching path-value
 *   **if** it is a relative path (which is checked via {@link isAbsolutePath}).
 * - `config.sort`: specify `true` (default behavior) if your input `import_map_entries` is not already sorted alias-length-wise.
 *   it is necessary for the `import_map_entries` to be sorted for the import-map specification-compliant match to be selected.
 *   so, if your import map entries are pre-sorted, you can save time by setting this option to `false`.
 * - `config.errorCheck`: if a path-value match is found for some `path_alias`, however the alias-path of the entry is directory,
 *   but the corresponding path-value is not a directory (i.e. does not end in "/"), then an error will be thrown.
 * 
 * @example
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert"
 * 
 * // out export map's entries
 * const my_export_map_entries = [
 * 	[".",              "./src/mod.ts"],
 * 	["./",             "./src/dir/"],
 * 	["./hello/abc/",   "./src/hello-abc/xyz/"],
 * 	["./hello/world/", "./src/hello-world/"],
 * 	["./hello",        "./src/js/script.ts"],
 * 	["./hello/",       "./src/hello-greetings/"],
 * 	["./alias/dir/",   "./incorrect/non-dir/path"],
 * 	["postcss",        "./node_modules/postcss/main.js"],
 * 	["esbuild",        "https://registry.npmjs.org/esbuild"],
 * 	["kitchensink/",   "https://jsr.io/@oazmi/kitchensink/0.9.6/src/"],
 * ] as Array<[alias: string, path: string]>
 * 
 * // aliasing our functions, types, and objects for brevity
 * type Config = Partial<ResolvePathFromImportMapEntriesConfig>
 * const
 * 	eq = assertEquals,
 * 	err = assertThrows,
 * 	fn = (path_alias: string, config?: Config) => resolvePathFromImportMapEntries(path_alias, my_export_map_entries, config),
 * 	config_1: Config = { baseAliasDir: "jsr:@my-scope/my-lib" },
 * 	config_2: Config = { baseAliasDir: "jsr:@my-other/library" },
 * 	config_3: Config = { baseAliasDir: "jsr:@my-scope/my-lib/", basePathDir: "http://example.com" },
 * 	config_4: Config = { basePathDir: "@scope/lib" }
 * 
 * eq(fn("jsr:@my-scope/my-lib",                    config_1), "./src/mod.ts")
 * eq(fn("jsr:@my-scope/my-lib/",                   config_1), "./src/dir/")
 * eq(fn("jsr:@my-scope/my-lib/www/robot.txt",      config_1), "./src/dir/www/robot.txt")
 * eq(fn("jsr:@my-scope/my-lib/hello",              config_1), "./src/js/script.ts")
 * eq(fn("jsr:@my-scope/my-lib/hello/js/script.ts", config_1), "./src/hello-greetings/js/script.ts")
 * eq(fn("jsr:@my-scope/my-lib/hello/world/",       config_1), "./src/hello-world/")
 * eq(fn("jsr:@my-scope/my-lib/hello/world/mod.ts", config_1), "./src/hello-world/mod.ts")
 * eq(fn("jsr:@my-scope/my-lib/hello/abc/",         config_1), "./src/hello-abc/xyz/")
 * eq(fn("jsr:@my-scope/my-lib/hello/abc/mod.ts",   config_1), "./src/hello-abc/xyz/mod.ts")
 * eq(fn("jsr:@my-scope/my-lib/postcss",            config_1), "./src/dir/postcss") // captured by the `"./"` alias
 * eq(fn("postcss",                                 config_1), "./node_modules/postcss/main.js")
 * eq(fn("esbuild",                                 config_1), "https://registry.npmjs.org/esbuild")
 * eq(fn("kitchensink/pathman.ts",                  config_1), "https://jsr.io/@oazmi/kitchensink/0.9.6/src/pathman.ts")
 * 
 * err(() => fn("jsr:@my-scope/my-lib/alias/dir/",        config_1))
 * err(() => fn("jsr:@my-scope/my-lib/alias/dir/xyz.txt", config_1))
 * 
 * eq(fn("jsr:@my-scope/my-lib",                    config_2), undefined)
 * 
 * eq(fn("jsr:@my-scope/my-lib",                    config_3), "http://example.com/src/mod.ts")
 * eq(fn("jsr:@my-scope/my-lib/",                   config_3), "http://example.com/src/dir/")
 * eq(fn("jsr:@my-scope/my-lib/www/robot.txt",      config_3), "http://example.com/src/dir/www/robot.txt")
 * eq(fn("jsr:@my-scope/my-lib/hello",              config_3), "http://example.com/src/js/script.ts")
 * eq(fn("jsr:@my-scope/my-lib/hello/js/script.ts", config_3), "http://example.com/src/hello-greetings/js/script.ts")
 * eq(fn("jsr:@my-scope/my-lib/hello/world/",       config_3), "http://example.com/src/hello-world/")
 * eq(fn("jsr:@my-scope/my-lib/hello/world/mod.ts", config_3), "http://example.com/src/hello-world/mod.ts")
 * eq(fn("jsr:@my-scope/my-lib/hello/abc/",         config_3), "http://example.com/src/hello-abc/xyz/")
 * eq(fn("jsr:@my-scope/my-lib/hello/abc/mod.ts",   config_3), "http://example.com/src/hello-abc/xyz/mod.ts")
 * eq(fn("jsr:@my-scope/my-lib/postcss",            config_3), "http://example.com/src/dir/postcss")
 * eq(fn("postcss",                                 config_3), "http://example.com/node_modules/postcss/main.js")
 * eq(fn("esbuild",                                 config_3), "https://registry.npmjs.org/esbuild")
 * eq(fn("kitchensink/pathman.ts",                  config_3), "https://jsr.io/@oazmi/kitchensink/0.9.6/src/pathman.ts")
 * 
 * eq(fn(".",                      config_4), "@scope/lib/src/mod.ts")
 * eq(fn("./",                     config_4), "@scope/lib/src/dir/")
 * eq(fn("./www/robot.txt",        config_4), "@scope/lib/src/dir/www/robot.txt")
 * eq(fn("./hello",                config_4), "@scope/lib/src/js/script.ts")
 * eq(fn("./hello/js/script.ts",   config_4), "@scope/lib/src/hello-greetings/js/script.ts")
 * eq(fn("./hello/world/",         config_4), "@scope/lib/src/hello-world/")
 * eq(fn("./hello/world/mod.ts",   config_4), "@scope/lib/src/hello-world/mod.ts")
 * eq(fn("./hello/abc/",           config_4), "@scope/lib/src/hello-abc/xyz/")
 * eq(fn("./hello/abc/mod.ts",     config_4), "@scope/lib/src/hello-abc/xyz/mod.ts")
 * eq(fn("./postcss",              config_4), "@scope/lib/src/dir/postcss")
 * eq(fn("postcss",                config_4), "@scope/lib/node_modules/postcss/main.js")
 * eq(fn("esbuild",                config_4), "https://registry.npmjs.org/esbuild")
 * eq(fn("kitchensink/pathman.ts", config_4), "https://jsr.io/@oazmi/kitchensink/0.9.6/src/pathman.ts")
 * 
 * eq(fn("",                       config_4), "@scope/lib/src/mod.ts")
 * eq(fn("/",                      config_4), undefined)
 * eq(fn("www/robot.txt",          config_4), undefined)
 * eq(fn("hello",                  config_4), undefined)
 * eq(fn("hello/js/script.ts",     config_4), undefined)
 * eq(fn("hello/world/",           config_4), undefined)
 * eq(fn("hello/world/mod.ts",     config_4), undefined)
 * eq(fn("hello/abc/",             config_4), undefined)
 * eq(fn("hello/abc/mod.ts",       config_4), undefined)
 * eq(fn("postcss",                config_4), "@scope/lib/node_modules/postcss/main.js")
 * eq(fn("esbuild",                config_4), "https://registry.npmjs.org/esbuild")
 * eq(fn("kitchensink/pathman.ts", config_4), "https://jsr.io/@oazmi/kitchensink/0.9.6/src/pathman.ts")
 * ```
*/
export const resolvePathFromImportMapEntries = (path_alias: string, import_map_entries: ImportMapSortedEntries, config?: Partial<ResolvePathFromImportMapEntriesConfig>): string | undefined => {
	let { baseAliasDir, basePathDir, errorCheck, sort } = { ...defaultResolvePathFromImportMapEntriesConfig, ...config }
	// ensuring there is no trailing slashes, because they will be added later on.
	baseAliasDir = replaceSuffix(baseAliasDir, "/") ?? baseAliasDir
	basePathDir = replaceSuffix(basePathDir, "/") ?? basePathDir
	// normalize the path alias, and strip away the `baseAliasDir` substring from it.
	const
		unprefixed_path_alias = replacePrefix(normalizePath(path_alias), baseAliasDir),
		relative_path_alias = (
			unprefixed_path_alias === ""
			|| (baseAliasDir !== "" && unprefixed_path_alias?.startsWith("/"))
		)
			? "." + unprefixed_path_alias
			: unprefixed_path_alias
	// if removing the `baseAliasDir` prefix had failed, then no matching relative-alias has been found.
	// so instead, we try matching absolutely named aliases by setting `baseAliasDir` to `""` this time.
	if (relative_path_alias === undefined) {
		return resolvePathFromImportMapEntries(path_alias, import_map_entries, { baseAliasDir: "", basePathDir, errorCheck, sort })
	}

	// sort the entries in descending-length-order of the alias keys, if the user's `sort` config option is `true` (which is the default)
	if (sort) { import_map_entries = import_map_entries.toSorted(compareImportMapEntriesByLength) }

	// finding the longest matching `alias` in our descending-length-order sorted export map entries.
	for (const [alias, path] of import_map_entries) {
		const residual_subpath = replacePrefix(relative_path_alias, alias)
		if (residual_subpath !== undefined) {
			if (errorCheck && alias.endsWith("/") && !path.endsWith("/")) {
				throw new Error(`the value ("${path}") of the matched import-map key ("${alias}") for the path alias "${path_alias}" MUST end with a trailing slash ("/") to be specification compliant.`)
			}
			const base_path = (basePathDir === "" || isAbsolutePath(path))
				? path
				: joinPaths(ensureEndSlash(basePathDir), path)
			// if there was an exact match (i.e. `relative_path_alias === alias`), then return the corresponding `path`.
			if (residual_subpath === "") { return base_path }
			// if the alias is for a directory, then return the corresponding `path` + `residual_subpath`.
			if (alias.endsWith("/")) {
				return joinPaths(base_path, ensureStartDotSlash(residual_subpath))
			}
		}
	}
}
