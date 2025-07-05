/** this submodule exports the base abstract class {@link RuntimePackage},
 * that is supposed to be utilized for parsing package metadata, and resolving various import path aliases.
 * 
 * @module
*/

import { constructorOf, defaultFetchConfig, defaultResolvePath, isString, json_parse, jsoncRemoveComments, promise_outside, resolveAsUrl, type ConstructorOf } from "../deps.ts"
import { resolvePathFromImportMapEntries, type ResolvePathFromImportMapEntriesConfig } from "../importmap/mod.ts"
import type { ImportMapSortedEntries } from "../importmap/typedefs.ts"


export interface RuntimePackageResolveImportConfig extends ResolvePathFromImportMapEntriesConfig {
	/** once a workspace runtime-package has been visited, its path (returned by {@link RuntimePackage.getPath}) is saved to this `Set`,
	 * so that it is not traversed again by any other child/parent workspace during the current path-resolution task.
	*/
	workspacesVisited?: Set<string>
}

const cachedRuntimePackage = new Map<string, Promise<RuntimePackage<any>>>()

/** an abstraction for import-map utilities of a general javascript runtime's package object with the schema `SCHEMA`.
 * - in the case of node, `SCHEMA` would represent `package.json`'s schema.
 * - in the case of deno, `SCHEMA` would represent `deno.json`, `deno.jsonc`, or `jsr.json`'s schema.
 * 
 * @template SCHEMA a record type representing the package schema.
*/
export abstract class RuntimePackage<SCHEMA extends Record<string, any>> {
	/** the path or url of the package json(c) file.
	 * 
	 * the {@link RuntimePackage | base class} does nothing with this information;
	 * it is just there so that subclasses can make uses of this information (usually for resolving relative paths).
	*/
	protected readonly packagePath: string

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
	constructor(package_object: SCHEMA, package_path: string) {
		this.packageInfo = package_object
		this.packagePath = package_path
	}

	/** get the package's name. */
	abstract getName(): string

	/** get the package's version string. */
	abstract getVersion(): string

	/** get the path/url to the package's json(c) file.
	 * 
	 * the {@link RuntimePackage | base class} does nothing with this information;
	 * it is just there so that subclasses can make uses of this information (usually for resolving relative paths).
	*/
	getPath(): string { return this.packagePath }

	/** this method tries to resolve the provided export `path_alias` of this package,
	 * to an absolutely referenced path to the resource (using the internal {@link exportMapSortedEntries}).
	 * if no exported resources match the given `path_alias`, then `undefined` will be returned.
	 * 
	 * > [!tip]
	 * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
	*/
	resolveExport(path_alias: string, config?: Partial<RuntimePackageResolveImportConfig>): string | undefined {
		// if this workspace package has already been visited, do not traverse it further.
		if (config?.workspacesVisited?.has(this.getPath())) { return }
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
	resolveImport(path_alias: string, config?: Partial<RuntimePackageResolveImportConfig>): string | undefined {
		// if this workspace package has already been visited, do not traverse it further.
		if (config?.workspacesVisited?.has(this.getPath())) { return }
		return resolvePathFromImportMapEntries(path_alias, this.importMapSortedEntries, { sort: false, ...config })
	}

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
	static async fromUrl<
		SCHEMA extends Record<string, any>,
		INSTANCE = RuntimePackage<SCHEMA>,
	>(this: ConstructorOf<INSTANCE, [SCHEMA, string]>, package_jsonc_path: URL | string): Promise<INSTANCE> {
		package_jsonc_path = resolveAsUrl(package_jsonc_path, defaultResolvePath())
		const
			package_jsonc_path_str = package_jsonc_path.href,
			cached_result = cachedRuntimePackage.get(package_jsonc_path_str)
		if (cached_result) { return cached_result as Promise<INSTANCE> }
		const [promise, resolve, reject] = promise_outside<INSTANCE>()
		cachedRuntimePackage.set(package_jsonc_path_str, promise as Promise<RuntimePackage<SCHEMA>>)
		const
			package_object = json_parse(jsoncRemoveComments(await ((await fetch(package_jsonc_path, defaultFetchConfig)).text()))) as SCHEMA,
			new_instance = new this(package_object, package_jsonc_path_str)
		resolve(new_instance)
		return new_instance
	}
}

export abstract class WorkspacePackage<SCHEMA extends Record<string, any>> extends RuntimePackage<SCHEMA> {
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
	public readonly workspaceChildren: Array<WorkspacePackage<any>>

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
	public readonly workspaceParents: Array<WorkspacePackage<any>>

	constructor(package_object: SCHEMA, package_path: string) {
		super(package_object, package_path)
		this.workspaceChildren = []
		this.workspaceParents = []
	}

	/** add a child workspace package, either by providing its path (absolute or relative), or by providing its {@link WorkspacePackage} object.
	 * 
	 * the exports of the added child workspace will become available to this package during workspace export-resolution ({@link resolveWorkspaceExport}).
	*/
	async addWorkspaceChild(package_jsonc_path: URL | string): Promise<void>
	async addWorkspaceChild(runtime_package: WorkspacePackage<any>): Promise<void>
	async addWorkspaceChild(package_or_path: URL | string | WorkspacePackage<any>): Promise<void> {
		const
			this_constructor = constructorOf(this) as unknown as typeof WorkspacePackage<SCHEMA>,
			this_package_path = this.getPath(),
			package_is_path = isString(package_or_path) || package_or_path instanceof URL,
			// convert any relative workspace paths to absolute url-paths, if they're not already.
			package_url = package_is_path ? resolveAsUrl(package_or_path, this_package_path) : undefined,
			child_package = package_is_path
				// below, a type error is raised by `this_constructor`, due to the fact `WorkspacePackage` is an abstract class, hence it should not instantiate an object.
				? await (this_constructor as any).fromUrl(package_url!) as WorkspacePackage<SCHEMA>
				: package_or_path
		// we should ideally check for pre-existence of the `child_package` within `this.workspaceChildren`,
		// by comparing its `child_package.getPath()` with the existing children's paths.
		// but during import/export-resolution, duplicate paths will not be traversed more than once anyway, so it doesn't really matter that much.
		this.workspaceChildren.push(child_package)
		child_package.workspaceParents.push(this)
	}

	/** add a parent (monorepo) to this package, either by providing its path (absolute or relative), or by providing its {@link WorkspacePackage} object.
	 * 
	 * the imports of the added parent workspace will become available to this package during workspace import-resolution ({@link resolveWorkspaceImport}).
	*/
	async addWorkspaceParent(package_jsonc_path: URL | string): Promise<void>
	async addWorkspaceParent(runtime_package: WorkspacePackage<any>): Promise<void>
	async addWorkspaceParent(package_or_path: URL | string | WorkspacePackage<any>): Promise<void> {
		const
			this_constructor = constructorOf(this) as unknown as typeof WorkspacePackage<SCHEMA>,
			this_package_path = this.getPath(),
			package_is_path = isString(package_or_path) || package_or_path instanceof URL,
			// convert any relative workspace paths to absolute url-paths, if they're not already.
			package_url = package_is_path ? resolveAsUrl(package_or_path, this_package_path) : undefined,
			parent_package = package_is_path
				// below, a type error is raised by `this_constructor`, due to the fact `WorkspacePackage` is an abstract class, hence it should not instantiate an object.
				? await (this_constructor as any).fromUrl(package_url!) as WorkspacePackage<SCHEMA>
				: package_or_path
		// we should ideally check for pre-existence of the `parent_package` within `this.workspaceParents`,
		// by comparing its `parent_package.getPath()` with the existing parent's paths.
		// but during import/export-resolution, duplicate paths will not be traversed more than once anyway, so it doesn't really matter that much.
		this.workspaceParents.push(parent_package)
		parent_package.workspaceChildren.push(this)
	}

	/** this method tries to resolve the provided export `path_alias` to an absolute resource path,
	 * using this package's child workspaces (i.e. not including _this_ package's _own_ exports).
	 * 
	 * - if there are no child-workspaces, or if the child-workspaces fail to resolve the exported `path_alias`, then `undefined` will be returned.
	 * - this method does not inspect this package's own exports. you should use {@link resolveExport} for that.
	*/
	resolveWorkspaceExport(path_alias: string, config?: Partial<RuntimePackageResolveImportConfig>): string | undefined {
		const
			{ workspacesVisited = new Set<string>(), ...import_map_config } = config ?? {},
			workspace_children = this.workspaceChildren,
			current_workspaces_path = this.getPath()
		// if this workspace has already been visited, do not traverse it further.
		if (workspacesVisited.has(current_workspaces_path)) { return }
		// we share the `workspacesVisited` object among the child-workspaces,
		// so that any runtime-package path that has been considered at least once will not be tried twice in an alternate child-workspace.
		// NOTE: this may be unnecessary given that parent to child traversal should not lead to a circular dependency loop,
		// but it is still possible if the end user had explicitly made such a circular dependency (in which case the visited set would be needed).
		workspacesVisited.add(current_workspaces_path)
		for (const runtime_package of workspace_children) {
			const resolved_path = runtime_package.resolveExport(path_alias, {
				workspacesVisited,
				...import_map_config,
			}) ?? runtime_package.resolveWorkspaceExport(path_alias, {
				workspacesVisited,
				...import_map_config,
			})
			if (resolved_path) { return resolved_path }
		}
		return
	}

	/** this method tries to resolve the provided import `path_alias` done by some resource within this package,
	 * using the internal {@link importMapSortedEntries} list of import-aliases that this package uses.
	 * 
	 * - if no import resources match the given `path_alias` within this package, then this package's {@link workspaceParents} will be traversed.
	 * - if there are no parent-workspaces, or if the parent-workspaces fail to resolve this `path_alias`, then `undefined` will be returned.
	 *   (which would probably imply that the given `path_alias` is already either an absolute or relative path, or perhaps incorrect altogether)
	 * 
	 * > [!tip]
	 * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
	*/
	resolveWorkspaceImport(path_alias: string, config?: Partial<RuntimePackageResolveImportConfig>): string | undefined {
		const
			{ workspacesVisited = new Set<string>(), ...import_map_config } = config ?? {},
			workspace_parents = this.workspaceParents,
			current_workspaces_path = this.getPath()
		// if this workspace has already been visited, do not traverse it further.
		if (workspacesVisited.has(current_workspaces_path)) { return }
		// we share the `workspacesVisited` object among the parent-workspaces,
		// so that any runtime-package path that has been considered at least once will not be tried twice in an alternate parent-workspace.
		workspacesVisited.add(current_workspaces_path)
		for (const runtime_package of workspace_parents) {
			const resolved_path = runtime_package.resolveImport(path_alias, {
				workspacesVisited,
				...import_map_config,
			}) ?? runtime_package.resolveWorkspaceImport(path_alias, {
				workspacesVisited,
				...import_map_config,
			})
			if (resolved_path) { return resolved_path }
		}
		return
	}
}
