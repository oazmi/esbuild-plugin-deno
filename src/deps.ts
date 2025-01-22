import { getUriScheme, resolvePathFactory } from "@oazmi/kitchensink/pathman"


export { json_stringify, object_entries, response_json } from "@oazmi/kitchensink/alias"
export { InvertibleMap, invertMap } from "@oazmi/kitchensink/collections"
export { ensureEndSlash, ensureStartDotSlash, joinPaths, parseFilepathInfo, parsePackageUrl, resolveAsUrl } from "@oazmi/kitchensink/pathman"
export type { Optional } from "@oazmi/kitchensink/typedefs"
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
	const scheme = getUriScheme(segment) ?? "relative"
	return scheme !== "relative"
}

export const
	getCwd = () => Deno.cwd(),
	defaultResolvePath = resolvePathFactory(getCwd, isAbsolutePath)

export const
	textEncoder = new TextEncoder(),
	textDecoder = new TextDecoder()
