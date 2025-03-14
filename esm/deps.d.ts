export { dom_decodeURI, json_parse, json_stringify, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_outside, promise_resolve } from "@oazmi/kitchensink/alias";
export { bind_array_push, bind_map_get, bind_map_has, bind_map_set } from "@oazmi/kitchensink/binder";
export { InvertibleMap, invertMap } from "@oazmi/kitchensink/collections";
export { execShellCommand, identifyCurrentRuntime, RUNTIME } from "@oazmi/kitchensink/crossenv";
export { memorize } from "@oazmi/kitchensink/lambda";
export { ensureEndSlash, ensureStartDotSlash, getUriScheme, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "@oazmi/kitchensink/pathman";
export { escapeLiteralStringForRegex, replacePrefix, replaceSuffix } from "@oazmi/kitchensink/stringman";
export { isArray, isObject, isString } from "@oazmi/kitchensink/struct";
export type { ConstructorOf, MaybePromise, Optional } from "@oazmi/kitchensink/typedefs";
export { parse as jsoncParse } from "@std/jsonc";
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying, parse as semverParse, parseRange as semverParseRange, format as semverToString } from "@std/semver";
export type * as esbuild from "esbuild";
/** flags used for minifying (or eliminating) debugging logs and asserts, when an intelligent bundler, such as `esbuild`, is used. */
export declare const enum DEBUG {
    LOG = 1,
    ASSERT = 1,
    ERROR = 0,
    PRODUCTION = 1,
    MINIFY = 0
}
export declare const isAbsolutePath: (segment: string) => boolean;
/** global configuration for all `fetch` calls. */
export declare const defaultFetchConfig: RequestInit;
export declare const defaultGetCwd: string, defaultResolvePath: any;
export declare const noop: () => undefined;
export type DeepPartial<T> = T extends (Function | Array<any> | String | BigInt | Number | Boolean | Symbol | URL | Map<any, any> | Set<any>) ? T : T extends Record<string, any> ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
//# sourceMappingURL=deps.d.ts.map