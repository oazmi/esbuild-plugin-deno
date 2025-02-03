import { getUriScheme, resolvePathFactory } from "@oazmi/kitchensink/pathman"


export { json_parse, json_stringify, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_resolve } from "@oazmi/kitchensink/alias"
export { InvertibleMap, invertMap } from "@oazmi/kitchensink/collections"
export { ensureEndSlash, ensureStartDotSlash, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, resolveAsUrl } from "@oazmi/kitchensink/pathman"
export { replacePrefix, replaceSuffix } from "@oazmi/kitchensink/stringman"
export { isString } from "@oazmi/kitchensink/struct"
export type { ConstructorOf, Optional } from "@oazmi/kitchensink/typedefs"
export { parse as jsoncParse } from "@std/jsonc"
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying, parse as semverParse, parseRange as semverParseRange, format as semverToString } from "@std/semver"
export type * as esbuild from "npm:esbuild@0.24.2"

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
	// the condition below will identify node imports such as `"node:http"` and `"node:fs"` as absolute.
	// thereby the default path resolvers of the plugin will not join import paths like `"node:http"` with the path of `args.importer` or `args.resolveDir`.
	// this in turn will allow esbuild's native resolver to intercept this path inside of the "unResolver" function (when `build.resolve` is called).
	if (segment.startsWith("node:")) { return true }
	const scheme = getUriScheme(segment) ?? "relative"
	return scheme !== "relative"
}

export const
	getCwd = () => Deno.cwd(),
	defaultResolvePath = resolvePathFactory(getCwd, isAbsolutePath)

export const
	textEncoder = new TextEncoder(),
	textDecoder = new TextDecoder()
