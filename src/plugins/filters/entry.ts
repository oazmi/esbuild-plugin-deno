/** this filter plugin intercepts all entities and makes them sequentially pass through three resolvers,
 * so that an absolute path to the resource can be acquired in the best possible way (citation needed).
 * 
 * > [!important]
 * > you **must** include the {@link resolverPlugin} somewhere in your esbuild build-options,
 * > otherwise this plugin will not be able to resolve to absolute paths on its own,
 * > and all efforts of this plugin will pretty much be for naught.
 * 
 * ## details
 * 
 * an explanation of the operations performed by each of the three resolvers follows:
 * 
 * ### 1. initial plugin-data injector
 * 
 * this resolver simply inserts the user's {@link EntryPluginSetupConfig.initialPluginData} to **all** entry-points which lack an `args.pluginData`.
 * but when {@link EntryPluginSetupConfig.forceInitialPluginData} is `true`, the entry-points with existing pluginData will be overwritten.
 * 
 * it is through this resolver that things like {@link CommonPluginData.importMap | import-maps}
 * and the {@link CommonPluginData.runtimePackage | deno-package-resolver} get inserted into the entry-point resources,
 * and then seeded into their dependencies.
 * 
 * ### 2. plugin-data inheritor
 * 
 * a fundamental problem (design choice?) with esbuild is that resource's `pluginData` **does not** propagate to the child-dependencies,
 * when esbuild's native resolvers and loaders process the resource.
 * this problem of stripping away valuable `pluginData` can also occur in external plugins that are not designed mindfully.
 * 
 * as a consequence, we would not be able to embed import-maps and runtime-package-resolvers that can be picked up by dependencies.
 * 
 * thus, to counteract this issue, this resolver inspects the `pluginData` of every resolved entity, stores it in a dictionary for book-keeping,
 * and then, when a dependency-resource comes along with its plugin-data stripped away (i.e. `args.pluginData === undefined`),
 * this resolver inserts its dependent's (`args.importer`) plugin-data.
 * in effect, this resolver permits inheritance of plugin-data when it is stripped away.
 * 
 * ### 3. absolute-path resolution
 * 
 * finally, we come to the resolver which implicitly calls the namespaced resolvers of the {@link resolverPlugin},
 * which is a pipeline that can resolve {@link CommonPluginData.importMap | import-maps},
 * {@link CommonPluginData.runtimePackage | deno-packages},
 * {@link nodeModulesResolverFactory | node-packages (`node_modules`)},
 * and perform generic path-joining, in order to get the absolute path (doesn't have to be filesystem path) to the resource.
 * 
 * most resolvers of the {@link resolverPlugin} require {@link CommonPluginData | `pluginData`} to be useful.
 * which is why we have to ensure its availability and inheritance through the two prior resolvers,
 * in order for the {@link resolverPlugin} to be effective.
 * 
 * ---
 * 
 * > [!tip]
 * > while the placement order of the {@link resolverPlugin} does not matter (invariant behavior),
 * > placing it at the front would reduce the number of redundant `onResolve` callbacks received by this plugin,
 * > which then need to be bounced-back to prevent an indefinite `onResolve` recursion.
 * > 
 * > you may wonder how this plugin does not spiral into an endless recursion of `onResolve` callbacks,
 * > when it uses the "capture-all" filter that spans throughout all namespaces, meanwhile using `build.resove()`.
 * > 
 * > that's because upon the interception of a new entity, we insert a unique `symbol` marker into the `pluginData`,
 * > which when detected again, halts the plugin from processing it further (by returning `undefined`).
 * > 
 * > moreover, this plugin validates that the `args.namespace` it receives must be one of `[undefined, "", "file"]`
 * > (see {@link defaultEsbuildNamespaces}), otherwise it will terminate processing it any further.
 * > this check is put in place to prevent this plugin from treading into the territory of other plugins' namespaces,
 * > which would potentially ruin their logic and `pluginData`.
 * 
 * @module
*/

import { bind_map_get, bind_map_has, bind_map_set, DEBUG, fetchScanUrls, getUriScheme, isString, joinPaths, pathToPosixPath, resolveAsUrl } from "../../deps.ts"
import { RuntimePackage, type WorkspacePackage } from "../../packageman/base.ts"
import { DenoPackage, denoPackageJsonFilenames } from "../../packageman/deno.ts"
import { logLogger } from "../funcdefs.ts"
import type { nodeModulesResolverFactory, resolverPlugin } from "../resolvers.ts"
import type { CommonPluginData, EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, OnResolveArgs, OnResolveCallback } from "../typedefs.ts"
import { defaultEsbuildNamespaces, PLUGIN_NAMESPACE } from "../typedefs.ts"


/** this is a slightly modified version of {@link CommonPluginData},
 * which accepts a path or url to your "deno.json" file under the `runtimePackage` property.
*/
export interface InitialPluginData extends Omit<CommonPluginData, "runtimePackage"> {
	/** specify your project's top-level runtime package manager,
	 * so that your project's import and export aliases can be resolved appropriately.
	 * 
	 * there are several ways for you to specify your runtime package for package-resolution support:
	 * - provide an existing {@link WorkspacePackage} object.
	 * - provide a path `string` or `URL` to the package json(c) file (such as "deno.json", "jsr.jsonc", "package.json", etc...).
	 * - provide a directory-path `string` or `URL` (**must** end with a trailing slash `"/"`) where a package json(c) file exists,
	 *   and the plugin will scan for the following files at that location in the provided order:
	 *   - `"deno.json"`, `"deno.jsonc"`, `"jsr.json"`, `"jsr.jsonc"`, `"package.json"`, `"package.jsonc"`.
	*/
	runtimePackage?: WorkspacePackage<any> | URL | string
}

/** configuration options for the {@link entryPluginSetup} esbuild-setup factory function. */
export interface EntryPluginSetupConfig {
	/** specify the regex filters to use for your initial-data-injection and path-resolver plugin.
	 * 
	 * @defaultValue `[RegExp(".*"),]` (captures all input entities)
	*/
	filters: RegExp[]

	/** {@inheritDoc "plugins/filters/entry"!InitialPluginData} */
	initialPluginData?: Partial<InitialPluginData>

	/** specify the mode for forcefully inserting {@link initialPluginData} into `args.pluginData` of all entry-points:
	 * - `false`: don't insert {@link initialPluginData} into entry-points with existing `args.pluginData`.
	 * - `true`: equivalent to the `"overwrite"` option.
	 * - `"overwrite"`: discard any existing `args.pluginData`, and replace it with {@link initialPluginData}.
	 * - `"merge"`: join the old plugin-data and the initial plugin-data in the following way: `{ ...initialPluginData, ...args.pluginData }`.
	 * 
	 * @defaultValue `false`
	*/
	forceInitialPluginData: boolean | "merge" | "overwrite"

	/** specify if `pluginData` should be passed down from an resource to its dependency-resources,
	 * if they have been stripped off of their plugin data (i.e. `dependency_args.pluginData === undefined`).
	 * 
	 * > [!note]
	 * > you might be questioning _why would the dependency-resource lose the plugin data that its importer had?_
	 * > 
	 * > the reason is that esbuild's native resolvers and loaders strip away plugin data when any resource goes through them.
	 * > (i.e. esbuild does not propagate the plugin data on its own if it resolves or loads something)
	 * > moreover, poorly written plugins may do the same.
	 * > which is why this option helps you retrieve lost plugin data from the parent dependent resource (the `args.importer`).
	 * 
	 * > [!important]
	 * > generally, you would always want this to be left as `true`.
	 * > otherwise, npm-packages and local-files, that are implicitly resolved by esbuild in this library,
	 * > will lose their access to the {@link CommonPluginData.importMap | import-maps} and {@link CommonPluginData.runtimePackage | deno-package-resolver}.
	 * 
	 * @defaultValue `true`
	*/
	enableInheritPluginData: boolean

	/** enable scanning of parental/ancestral directories of your project's
	 * {@link InitialPluginData.runtimePackage | base directory (`initialPluginData.runtimePackage`)},
	 * so that all relevant workspace packages up the directory tree can be discovered and cached.
	 * 
	 * this would permit the resolution of workspace package aliases that are not directly mentioned in your "deno.json" package file.
	 * 
	 * @defaultValue `false`
	*/
	scanAncestralWorkspaces: boolean

	/** specify which `namespace`s should be intercepted by the entry-point plugin.
	 * all other `namespace`s will not be processed by this plugin.
	 * 
	 * if you want your plugin to receive pre-resolved absolute paths under some `namespace`,
	 * instead of having to resolve the path yourself by joining paths and inspecting `pluginData`,
	 * then simply include it in this configuration property.
	 * 
	 * @defaultValue `[undefined, "", "file"]` (also {@link PLUGIN_NAMESPACE.LOADER_HTTP} gets added later on)
	*/
	acceptNamespaces: Array<string | undefined>
}

const defaultEntryPluginSetup: EntryPluginSetupConfig = {
	filters: [/.*/],
	initialPluginData: undefined,
	forceInitialPluginData: false,
	enableInheritPluginData: true,
	scanAncestralWorkspaces: false,
	acceptNamespaces: defaultEsbuildNamespaces,
}

const defaultStdinPath = "<stdin>"

/** this filter plugin intercepts all entities, injects and propagates plugin-data (if the entity is an entry-point, or a dependency with no plugin-data),
 * and then makes them go through the {@link resolverPlugin} set of resolvers, in order to obtain the absolute path to the resource.
 * 
 * for an explanation, see detailed comments of this submodule: {@link "plugins/filters/entry"}.
*/
export const entryPluginSetup = (config?: Partial<EntryPluginSetupConfig>): EsbuildPluginSetup => {
	const
		{ filters, initialPluginData: _initialPluginData, forceInitialPluginData, enableInheritPluginData, scanAncestralWorkspaces, acceptNamespaces: _acceptNamespaces } = { ...defaultEntryPluginSetup, ...config },
		acceptNamespaces = new Set([..._acceptNamespaces, PLUGIN_NAMESPACE.LOADER_HTTP]),
		// contains a record of **all** resources that have passed through the `inheritPluginDataInjector`,
		// so that dependency resources which have been stripped out of their `pluginData` can inherit it back from their `importer`'s saved `pluginData`.
		// the keys are resolved paths (posix enforced), and the values are the plugin-data of the resolved resource.
		importerPluginDataRecord = new Map<string, CommonPluginData>(),
		importerPluginDataRecord_get = bind_map_get(importerPluginDataRecord),
		importerPluginDataRecord_set = bind_map_set(importerPluginDataRecord),
		importerPluginDataRecord_has = bind_map_has(importerPluginDataRecord),
		ALREADY_CAPTURED_BY_INITIAL: unique symbol = Symbol(DEBUG.MINIFY ? "" : "[oazmi-entry]: already captured by initial-data-injector"),
		ALREADY_CAPTURED_BY_INHERITOR: unique symbol = Symbol(DEBUG.MINIFY ? "" : "[oazmi-entry]: already captured by inherit-data-injector"),
		ALREADY_CAPTURED_BY_RESOLVER: unique symbol = Symbol(DEBUG.MINIFY ? "" : "[oazmi-entry]: already captured by absolute-path-resolver")

	return async (build: EsbuildPluginBuild) => {
		const
			{ runtimePackage: initialRuntimePackage, ...rest_initialPluginData } = _initialPluginData ?? {},
			initialPluginData: Partial<CommonPluginData> = rest_initialPluginData,
			initialPluginDataExists = _initialPluginData !== undefined

		build.onStart(async () => {
			// here we resolve the path to the "deno.json" file if `initialRuntimePackage` is either a url or a local path.
			// to resolve non-url-based file paths, we'll use the namespace of {@link resolverPlugin}
			// to carry out the path resolution inside of the {@link resolveRuntimePackage} function.
			initialPluginData.runtimePackage = await resolveRuntimePackage(build, initialRuntimePackage, scanAncestralWorkspaces)

			// moreover, if an stdin is present, we will have to manually add it to `importerPluginDataRecord`,
			// because stdin's path does not go through path resolving, and thereby not intercepted by the entry plugin.
			// instead, stdin's contents are loaded (via `build.onLoad`) directly.
			const stdin = build.initialOptions.stdin
			if (stdin) {
				const
					{ sourcefile = defaultStdinPath, resolveDir = "" } = stdin,
					// when `sourcefile` is not defined by the user, esbuild sets it to `"<stdin>"`,
					// and it does not prepend the user specified `resolveDir` to it.
					// our `path` below is a mere anticipation of what esbuild must have set stdin's path string to,
					// so that we can match it with the subsequent resources' `importer`s.
					path = (sourcefile === defaultStdinPath) ? sourcefile : (resolveDir
						? joinPaths(resolveDir, sourcefile)
						: pathToPosixPath(sourcefile)
					)
				// we have to do `initialPluginData as any` because `initialPluginData` lacks symbols entries, whereas the `CommonPluginData` requires them.
				importerPluginDataRecord_set(path, initialPluginData as any)
			}
		})

		/** this resolver simply inserts the user's {@link initialPluginData} to **all** entry-points which lack an `args.pluginData`.
		 * but when {@link forceInitialPluginData} is `true`, the entry-points with existing pluginData will be overwritten.
		*/
		const initialPluginDataInjector: OnResolveCallback = async (args: OnResolveArgs) => {
			const
				{ path, pluginData, ...rest_args } = args,
				{ kind, namespace } = rest_args

			// if the entity is not an entry-point, then skip it.
			if (kind !== "entry-point") { return }
			// if the plugin marker already exists for this entity, then we've already processed it once,
			// therefore we should return `undefined` so that we don't end in an infinite onResolve recursion.
			// this way, the next resolver registered to esbuild (or its native resolver) will take up the task for resolving this entity.
			if ((pluginData ?? {})[ALREADY_CAPTURED_BY_INITIAL]) { return }
			// since all namespaces are captured by the `onResolve` options,
			// we skip processing any resource with a namespace not in the `acceptNamespaces` list.
			if (!acceptNamespaces.has(namespace)) { return }
			// if there is an existing non-empty plugin data and `forceInitialPluginData` is not enabled (default), then skip this entity
			if (pluginData !== undefined && !forceInitialPluginData) { return }

			const merged_pluginData = forceInitialPluginData === "merge"
				? { ...initialPluginData, ...pluginData, [ALREADY_CAPTURED_BY_INITIAL]: true }
				: { ...initialPluginData, [ALREADY_CAPTURED_BY_INITIAL]: true }

			// below, we implicitly (hope to) call the `inheritPluginDataInjector`, so long as no other "capture-all" plugin exists before this plugin.
			const resolved_result = await build.resolve(path, { ...rest_args, pluginData: merged_pluginData })
			// if esbuild's native resolver had resolved the `path`, then the `merged_pluginData` that we just inserted WILL be lost.
			// i.e. `resolved_result.pluginData === undefined` if esbuild's native resolver took care of the path-resolution.
			// in such cases, we would like to re-insert our `merged_pluginData` again, before returning the result
			resolved_result.pluginData ??= merged_pluginData

			// NOTICE: we intentionally do not remove the `ALREADY_CAPTURED_BY_INITIAL` marker from the result's plugin-data.
			//   even though it is practically impossible for this resource to somehow end up back inside this resolver,
			//   we still keep it around for safety measures.
			return resolved_result
		}

		/** this resolver ensures that the incoming resources have some non-undefined `pluginData`,
		 * otherwise it will insert the `pluginData` of its parent `importer` resource.
		 * (i.e. dependency resources will inherit their parent importer's `pluginData` if they are lacking one)
		 * 
		 * moreover, internally, a call to `build.resolver()` is made to resolve the path of the current resource.
		 * however, if the resolved result is lacking a `pluginData`
		 * (possibly due to being resolved by esbuild's native resolver, which strips away `pluginData`),
		 * then the `pluginData` _prior_ to the path-resolution will be re-inserted into the result.
		*/
		const inheritPluginDataInjector: OnResolveCallback = async (args: OnResolveArgs) => {
			const
				{ path, pluginData, ...rest_args } = args,
				{ importer = "", namespace } = rest_args
			if ((pluginData ?? {})[ALREADY_CAPTURED_BY_INHERITOR]) { return }
			if (!acceptNamespaces.has(namespace)) { return }

			// if `pluginData` is missing (and an `importer` exists), then inherit it from the parent `importer`, and retry (via recursion).
			if ((pluginData === undefined || pluginData === null) && importer !== "") {
				const parentPluginData = importerPluginDataRecord_get(pathToPosixPath(importer))
				return parentPluginData
					? inheritPluginDataInjector({ ...rest_args, path, pluginData: parentPluginData })
					: undefined
			}

			const
				prior_pluginData: CommonPluginData = { ...pluginData, [ALREADY_CAPTURED_BY_INHERITOR]: true },
				// below, we implicitly (hope to) call the `absolutePathResolver`, so long as no other "capture-all" plugin exists before this plugin.
				resolved_result = await build.resolve(path, { ...rest_args, pluginData: prior_pluginData }),
				resolved_pluginData = {
					// if esbuild's native resolver had resolved the `path`, then the `prior_pluginData` WILL be lost, and we will need to re-insert it.
					...((resolved_result.pluginData as (CommonPluginData | undefined)) ?? prior_pluginData),

					// we must also disable the `ALREADY_CAPTURED_BY_INHERITOR` marker, since the `resolved_result` is ready to go to the loader,
					// however, we don't want the dependencies (which will inherit the `pluginData`) to have their capture marker set to `true`,
					// since they haven't actually been captured by this resolver yet.
					[ALREADY_CAPTURED_BY_INHERITOR]: false,
				}

			// finally (if the `useInheritPluginData` option is not explicitly disabled),
			// we save the resolved plugin data to the global record, so that its dependencies can inherit it when needed.
			// TODO: consider the scenario where the same `path` is processed,
			//   leading up to the same `resolved_result.path` that already exists in `importerPluginDataRecord`.
			//   should we still update the record with a potentially new and different `resolved_pluginData`?, or should we abstain from that?
			//   currently, I only accept the first plugin-data, and no more re-writes.
			if (resolved_pluginData.resolverConfig?.useInheritPluginData !== false) {
				const resolved_path = pathToPosixPath(resolved_result.path)
				if (!importerPluginDataRecord_has(resolved_path)) {
					importerPluginDataRecord_set(pathToPosixPath(resolved_result.path), resolved_pluginData)
				}
			}
			resolved_result.pluginData = resolved_pluginData
			return resolved_result
		}

		/** by this point, our resource will have acquired any `pluginData` that was intended for it.
		 * so all that is left to be done is to obtain the absolute-path to the resource,
		 * by implicitly resolving it though the {@link resolverPlugin}'s namespace.
		 * 
		 * once we obtain the resolved absolute-path, we run it though `build.resolve` again (but in the resource's original namespace this time),
		 * so that whichever plugin that this resource was intended for (including esbuild's native resolver)
		 * will receive it gracefully, and resolve it in their own accord.
		*/
		const absolutePathResolver: OnResolveCallback = async (args: OnResolveArgs) => {
			if ((args.pluginData ?? {})[ALREADY_CAPTURED_BY_RESOLVER]) { return }
			if (!acceptNamespaces.has(args.namespace)) { return }
			const
				{ path, namespace: original_ns, ...rest_args } = args,
				abs_result = await build.resolve(path, { ...rest_args, namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE })
			const
				{ path: abs_path, pluginData: abs_pluginData = {}, namespace: _0 } = abs_result,
				next_pluginData = { ...abs_pluginData, [ALREADY_CAPTURED_BY_RESOLVER]: true },
				resolved_result = await build.resolve(abs_path, { ...rest_args, namespace: original_ns, pluginData: next_pluginData })

			resolved_result.pluginData = {
				// if esbuild's native resolver had resolved the `path`, then the `next_pluginData` WILL be lost, and we will need to re-insert it.
				...(resolved_result.pluginData ?? next_pluginData),

				// we must also disable the `ALREADY_CAPTURED_BY_RESOLVER` marker, since the `resolved_result` is ready to go to the loader,
				// however, we don't want the dependencies (which will inherit the `pluginData`) to have their capture marker set to `true`,
				// since they haven't actually been captured by this resolver yet.
				[ALREADY_CAPTURED_BY_RESOLVER]: false,
			}
			return resolved_result
		}

		for (const filter of filters) {
			if (initialPluginDataExists) { build.onResolve({ filter }, initialPluginDataInjector) }
			if (enableInheritPluginData) { build.onResolve({ filter }, inheritPluginDataInjector) }
			build.onResolve({ filter }, absolutePathResolver)
		}
	}
}

/** {@inheritDoc entryPluginSetup} */
export const entryPlugin = (config?: Partial<EntryPluginSetupConfig>): EsbuildPlugin => {
	return {
		name: "oazmi-entry",
		setup: entryPluginSetup(config),
	}
}

/** a utility function that resolves the path/url to your runtime-package json file (such as "deno.json"),
 * then creates a {@link DenoPackage} instance of out of it (which is needed for the `initialPluginData`, and then inherited by the dependencies).
 * 
 * there are several ways to specify the current runtime package (a class instance, a file path/url, or a directory path/url).
 * for all available options, see the documentation comments of {@link InitialPluginData.runtimePackage}.
*/
const resolveRuntimePackage = async (build: EsbuildPluginBuild, initialRuntimePackage: InitialPluginData["runtimePackage"], scanAncestralWorkspaces: boolean = true): Promise<WorkspacePackage<any> | undefined> => {
	let
		deno_package: WorkspacePackage<any> | undefined,
		deno_json_path: string | URL | undefined

	if (!initialRuntimePackage) { return }
	if (initialRuntimePackage instanceof RuntimePackage) {
		deno_package = initialRuntimePackage
	} else {
		const is_relative_path = isString(initialRuntimePackage) && (getUriScheme(initialRuntimePackage) === "relative")
		deno_json_path = is_relative_path
			? (await build.resolve(initialRuntimePackage, {
				kind: "entry-point",
				namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
				pluginData: { resolverConfig: { useNodeModules: false } } satisfies CommonPluginData,
			})).path
			: initialRuntimePackage

		// below, the `DenoPackage.fromUrl` method takes care of urls, local-paths, and directories as well.
		// however, if scanning a directory for the common package json file names fails, then an error is throw.
		// in that case, we'll catch the error and warn the end-user about the missing json file, instead of halting the build process.
		deno_package = await DenoPackage.fromUrl(deno_json_path).catch((reason): undefined => {
			logLogger(`[resolveRuntimePackage]    : ${reason?.message ?? reason}`)
		})
	}
	// if the `scanAncestralWorkspaces` option is set to true, then we will traverse all parent, grandparent, etc... directories,
	// looking for "deno.json" and equivalent package files and caching them, in a addition to building a workspace-tree between the various packages.
	if (scanAncestralWorkspaces && (deno_package ?? deno_json_path)) {
		await traverseAncestralWorkspaces(deno_package?.getPath() ?? deno_json_path!)
	}
	return deno_package
}

/** this utility function traverses the ancestral directories of the provided `starting_path`,
 * caching any workspace package that it discovers along the way (i.e. "deno.json(c)", "jsr.json(c)", and "package.json(c)"),
 * so that child packages would become aware of any parent workspace packages.
*/
const traverseAncestralWorkspaces = async (starting_path: string | URL): Promise<void> => {
	const
		dir_url = resolveAsUrl("./", starting_path),
		parent_dir_url = resolveAsUrl("../", dir_url)
	// if we can no longer traverse into a parent directory (i.e. we're at the root), then exit.
	if (parent_dir_url.href === dir_url.href) { return }
	const
		deno_package_json_urls = denoPackageJsonFilenames.map((json_filename) => new URL(json_filename, dir_url)),
		// we don't use the head method below, because "file://" urls do not support the head method.
		valid_url = await fetchScanUrls(deno_package_json_urls)
	if (valid_url) {
		// caching the discovered deno package so that its workspace tree can be generated (if there's any that is).
		const deno_package = await DenoPackage.fromUrl(valid_url).catch((reason): undefined => {
			logLogger(`[resolveRuntimePackage]    : workspace file at "${valid_url}" was found, but we failed to load it as a deno package. reason:  ${reason?.message ?? reason}`)
		})
	}
	return traverseAncestralWorkspaces(parent_dir_url)
}
