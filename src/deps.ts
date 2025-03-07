import { dom_decodeURI } from "@oazmi/kitchensink/alias"
import { getRuntimeCwd, identifyCurrentRuntime } from "@oazmi/kitchensink/crossenv"
import { ensureEndSlash, getUriScheme, pathToPosixPath, resolvePathFactory } from "@oazmi/kitchensink/pathman"


export { dom_decodeURI, json_parse, json_stringify, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_outside, promise_resolve } from "@oazmi/kitchensink/alias"
export { InvertibleMap, invertMap } from "@oazmi/kitchensink/collections"
export { execShellCommand, identifyCurrentRuntime, RUNTIME } from "@oazmi/kitchensink/crossenv"
export { memorize } from "@oazmi/kitchensink/lambda"
export { ensureEndSlash, ensureStartDotSlash, getUriScheme, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "@oazmi/kitchensink/pathman"
export { escapeLiteralStringForRegex, replacePrefix, replaceSuffix } from "@oazmi/kitchensink/stringman"
export { isArray, isString } from "@oazmi/kitchensink/struct"
export type { ConstructorOf, MaybePromise, Optional } from "@oazmi/kitchensink/typedefs"
export { parse as jsoncParse } from "@std/jsonc"
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying, parse as semverParse, parseRange as semverParseRange, format as semverToString } from "@std/semver"
export type * as esbuild from "npm:esbuild@^0.25.0"

/** flags used for minifying (or eliminating) debugging logs and asserts, when an intelligent bundler, such as `esbuild`, is used. */
export const enum DEBUG {
	LOG = 1,
	ASSERT = 0,
	ERROR = 0,
	PRODUCTION = 1,
	MINIFY = 1,
}

// below is a custom path segment's absoluteness test function that will identify all `UriScheme` segments that are not "relative" as absolute paths,
export const isAbsolutePath = (segment: string): boolean => {
	const scheme = getUriScheme(segment) ?? "relative"
	return scheme !== "relative"
}

/** global configuration for all `fetch` calls. */
export const defaultFetchConfig: RequestInit = { redirect: "follow", cache: "force-cache" }

export const
	defaultGetCwd: string = /*@__PURE__*/ ensureEndSlash(pathToPosixPath(getRuntimeCwd(identifyCurrentRuntime(), true))),
	defaultResolvePath = /*@__PURE__*/ resolvePathFactory(defaultGetCwd, isAbsolutePath)

export const noop = (() => undefined)

const windows_local_path_correction_regex = /^[\/\\]([a-z])\:[\/\\]/i

export const fileUrlToLocalPath = (file_url?: URL): string | undefined => {
	if (!file_url?.protocol.startsWith("file:")) { return }
	// the `file_url.pathname` always starts with a leading slash, which is invalid for windows (at least esbuild doesn't recognize it).
	// thus we replace any leading slashes in any windows-looking path that we encounter, without actually consulting what os is being ran.
	const
		local_path_with_leading_slash = pathToPosixPath(dom_decodeURI(file_url.pathname)),
		corrected_local_path = local_path_with_leading_slash.replace(windows_local_path_correction_regex, "$1:/")
	return corrected_local_path
}

// TODO: import the fixed the implementation from kitchensink
export type DeepPartial<T> = T extends (Function | Array<any> | String | BigInt | Number | Boolean | Symbol)
	? T : T extends Record<string, any>
	? { [P in keyof T]?: DeepPartial<T[P]> } : T
