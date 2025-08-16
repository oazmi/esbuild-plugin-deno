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
 * eq(resEx("jsr:@scope/lib"),                         "https://jsr.io/@scope/lib/0.1.0/src/mod.ts")
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
import { defaultFetchConfig, defaultResolvePath, ensureEndSlash, fetchScanUrls, isCertainlyRelativePath, isString, json_stringify, memorize, object_entries, parseFilepathInfo, parsePackageUrl, promise_all, promise_outside, replacePrefix, resolveAsUrl, semverMaxSatisfying } from "../deps.js";
import { compareImportMapEntriesByLength } from "../importmap/mod.js";
import { WorkspacePackage } from "./base.js";
const existingDenoPackageConstructionStatus = new Map();
export class DenoPackage extends WorkspacePackage {
    importMapSortedEntries;
    exportMapSortedEntries;
    getName() { return this.packageInfo.name ?? "@no-name/package"; }
    getVersion() { return this.packageInfo.version ?? "0.0.0"; }
    getPath() {
        const package_path = this.packagePath;
        return package_path ? package_path : `${jsr_base_url}/${this.getName()}/${this.getVersion()}/deno.json`;
    }
    constructor(package_object, package_path) {
        super(package_object, package_path);
        const { exports = {}, imports = {} } = package_object, exports_object = isString(exports) ? (exports.endsWith("/")
            ? { "./": exports }
            : { ".": exports }) : exports, imports_object = { ...imports };
        // below, we clone all non-directory aliases (such as "jsr:@scope/lib"), into directory aliases as well (i.e. "jsr:@scope/lib/").
        // this is so that import statements with an alias + subpath (such as "jsr:@scope/lib/my-subpath")
        // can be resolved by the `resolveImport` method, instead of being declared unresolvable (`undefined`).
        // this is absolutely necessary for regular operation, although, strictly speaking, we are kind of malforming the original import map entries.
        for (const [alias, path] of object_entries(imports_object)) {
            const alias_dir_variant = ensureEndSlash(alias);
            // only assign the directory variant of the alias if such a key does not already exist in `imports_object`.
            // because otherwise, we would be overwriting the original package creator's own alias key (which would be intrusive).
            if (alias !== alias_dir_variant && !(alias_dir_variant in imports_object)) {
                imports_object[alias_dir_variant] = ensureEndSlash(path);
            }
        }
        this.exportMapSortedEntries = object_entries(exports_object).toSorted(compareImportMapEntriesByLength);
        this.importMapSortedEntries = object_entries(imports_object).toSorted(compareImportMapEntriesByLength);
    }
    resolveExport(path_alias, config) {
        const package_json_path = this.getPath();
        // if this workspace has already been visited, do not traverse it further.
        if (config?.workspaceExportsVisited?.has(package_json_path)) {
            return;
        }
        const name = this.getName(), version = this.getVersion(), { baseAliasDir: _baseAliasDir, basePathDir = parseFilepathInfo(package_json_path).dirpath, ...rest_config } = config ?? {}, baseAliasDirs = _baseAliasDir === undefined
            ? [`jsr:${name}@${version}`, `jsr:${name}`, `${name}`]
            : [_baseAliasDir];
        // when the original `config.baseAliasDir` option is not set by the user, we will try resolving the `path_alias` against three possible base alias paths:
        // - "@scope/lib/pathname"
        // - "jsr:@scope/lib/pathname"
        // - "jsr:@scope/lib@version/pathname"
        for (const baseAliasDir of baseAliasDirs) {
            const residual_path_alias = replacePrefix(path_alias, baseAliasDir)?.replace(/^\/+/, "/");
            if (residual_path_alias !== undefined) {
                path_alias = baseAliasDir + (residual_path_alias === "/" ? "" : residual_path_alias);
            }
            const resolved_path = super.resolveExport(path_alias, { baseAliasDir, basePathDir, ...rest_config });
            if (resolved_path) {
                return resolved_path;
            }
        }
    }
    resolveImport(path_alias, config) {
        const package_json_path = this.getPath();
        // if this workspace has already been visited, do not traverse it further.
        if (config?.workspaceImportsVisited?.has(package_json_path)) {
            return;
        }
        const basePathDir = parseFilepathInfo(package_json_path).dirpath, path_alias_is_relative = isCertainlyRelativePath(path_alias), self_reference_base_alias = path_alias_is_relative ? "" : undefined;
        // resolving the `path_alias` as a locally self-referenced package export.
        // here is the list of possible combinations of base alias paths that can be performed within this package to reference its own export endpoints:
        // - "@scope/lib/pathname"
        // - "jsr:@scope/lib/pathname"
        // - "jsr:@scope/lib@version/pathname"
        const locally_resolved_export = this.resolveExport(path_alias, { ...config, baseAliasDir: self_reference_base_alias });
        // if (locally_resolved_export !== undefined) { return locally_resolved_export }
        return locally_resolved_export ?? super.resolveImport(path_alias, { ...config, basePathDir });
        // TODO: currently, I won't bother with the nonsense that is below - especially since deno itself cannot resolve recursive import aliases.
        // if the `path_alias` is not a local export, then resolve it based on the package's import-map.
        // - do note that if the import-map specifies an entry where the alias's path directs to a relative path (for instance: `"@server": "./src/server.ts"`),
        //   then we would want the base-path to be the directory of the "deno.json" file (acquired via `this.getPath()`)
        // - however, if that is not the case (i.e. it directs to another aliased resource, for instance `"@server": "@my-workspace/server"`),
        //   then we will have to check that alias against the local child-workspaces, and parent-workspace imports.
        // const
        // 	resolved_import = super.resolveImport(path_alias, { ...config, basePathDir }),
        // 	is_certainly_relative_path = (resolved_import === undefined) || isCertainlyRelativePath(resolved_import),
        // 	is_certainly_absolute_path = (resolved_import === undefined) || isAbsolutePath(resolved_import)
        // if (is_certainly_relative_path || is_certainly_absolute_path) { return resolved_import }
        // const workspace_resolution_result = this.resolveWorkspaceImport(resolved_import, config)
        // TODO: suppose that the resolution did succeed, then you will be faced with the challenge of swapping out the current `this` runtime package with the one that correctly managed to resolve this import.
        // TODO: another issue is that `super.resolveWorkspaceImport` calls the children's `resolveImport`, which in turn may call `resolveWorkspaceImport` on the parent during this step.
        //   although the "visited" set will prevent infinite looping, there are still too many redundant operations being carried out, I feel.
        // return workspace_resolution_result?.[0] ?? resolved_import
    }
    resolveWorkspaceImport(path_alias, config) {
        // notice: we do not conflate/merge between `config.workspaceExportsVisited` and `config.workspaceImportsVisited`.
        // this is because otherwise it could be possible that a given workspace package may not be able to resolve the `path_alias` as an export,
        // but it may successfully resolve it as an import. however, if the `resolveWorkspaceExport` method had already traversed that package,
        // then it will not be revisited by `resolveWorkspaceImport`, which would eventually lead to a path alias resolution failure (`undefined`).
        return this.resolveWorkspaceExport(path_alias, config)
            ?? super.resolveWorkspaceImport(path_alias, config);
    }
    static async fromUrl(jsr_package) {
        const package_path_url = resolveAsUrl(jsr_package, defaultResolvePath()), package_path_str = package_path_url.href, url_is_jsr_protocol = package_path_str.startsWith("jsr:"), url_is_directory = package_path_str.endsWith("/");
        if (url_is_jsr_protocol) {
            // by only extracting the hostname (and stripping away any `pathname`),
            // we get to reduce the number of inputs that our function will memorize.
            // (since the outputs are invariant of the pathname).
            const { host } = parsePackageUrl(jsr_package);
            jsr_package = await memorized_jsrPackageToMetadataUrl(`jsr:${host}`);
        }
        else if (url_is_directory) {
            // if the user had provided a directory path, then we'll have to scan for the list of well-known package files in that directory.
            const package_json_urls = denoPackageJsonFilenames.map((json_filename) => new URL(json_filename, package_path_url)), 
            // we don't use the head method below, because "file://" urls do not support the head method.
            valid_url = await fetchScanUrls(package_json_urls);
            // when no "deno.json" or equivalent package manager json file is found in the provided directory, we'll have to throw an error.
            if (!valid_url) {
                throw new Error(`Scan Error! failed to find a "./deno.json(c)" or "./jsr.json(c)" package file in your supplied directory: "${package_path_url}".`);
            }
            jsr_package = valid_url;
        }
        const new_instance = await super.fromUrl(jsr_package), new_instance_path = new_instance.getPath(), existing_package_status = existingDenoPackageConstructionStatus.get(new_instance_path);
        // it is possible for the `new_instance` returned by `super.fromUrl` to be a pre-existing cached object.
        // in that case, we would not want re-add all child workspace packages.
        if (existing_package_status) {
            await existing_package_status;
            return new_instance;
        }
        // if this is indeed a newly instantiated object, then wait for the creation of all of its child workspaces,
        // and then declare each as a child to `new_instance` via the `addWorkspaceChild` method.
        const [promise, resolve, reject] = promise_outside();
        existingDenoPackageConstructionStatus.set(new_instance_path, promise);
        await promise_all((new_instance.packageInfo.workspace ?? []).map(async (path) => {
            // turn the child workspace path to an absolute path, and also ensure that trailing directory slash is appended.
            const child_path = ensureEndSlash(defaultResolvePath(path, new_instance_path));
            await new_instance.addWorkspaceChild(child_path);
        }));
        resolve();
        return new_instance;
    }
}
const jsr_base_url = "https://jsr.io";
export const denoPackageJsonFilenames = [
    "./deno.json",
    "./deno.jsonc",
    "./jsr.json",
    "./jsr.jsonc",
    // TODO: the use of "package.json" is not supported for now, since it will complicate the parsing of the import/export-maps (due to having a different structure).
    //   in the future, I might write a `npmPackageToDenoJson` function to transform the imports (dependencies) and exports.
    // "./package.json",
    // "./package.jsonc", // as if such a thing will ever exist, lol
];
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
 * // TODO: my semver resolution library `@oazmi/kitchensink/semver` cannot distinguish between pre-releases and regular releases,
 * //   so the test below will fail as a result, since my library selects version "0.8.5-a" instead of "0.8.5".
 * // eq((await fn("jsr:@oazmi/kitchensink@<0.8.6")).href,         "https://jsr.io/@oazmi/kitchensink/0.8.5/deno.json")
 * eq((await fn("jsr:@oazmi/kitchensink@0.8.2 - 0.8.4")).href,  "https://jsr.io/@oazmi/kitchensink/0.8.4/deno.json")
 *
 * // the jsonc (json with comments) format for "deno.json" and "jsr.json" is also supported.
 * eq((await fn("jsr:@preact-icons/ai@ <= 1.0.13 1.x")).href,   "https://jsr.io/@preact-icons/ai/1.0.13/deno.jsonc")
 * ```
*/
export const jsrPackageToMetadataUrl = async (jsr_package) => {
    const { protocol, scope, pkg, pathname, version: desired_semver } = parsePackageUrl(jsr_package);
    if (protocol !== "jsr:") {
        throw new Error(`expected path protocol to be "jsr:", found "${protocol}" instead, for package: "${jsr_package}"`);
    }
    if (!scope) {
        throw new Error(`expected jsr package to contain a scope, but found "${scope}" instead, for package: "${jsr_package}"`);
    }
    const meta_json_url = new URL(`@${scope}/${pkg}/meta.json`, jsr_base_url), meta_json = await (await fetch(meta_json_url, defaultFetchConfig)).json(), unyanked_versions = object_entries(meta_json.versions)
        .filter(([version_str, { yanked }]) => (!yanked))
        .map(([version_str]) => version_str);
    // semantic version resolution
    const resolved_semver = semverMaxSatisfying(unyanked_versions, desired_semver ?? meta_json.latest);
    if (!resolved_semver) {
        throw new Error(`failed to find the desired version "${desired_semver}" of the jsr package "${jsr_package}", with available versions "${json_stringify(meta_json.versions)}"`);
    }
    const base_host = new URL(`@${scope}/${pkg}/${resolved_semver}/`, jsr_base_url), deno_json_urls = denoPackageJsonFilenames.map((json_filename) => new URL(json_filename, base_host));
    // trying to fetch various possible "deno.json(c)" files and their alternatives, sequentially, and returning the url of the first successful response.
    const valid_url = await fetchScanUrls(deno_json_urls, { method: "HEAD" });
    if (valid_url) {
        return new URL(valid_url);
    }
    throw new Error(`Network Error: couldn't locate "${jsr_package}"'s package json file. searched in the following locations:\n${json_stringify(deno_json_urls)}`);
};
const memorized_jsrPackageToMetadataUrl = memorize(jsrPackageToMetadataUrl);
