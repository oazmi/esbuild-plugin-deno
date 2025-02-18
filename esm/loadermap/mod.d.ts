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
import { InvertibleMap, type esbuild } from "../deps.js";
export type MimeType = string;
export type ExtensionType = string;
/** a pre-defined invertible-mapping between http-header `"content-type"` (aka mime-type) and esbuild's default loader selection.
 *
 * the mapping definitions are located in the {@link mimeMap | `./mimes.json`} file.
*/
export declare const mimeTypeLoaderMap: InvertibleMap<esbuild.Loader, string>;
/** a pre-defined invertible-mapping between path-extensions (suffix) and esbuild's default loader selection.
 *
 * the mapping definitions are located in the {@link extensionMap | `./extensions.json`} file.
*/
export declare const extensionTypeLoaderMap: InvertibleMap<esbuild.Loader, string>;
/** guesses the potential esbuild loader types for a given mime type.
 *
 * @param content_type the mime string that you wish to guess the loader of
 * @returns a set of possible esbuild loaders appropriate for the given `content_type` mime.
*/
export declare const guessMimeLoaders: (content_type: string) => Set<esbuild.Loader> | undefined;
/** guesses the potential esbuild loader types for a given mime type.
 *
 * @param content_type the mime string that you wish to guess the loader of
 * @returns a set of possible esbuild loaders appropriate for the given `content_type` mime.
*/
export declare const guessExtensionLoaders: (file_path: string) => Set<esbuild.Loader> | undefined;
/** given an http response, this function guesses the appropriate {@link esbuild.Loader | esbuild loaders} for it.
 * it does so by looking at the `"content-type"` header of the response, and also by inspecting the file extension of the request's url path.
 *
 * @param response your http response object.
 * @returns a set of zero or more esbuild loaders that are accepted by the current http response.
*/
export declare const guessHttpResponseLoaders: (response: Response) => Set<esbuild.Loader>;
//# sourceMappingURL=mod.d.ts.map