/** this submodule exports the base abstract class {@link RuntimePackage},
 * that is supposed to be utilized for parsing package metadata, and resolving various import path aliases.
 *
 * @module
*/
import { defaultFetchConfig, defaultResolvePath, jsoncParse, resolveAsUrl } from "../deps.js";
import { resolvePathFromImportMapEntries } from "../importmap/mod.js";
/** an abstraction for import-map utilities of a general javascript runtime's package object with the schema `SCHEMA`.
 * - in the case of node, `SCHEMA` would represent `package.json`'s schema.
 * - in the case of deno, `SCHEMA` would represent `deno.json`, `deno.jsonc`, or `jsr.json`'s schema.
 *
 * @template SCHEMA a record type representing the package schema.
*/
export class RuntimePackage {
    /** the path or url of the package json(c) file.
     *
     * the {@link RuntimePackage | base class} does nothing with this information;
     * it is just there so that subclasses can make uses of this information (usually for resolving relative paths).
    */
    packagePath;
    /** the fetched/parsed package metadata file's raw contents. */
    packageInfo;
    /** @param package_object the parsed package metadata as an object.
     *   - in the case of node, this would be your json-parsed "package.json" file.
     *   - in the case of deno, this would be your json-parsed "deno.json" file.
    */
    constructor(package_object, package_path) {
        this.packageInfo = package_object;
        this.packagePath = package_path;
    }
    /** get the path/url to the package's json(c) file.
     *
     * the {@link RuntimePackage | base class} does nothing with this information;
     * it is just there so that subclasses can make uses of this information (usually for resolving relative paths).
    */
    getPath() { return this.packagePath; }
    /** this method tries to resolve the provided export `path_alias` of this package,
     * to an absolutely referenced path to the resource (using the internal {@link exportMapSortedEntries}).
     * if no exported resources match the given `path_alias`, then `undefined` will be returned.
     *
     * > [!tip]
     * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
    */
    resolveExport(path_alias, config) {
        return resolvePathFromImportMapEntries(path_alias, this.exportMapSortedEntries, { sort: false, ...config });
    }
    /** this method tries to resolve the provided import `path_alias` done by some resource within this package,
     * using the internal {@link importMapSortedEntries} list of import-aliases that this package uses.
     * if no import resources match the given `path_alias`, then `undefined` will be returned
     * (which would probably mean that the given `path_alias` is already either an absolute or relative path, or perhaps incorrect altogether.
     *
     * > [!tip]
     * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
    */
    resolveImport(path_alias, config) {
        return resolvePathFromImportMapEntries(path_alias, this.importMapSortedEntries, { sort: false, ...config });
    }
    /** create an instance of this class by loading a package's json(c) file from a url or local file-system path.
     *
     * > [!tip]
     * > the constructor uses a "JSONC" parser (from [@std/jsonc](https://jsr.io/@std/jsonc)) for the fetched files.
     * > therefore, you may provide links to ".jsonc" files, instead of parsing them yourself before calling the super constructor.
    */
    static async fromUrl(package_jsonc_path) {
        package_jsonc_path = resolveAsUrl(package_jsonc_path, defaultResolvePath());
        const package_object = jsoncParse(await ((await fetch(package_jsonc_path, defaultFetchConfig)).text()));
        return new this(package_object, package_jsonc_path.href);
    }
}
