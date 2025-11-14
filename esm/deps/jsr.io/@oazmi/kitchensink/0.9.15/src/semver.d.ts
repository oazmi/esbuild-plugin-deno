/** contains a small implementation of semantic-versioning (semver) operations.
 *
 * ### what is semantic versioning?
 *
 * below is diagram that summarizes the fields of a semantic version string::
 *
 * ```txt
 * ┌─────────────────────► major
 * │ ┌───────────────────► minor
 * │ │ ┌─────────────────► patch
 * │ │ │  ┌──────────────► prerelease
 * │ │ │  │      ┌───────► build
 * │ │ │ ┌┴┐ ┌───┴───┐
 * 1.2.3-pre+build-xyz }─► semver
 * ```
 *
 * @module
*/
import type { Require } from "./typedefs.js";
/** a semver string is any well typed version string, that does not contain wildcards nor lacks the core version information.
 *
 * examples:
 * - correct: `"1.2.3"`, `"1.2.3-rc1"`, `"1.2.3-0+build-sha256"`
 * - incorrect: `"1"`, `"1.x"`, `""`, `"x"`
*/
export type SemverString = string;
/** a comparator string for semver, such as `">= 5.2.x"`. see {@link SemverComparatorOperator } for all available comparators. */
export type SemverComparatorString = string;
/** a range string for semver, consisting of multiple {@link SemverComparatorString},
 * separated by spaces (AND operator), or the `"||"` characters (OR operator).
 *
 * > example: `"1.x || >=2.5.0 || 5.0.0 - 7.2.3 ^6"`
 * >
 * > this would be read as:
 * > > "1.x.x" OR ">=2.5.0" OR (">=5.0.0" AND "<=7.2.3" AND "^6.0.0")
*/
export type SemverRangeString = string;
/** an interface that describes the constiting parts of a semver.
 *
 * break down of the fields in an ascii diagram:
 *
 * ```txt
 * ┌─────────────────────► major
 * │ ┌───────────────────► minor
 * │ │ ┌─────────────────► patch
 * │ │ │  ┌──────────────► prerelease
 * │ │ │  │      ┌───────► build
 * │ │ │ ┌┴┐ ┌───┴───┐
 * 1.2.3-pre+build-xyz }─► semver
 * ```
*/
export interface Semver {
    /** major version number. */
    major: number;
    /** minor version number. */
    minor: number;
    /** patch version number. */
    patch: number;
    /** optional prerelease version string.
     *
     * an empty string implies that no pre-release version annotation exists.
    */
    prerelease?: string;
    /** optional version build information.
     *
     * an empty string implies that no build-information annotation exists.
    */
    build?: string;
}
/** cleans up a semver string to trim leading and trailing spaces, in addition to remove unnecessary prefixes (such as the `v` in `"v 1.2.3"`). */
export declare const clean: (version: SemverString) => string;
/** cleans up and parse a semver string to a {@link Semver} object. */
export declare const parse: (version: SemverString) => (Semver | undefined);
/** stringify a {@link Semver} object. */
export declare const stringify: (version: Partial<Semver>) => SemverString;
/** compares between two {@link Semver} objects.
 * this function can be used for sorting an array of semantic versions.
*/
export declare const compare: (v1: SemverString | Semver, v2: SemverString | Semver) => (-1 | 0 | 1);
/** parses and sorts a collection of semantic versions in increasing order. */
export declare const sort: (versions: (SemverString | Semver)[]) => Semver[];
/** this function converts versions with various forms of wildcards ("x", "X", "*"),
 * or missing segments, into a normalized `"1.x.x"` representation.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = normalize,
 * 	eq = assertEquals
 *
 * eq(fn("1.x"),                 "1.x.x")
 * eq(fn("*"),                   "x.x.x")
 * eq(fn(""),                    "x.x.x")
 * eq(fn("2.3"),                 "2.3.x")
 * eq(fn("X.2.3"),               "x.2.3")
 * eq(fn("1.*.3-rc1+build.xyz"), "1.x.3-rc1+build.xyz")
 * eq(fn("1-rc1+build.xyz"),     "1.x.x-rc1+build.xyz")
 * eq(fn("2.*.3-rc1"),           "2.x.3-rc1")
 * eq(fn("3+build.xyz"),         "3.x.x+build.xyz")
 * ```
*/
export declare const normalize: (version: string) => SemverString;
/** semver comparison operators.
 *
 * > [!note]
 * > the caret ("^") operator and the tilde ("~") operators can be expressed using the less-than and greater-than comparators,
 * > so they can be thought as syntactic sugar.
*/
export type SemverComparatorOperator = undefined | "=" | "!=" | ">" | ">=" | "<" | "<=";
/** semver unary operators.
 *
 * the caret ("^") operator and the tilde ("~") operators are not quite fundamental,
 * as they can be expressed using the less-than and greater-than comparators,
 * which is why they can be thought as syntactic sugar.
*/
export type SemverOperator = SemverComparatorOperator | "^" | "~";
/** an interface for carrying optional comparator operation information, along with wildcards (undefined fields). */
export interface Comparator extends Partial<Semver> {
    /** the comparison operator.
     *
     * @defaultValue `"="`
    */
    operator?: SemverComparatorOperator;
}
/** an interface for carrying optional operator information, along with wildcards (undefined fields). */
export interface Operator extends Partial<Semver> {
    /** the unary operator.
     *
     * @defaultValue `"="`
    */
    operator?: SemverOperator;
}
/** parses a single range operator string (">=1.x.*", etc...), and returns a {@link Operator} object.
 *
 * @example
 * ```ts
 * import { assertObjectMatch } from "jsr:@std/assert"
 *
 * // aliasing our functions and constants for brevity
 * const
 * 	fn = parseOperator,
 * 	eq = assertObjectMatch
 *
 * eq(fn("1.2.3"),  { operator: "=",  major: 1, minor: 2, patch: 3 })
 * eq(fn(""),       { operator: "=",  })
 * eq(fn("x"),      { operator: "=",  })
 * eq(fn("  1.x "), { operator: "=",  major: 1 })
 * eq(fn(" = 1.x"), { operator: "=",  major: 1 })
 * eq(fn("1.x.*"),  { operator: "=",  major: 1 })
 * eq(fn("1"),      { operator: "=",  major: 1 })
 * eq(fn("> 1.2 "), { operator: ">",  major: 1, minor: 2 })
 * eq(fn(">1.2.0"), { operator: ">",  major: 1, minor: 2, patch: 0 })
 * eq(fn(">=1.2"),  { operator: ">=", major: 1, minor: 2 })
 * eq(fn("<1.2"),   { operator: "<",  major: 1, minor: 2 })
 * eq(fn("<=1.2"),  { operator: "<=", major: 1, minor: 2 })
 * eq(fn("<1.0.0"), { operator: "<",  major: 1, minor: 0, patch: 0 })
 * eq(fn("<1-pre"), { operator: "<",  major: 1, prerelease: "pre" })
 * eq(fn("<1+abc"), { operator: "<",  major: 1, build: "abc" })
 * eq(fn("!=1.x"),  { operator: "!=", major: 1 })
 * ```
*/
export declare const parseOperator: (comp: SemverComparatorString) => Operator;
/** a type representing a semantic version range.
 * the ranges consist of a nested array, which represents a set of **OR** comparisons,
 * while the inner array represents **AND** comparisons.
*/
export type Range = DetailedComparator[][];
/** a fully defined (no wildcards) {@link Comparator} expression. */
export type DetailedComparator = Require<Comparator, "operator" | "major" | "minor" | "patch">;
/** parse a range string into a {@link Range} type. */
export declare const parseRange: (range: SemverRangeString) => Range;
/** check if provided `version` satisfies the given `range` description.
 *
 * @param version version string or object to validate.
 * @param range range of versions that are accepted.
 * @returns `true` is returned if the provided `version` is within the provided `range` description, otherwise `false` is returned.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions and constants for brevity
 * const
 * 	fn = isSatisfying,
 * 	eq = assertEquals
 *
 * eq(fn("1.2.3", "1.x || >=2.5.0 || 5.0.0 - 7.2.3"), true)
 * eq(fn("0.2.3", "1.x || >=2.5.0 || 5.0.0 - 7.2.3"), false)
 * ```
*/
export declare const isSatisfying: (version: Semver | SemverString, range: Range | SemverRangeString) => boolean;
/** get the highest version that satisfies a given `range` from your list of `versions`. */
export declare const maxSatisfying: (versions: (Semver | SemverString)[], range: Range | SemverRangeString) => SemverString | undefined;
/** get the lowest version that satisfies a given `range` from your list of `versions`. */
export declare const minSatisfying: (versions: (Semver | SemverString)[], range: Range | SemverRangeString) => SemverString | undefined;
//# sourceMappingURL=semver.d.ts.map