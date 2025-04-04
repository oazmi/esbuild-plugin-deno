export { array_isEmpty, dom_decodeURI, json_parse, json_stringify, number_isFinite, number_parseInt, object_assign, object_entries, object_fromEntries, object_keys, object_values, promise_outside, promise_resolve } from "@oazmi/kitchensink/alias";
export { bind_array_push, bind_map_get, bind_map_has, bind_map_set } from "@oazmi/kitchensink/binder";
export { InvertibleMap, invertMap } from "@oazmi/kitchensink/collections";
export { execShellCommand, identifyCurrentRuntime, RUNTIME } from "@oazmi/kitchensink/crossenv";
export { memorize } from "@oazmi/kitchensink/lambda";
export { ensureEndSlash, ensureFileUrlIsLocalPath, ensureStartDotSlash, fileUrlToLocalPath, getUriScheme, joinPaths, normalizePath, parseFilepathInfo, parsePackageUrl, pathToPosixPath, resolveAsUrl, resolvePathFactory } from "@oazmi/kitchensink/pathman";
export { maxSatisfying as semverMaxSatisfying, minSatisfying as semverMinSatisfying } from "@oazmi/kitchensink/semver";
export { escapeLiteralStringForRegex, jsoncRemoveComments, replacePrefix, replaceSuffix } from "@oazmi/kitchensink/stringman";
export { isArray, isObject, isString } from "@oazmi/kitchensink/struct";
export type { ConstructorOf, MaybePromise, Optional } from "@oazmi/kitchensink/typedefs";
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
/** see {@link RelativePathResolverConfig.resolvePath} for details. */
export declare const resolveResourcePathFactory: (absolute_current_dir: string | (() => string), absolute_segment_test_fn?: (segment: string) => boolean) => ((path?: string | undefined, importer?: string | undefined) => string);
/** global configuration for all `fetch` calls. */
export declare const defaultFetchConfig: RequestInit;
export declare const defaultGetCwd: string, defaultResolvePath: (path?: string | undefined, importer?: string | undefined) => string;
export declare const noop: () => undefined;
export type DeepPartial<T> = T extends (Function | Array<any> | String | BigInt | Number | Boolean | Symbol | URL | Map<any, any> | Set<any>) ? T : T extends Record<string, any> ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
//# sourceMappingURL=deps.d.ts.map