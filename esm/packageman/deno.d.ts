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
 * const pkg_metadata = new DenoPackage(my_deno_json, "")
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
import { type ResolvePathFromImportMapEntriesConfig } from "../importmap/mod.js";
import type { ImportMapSortedEntries } from "../importmap/typedefs.js";
import { RuntimePackage } from "./base.js";
/** this is a subset of the "deno.json" file schema, copied from my other project.
 * [source link](https://jsr.io/@oazmi/build-tools/0.2.4/src/types/deno_json.ts).
*/
export interface DenoJsonSchema {
    /** the name of this jsr package. it must be scoped */
    name?: string;
    /** the version of this jsr package. */
    version?: string;
    exports?: Exports;
    /** the location of an additional import map to be used when resolving modules.
     * If an import map is specified as an `--importmap` flag or using "imports" and "scopes" properties, they will override this value.
     *
     * TODO: merging this import-map with the main `imports` import-map needs to be implemented.
     *   however, doing so will force us to make our function async, as we will need to fetch the import map file for it.
    */
    importMap?: string;
    /** a map of specifiers to their remapped specifiers. */
    imports?: {
        /** the key is the specifier or partial specifier to match, with a value that represents the target specifier. */
        [alias: string]: string;
    };
    /** enables or disables the use of a local `node_modules` folder for npm packages.
     * alternatively, use the `--node-modules-dir` flag or override the config via `--node-modules-dir=false`.
     *
     * TODO: when I'll be implementing npm-package resolution with the "npm:" specifiers later on,
     *   I think it will be absolutely necessary for us to have this option turned on.
     *   (or at least that's what we are going to have to do anyway (i.e. storing required node packages in the filesystem))
    */
    nodeModulesDir?: boolean;
    /** define a scope which remaps a specifier in only a specified scope.
     *
     * TODO: I've never used this, so I'm uncertain about how it works, and its relation to an import-map's "scope" field.
     *   I won't bother with this option until I find a personal use/need for it.
    */
    scopes?: {
        /** a definition of a scoped remapping. */
        [key: string]: {
            /** the key is the specifier or partial specifier to match within the referring scope, with a value that represents the target specifier. */
            [key: string]: string;
        };
    };
    /** the members of this workspace.
     *
     * TODO: I haven't used deno workspaces, so I won't bother implementing this feature for the plugin until much later.
    */
    workspace?: string[];
    [property: string]: any;
}
type Exports = string | {
    /** export aliases must follow the regex "^\.(/.*)?$" */
    [alias: string]: string;
};
export declare class DenoPackage extends RuntimePackage<DenoJsonSchema> {
    protected readonly importMapSortedEntries: ImportMapSortedEntries;
    protected readonly exportMapSortedEntries: ImportMapSortedEntries;
    getName(): string;
    getVersion(): string;
    getPath(): string;
    constructor(package_object: DenoJsonSchema, package_path: string);
    resolveExport(path_alias: string, config?: Partial<ResolvePathFromImportMapEntriesConfig>): string | undefined;
    resolveImport(path_alias: string, config?: Partial<ResolvePathFromImportMapEntriesConfig>): string | undefined;
    static fromUrl<SCHEMA extends DenoJsonSchema, INSTANCE = DenoPackage>(jsr_package: URL | string): Promise<INSTANCE>;
}
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
export declare const jsrPackageToMetadataUrl: (jsr_package: `jsr:${string}` | URL) => Promise<URL>;
export {};
//# sourceMappingURL=deno.d.ts.map