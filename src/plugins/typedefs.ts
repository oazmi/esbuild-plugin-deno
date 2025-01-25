/** this submodule contains type definitions used by the esbuild plugins.
 * 
 * @module
*/

import type { DEBUG, esbuild } from "../deps.ts"
import type { ImportMap } from "../importmap/typedefs.ts"


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

	/** specifies the current scope's import map aliases.
	 * 
	 * these will need to be checked by the "unresolver" function to make sure that we don't exit out of our namespace,
	 * while being asked for resolving the path that is part of the current scope's import map.
	 * 
	 * the keys of this object hold the aliased name of the import, while the values hold the absolute path of the referenced resource.
	 * 
	 * for further reading on import maps, see {@link ImportMap}.
	 * 
	 * TODO: this feature needs to be implemented, and I might need an efficient way to be able to tell whether a given path
	 *   string is a super-string of one of the import map keys.
	 * TODO: I should also merge the `exports` field of `deno.json` into the current scope's import map, since deno does allow
	 *   a package/library to self reference via one of the following (and it works even when offline):
	 *   - `@user/library` or `library` (i.e.  package json's (e.g. deno.json, package.json, jsr.json) `name` field)
	 *   - `jsr:@user/library`
	 *   - `jsr:@user/library@current_version`
	*/
	importMap: ImportMap
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
