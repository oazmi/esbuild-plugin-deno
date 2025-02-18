/** utility submodule for identifying an http response's mime type ("content-type" header), and mapping it to an esbuild loader.
 * 
 * TODO: currently, the mime and extension to esbuild loader mapping is immutable.
 *   the end user might benefit more if they could directly modify it,
 *   instead of only being able to modify it via `mimeTypeLoaderMap` and `extensionTypeLoaderMap`.
 *   but on the other hand, making them immutable would mean that we will not be able to use a an `InvertibleMap` class,
 *   and instead have to always generate the inverse map on every call to `guessMimeLoaders`, which is highly inefficient.
 *   or alternatively, we might have to store the data in an inverted map in the first place to prevent the need for inverting.
 *   but that will make its representation quite ugly.
 * 
 * @module
*/

import { InvertibleMap, type esbuild, object_entries, parseFilepathInfo } from "../deps.js"
import extensionMap from "./extensions.js"
import mimeMap from "./mimes.js"


export type MimeType = string
export type ExtensionType = string

const mime_map_entries = object_entries(mimeMap).map(([loader_name, mime_types]): [esbuild.Loader, Set<MimeType>] => {
	return [loader_name as esbuild.Loader, new Set(mime_types)]
})
const extension_map_entries = object_entries(extensionMap).map(([loader_name, extension_types]): [esbuild.Loader, Set<ExtensionType>] => {
	return [loader_name as esbuild.Loader, new Set(extension_types)]
})

/** a pre-defined invertible-mapping between http-header `"content-type"` (aka mime-type) and esbuild's default loader selection.
 * 
 * the mapping definitions are located in the {@link mimeMap | `./mimes.json`} file.
*/
export const mimeTypeLoaderMap: InvertibleMap<esbuild.Loader, string> = new InvertibleMap<esbuild.Loader, MimeType>(new Map(mime_map_entries))

/** a pre-defined invertible-mapping between path-extensions (suffix) and esbuild's default loader selection.
 * 
 * the mapping definitions are located in the {@link extensionMap | `./extensions.json`} file.
*/
export const extensionTypeLoaderMap: InvertibleMap<esbuild.Loader, string> = new InvertibleMap<esbuild.Loader, ExtensionType>(new Map(extension_map_entries))

/** guesses the potential esbuild loader types for a given mime type.
 * 
 * @param content_type the mime string that you wish to guess the loader of
 * @returns a set of possible esbuild loaders appropriate for the given `content_type` mime.
*/
export const guessMimeLoaders = (content_type: string): Set<esbuild.Loader> | undefined => {
	// first we normalize the mime string by discarding everything that comes after the semicolon (since it contains optional parameters).
	// and then we trim any whitespaces and set all characters to lowercase.
	const
		[mime_type, ...rest] = content_type.split(";"),
		normalized_mime_type = mime_type.trim().toLowerCase()
	return mimeTypeLoaderMap.rget(normalized_mime_type)
}

/** guesses the potential esbuild loader types for a given mime type.
 * 
 * @param content_type the mime string that you wish to guess the loader of
 * @returns a set of possible esbuild loaders appropriate for the given `content_type` mime.
*/
export const guessExtensionLoaders = (file_path: string): Set<esbuild.Loader> | undefined => {
	// we need a special case for ".module.css" extension because `parseFilepathInfo` would only return ".css" as its `extname`.
	const file_extension: ExtensionType = file_path.endsWith(".module.css")
		? ".module.css"
		: parseFilepathInfo(file_path).extname
	return extensionTypeLoaderMap.rget(file_extension)
}

/** given an http response, this function guesses the appropriate {@link esbuild.Loader | esbuild loaders} for it.
 * it does so by looking at the `"content-type"` header of the response, and also by inspecting the file extension of the request's url path.
 * 
 * @param response your http response object.
 * @returns a set of zero or more esbuild loaders that are accepted by the current http response.
*/
export const guessHttpResponseLoaders = (response: Response): Set<esbuild.Loader> => {
	const
		{ headers, url } = response,
		content_type = headers.get("content-type") ?? "",
		mime_loaders = guessMimeLoaders(content_type) ?? new Set(),
		extension_loaders = guessExtensionLoaders(url) ?? new Set()
	let common_loaders: Set<esbuild.Loader> = mime_loaders.intersection(extension_loaders)
	// if there is no intersection between `mime_loaders` and `extension_loaders`, then we will give preference to `extension_loaders`,
	// otherwise, if even that turns out to be empty, then we  will use the loaders from `mime_loaders`.
	if (common_loaders.size <= 0) { common_loaders = extension_loaders }
	if (common_loaders.size <= 0) { common_loaders = mime_loaders }
	return common_loaders
}
