/** a submodule containing common utility functions used by most plugins.
 * 
 * @module
*/

import { DEBUG, defaultFetchConfig, ensureEndSlash, ensureStartDotSlash, joinPaths, json_stringify, pathToPosixPath, resolveAsUrl, type esbuild } from "../deps.ts"
import { resolvePathFromImportMap } from "../importmap/mod.ts"
import type { ImportMap } from "../importmap/typedefs.ts"
import { guessHttpResponseLoaders } from "../loadermap/mod.ts"
import type { RuntimePackage } from "../packageman/base.ts"
import type { CommonPluginData, CommonPluginLoaderConfig, CommonPluginResolverConfig } from "./typedefs.ts"


/** a factory function that returns a general purpose path resolver function for your esbuild plugin, tuned to your specific `config`.
 * 
 * given a certain esbuild {@link esbuild.OnResolveArgs | `args`}, and your expected resolved {@link esbuild.OnResolveResult | `result`}
 * here is what the returned resolver function takes care of:
 * 1. figure out the absolute resolved `result.path`:
 * - if `args.parse` is an absolute path (i.e. when `config.isAbsolutePath(args.parse) === true`), then it will be returned as is.
 * - if `args.parse` is a relative path (i.e. when `config.isAbsolutePath(args.parse) === false`), then:
 *   - we figure out the absolute parent directory `dir`, by:
 *     - joining `args.importer` with `args.resolveDir` (via `config.resolvePath`) if `args.importer` is not absolute.
 *     - otherwise set `dir` to `args.importer` if it is absolute.
 *   - join `dir` with `args.parse` using `config.resolvePath` and return it as `result.path`.
 * 2. take care of namespace:
 * - set `result.namespace` to `config.namespace`
 * - backup the  original namespace `args.namespace` to `config.pluginData.originalNamespace`
 * 3. inherit import maps from plugin data:
 * - set `result.pluginData.importMap` to `args.pluginData.importMap` (which is originally set by the loaders of our typical plugin)
 * 
 * @param config provide a configuration for this factory function.
 * @returns a path resolver function that can be passed to {@link esbuild.PluginBuild.onResolve}.
 *   the resolver function will resolve any relative paths to absolute ones, and set the namespace to `config.namespace`.
*/
export const onResolveFactory = (
	config: CommonPluginResolverConfig,
): ((args: esbuild.OnResolveArgs) => Promise<esbuild.OnResolveResult>) => {
	const { isAbsolutePath, namespace: plugin_ns, resolvePath, log = false, globalImportMap = {} } = config

	// this function is meant to resolve paths that are either absolute or relative: http-urls, file-uris, or filesystem paths.
	return async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult> => {
		// NOTE:
		// - `args.path` is absolute when the entity is an entry point
		// - `args.path` is _possibly_ relative when the entity is imported by a another entity
		// - `args.resolveDir` is almost always an empty string, or a malformed/non-existing path, UNLESS what is being loaded is a node module package.
		const
			{ path, resolveDir, importer, namespace, pluginData = {} } = args,
			originalNamespace = namespace,
			importMap = { ...globalImportMap, ...pluginData.importMap } as ImportMap,
			runtimePackage = pluginData.runtimePackage as RuntimePackage<any> | undefined
		let resolved_path: string | undefined = undefined

		if (runtimePackage && !path.startsWith("./") && !path.startsWith("../")) {
			// if the input `path` is an import being performed inside of a package, in addition to not being a relative import,
			// then use the package manager to resolve the imported path.
			resolved_path = runtimePackage.resolveImport(path)
		}

		if (resolved_path === undefined) {
			// if there was no package manager, or if it could not resolve our `path`, then try using the `importMap` for resolving.
			resolved_path = resolvePathFromImportMap(path, importMap)
		}

		if (resolved_path === undefined) {
			// the input `path` is neither resolvable by the `runtimePackage`, nor is it an alias key of the full `importMap`.
			// thus, we need to resolve `path` by traditional means.
			const dir = isAbsolutePath(importer)
				? importer
				: joinPaths(ensureEndSlash(resolveDir), importer)
			resolved_path = isAbsolutePath(path)
				? pathToPosixPath(path) // I don't want to see ugly windows back-slashes in the esbuild resolved-path comments and metafile
				: resolvePath(dir, ensureStartDotSlash(path))
		}

		if (DEBUG.LOG && log) { console.log(`[${plugin_ns}] onResolve:`, { path, resolved_path, args, importMap }) }
		return {
			path: resolved_path,
			namespace: plugin_ns,
			// TODO: should I also embed `importMap` into `pluginData` after `...pluginData`?
			//   doing so would let us propagate our `globalImportMap` to all dependencies,
			//   without them needing to be resolved specifically by _this_ resolver function.
			//   but it may have unintended consequences, so I'll leave it out for now.
			// NOTICE: I am intentionally letting any potential `pluginData.originalNamespace` overwrite the `originalNamespace` variable.
			//   this is because I want the very first namespace to persevere even if the current `path` that is currently being resolved
			//   goes through several recursive calls (i.e. ping-pongs) between `onResolveFactory`s and `unResolveFactory`s.
			pluginData: { originalNamespace, ...pluginData } satisfies CommonPluginData
		}
	}
}

/** a path resolution factory function for {@link esbuild.PluginBuild.onResolve},
 * similar to {@link onResolveFactory}, but it "unhooks" any current `args.namespace`.
 * 
 * given a certain esbuild {@link esbuild.OnResolveArgs | `args`}, and your expected resolved {@link esbuild.OnResolveResult | `result`},
 * here is how the returned resolver function works:
 * 1. strips out the current `args.namespace` and replaces it with the backedup original one in `args.pluginData.originalNamespace`
 *    (assuming it exists, otherwise the namespace will become `undefined`).
 * 2. the absolute path of the input `args` is resolved using the same mechanism in the returned function of the {@link onResolveFactory} factory.
 * 3. we call {@link build["resolve"] | `build.resolve`} with the `namespace` set to `args.pluginData.originalNamespace`,
 *    so that it resolves naturally, by giving other plugins the chance to intercept it (including esbuild's native file resolution and built-in "node_module" resolution).
 * 4. the naturally resolved `result` is then returned, thereby changing the potential `build.onLoad` loader function that esbuild will then call
 *    (that's because `result.namespace` could possibly shift to something different from the initial `arg.namespace`,
 *    thereby our plugin's path-resolution and path-loading will not remain in a continuous cycle of the same namespace,
 *    since it'll give other plugins the chance to resolve and load it as well).
 * 
 * @param config provide a configuration similar to the configuration provided to the {@link unResolveFactory} function that you are trying to "unresolve"/"unhook" from.
 * @param build provide the current plugin setup's `build: esbuild.PluginBuild` parameter,
 *   so that returned unresolver function can call `build.resolve(...)` in order to acquire the natural resolved results from potentially external plugins (or the native behavior).
 * @returns a path resolver function, under a specific `namespace`, that can be passed to {@link esbuild.PluginBuild.onResolve}, so that the namespace can be stripped away,
 *   and so that the path and `args` can be resolved naturally by other plugins or by esbuild's file native resolver.
*/
export const unResolveFactory = (
	config: CommonPluginResolverConfig,
	build: esbuild.PluginBuild,
): ((args: esbuild.OnResolveArgs) => Promise<esbuild.OnResolveResult>) => {
	const
		{ log, namespace: plugin_ns } = config,
		on_resolve_fn = onResolveFactory({ ...config, log: false, namespace: "oazmi-unresolver-namespace-does-not-matter" })

	// this function resolves either an absolute or relative http href link (provided in the `args`)
	return async (args: esbuild.OnResolveArgs): Promise<esbuild.OnResolveResult> => {
		const {
			path,
			namespace: _0,
			pluginData: {
				importMap,
				runtimePackage,
				originalNamespace: namespace,
				...restPluginData
			} = {} satisfies Partial<CommonPluginData>,
			...rest_args
		} = args
		// TODO: merge the current `pluginData.importMap` with `globalImportMap`.
		//   or should we? since `on_resolve_fn` would be aware of this `globalImportMap` anyway.
		const {
			path: resolved_abs_path,
			namespace: _1,
			pluginData: _2,
			...rest_resolved_args
		} = await on_resolve_fn({ path, namespace, ...rest_args, pluginData: { importMap, runtimePackage } })
		const naturally_resolved_result = await build.resolve(resolved_abs_path!, {
			...rest_args,
			namespace,
			pluginData: { importMap, runtimePackage, ...restPluginData },
		})
		if (DEBUG.LOG && log) { console.log(`[${plugin_ns}] unResolve:`, { path, resolved_abs_path, naturally_resolved_result, rest_resolved_args }) }
		return { ...rest_resolved_args, ...naturally_resolved_result }
	}
}

const all_esbuild_loaders: Array<esbuild.Loader> = [
	"base64", "binary", "copy", "css", "dataurl",
	"default", "empty", "file", "js", "json",
	"jsx", "local-css", "text", "ts", "tsx",
]

/** a factory function that returns a general purpose url content loading function for your esbuild plugin, tuned to your specific `config`.
 * 
 * for the content to be correctly fetched and loaded, your `args.path` **must** be in one of the following formats:
 * - an `"http://"` or an `"https://"` url
 * - a `"file://"` url
 * - or, an absolute local file path (such as `"/home/bin/..."` or `"C:/Users/..."`)
 * 
 * make sure that the path is **not** a relative path (even if it's relative to the current working directory).
 * 
 * > [!important]
 * > esbuild identifies redundant/duplicate resources by their _resolved path_ and _namespace_ .
 * > if the same resource is being bundled but with either a different resolved path, or under a different namespace,
 * > then esbuild will consider them to be separate resources, instead of being one and the same.
 * > thus, it is extremely crucial that you prepare a uniquely-idenfifiable resolved path in the plugin's resolver,
 * > rather than delaying its resolution in the plugin's loader.
 * > 
 * > in other words, for best results minifiable results, you should resolve the following things in the plugin's resolver, rather than the plugin's loader:
 * > - a path that is an alias inside the current import map, should be resolved to absolute an path (i.e. preferebly an `http://` or `file://` path)
 * > - jsr and npm specifiers (such as `jsr:@scope/package/pathname`) should also be resolved to http paths.
 * > - if you are caching jsr/npm/http resources on your local filesystem, you should _still_ resolve the resources by their absolute http paths,
 * >   and then check for the cached resource's existence in the filesystem inside the plugin's loader function.
 * >   do not _resolve_ to a local filesystem path if cached resources are detected, since it will break equivalency of referenced resource's resolved path.
 * > 
 * > typically, the unique key that esbuild uses for identifiying redundant/duplicate resource references is of the following template:
 * > `${resolver_result.namespace}:${resolver_result.path}`
 * > 
 * > where `resolver_result` is of kind {@link esbuild.OnResolveResult}.
 * > 
 * > this key also becomes the key of the resource in the output metadata object (if it is enabled).
 * 
 * > [!caution]
 * > based on some logging tests, I've verified that esbuild does indeed memorize the result of an `onLoad`'s callback.
 * > this means that it is possible for inconsistencies to occur in your `pluginData`, when the dependency paths are being resolved.
 * > but I will say that it is hard to imagine if this could ever become an issue, since the dependencies will also be loaded _only once_ .
 * > although, the next time something other than the original dependant, requires the same dependency file,
 * > the new `pluginData` (i.e. potentially different) of the new dependant will not be conveyed to the loader (since its results are cached by esbuild).
 * 
 * @param config provide a configuration to customize some aspects of the returned loader function.
 * @returns a url loader function that can be passed to {@link esbuild.PluginBuild.onLoad},
 *   so that it can fetch the contents of url-based paths when esbuild intercept 
*/
export const urlLoaderFactory = (
	config: CommonPluginLoaderConfig
): ((args: esbuild.OnLoadArgs) => Promise<esbuild.OnLoadResult>) => {
	const
		{ defaultLoader, namespace: plugin_ns, acceptLoaders = all_esbuild_loaders, log = false } = config,
		accept_loaders_set = new Set(acceptLoaders)

	return async (args: esbuild.OnLoadArgs) => {
		// `args.path` is absolute when the entity is an entry point.
		// `args.path` is _possibly_ relative when the entity is imported by a another entity,
		// and the resolver preceding this `onLoad` function has not generated an absolute path.
		const
			{ path, pluginData } = args,
			path_url = resolveAsUrl(path),
			response = await fetch(path_url, defaultFetchConfig)
		if (!response.ok) {
			throw new Error(`[${plugin_ns}] onLoadUrl: ERROR: network fetch response for url "${path_url.href}" was not ok (${response.status}). response header:\n${json_stringify(response.headers)}`)
		}
		const
			guessed_loaders = guessHttpResponseLoaders(response),
			available_loaders = accept_loaders_set.intersection(guessed_loaders),
			preferred_loader = [...available_loaders].at(0) ?? defaultLoader,
			contents = await response.bytes()
		if (DEBUG.LOG && log) { console.log(`[${plugin_ns}] onLoadUrl:`, { path, path_url: path_url.href, guessed_loaders, preferred_loader, args }) }
		return {
			contents,
			loader: preferred_loader,
			// unfortunately, if we set the `resolveDir` to anything but an empty string, then it will be appended to the
			// previous `resolveDir` of the resolver. even if provide an absolute path value to it, it still joins it up.
			// I think the intention behind `resolveDir` is to set the OUTPUT relative directory,
			// and not that we're trying to specify the current working/loading directory.
			// but it still doesn't work (i.e. I am unable to manipulate the output dir via this option).
			// resolveDir: resolveAsUrl("./", path).href,
			pluginData,
		}
	}
}
