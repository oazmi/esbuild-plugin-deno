/** this filter plugin intercepts all entities, injects plugin-data (if the entrity is an entry-point, or a dependency thereof),
 * and then makes them go through the {@link resolverPlugin} set of resolvers, in order to obtain the absolute path to the resource.
 * 
 * > [!important]
 * > you **must** include the {@link resolverPlugin} somewhere in your esbuild build-options,
 * > otherwise this plugin will not be able to resolve any path on its own.
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

import { isString, normalizePath, resolveAsUrl } from "../../deps.ts"
import { RuntimePackage } from "../../packageman/base.ts"
import { DenoPackage } from "../../packageman/deno.ts"
import type { resolverPlugin } from "../resolvers.ts"
import type { CommonPluginData, EsbuildPlugin, EsbuildPluginBuild, EsbuildPluginSetup, OnResolveArgs, OnResolveCallback } from "../typedefs.ts"
import { defaultEsbuildNamespaces, PLUGIN_NAMESPACE } from "../typedefs.ts"


/** this is a slightly modified version of {@link CommonPluginData},
 * which accepts a path or url to your "deno.json" file under the `runtimePackage` property.
*/
export interface InitialPluginData extends Omit<CommonPluginData, "runtimePackage"> {
	/** specify your project's top-level runtime package manager object,
	 * or provide the path to the package json(c) file (such as "deno.json", "jsr.jsonc", "package.json", etc...),
	 * so that your project's import and export aliases can be resolved appropriately.
	*/
	runtimePackage?: RuntimePackage<any> | URL | string
}

/** configuration options for the {@link entryPluginSetup} esbuild-setup factory function. */
export interface EntryPluginSetupConfig {
	/** specify the regex filters to use for your initial-data-injection and path-resolver plugin.
	 * 
	 * @defaultValue `[RegExp(".*"),]` (captures all input entities)
	*/
	filters: RegExp[]

	/** {@inheritDoc InitialPluginData} */
	pluginData?: Partial<InitialPluginData>

	/** specify if you wish for the dependencies of the captured `"entry-points"` to be captured as well?
	 * 
	 * _why_? you ask? that's because esbuild's native loaders do not propagate the `pluginData` passed by the resolver, onto the dependency entities.
	 * this means that the initial-data will be lost when a dependency of an entry-point is being resolved, due to esbuild's native loader not preserving it.
	 * thus, our plugin will have to keep track of which entities it has already pushed its initial-data onto,
	 * and then be on the lookout for dependency entities that come from an importer file that has had the initial-data injected into it,
	 * so that this dependency entity can also be injected with the same initial-data.
	 * 
	 * if you don't want the initial-data to be injected onto the entry-point's dependencies (and deep grandchildren dependencies),
	 * make sure to turn off this option, otherwise it'll be enabled by default.
	 * 
	 * @defaultValue `true`
	*/
	captureDependencies: boolean

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
	pluginData: undefined,
	captureDependencies: true,
	acceptNamespaces: defaultEsbuildNamespaces,
}

/** this filter plugin intercepts all entities, injects plugin-data (if the entrity is an entry-point, or a dependency thereof),
 * and then makes them go through the {@link resolverPlugin} set of resolvers, in order to obtain the absolute path to the resource.
 * 
 * for more details see the submodule comments: {@link "plugins/filters/entry"}.
*/
export const entryPluginSetup = (config?: Partial<EntryPluginSetupConfig>): EsbuildPluginSetup => {
	const
		{ filters, pluginData: _initialPluginData, captureDependencies, acceptNamespaces: _acceptNamespaces } = { ...defaultEntryPluginSetup, ...config },
		acceptNamespaces = new Set([..._acceptNamespaces, PLUGIN_NAMESPACE.LOADER_HTTP]),
		captured_resolved_paths = new Set<string>(),
		ALREADY_CAPTURED_BY_INJECTOR: unique symbol = Symbol(),
		ALREADY_CAPTURED_BY_RESOLVER: unique symbol = Symbol()

	return async (build: EsbuildPluginBuild) => {
		const
			{ runtimePackage: initialRuntimePackage, ...rest_initialPluginData } = _initialPluginData ?? {},
			initialPluginData: Partial<CommonPluginData> = rest_initialPluginData

		build.onStart(async () => {
			// here we resolve the path to the "deno.json" file if `initialRuntimePackage` is either a url or a local path.
			// to resolve non-url-based file paths, we'll use the namespace of {@link resolverPlugin}
			// to carry out the path resolution inside of the {@link resolveRuntimePackage} function.
			initialPluginData.runtimePackage = await resolveRuntimePackage(build, initialRuntimePackage)
		})

		const entryPluginDataInjector: OnResolveCallback = async (args: OnResolveArgs) => {
			// if the plugin marker already exists for this entity, then we've already processed it once,
			// therefore we should return `undefined` so that we don't end in an infinite onResolve recursion.
			// this way, the next resolver registered to esbuild (or its native resolver) will take up the task for resolving this entity.
			if ((args.pluginData ?? {})[ALREADY_CAPTURED_BY_INJECTOR]) { return }
			// moreover, if the entity explicitly does not want to use the initial plugin-data injection for itself, then we'll not do so.
			// as a consequence, all of this entity's dependency will also lose the ability to acquire the initial plugin-data,
			// since their parent `args.importer` will not be registered onto `captured_resolved_paths` (even if they don't have `useInitialPluginData` set to `false`).
			if (args.pluginData?.resolverConfig?.useInitialPluginData === false) { return }
			// NOTE: for some reason, not specifying the `namespace` in the `build.onResolve` function, or setting it to just `""` will capture ALL namespaces!
			//   which is why it is absolutely essential to use the validation below,
			//   otherwise these resolvers will even capture the `PLUGIN_NAMESPACE.RESOLVER_PIPELINE` namespace, resulting in an infinite loop.
			if (!acceptNamespaces.has(args.namespace)) { return }
			const
				{ path, pluginData = {}, ...rest_args } = args,
				merged_plugin_data = { ...initialPluginData, ...pluginData, [ALREADY_CAPTURED_BY_INJECTOR]: true },
				{ kind, importer } = rest_args

			// if the `kind` is not an entrypoint, nor is the `importer` one of the files that has been previously captured for initial-data injection,
			// then skip, since this plugin is intended to insert plugin data only to entry points, and their dependencies.
			if (kind !== "entry-point" && !captured_resolved_paths.has(normalizePath(importer))) { return }

			// below, we implicitly (hope to) call the `absolutePathResolver`, so long as no other "capture-all" plugin exists before this plugin.
			const resolved_result = await build.resolve(path, { ...rest_args, pluginData: merged_plugin_data })
			// if esbuild's native resolver had resolved the `path`, then the `merged_plugin_data` that we just inserted WILL be lost.
			// i.e. `resolved_result.pluginData === undefined` if esbuild's native resolver took care of the path-resolution.
			// in such cases, we would like to re-insert our `merged_plugin_data` again, before returning the result
			if (resolved_result.pluginData === undefined) { resolved_result.pluginData = merged_plugin_data }
			// if we intend to capture the dependencies of this entity for `pluginData` injection operation,
			// then we must add this entity's path to `captured_resolved_paths`, so that entities with the same `args.importer`
			// can be identified as dependencies of this entity, and thereby be injected.
			if (captureDependencies) { captured_resolved_paths.add(normalizePath(resolved_result.path)) }
			// NOTICE: unlike `absolutePathResolver`, we intentionally do not remove the `ALREADY_CAPTURED_BY_INJECTOR` marker from the result,
			//   because any plugin-data preserving loader-function or resolver-function will also keep our injected `pluginData` intact,
			//   hence there would be no need to re-inject the plugin-data (since it might also break stuff, like if we intentionally omit a plugin data in a loader).
			//   however, for non-plugin-data preserving plugins (such as esbuild's native loader and resolvers), they would strip away our marker themselves,
			//   leading us to re-inject the initial plugin-data upon its re-discovery (or the discovery of one of its dependencies).
			return resolved_result
		}

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
			// if esbuild's native resolver had resolved the `path`, then the `merged_plugin_data` that we just inserted WILL be lost.
			// i.e. `resolved_result.pluginData === undefined` if esbuild's native resolver took care of the path-resolution.
			// in such cases, we would like to re-insert our `merged_plugin_data` again, before returning the result
			if (resolved_result.pluginData === undefined) { resolved_result.pluginData = next_pluginData }
			// we must also disable the `ALREADY_CAPTURED_BY_RESOLVER` marker, since the `resolved_result` is ready to go to the loader,
			// however, we don't want the dependencies (which will inherit the `pluginData`) to have their capture marker set to `true`,
			// since they haven't actually been captured by this resolver yet.
			resolved_result.pluginData = { ...resolved_result.pluginData, [ALREADY_CAPTURED_BY_RESOLVER]: false }
			return resolved_result
		}

		for (const filter of filters) {
			build.onResolve({ filter }, entryPluginDataInjector)
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
 * then creates a {@link DenoPackage} instance of out of it (which is needed for the initial `pluginData`, and then inherited by the dependencies).
*/
const resolveRuntimePackage = async (build: EsbuildPluginBuild, initialRuntimePackage: InitialPluginData["runtimePackage"]): Promise<RuntimePackage<any> | undefined> => {
	const
		denoPackageJson_exists = initialRuntimePackage !== undefined,
		denoPackageJson_isRuntimePackage = initialRuntimePackage instanceof RuntimePackage,
		denoPackageJson_url = (!denoPackageJson_exists || denoPackageJson_isRuntimePackage) ? undefined
			: isString(initialRuntimePackage)
				? resolveAsUrl((await build.resolve(initialRuntimePackage, {
					kind: "entry-point",
					namespace: PLUGIN_NAMESPACE.RESOLVER_PIPELINE,
					pluginData: { resolverConfig: { useInitialPluginData: false, useNodeModules: false } } satisfies CommonPluginData,
				})).path)
				: initialRuntimePackage
	const denoPackage = !denoPackageJson_exists ? undefined
		: denoPackageJson_isRuntimePackage ? initialRuntimePackage
			: await DenoPackage.fromUrl(denoPackageJson_url!)
	return denoPackage
}
