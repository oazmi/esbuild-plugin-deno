import { getRuntimeCwd, identifyCurrentRuntime } from "@oazmi/kitchensink/crossenv"
import { ensureEndSlash, ensureFileUrlIsLocalPath, ensureStartDotSlash, getUriScheme, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "@oazmi/kitchensink/pathman"
import type { RelativePathResolverConfig } from "./plugins/resolvers.js"


export { array_isEmpty, dom_decodeURI, json_parse, json_stringify, number_isFinite, number_parseInt, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_outside, promise_resolve } from "@oazmi/kitchensink/alias"
export { bind_array_push, bind_map_get, bind_map_has, bind_map_set } from "@oazmi/kitchensink/binder"
export { InvertibleMap, invertMap } from "@oazmi/kitchensink/collections"
export { execShellCommand, identifyCurrentRuntime, RUNTIME } from "@oazmi/kitchensink/crossenv"
export { memorize } from "@oazmi/kitchensink/lambda"
export { ensureEndSlash, ensureFileUrlIsLocalPath, ensureStartDotSlash, fileUrlToLocalPath, getUriScheme, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "@oazmi/kitchensink/pathman"
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying } from "@oazmi/kitchensink/semver"
export { escapeLiteralStringForRegex, jsoncRemoveComments, replacePrefix, replaceSuffix } from "@oazmi/kitchensink/stringman"
export { isArray, isObject, isString } from "@oazmi/kitchensink/struct"
export type { ConstructorOf, MaybePromise, Optional } from "@oazmi/kitchensink/typedefs"
export type * as esbuild from "esbuild"

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

// TODO: import the fixed the implementation from kitchensink
export type DeepPartial<T> = T extends (Function | Array<any> | String | BigInt | Number | Boolean | Symbol | URL | Map<any, any> | Set<any>)
	? T : T extends Record<string, any>
	? { [P in keyof T]?: DeepPartial<T[P]> } : T
