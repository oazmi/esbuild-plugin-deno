/** this submodule exports the base abstract class {@link RuntimePackage},
 * that is supposed to be utilized for parsing package metadata, and resolving various import path aliases.
 * 
 * @module
*/

import { defaultFetchConfig, defaultResolvePath, jsoncParse, resolveAsUrl, type ConstructorOf } from "../deps.js"
import { resolvePathFromImportMapEntries, type ResolvePathFromImportMapEntriesConfig } from "../importmap/mod.js"
import type { ImportMapSortedEntries } from "../importmap/typedefs.js"


/** an abstraction for import-map utilities of a general javascript runtime's package object with the schema `SCHEMA`.
 * - in the case of node, `SCHEMA` would represent `package.json`'s schema.
 * - in the case of deno, `SCHEMA` would represent `deno.json`, `deno.jsonc`, or `jsr.json`'s schema.
 * 
 * @template SCHEMA a record type representing the package schema.
*/
export abstract class RuntimePackage<SCHEMA extends Record<string, any>> {
	/** the fetched/parsed package metadata file's raw contents. */
	protected readonly packageInfo: SCHEMA

	/** the import-map entries of the package, sorted from the largest key-alias to the shortest.
	 * 
	 * > [!note]
	 * > each subclass will have to assign on their own, in addition to ensuring the required sorting order.
	*/
	protected abstract importMapSortedEntries: ImportMapSortedEntries

	/** the export-map entries of the package, sorted from the largest key-alias to the shortest.
	 * 
	 * > [!note]
	 * > each subclass will have to assign on their own, in addition to ensuring the required sorting order.
	*/
	protected abstract exportMapSortedEntries: ImportMapSortedEntries

	/** @param package_object the parsed package metadata as an object.
	 *   - in the case of node, this would be your json-parsed "package.json" file.
	 *   - in the case of deno, this would be your json-parsed "deno.json" file.
	*/
	constructor(package_object: SCHEMA) {
		this.packageInfo = package_object
	}

	/** get the package's name. */
	abstract getName(): string

	/** get the package's version string. */
	abstract getVersion(): string

	/** this method tries to resolve the provided export `path_alias` of this package,
	 * to an absolutely referenced path to the resource (using the internal {@link exportMapSortedEntries}).
	 * if no exported resources match the given `path_alias`, then `undefined` will be returned.
	 * 
	 * > [!tip]
	 * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
	*/
	resolveExport(path_alias: string, config?: Partial<ResolvePathFromImportMapEntriesConfig>): string | undefined {
		return resolvePathFromImportMapEntries(path_alias, this.exportMapSortedEntries, { sort: false, ...config })
	}

	/** this method tries to resolve the provided import `path_alias` done by some resource within this package,
	 * using the internal {@link importMapSortedEntries} list of import-aliases that this package uses.
	 * if no import resources match the given `path_alias`, then `undefined` will be returned
	 * (which would probably mean that the given `path_alias` is already either an absolute or relative path, or perhaps incorrect altogether.
	 * 
	 * > [!tip]
	 * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
	*/
	resolveImport(path_alias: string, config?: Partial<ResolvePathFromImportMapEntriesConfig>): string | undefined {
		return resolvePathFromImportMapEntries(path_alias, this.importMapSortedEntries, { sort: false, ...config })
	}

	/** create an instance of this class by loading a package's json(c) file from a url or local file-system path.
	 * 
	 * > [!tip]
	 * > the constructor uses a "JSONC" parser (from [@std/jsonc](https://jsr.io/@std/jsonc)) for the fetched files.
	 * > therefore, you may provide links to ".jsonc" files, instead of parsing them yourself before calling the super constructor.
	*/
	static async fromUrl<
		SCHEMA extends Record<string, any>,
		INSTANCE = RuntimePackage<SCHEMA>,
	>(this: ConstructorOf<INSTANCE, [SCHEMA]>, package_jsonc_path: URL | string): Promise<INSTANCE> {
		package_jsonc_path = resolveAsUrl(package_jsonc_path, defaultResolvePath())
		const package_object = jsoncParse(await ((await fetch(package_jsonc_path, defaultFetchConfig)).text())) as SCHEMA
		return new this(package_object)
	}
}
