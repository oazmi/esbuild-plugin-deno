export { array_isArray, array_isEmpty, dom_decodeURI, json_parse, json_stringify, number_isFinite, number_parseInt, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_all, promise_outside, promise_resolve } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/alias.js";
export { bind_array_push, bind_map_get, bind_map_has, bind_map_set } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/binder.js";
export { InvertibleMap, invertMap } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/collections.js";
export { execShellCommand, identifyCurrentRuntime, RUNTIME } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/crossenv.js";
export { memorize } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/lambda.js";
export { ensureEndSlash, ensureFileUrlIsLocalPath, ensureStartDotSlash, fileUrlToLocalPath, getUriScheme, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/pathman.js";
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/semver.js";
export { escapeLiteralStringForRegex, jsoncRemoveComments, replacePrefix, replaceSuffix } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/stringman.js";
export { constructorOf, isArray, isObject, isString } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/struct.js";
export type { ConstructorOf, DeepPartial, MaybePromise, Optional } from "./deps/jsr.io/@oazmi/kitchensink/0.9.15/src/typedefs.js";
export type * as esbuild from "./deps/jsr.io/@oazmi/esbuild-types/0.27.0/src/mod.js";
/** flags used for minifying (or eliminating) debugging logs and asserts, when an intelligent bundler, such as `esbuild`, is used. */
export declare const enum DEBUG {
    LOG = 1,
    ASSERT = 1,
    ERROR = 0,
    PRODUCTION = 1,
    MINIFY = 0
}
export declare const isAbsolutePath: (segment: string) => boolean;
export declare const isCertainlyRelativePath: (segment: string) => boolean;
/** see {@link RelativePathResolverConfig.resolvePath} for details. */
export declare const resolveResourcePathFactory: (absolute_current_dir: string | (() => string), absolute_segment_test_fn?: (segment: string) => boolean) => ((path?: string | undefined, importer?: string | undefined) => string);
/** global configuration for all `fetch` calls. */
export declare const defaultFetchConfig: RequestInit;
export declare const defaultGetCwd: string, defaultResolvePath: (path?: string | undefined, importer?: string | undefined) => string;
export declare const noop: () => undefined;
export declare const urlToString: (url: string | URL) => string;
/** fetch multiple urls sequentially, and return the first successful response (i.e. http-code 200).
 *
 * when none of the response is successful, an `undefined` is returned.
*/
export declare const fetchScan: (urls: (string | URL)[], init?: RequestInit) => Promise<Response | undefined>;
export declare const fetchScanUrls: (urls: (string | URL)[], init?: RequestInit) => Promise<string | undefined>;
//# sourceMappingURL=deps.d.ts.map