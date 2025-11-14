import { getRuntimeCwd, identifyCurrentRuntime } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/crossenv.js"
import { ensureEndSlash, ensureFileUrlIsLocalPath, ensureStartDotSlash, getUriScheme, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/pathman.js"
import { isString } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/struct.js"
import type { RelativePathResolverConfig } from "./plugins/resolvers.js"


export { array_isArray, array_isEmpty, dom_decodeURI, json_parse, json_stringify, number_isFinite, number_parseInt, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_all, promise_outside, promise_resolve } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/alias.js"
export { bind_array_push, bind_map_get, bind_map_has, bind_map_set } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/binder.js"
export { InvertibleMap, invertMap } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/collections.js"
export { execShellCommand, identifyCurrentRuntime, RUNTIME } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/crossenv.js"
export { memorize } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/lambda.js"
export { ensureEndSlash, ensureFileUrlIsLocalPath, ensureStartDotSlash, fileUrlToLocalPath, getUriScheme, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/pathman.js"
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/semver.js"
export { escapeLiteralStringForRegex, jsoncRemoveComments, replacePrefix, replaceSuffix } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/stringman.js"
export { constructorOf, isArray, isObject, isString } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/struct.js"
export type { ConstructorOf, DeepPartial, MaybePromise, Optional } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/typedefs.js"
export type * as esbuild from "./deps/jsr.io/@oazmi/esbuild-types/0.27.0/src/mod.js"

/** flags used for minifying (or eliminating) debugging logs and asserts, when an intelligent bundler, such as `esbuild`, is used. */
export const enum DEBUG {
	LOG = 1,
	ASSERT = 1,
	ERROR = 0,
	PRODUCTION = 1,
	MINIFY = 0,
}

// below is a custom path segment's absoluteness test function that will identify all `UriScheme` segments that are not "relative" as absolute paths,
export const isAbsolutePath = (segment: string): boolean => {
	const scheme = getUriScheme(segment) ?? "relative"
	return scheme !== "relative"
}

// this function helps with testing if a given path segment is guaranteed to be a relative path segment (i.e. begins with "./" or "../").
export const isCertainlyRelativePath = (segment: string): boolean => {
	return segment.startsWith("./") || segment.startsWith("../")
}

/** see {@link RelativePathResolverConfig.resolvePath} for details. */
export const resolveResourcePathFactory = (
	absolute_current_dir: string | (() => string),
	absolute_segment_test_fn: (segment: string) => boolean = isAbsolutePath,
): ((path?: string | undefined, importer?: string | undefined) => string) => {
	const path_resolver = resolvePathFactory(absolute_current_dir, absolute_segment_test_fn)
	return (path?: string | undefined, importer?: string | undefined): string => {
		// to obtain a resolved path, we perform four checks:
		// 1. if no path was provided, then we shall return the current working directory.
		if (!path) { return path_resolver() }
		// 2. if the path begins with a leading slash, then we treat it as a root path, and join it with the importer's domain.
		if (path.startsWith("/") && importer) { return ensureFileUrlIsLocalPath(resolveAsUrl(path, importer)) }
		// 3. otherwise, if it is an absolute path of some other kind, we simply return it as is (after ensuring posix separators are being used).
		if (isAbsolutePath(path)) { return pathToPosixPath(path) }
		// 4. finally, for all relative paths, we join them with their importer.
		const relative_path = ensureStartDotSlash(path)
		if (importer) { return path_resolver(importer, relative_path) }
		return path_resolver(relative_path)
	}
}

/** global configuration for all `fetch` calls. */
export const defaultFetchConfig: RequestInit = { redirect: "follow", cache: "force-cache" }

export const
	defaultGetCwd: string = /*@__PURE__*/ ensureEndSlash(pathToPosixPath(getRuntimeCwd(identifyCurrentRuntime(), true))),
	defaultResolvePath = /*@__PURE__*/ resolveResourcePathFactory(defaultGetCwd, isAbsolutePath)

export const noop = (() => undefined)

export const urlToString = (url: string | URL): string => { return isString(url) ? url : url.href }

/** fetch multiple urls sequentially, and return the first successful response (i.e. http-code 200).
 * 
 * when none of the response is successful, an `undefined` is returned.
*/
export const fetchScan = async (urls: (string | URL)[], init?: RequestInit): Promise<Response | undefined> => {
	for (const url of urls) {
		const response = await fetch(url, { ...defaultFetchConfig, ...init }).catch(noop)
		if (response?.ok) { return response }
		await response?.body?.cancel()
	}
}

export const fetchScanUrls = async (urls: (string | URL)[], init?: RequestInit): Promise<string | undefined> => {
	const valid_response = await fetchScan(urls, init)
	if (valid_response) {
		const url = valid_response.url
		// it is necessary to cancel the response's body to avoid memory leaks.
		valid_response.body?.cancel()
		return url
	}
}
