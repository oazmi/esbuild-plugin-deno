/** this submodule contains type definitions used by the esbuild plugins.
 * 
 * @module
*/

import type { DEBUG, esbuild } from "../deps.js"
import type { ImportMap } from "../importmap/typedefs.js"
import type { RuntimePackage } from "../packageman/base.js"


/** this is the plugin data utilized by most plugins in this library. */
export interface CommonPluginData {
	/** specifies the original namespace of the link/path that is being transformed/resolved by one of our plugins.
	 * 
	 * this is needed because once a path is loaded (via {@link esbuild.PluginBuild.onLoad | `build.onLoad`}) in a certain namespace,
	 * any dependency paths of it will inherit the same namespace, and esbuild will only look for a resolver
	 * (i.e. {@link esbuild.PluginBuild.onResolve | `build.onResolve`}) that has its `namespace` set to the inherited namespace.
	 * 
	 * thus, to exit out of this namespace loop, we need this piece of information in order to restore the namespace back to the original,
	 * before one of our plugins' resolver captured it.
	 * 
	 * you may ask why would we want to exit out of our plugin's namespace?
	 * and that is because it would give other external plugins the chance to resolve the paths,
	 * should they have a correct filter for it (i.e. it is non-invasive).
	 * moreover, it would allow us to use a multitude of different namespaces for each of our own plugins,
	 * with no need for a hidden layer of collaboration between them.
	 * 
	 * > [!note]
	 * > the default namespace of esbuild should be `"file"`, however, I've come to observe that it is often just an empty string (`""`),
	 * > or simply `undefined`, when the namespace filter is not defined.
	 * > thus, when wanting to go back to the default namespace, it is best to either assign `undefined` or an empty string (`""`), instead of `"file"`.
	*/
	originalNamespace: string

	/** specifies the current scope's import-map aliases (which is usually just the global import-map).
	 * 
	 * these will need to be checked by the "unresolver" function to make sure that we don't exit out of our namespace,
	 * while being asked for resolving the path that is part of the current scope's import map.
	 * 
	 * the keys of this object hold the aliased name of the import, while the values hold the absolute path of the referenced resource.
	 * 
	 * for further reading on import maps, see {@link ImportMap}.
	*/
	importMap: ImportMap

	/** specifies the current scope's runtime package manager (such as deno, jsr, npm, node, etc...),
	 * so that the package's own import and export aliases can be resolved appropriately.
	*/
	runtimePackage?: RuntimePackage<any>
}

/** this is the common configuration interface for resolver functions of most plugins of this library. */
export interface CommonPluginResolverConfig {
	/** the namespace that the plugin should use.
	 * 
	 * if the plugin requires multiple namespaces, it should append additional characters to this base namespace for consistency and collision resistance.
	*/
	namespace: string

	/** enable logging of the input arguments and resolved paths, when {@link DEBUG.LOG} is ennabled.
	 * 
	 * @defaultValue `false`
	*/
	log?: boolean

	/** specify a global import-map for aliases to resources.
	 * 
	 * the full import-map within the body of the resolver function should be a merger between _this_ global import-map,
	 * and the import-map acquired from the plugin data (i.e. {@link CommonPluginData.importMap}).
	 * the plugin data's import-map will take a higher priority in case of conflicting key (i.e. same alias key but different absolute path values).
	 * 
	 * the resolve function will always look for a match for `args.path` inside of the import-map,
	 * before resolving it with respect to the current importer or resolve-directory (i.e. `args.importer` or `args.resolveDir`).
	 * 
	 * @defaultValue `{}` (empty object/dictionary)
	*/
	globalImportMap?: ImportMap

	/** a function that joins/resolves path segments to an absolute path (i.e. a path that the plugin itself can recognize as an absolute path).
	 * 
	 * typically, only two or one segments are provided at a time, but it's better if your function accepts variable number of segments.
	*/
	resolvePath: (...segments: string[]) => string

	/** a function that declares whether or not a given path segment is an absolute path (i.e. the plugin itself recognizes it as an absolute path). */
	isAbsolutePath: (segment: string) => boolean
}

/** this is the common configuration interface for loader functions of most plugins of this library. */
export interface CommonPluginLoaderConfig {
	/** the namespace that the plugin should use. this value is only used for logging purposes, and nothing more. */
	namespace: string

	/** enable logging of the input arguments and preferred loader, when {@link DEBUG.LOG} is ennabled.
	 * 
	 * @defaultValue `false`
	*/
	log?: boolean

	/** the default loader that the plugin's loader should use for unidentified content types.
	 * 
	 * if you would like to use esbuild's _own_ default loader, set the value to `"default"`.
	*/
	defaultLoader: esbuild.Loader

	/** only accept the following subset of loaders when auto content-detection is used for guessing the loader type.
	 * 
	 * > [!note]
	 * > if there is no intersection between the set of guessed loaders, and this set of `acceptLoaders`,
	 * > then the default loader ({@link defaultLoader}) will be used as a fallback.
	 * 
	 * @defaultValue all available esbuild loaders
	*/
	acceptLoaders?: Array<esbuild.Loader>
}
