import { getRuntimeCwd, identifyCurrentRuntime } from "@oazmi/kitchensink/crossenv";
import { getUriScheme, resolvePathFactory } from "@oazmi/kitchensink/pathman";
export { json_parse, json_stringify, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_resolve } from "@oazmi/kitchensink/alias";
export { InvertibleMap, invertMap } from "@oazmi/kitchensink/collections";
export { getRuntimeCwd, identifyCurrentRuntime } from "@oazmi/kitchensink/crossenv";
export { ensureEndSlash, ensureStartDotSlash, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "@oazmi/kitchensink/pathman";
export { escapeLiteralStringForRegex, replacePrefix, replaceSuffix } from "@oazmi/kitchensink/stringman";
export { isString } from "@oazmi/kitchensink/struct";
export { parse as jsoncParse } from "@std/jsonc";
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying, parse as semverParse, parseRange as semverParseRange, format as semverToString } from "@std/semver";
/** flags used for minifying (or eliminating) debugging logs and asserts, when an intelligent bundler, such as `esbuild`, is used. */
export var DEBUG;
(function (DEBUG) {
    DEBUG[DEBUG["LOG"] = 1] = "LOG";
    DEBUG[DEBUG["ASSERT"] = 0] = "ASSERT";
    DEBUG[DEBUG["ERROR"] = 0] = "ERROR";
    DEBUG[DEBUG["PRODUCTION"] = 1] = "PRODUCTION";
    DEBUG[DEBUG["MINIFY"] = 1] = "MINIFY";
})(DEBUG || (DEBUG = {}));
// below is a custom path segment's absoluteness test function that will identify all `UriScheme` segments that are not "relative" as absolute paths,
export const isAbsolutePath = (segment) => {
    // TODO: delete the comments below
    // the condition below will identify node imports such as `"node:http"` and `"node:fs"` as absolute.
    // thereby the default path resolvers of the plugin will not join import paths like `"node:http"` with the path of `args.importer` or `args.resolveDir`.
    // this in turn will allow esbuild's native resolver to intercept this path inside of the "unResolver" function (when `build.resolve` is called).
    // if (segment.startsWith("node:")) { return true } // `getUriScheme` now identifies the "node:" specifier in `@oazmi/kitchensink@>=0.9.4`
    const scheme = getUriScheme(segment) ?? "relative";
    return scheme !== "relative";
};
/** global configuration for all `fetch` calls. */
export const defaultFetchConfig = { redirect: "follow", cache: "force-cache" };
export const defaultGetCwd = /*@__PURE__*/ getRuntimeCwd(identifyCurrentRuntime(), true), defaultResolvePath = /*@__PURE__*/ resolvePathFactory(defaultGetCwd, isAbsolutePath);
