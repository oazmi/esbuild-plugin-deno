/** a utility submodule for resolving the import/export-map aliases of deno and [jsr](https://jsr.io) packages.
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
 * 		".":            "./src/mod.ts",
 * 		"./hello":      "./src/nyaa.ts",
 * 		"./world":      "./src/ligma.ts",
 * 		"./utils/cli/": "./src/cli/",
 * 	},
 * 	imports: {
 * 		"my-lib":        "jsr:@scope/my-lib",
 * 		"my-lib-types":  "jsr:@scope/my-lib/typedefs",
 * 		"jsr-pkg":       "jsr:@scope/jsr-pkg",
 * 		"jsr-pkg/":      "jsr:@scope/jsr-pkg/dir/",
 * 		"npm-pkg":       "npm:boomer-package",
 * 		"npm-pkg-utils": "npm:boomer-package/utilities",
 * 	}
 * }
 * 
 * const pkg_metadata = new DenoPackage(my_deno_json)
 * 
 * // aliasing our functions, methods, and configurations for brevity
 * const
 * 	eq = assertEquals,
 * 	resIm = pkg_metadata.resolveImport.bind(pkg_metadata),
 * 	resEx = pkg_metadata.resolveExport.bind(pkg_metadata),
 * 	config_1 = { basePathDir: "" },
 * 	config_2 = { baseAliasDir: "jsr:@scope/lib" },
 * 	config_3 = { baseAliasDir: "", basePathDir: "" }
 * 
 * 
 * // testing out the import alias-path resolution of the package own export-map (i.e. self-referenced imports).
 * eq(resIm("@scope/lib"),      "https://jsr.io/@scope/lib/0.1.0/src/mod.ts")
 * eq(resIm("@scope/lib/"),     "https://jsr.io/@scope/lib/0.1.0/src/mod.ts")
 * eq(resIm("@scope/lib",                          config_1), "./src/mod.ts")
 * eq(resIm("@scope/lib",             { basePathDir: "./" }), "./src/mod.ts")
 * // the result below is `undefined` because, internally, `resolveImport` will only concern itself with
 * // self-references that deno itself recognizes, and not just any arbitrary `baseAliasDir`.
 * // even though this path alias would get resolved by the `resolveExport` method (which you will see later).
 * eq(resIm("SELF",                { baseAliasDir: "SELF" }), undefined)
 * eq(resIm("@scope/lib/hello",                    config_1), "./src/nyaa.ts")
 * eq(resIm("@scope/lib/world",                    config_1), "./src/ligma.ts")
 * eq(resIm("@scope/lib/utils/cli/",               config_1), "./src/cli/")
 * eq(resIm("@scope/lib/utils/cli/script.ts",      config_1), "./src/cli/script.ts")
 * eq(resIm("@scope/lib/utils/cli/../../hello",    config_1), "./src/nyaa.ts")
 * eq(resIm("@scope/lib/utils/cli/../../hello.js", config_1), undefined)
 * eq(resIm("jsr:@scope/lib",                      config_1), "./src/mod.ts")
 * eq(resIm("jsr:@scope/lib@0.1.0",                config_1), "./src/mod.ts")
 * eq(resIm(".",                                   config_1), "./src/mod.ts")
 * eq(resIm("./hello",                             config_1), "./src/nyaa.ts")
 * 
 * // testing out the import alias-path resolution of the package's externally referenced import-map entries.
 * eq(resIm("my-lib"),            "jsr:@scope/my-lib")
 * eq(resIm("my-lib/"),           "jsr:@scope/my-lib/")
 * eq(resIm("my-lib-types"),      "jsr:@scope/my-lib/typedefs")
 * eq(resIm("my-lib/funcdefs"),   "jsr:@scope/my-lib/funcdefs")
 * eq(resIm("jsr-pkg"),           "jsr:@scope/jsr-pkg")
 * eq(resIm("jsr-pkg/"),          "jsr:@scope/jsr-pkg/dir/")
 * eq(resIm("jsr-pkg/file"),      "jsr:@scope/jsr-pkg/dir/file")
 * eq(resIm("npm-pkg"),           "npm:boomer-package")
 * eq(resIm("npm-pkg-utils"),     "npm:boomer-package/utilities")
 * eq(resIm("npm-pkg/utils/cli"), "npm:boomer-package/utils/cli")
 * 
 * // testing out the alias-path resolution of the package's exported entries.
 * eq(resEx("jsr:@scope/lib"),                         undefined) // by default, you must provide the version number as well
 * eq(resEx("jsr:@scope/lib",               config_2), "https://jsr.io/@scope/lib/0.1.0/src/mod.ts")
 * eq(resEx("jsr:@scope/lib/",              config_2), "https://jsr.io/@scope/lib/0.1.0/src/mod.ts")
 * eq(resEx("jsr:@scope/lib@0.1.0",         config_1), "./src/mod.ts")
 * eq(resEx(".",                            config_3), "./src/mod.ts")
 * eq(resEx(".",                { baseAliasDir: "" }), "https://jsr.io/@scope/lib/0.1.0/src/mod.ts")
 * eq(resEx("SELF",         { baseAliasDir: "SELF" }), "https://jsr.io/@scope/lib/0.1.0/src/mod.ts")
 * eq(resEx("jsr:@scope/lib@0.1.0"),                   "https://jsr.io/@scope/lib/0.1.0/src/mod.ts")
 * eq(resEx("jsr:@scope/lib@0.1.0/"),                  "https://jsr.io/@scope/lib/0.1.0/src/mod.ts")
 * eq(resEx("jsr:@scope/lib@0.1.0/hello"),             "https://jsr.io/@scope/lib/0.1.0/src/nyaa.ts")
 * eq(resEx("jsr:@scope/lib@0.1.0/world"),             "https://jsr.io/@scope/lib/0.1.0/src/ligma.ts")
 * eq(resEx("jsr:@scope/lib@0.1.0/utils/cli/"),        "https://jsr.io/@scope/lib/0.1.0/src/cli/")
 * eq(resEx("jsr:@scope/lib@0.1.0/utils/cli/file.js"), "https://jsr.io/@scope/lib/0.1.0/src/cli/file.js")
 * ```
*/

import { memorize } from "@oazmi/kitchensink/lambda"
import { defaultFetchConfig, ensureEndSlash, isString, json_stringify, object_entries, parsePackageUrl, replacePrefix, resolveAsUrl, semverMaxSatisfying, semverParse, semverParseRange, semverToString } from "../deps.js"
import { compareImportMapEntriesByLength, type ResolvePathFromImportMapEntriesConfig } from "../importmap/mod.js"
import type { ImportMapSortedEntries } from "../importmap/typedefs.js"
import { RuntimePackage } from "./base.js"


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

export class DenoPackage extends RuntimePackage<DenoJsonSchema> {
	protected override readonly importMapSortedEntries: ImportMapSortedEntries
	protected override readonly exportMapSortedEntries: ImportMapSortedEntries

	override getName(): string { return this.packageInfo.name! }

	override getVersion(): string { return this.packageInfo.version! }

	constructor(package_object: DenoJsonSchema) {
		super(package_object)
		const
			{ exports = {}, imports = {} } = package_object,
			exports_object = isString(exports) ? (exports.endsWith("/")
				? { "./": exports }
				: { ".": exports }
			) : exports,
			imports_object = { ...imports }

		// below, we clone all non-directory aliases (such as "jsr:@scope/lib"), into directory aliases as well (i.e. "jsr:@scope/lib/").
		// this is so that import statements with an alias + subpath (such as "jsr:@scope/lib/my-subpath")
		// can be resolved by the `resolveImport` method, instead of being declared unresolvable (`undefined`).
		// this is absolutely necessary for regular operation, although, strictly speaking, we are kind of malforming the original import map entries.
		for (const [alias, path] of object_entries(imports_object)) {
			const alias_dir_variant = ensureEndSlash(alias)
			// only assign the directory variant of the alias if such a key does not already exist in `imports_object`.
			// because otherwise, we would be overwriting the original package creator's own alias key (which would be intrusive).
			if (alias !== alias_dir_variant && !(alias_dir_variant in imports_object)) {
				imports_object[alias_dir_variant] = ensureEndSlash(path)
			}
		}

		this.exportMapSortedEntries = object_entries(exports_object).toSorted(compareImportMapEntriesByLength)
		this.importMapSortedEntries = object_entries(imports_object).toSorted(compareImportMapEntriesByLength)
	}

	override resolveExport(path_alias: string, config?: Partial<ResolvePathFromImportMapEntriesConfig>): string | undefined {
		const
			name = this.getName(),
			version = this.getVersion(),
			{
				baseAliasDir = `jsr:${name}@${version}`,
				basePathDir = `${jsr_base_url}/${name}/${version}`,
				...rest_config
			} = config ?? {},
			residual_path_alias = replacePrefix(path_alias, baseAliasDir)?.replace(/^\/+/, "/")
		if (residual_path_alias !== undefined) {
			path_alias = baseAliasDir + (residual_path_alias === "/" ? "" : residual_path_alias)
		}
		return super.resolveExport(path_alias, { baseAliasDir, basePathDir, ...rest_config })
	}

	override resolveImport(path_alias: string, config?: Partial<ResolvePathFromImportMapEntriesConfig>): string | undefined {
		const
			name = this.getName(),
			version = this.getVersion(),
			path_alias_is_relative = path_alias.startsWith("./") || path_alias.startsWith("../"),
			local_package_reference_aliases = path_alias_is_relative
				? [""]
				: [`jsr:${name}@${version}`, `jsr:${name}`, `${name}`]

		// resolving the `path_alias` as a locally self-referenced package export.
		// here is the list of possible combinations of base alias paths that can be performed within this package to reference its own export endpoints:
		// - "@scope/lib/pathname"
		// - "jsr:@scope/lib/pathname"
		// - "jsr:@scope/lib@version/pathname"
		let locally_resolved_export: string | undefined = undefined
		for (const base_alias_dir of local_package_reference_aliases) {
			locally_resolved_export = this.resolveExport(path_alias, { ...config, baseAliasDir: base_alias_dir })
			if (locally_resolved_export) { break }
		}

		// if the `path_alias` is not a local export, then resolve it based on the package's import-map
		return locally_resolved_export ?? super.resolveImport(path_alias, config)
	}

	static override async fromUrl<
		SCHEMA extends DenoJsonSchema,
		INSTANCE = DenoPackage,
	>(jsr_package: URL | string): Promise<INSTANCE> {
		// TODO: ideally, we should also memorize the resulting instance of `DenoPackage` that gets created via this static method,
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
 * eq((await fn("jsr:@oazmi/kitchensink@0.8.2 - 0.8.4")).href,  "https://jsr.io/@oazmi/kitchensink/0.8.4/deno.json")
 * ```
*/
export const jsrPackageToMetadataUrl = async (jsr_package: `jsr:${string}` | URL): Promise<URL> => {
	const { protocol, scope, pkg, pathname, version: desired_semver } = parsePackageUrl(jsr_package)
	if (protocol !== "jsr:") { throw new Error(`expected path protocol to be "jsr:", found "${protocol}" instead, for package: "${jsr_package}"`) }
	if (!scope) { throw new Error(`expected jsr package to contain a scope, but found "${scope}" instead, for package: "${jsr_package}"`) }

	const
		meta_json_url = resolveAsUrl(`@${scope}/${pkg}/meta.json`, jsr_base_url),
		meta_json = await (await fetch(meta_json_url, defaultFetchConfig)).json() as JsrPackageMeta,
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
		if ((await fetch(url, { ...defaultFetchConfig, method: "HEAD" })).ok) { return url }
	}

	throw new Error(`Network Error: couldn't locate "${jsr_package}"'s package json file. searched in the following locations:\n${json_stringify(urls)}`)
}

const memorized_jsrPackageToMetadataUrl = memorize(jsrPackageToMetadataUrl)
