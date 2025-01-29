/** a utility submodule for generating import maps of deno and [jsr](https://jsr.io) packages.
 * 
 * @module
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * const my_deno_json: DenoJsonSchema = {
 * 	name: "@scope/lib",
 * 	version: "0.1.0",
 * 	exports: {
 * 		".":             "./src/mod.ts",
 * 		"./hello":       "./src/nyaa.ts",
 * 		"./world":       "./src/ligma.ts",
 * 		"./utils/cli/":  "./src/cli/",
 * 	},
 * 	imports: {
 * 		"my-lib":        "jsr:@scope/my-lib",
 * 		"my-lib-types":  "jsr:@scope/my-lib/typedefs",
 * 		"npm-pkg":       "npm:boomer-package",
 * 		"npm-pkg-utils": "npm:boomer-package/utilities",
 * 	}
 * }
 * 
 * const my_deno_metadata = new DenoPackageMetadata(my_deno_json)
 * 
 * // acquiring the import map that it internally recognized by the library itself
 * assertEquals(my_deno_metadata.getInternalMap(), {
 * 	"@scope/lib":                      "./src/mod.ts",
 * 	"@scope/lib/hello":                "./src/nyaa.ts",
 * 	"@scope/lib/world":                "./src/ligma.ts",
 * 	"@scope/lib/utils/cli/":           "./src/cli/",
 * 	"jsr:@scope/lib":                  "./src/mod.ts",
 * 	"jsr:@scope/lib/hello":            "./src/nyaa.ts",
 * 	"jsr:@scope/lib/world":            "./src/ligma.ts",
 * 	"jsr:@scope/lib/utils/cli/":       "./src/cli/",
 * 	"jsr:@scope/lib@0.1.0":            "./src/mod.ts",
 * 	"jsr:@scope/lib@0.1.0/hello":      "./src/nyaa.ts",
 * 	"jsr:@scope/lib@0.1.0/world":      "./src/ligma.ts",
 * 	"jsr:@scope/lib@0.1.0/utils/cli/": "./src/cli/",
 * 	"my-lib":                          "jsr:@scope/my-lib",
 * 	"my-lib-types":                    "jsr:@scope/my-lib/typedefs",
 * 	"npm-pkg":                         "npm:boomer-package",
 * 	"npm-pkg-utils":                   "npm:boomer-package/utilities",
 * })
 * 
 * // acquiring the versioned export map
 * assertEquals(my_deno_metadata.getExportMap(), {
 * 	"jsr:@scope/lib@0.1.0":            "./src/mod.ts",
 * 	"jsr:@scope/lib@0.1.0/hello":      "./src/nyaa.ts",
 * 	"jsr:@scope/lib@0.1.0/world":      "./src/ligma.ts",
 * 	"jsr:@scope/lib@0.1.0/utils/cli/": "./src/cli/",
 * })
 * 
 * // acquiring the versioned export map, with a different base-path (http)
 * assertEquals(my_deno_metadata.getExportMap("https://jsr.io/@oazmi/kitchensink/0.9.3/"), {
 * 	"jsr:@scope/lib@0.1.0":            "https://jsr.io/@oazmi/kitchensink/0.9.3/src/mod.ts",
 * 	"jsr:@scope/lib@0.1.0/hello":      "https://jsr.io/@oazmi/kitchensink/0.9.3/src/nyaa.ts",
 * 	"jsr:@scope/lib@0.1.0/world":      "https://jsr.io/@oazmi/kitchensink/0.9.3/src/ligma.ts",
 * 	"jsr:@scope/lib@0.1.0/utils/cli/": "https://jsr.io/@oazmi/kitchensink/0.9.3/src/cli/",
 * })
 * 
 * // acquiring the import-map (aliased external dependencies) of the library
 * assertEquals(my_deno_metadata.getImportMap(), {
 * 	"my-lib":        "jsr:@scope/my-lib",
 * 	"my-lib-types":  "jsr:@scope/my-lib/typedefs",
 * 	"npm-pkg":       "npm:boomer-package",
 * 	"npm-pkg-utils": "npm:boomer-package/utilities",
 * })
 * ```
*/

import { memorize } from "@oazmi/kitchensink/lambda"
import { ensureEndSlash, isString, joinPaths, json_stringify, object_assign, object_entries, object_fromEntries, parsePackageUrl, resolveAsUrl, semverMaxSatisfying, semverParse, semverParseRange, semverToString } from "../deps.ts"
import { RuntimePackageMetadata, type ImportMap } from "./typedefs.ts"


/** this is a subset of the "deno.json" file schema, copied from my other project.
 * [source link](https://jsr.io/@oazmi/build-tools/0.2.4/src/types/deno_json.ts).
*/
export interface DenoJsonSchema {
	/** the name of this jsr package. it must be scoped */
	name?: string

	/** the version of this jsr package. */
	version?: string

	exports?: Exports

	/** the location of an additional import map to be used when resolving modules.
	 * If an import map is specified as an `--importmap` flag or using "imports" and "scopes" properties, they will override this value.
	 * 
	 * TODO: merging this import-map with the main `imports` import-map needs to be implemented.
	 *   however, doing so will force us to make our function async, as we will need to fetch the import map file for it.
	*/
	importMap?: string

	/** a map of specifiers to their remapped specifiers. */
	imports?: {
		/** the key is the specifier or partial specifier to match, with a value that represents the target specifier. */
		[alias: string]: string
	}

	/** enables or disables the use of a local `node_modules` folder for npm packages.
	 * alternatively, use the `--node-modules-dir` flag or override the config via `--node-modules-dir=false`.
	 * 
	 * TODO: when I'll be implementing npm-package resolution with the "npm:" specifiers later on,
	 *   I think it will be absolutely necessary for us to have this option turned on.
	 *   (or at least that's what we are going to have to do anyway (i.e. storing required node packages in the filesystem))
	*/
	nodeModulesDir?: boolean

	/** define a scope which remaps a specifier in only a specified scope.
	 * 
	 * TODO: I've never used this, so I'm uncertain about how it works, and its relation to an import-map's "scope" field.
	 *   I won't bother with this option until I find a personal use/need for it.
	*/
	scopes?: {
		/** a definition of a scoped remapping. */
		[key: string]: {
			/** the key is the specifier or partial specifier to match within the referring scope, with a value that represents the target specifier. */
			[key: string]: string
		}
	}

	/** the members of this workspace.
	 * 
	 * TODO: I haven't used deno workspaces, so I won't bother implementing this feature for the plugin until much later.
	*/
	workspace?: string[]

	[property: string]: any
}

type Exports = string | {
	/** export aliases must follow the regex "^\.(/.*)?$" */
	[alias: string]: string
}

/** an interface for customizing the {@link DenoPackageMetadata.getCustomExportMap} method,
 * in order to attach optional prefix base paths to the aliases and paths of the package's export-map.
*/
export interface GetCustomExportMapConfig {
	/** the base directory, to which the export-aliases are relative to.
	 * 
	 * for instance:
	 * - if the export map is: `{ "./aliased/path": "./src/mod.ts" }`,
	 * - and the `baseAliasDir` option is set to "jsr:@scope/lib@version/"
	 *   (a trailing slash will always be added, unless the alias is exactly `"."`).
	 * - then, the returned export-map by {@link DenoPackageMetadata.getCustomExportMap} will become:
	 * ```ts ignore
	 * { "jsr:@scope/lib@version/aliased/path": "./src/mod.ts" }
	 * ```
	 * 
	 * @defaultValue `"./"` (which, as a result, does not transform the export paths at all)
	*/
	baseAliasDir: string

	/** the base directory, to which the export-paths are relative to.
	 * 
	 * for instance:
	 * - if the export map is: `{ "./aliased/path": "./src/mod.ts" }`,
	 * - and the `basePathDir` option is set to "https://jsr.io/@oazmi/kitchensink/0.9.3/"
	 *   (a trailing slash will always be added).
	 * - then, the returned export-map by {@link DenoPackageMetadata.getCustomExportMap} will become:
	 * ```ts ignore
	 * { "./aliased/path": "https://jsr.io/@oazmi/kitchensink/0.9.3/src/mod.ts" }
	 * ```
	 * 
	 * @defaultValue `"./"` (which, as a result, does not transform the export paths at all)
	*/
	basePathDir: string

	/** ensure that the package's actual export-map aliases and paths are **all** relatively defined.
	 * 
	 * @defaultValue `true`
	*/
	errorCheck: boolean
}

const defaultGetCustomExportMapConfig: GetCustomExportMapConfig = {
	baseAliasDir: "./",
	basePathDir: "./",
	errorCheck: true,
}

export class DenoPackageMetadata extends RuntimePackageMetadata<DenoJsonSchema> {
	override getName(): string { return this.packageInfo.name! }

	override getVersion(): string { return this.packageInfo.version! }

	getCustomExportMap(config?: Partial<GetCustomExportMapConfig>) {
		const
			{ baseAliasDir, basePathDir, errorCheck } = { ...defaultGetCustomExportMapConfig, ...config },
			base_path_dir = ensureEndSlash(basePathDir),
			base_alias_dir = ensureEndSlash(baseAliasDir),
			base_alias_dir_no_trailing_slash = base_alias_dir.slice(0, -1),
			exports = this.packageInfo.exports ?? {},
			exports_object = isString(exports) ? (exports.endsWith("/")
				? { "./": exports }
				: { ".": exports }
			) : exports,
			exports_object_entries = object_entries(exports_object)

		if (errorCheck) {
			// asserting that all alias keys and paths are defined relatively,
			// and that all directory aliases point towards a directory.
			exports_object_entries.forEach(([alias, path]) => {
				const
					alias_is_relative = alias.startsWith("./") || alias === ".",
					path_is_relative = path.startsWith("./"),
					alias_is_dir = alias.endsWith("/"),
					path_is_dir = path.endsWith("/")
				if (!(alias_is_relative && path_is_relative)) {
					throw new Error(`your export map should only contain relative alias-keys and path-values. current non-relative alias-path pair is:\n"${alias}": "${path}"`)
				}
				if (alias_is_dir !== path_is_dir) {
					throw new Error(`in your export map, both alias-keys and path-values must mutually point towards a directory or a file. current mismatched alias-path pair is:\n"${alias}": "${path}"`)
				}
			})
		}

		const export_map: ImportMap = object_fromEntries(exports_object_entries.map(([relative_alias, relative_path]) => {
			const
				is_main_export = relative_alias === ".",
				alias = is_main_export
					? base_alias_dir_no_trailing_slash
					: joinPaths(base_alias_dir, relative_alias),
				path = joinPaths(base_path_dir, relative_path)
			return [alias, path]
		}))

		return export_map
	}

	// TODO: make this method memorizable via decorators. but I'll have to look into it.
	override getExportMap(basePathDir = "./"): ImportMap {
		const
			name = this.getName(),
			version = this.getVersion(),
			baseAliasDir = `jsr:${name}@${version}`,
			export_map: ImportMap = this.getCustomExportMap({ baseAliasDir, basePathDir, errorCheck: true })
		// the keys of `export_map` now takes the following form:
		// - "jsr:@scope/lib@version/pathname"
		return export_map
	}

	override getImportMap(): ImportMap {
		const { imports = {}, importMap: additionalImportMapPath } = this.packageInfo
		// TODO: in the future, also fetch `additionalImportMapPath`. however, this method will then have to become asynchronous as a result.
		return { ...imports } // we return a clone, since we don't want people mutating the original import-map.
	}

	override getInternalMap(basePathDir = "./"): ImportMap {
		// incorrect input export-map format error checking needs to be done only once
		let errorCheck = true
		const
			name = this.getName(),
			version = this.getVersion(),
			local_package_name = name ? name : undefined,
			jsr_package_name = name ? `jsr:${name}` : undefined,
			jsr_package_versioned_name = (name && version) ? `jsr:${name}@${version}` : undefined,
			baseAliasDirs = [local_package_name, jsr_package_name, jsr_package_versioned_name],
			export_map: ImportMap = {}
		// assigning the following alias base-paths (if their string is not `undefined`):
		// - "@scope/lib/pathname"
		// - "jsr:@scope/lib/pathname"
		// - "jsr:@scope/lib@version/pathname"
		baseAliasDirs.forEach((baseAliasDir) => {
			if (baseAliasDir) {
				object_assign(export_map, this.getCustomExportMap({ baseAliasDir, basePathDir, errorCheck }))
				errorCheck = false
			}
		})

		return {
			...export_map,
			...this.getImportMap(),
		}
	}

	static override async fromUrl<
		SCHEMA extends DenoJsonSchema,
		INSTANCE = DenoPackageMetadata,
	>(jsr_package: URL | string): Promise<INSTANCE> {
		// TODO: ideally, we should also memorize the resulting instance of `DenoPackageMetadata` that gets created via this static method,
		//   so that subsequent calls with the same `jsr_package` will return an existing instance.
		//   it'll be nice if we could use a memorization decorator for such a thing, but I don't have any experience with writing them, so I'll look into it in the future.
		const
			package_jsonc_path_str = isString(jsr_package) ? jsr_package : jsr_package.href,
			url_is_jsr_protocol = package_jsonc_path_str.startsWith("jsr:")
		if (url_is_jsr_protocol) {
			// by only extracting the hostname (and stripping away any `pathname`),
			// we get to reduce the number of inputs that our function will memorize.
			// (since the outputs are invariant of the pathname).
			const { host } = parsePackageUrl(jsr_package)
			jsr_package = await memorized_jsrPackageToMetadataUrl(`jsr:${host}`)
		}
		return super.fromUrl<SCHEMA, INSTANCE>(jsr_package)
	}
}

interface JsrPackageMeta {
	scope: string
	name: string
	latest: string
	versions: Record<string, { yanked?: boolean }>
}

const jsr_base_url = "https://jsr.io"

/** given a jsr schema uri (such as `jsr:@std/assert/assert-equals`), this function resolves the http url of the package's metadata file (i.e. `deno.json(c)`).
 * 
 * @example
 * ```ts
 * import { assertEquals, assertMatch } from "jsr:@std/assert"
 * 
 * // aliasing our functions for brevity
 * const
 * 	fn = jsrPackageToMetadataUrl,
 * 	eq = assertEquals,
 * 	re = assertMatch
 * 
 * eq((await fn("jsr:@oazmi/kitchensink@0.9.1")).href,          "https://jsr.io/@oazmi/kitchensink/0.9.1/deno.json")
 * eq((await fn("jsr:@oazmi/kitchensink@0.9.1/typedefs")).href, "https://jsr.io/@oazmi/kitchensink/0.9.1/deno.json")
 * re((await fn("jsr:@oazmi/kitchensink")).href,                /^https:\/\/jsr.io\/@oazmi\/kitchensink\/.*?\/deno.json$/)
 * re((await fn("jsr:@oazmi/kitchensink/typedefs")).href,       /^https:\/\/jsr.io\/@oazmi\/kitchensink\/.*?\/deno.json$/)
 * 
 * // currently, in version `0.8`, we have the following release versions available:
 * // `["0.8.6", "0.8.5", "0.8.5-a", "0.8.4", "0.8.3", "0.8.3-d", "0.8.3-b", "0.8.3-a", "0.8.2", "0.8.1", "0.8.0"]`
 * // so, a query for version "^0.8.0" should return "0.8.6", and "<0.8.6" would return "0.8.5", etc...
 * eq((await fn("jsr:@oazmi/kitchensink@^0.8.0")).href,         "https://jsr.io/@oazmi/kitchensink/0.8.6/deno.json")
 * eq((await fn("jsr:@oazmi/kitchensink@<0.8.6")).href,         "https://jsr.io/@oazmi/kitchensink/0.8.5/deno.json")
 * 
 * // TODO: add support for a range query. currently, my package parser function `parsePackageUrl` from kitchensink fails to handle white spaces in version string.
 * // eq((await fn("jsr:@oazmi/kitchensink@0.8.2 - 0.8.4")).href,  "https://jsr.io/@oazmi/kitchensink/0.8.4/deno.json")
 * ```
*/
export const jsrPackageToMetadataUrl = async (jsr_package: `jsr:${string}` | URL): Promise<URL> => {
	const { protocol, scope, pkg, pathname, version: desired_semver } = parsePackageUrl(jsr_package)
	if (protocol !== "jsr:") { throw new Error(`expected path protocol to be "jsr:", found "${protocol}" instead, for package: "${jsr_package}"`) }
	if (!scope) { throw new Error(`expected jsr package to contain a scope, but found "${scope}" instead, for package: "${jsr_package}"`) }

	const
		meta_json_url = resolveAsUrl(`@${scope}/${pkg}/meta.json`, jsr_base_url),
		meta_json = await (await fetch(meta_json_url)).json() as JsrPackageMeta,
		unyanked_versions = object_entries(meta_json.versions)
			.filter(([version_str, { yanked }]) => (!yanked))
			.map(([version_str]) => semverParse(version_str))

	// semantic version resolution
	const resolved_semver = semverMaxSatisfying(unyanked_versions, semverParseRange(desired_semver ?? meta_json.latest))
	if (!resolved_semver) { throw new Error(`failed to find the desired version "${desired_semver}" of the jsr package "${jsr_package}", with available versions "${json_stringify(meta_json.versions)}"`) }

	const
		resolved_version = semverToString(resolved_semver),
		base_host = resolveAsUrl(`@${scope}/${pkg}/${resolved_version}/`, jsr_base_url),
		deno_json_url = resolveAsUrl("./deno.json", base_host),
		jsr_json_url = resolveAsUrl("./jsr.json", base_host),
		package_json_url = resolveAsUrl("./package.json", base_host)
	// TODO: the `package_json_url` (i.e. `package.json`) is unused for now, since it will complicate the parsing of the import/export-maps (due to having a different structure).
	//   in the future, I might write a `npmPackageToDenoJson` function to transform the imports (dependencies) and exports

	// trying to fetch the package's `deno.json` file (via HEAD method), and if it fails (does not exist), then we fetch the `jsr.json` file instead.
	const urls = [deno_json_url, jsr_json_url]
	for (const url of urls) {
		if ((await fetch(url, { method: "HEAD" })).ok) { return url }
	}

	throw new Error(`Network Error: couldn't locate "${jsr_package}"'s package json file. searched in the following locations:\n${json_stringify(urls)}`)
}

const memorized_jsrPackageToMetadataUrl = memorize(jsrPackageToMetadataUrl)
