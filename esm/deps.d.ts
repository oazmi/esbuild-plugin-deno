export { dom_decodeURI, json_parse, json_stringify, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_outside, promise_resolve } from "@oazmi/kitchensink/alias";
export { InvertibleMap, invertMap } from "@oazmi/kitchensink/collections";
export { memorize } from "@oazmi/kitchensink/lambda";
export { ensureEndSlash, ensureStartDotSlash, getUriScheme, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "@oazmi/kitchensink/pathman";
export { escapeLiteralStringForRegex, replacePrefix, replaceSuffix } from "@oazmi/kitchensink/stringman";
export { isArray, isString } from "@oazmi/kitchensink/struct";
export type { ConstructorOf, DeepPartial, MaybePromise, Optional } from "@oazmi/kitchensink/typedefs";
export { parse as jsoncParse } from "@std/jsonc";
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying, parse as semverParse, parseRange as semverParseRange, format as semverToString } from "@std/semver";
export type * as esbuild from "esbuild";
/** flags used for minifying (or eliminating) debugging logs and asserts, when an intelligent bundler, such as `esbuild`, is used. */
export declare const enum DEBUG {
    LOG = 1,
    ASSERT = 0,
    ERROR = 0,
    PRODUCTION = 1,
    MINIFY = 1
}
export declare const isAbsolutePath: (segment: string) => boolean;
/** global configuration for all `fetch` calls. */
export declare const defaultFetchConfig: RequestInit;
export declare const defaultGetCwd: string, defaultResolvePath: any;
export declare const noop: () => undefined;
export declare const fileUrlToLocalPath: (file_url?: URL) => string | undefined;
//# sourceMappingURL=deps.d.ts.map