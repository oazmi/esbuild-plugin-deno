/** this submodule exports the base abstract class {@link RuntimePackage},
 * that is supposed to be utilized for parsing package metadata, and resolving various import path aliases.
 *
 * @module
*/
import { type ConstructorOf } from "../deps.js";
import { type ResolvePathFromImportMapEntriesConfig } from "../importmap/mod.js";
import type { ImportMapSortedEntries } from "../importmap/typedefs.js";
export interface RuntimePackageResolveImportConfig extends ResolvePathFromImportMapEntriesConfig {
    /** once a workspace runtime-package has been visited, its path (returned by {@link RuntimePackage.getPath}) is saved to this `Set`,
     * so that it is not traversed again by any other child/parent workspace during the current import-path resolution task.
    */
    workspaceImportsVisited?: Set<string>;
    /** once a workspace runtime-package has been visited, its path (returned by {@link RuntimePackage.getPath}) is saved to this `Set`,
     * so that it is not traversed again by any other child/parent workspace during the current export-path resolution task.
    */
    workspaceExportsVisited?: Set<string>;
}
/** a 2-tuple returned by the workspace resolution methods {@link WorkspacePackage.resolveWorkspaceImport}, and {@link WorkspacePackage.resolveWorkspaceExport}.
 * it consists of the `resolved_path` and the {@link WorkspacePackage | `child_workspace_package`} that managed to resolve the `path_alias` provided to the method.
*/
export type ResolveWorkspaceReturnType = [resolved_path: string, child_workspace_package: WorkspacePackage<any>];
/** an abstraction for import-map utilities of a general javascript runtime's package object with the schema `SCHEMA`.
 * - in the case of node, `SCHEMA` would represent `package.json`'s schema.
 * - in the case of deno, `SCHEMA` would represent `deno.json`, `deno.jsonc`, or `jsr.json`'s schema.
 *
 * @template SCHEMA a record type representing the package schema.
*/
export declare abstract class RuntimePackage<SCHEMA extends Record<string, any>> {
    /** the path or url of the package json(c) file.
     *
     * the {@link RuntimePackage | base class} does nothing with this information;
     * it is just there so that subclasses can make uses of this information (usually for resolving relative paths).
    */
    protected readonly packagePath: string;
    /** the fetched/parsed package metadata file's raw contents. */
    protected readonly packageInfo: SCHEMA;
    /** the import-map entries of the package, sorted from the largest key-alias to the shortest.
     *
     * > [!note]
     * > each subclass will have to assign on their own, in addition to ensuring the required sorting order.
    */
    protected abstract importMapSortedEntries: ImportMapSortedEntries;
    /** the export-map entries of the package, sorted from the largest key-alias to the shortest.
     *
     * > [!note]
     * > each subclass will have to assign on their own, in addition to ensuring the required sorting order.
    */
    protected abstract exportMapSortedEntries: ImportMapSortedEntries;
    /** @param package_object the parsed package metadata as an object.
     *   - in the case of node, this would be your json-parsed "package.json" file.
     *   - in the case of deno, this would be your json-parsed "deno.json" file.
    */
    constructor(package_object: SCHEMA, package_path: string);
    /** get the package's name. */
    abstract getName(): string;
    /** get the package's version string. */
    abstract getVersion(): string;
    /** get the path/url to the package's json(c) file.
     *
     * the {@link RuntimePackage | base class} does nothing with this information;
     * it is just there so that subclasses can make uses of this information (usually for resolving relative paths).
    */
    getPath(): string;
    /** this method tries to resolve the provided export `path_alias` of this package,
     * to an absolutely referenced path to the resource (using the internal {@link exportMapSortedEntries}).
     * if no exported resources match the given `path_alias`, then `undefined` will be returned.
     *
     * > [!tip]
     * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
    */
    resolveExport(path_alias: string, config?: Partial<RuntimePackageResolveImportConfig>): string | undefined;
    /** this method tries to resolve the provided import `path_alias` done by some resource within this package,
     * using the internal {@link importMapSortedEntries} list of import-aliases that this package uses.
     * if no import resources match the given `path_alias`, then `undefined` will be returned
     * (which would probably mean that the given `path_alias` is already either an absolute or relative path, or perhaps incorrect altogether.
     *
     * > [!tip]
     * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
    */
    resolveImport(path_alias: string, config?: Partial<RuntimePackageResolveImportConfig>): string | undefined;
    /** create an instance of this class by loading a package's json(c) file from a url or local file-system path.
     *
     * > [!important]
     * > the resulting new instance is cached (memorized), so that it can be reused if another query with the same normalized path is provided.
     * >
     * > _why are we forcing a cache mechanism on the base class?_
     * >
     * > because the workspace children/parents, in the {@link WorkspacePackage} subclass, are referenced by their absolute path,
     * > and resolving an import through a workspace package would involve the creation of that child/parent runtime package via this method,
     * > thus leading to an exponential number of redundant re-creation of identical package manager objects.
     *
     * > [!tip]
     * > the constructor uses a "JSONC" parser (from [@oazmi/kitchensink/stringman](https://jsr.io/@oazmi/kitchensink/0.9.10/src/stringman.ts)) for the fetched files.
     * > therefore, you may provide links to ".jsonc" files, instead of parsing them yourself before calling the super constructor.
    */
    static fromUrl<SCHEMA extends Record<string, any>, INSTANCE = RuntimePackage<SCHEMA>>(this: ConstructorOf<INSTANCE, [SCHEMA, string]>, package_jsonc_path: URL | string): Promise<INSTANCE>;
}
export declare abstract class WorkspacePackage<SCHEMA extends Record<string, any>> extends RuntimePackage<SCHEMA> {
    /** specify all child workspaces of this package.
     *
     * - the exports of every child-workspace package are inherited by _this_ runtime package.
     *   > example: if `packageB` is child-workspace of `packageA`, then `packageA.exports` would be a superset of `packageB.exports`.
     * - similarly, the imports of _this_ runtime package will be implicitly available for all child-workspace packages.
     *   > example: if `packageB` is child-workspace of `packageA`, then `packageA.imports` would be a subset of `packageB.imports`.
     *
     *   > [!note]
     *   > since child-workspaces are also considered to be dependencies of the parent package (the monorepo),
     *   > each child-workspace would be available to for importation by all child-workspaces.
     *   > in other words, sibling packages of the workspace would be able to import one another.
     *
     * > [!important]
     * > the constructor of the subclasses do **not** typically parse the workspace paths from the provided schema,
     * > nor do they load the {@link WorkspacePackage} associated with those workspaces,
     * > since it would require asynchronous operations (such as `fetch`) which cannot be performed inside the constructor.
     * > this is why you would either need to manually add/push your child/parent-workspace {@link WorkspacePackage} object,
     * > or use the asynchronous {@link fromUrl} static method in the subclasses to take care of auto-loading and auto-injecting parent and child workspaces.
    */
    readonly workspaceChildren: Array<WorkspacePackage<any>>;
    /** specify all parent workspaces of this package.
     *
     * - the imports of _this_ runtime package will be implicitly available for all child-workspace packages.
     *   > example: if `packageB` is child-workspace of `packageA`, then `packageA.imports` would be a subset of `packageB.imports`.
     * - the exports of every child-workspace package are inherited by _this_ runtime package.
     *   > example: if `packageB` is child-workspace of `packageA`, then `packageA.exports` would be a superset of `packageB.exports`.
     *
     * > [!important]
     * > the constructor of the subclasses do **not** typically parse the workspace paths from the provided schema,
     * > nor do they load the {@link WorkspacePackage} associated with those workspaces,
     * > since it would require asynchronous operations (such as `fetch`) which cannot be performed inside the constructor.
     * > this is why you would either need to manually add/push your child/parent-workspace {@link WorkspacePackage} object,
     * > or use the asynchronous {@link fromUrl} static method in the subclasses to take care of auto-loading and auto-injecting parent and child workspaces.
    */
    readonly workspaceParents: Array<WorkspacePackage<any>>;
    constructor(package_object: SCHEMA, package_path: string);
    /** add a child workspace package, either by providing its path (absolute or relative), or by providing its {@link WorkspacePackage} object.
     *
     * the exports of the added child workspace will become available to this package during workspace export-resolution ({@link resolveWorkspaceExport}).
    */
    addWorkspaceChild(package_jsonc_path: URL | string): Promise<void>;
    addWorkspaceChild(runtime_package: WorkspacePackage<any>): Promise<void>;
    /** add a parent (monorepo) to this package, either by providing its path (absolute or relative), or by providing its {@link WorkspacePackage} object.
     *
     * the imports of the added parent workspace will become available to this package during workspace import-resolution ({@link resolveWorkspaceImport}).
    */
    addWorkspaceParent(package_jsonc_path: URL | string): Promise<void>;
    addWorkspaceParent(runtime_package: WorkspacePackage<any>): Promise<void>;
    /** this method tries to resolve the provided export `path_alias` to an absolute resource path,
     * using this package's child workspaces (i.e. not including _this_ package's _own_ exports).
     *
     * - if the action is successful, then a 2-tuple is returned,
     *   consisting of the `resolved_path` and the {@link WorkspacePackage | `child_workspace_package`} that managed to resolve the provided `path_alias`.
     * - if there are no child-workspaces, or if the child-workspaces fail to resolve the exported `path_alias`, then `undefined` will be returned.
     * - this method does not inspect this package's own exports. you should use {@link resolveExport} for that.
    */
    resolveWorkspaceExport(path_alias: string, config?: Partial<RuntimePackageResolveImportConfig>): ResolveWorkspaceReturnType | undefined;
    /** this method tries to resolve the provided import `path_alias` done by some resource within this package,
     * using the internal {@link importMapSortedEntries} list of import-aliases that this package uses.
     *
     * - if the action is successful, then a 2-tuple is returned,
     *   consisting of the `resolved_path` and the {@link WorkspacePackage | `child_workspace_package`} that managed to resolve the provided `path_alias`.
     * - if no import resources match the given `path_alias` within this package, then this package's {@link workspaceParents} will be traversed.
     * - if there are no parent-workspaces, or if the parent-workspaces fail to resolve this `path_alias`, then `undefined` will be returned.
     *   (which would probably imply that the given `path_alias` is already either an absolute or relative path, or perhaps incorrect altogether)
     *
     * > [!tip]
     * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
    */
    resolveWorkspaceImport(path_alias: string, config?: Partial<RuntimePackageResolveImportConfig>): ResolveWorkspaceReturnType | undefined;
}
//# sourceMappingURL=base.d.ts.map