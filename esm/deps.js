import { getRuntimeCwd, identifyCurrentRuntime } from "@oazmi/kitchensink/crossenv";
import { ensureEndSlash, getUriScheme, pathToPosixPath, resolvePathFactory } from "@oazmi/kitchensink/pathman";
export { dom_decodeURI, json_parse, json_stringify, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_outside, promise_resolve } from "@oazmi/kitchensink/alias";
export { bind_array_push } from "@oazmi/kitchensink/binder";
export { InvertibleMap, invertMap } from "@oazmi/kitchensink/collections";
export { execShellCommand, identifyCurrentRuntime, RUNTIME } from "@oazmi/kitchensink/crossenv";
export { memorize } from "@oazmi/kitchensink/lambda";
export { ensureEndSlash, ensureStartDotSlash, getUriScheme, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "@oazmi/kitchensink/pathman";
export { escapeLiteralStringForRegex, replacePrefix, replaceSuffix } from "@oazmi/kitchensink/stringman";
export { isArray, isObject, isString } from "@oazmi/kitchensink/struct";
export { parse as jsoncParse } from "@std/jsonc";
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying, parse as semverParse, parseRange as semverParseRange, format as semverToString } from "@std/semver";
/** flags used for minifying (or eliminating) debugging logs and asserts, when an intelligent bundler, such as `esbuild`, is used. */
export var DEBUG;
(function (DEBUG) {
    DEBUG[DEBUG["LOG"] = 1] = "LOG";
    DEBUG[DEBUG["ASSERT"] = 1] = "ASSERT";
    DEBUG[DEBUG["ERROR"] = 0] = "ERROR";
    DEBUG[DEBUG["PRODUCTION"] = 1] = "PRODUCTION";
    DEBUG[DEBUG["MINIFY"] = 1] = "MINIFY";
})(DEBUG || (DEBUG = {}));
// below is a custom path segment's absoluteness test function that will identify all `UriScheme` segments that are not "relative" as absolute paths,
export const isAbsolutePath = (segment) => {
    const scheme = getUriScheme(segment) ?? "relative";
    return scheme !== "relative";
};
/** global configuration for all `fetch` calls. */
export const defaultFetchConfig = { redirect: "follow", cache: "force-cache" };
export const defaultGetCwd = /*@__PURE__*/ ensureEndSlash(pathToPosixPath(getRuntimeCwd(identifyCurrentRuntime(), true))), defaultResolvePath = /*@__PURE__*/ resolvePathFactory(defaultGetCwd, isAbsolutePath);
export const noop = (() => undefined);
