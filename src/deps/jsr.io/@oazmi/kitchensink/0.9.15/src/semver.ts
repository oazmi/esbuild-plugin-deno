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

import { array_isEmpty, number_isFinite, number_parseInt } from "./alias.js"
import { escapeLiteralStringForRegex } from "./stringman.js"
import { isString } from "./struct.js"
import type { Require } from "./typedefs.js"


/** a semver string is any well typed version string, that does not contain wildcards nor lacks the core version information.
 * 
 * examples:
 * - correct: `"1.2.3"`, `"1.2.3-rc1"`, `"1.2.3-0+build-sha256"`
 * - incorrect: `"1"`, `"1.x"`, `""`, `"x"`
*/
export type SemverString = string

/** a comparator string for semver, such as `">= 5.2.x"`. see {@link SemverComparatorOperator } for all available comparators. */
export type SemverComparatorString = string

/** a range string for semver, consisting of multiple {@link SemverComparatorString},
 * separated by spaces (AND operator), or the `"||"` characters (OR operator).
 * 
 * > example: `"1.x || >=2.5.0 || 5.0.0 - 7.2.3 ^6"`
 * > 
 * > this would be read as:
 * > > "1.x.x" OR ">=2.5.0" OR (">=5.0.0" AND "<=7.2.3" AND "^6.0.0")
*/
export type SemverRangeString = string

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
	major: number

	/** minor version number. */
	minor: number

	/** patch version number. */
	patch: number

	/** optional prerelease version string.
	 * 
	 * an empty string implies that no pre-release version annotation exists.
	*/
	prerelease?: string

	/** optional version build information.
	 * 
	 * an empty string implies that no build-information annotation exists.
	*/
	build?: string
}

const
	digits_regex_str = "x|0|[1-9]\\d*",
	semver_core_regex_str = `(?<major>${digits_regex_str})\\.(?<minor>${digits_regex_str})\\.(?<patch>${digits_regex_str})`,
	semver_prerelease_str = `(?<prerelease>[^\\+\\s]*)`,
	semver_build_str = `(?<build>[^\\s]*)`,
	semver_regex = new RegExp(`${semver_core_regex_str}(?:\\-${semver_prerelease_str})?(?:\\+${semver_build_str})?`),
	semver_unclean_prefix = /^\=*v*\s*/i,
	semver_wildcard_regex = /^[xX\\*]$/,
	semver_prerelease_or_build_sep = /\-|\+/,
	digits_regex = new RegExp(`\^${digits_regex_str}\$`),
	semver_operator_regex_str = "<=|>=|!=|<|>|=|\\^|\\~",
	semver_operator_regex = new RegExp(`^(?<operator>${semver_operator_regex_str})?\\s*(?<semver>.*)$`)

const number_compare = (n1: number, n2: number): (-1 | 0 | 1) => {
	return n1 > n2 ? 1
		: n1 === n2 ? 0
			: -1
}

const clean_parse = (version: SemverString): (Semver | undefined) => {
	const match = semver_regex.exec(version)
	if (!match) { return undefined }
	const
		{ major = "0", minor = "0", patch = "0", prerelease = "", build = "" } = match.groups as ({ [k in keyof Semver]: string }),
		major_num = number_parseInt(major),
		minor_num = number_parseInt(minor),
		patch_num = number_parseInt(patch)
	return (number_isFinite(major_num) && number_isFinite(minor_num) && number_isFinite(patch_num)) ? {
		major: major_num,
		minor: minor_num,
		patch: patch_num,
		prerelease,
		build,
	} : undefined
}

/** cleans up a semver string to trim leading and trailing spaces, in addition to remove unnecessary prefixes (such as the `v` in `"v 1.2.3"`). */
export const clean = (version: SemverString): string => (version.trim().replace(semver_unclean_prefix, ""))

/** cleans up and parse a semver string to a {@link Semver} object. */
export const parse = (version: SemverString): (Semver | undefined) => {
	return clean_parse(clean(version))
}

/** stringify a {@link Semver} object. */
export const stringify = (version: Partial<Semver>): SemverString => {
	const { major = "x", minor = "x", patch = "x", build = "", prerelease = "" } = version
	return `${major}.${minor}.${patch}`
		+ (prerelease ? ("-" + prerelease) : "")
		+ (build ? ("+" + build) : "")
}

/** compares between two {@link Semver} objects.
 * this function can be used for sorting an array of semantic versions.
*/
export const compare = (v1: SemverString | Semver, v2: SemverString | Semver): (-1 | 0 | 1) => {
	v1 = isString(v1) ? parse(v1)! : v1
	v2 = isString(v2) ? parse(v2)! : v2
	const
		{ major: v1_major, minor: v1_minor, patch: v1_patch } = v1,
		{ major: v2_major, minor: v2_minor, patch: v2_patch } = v2
	if (v1_major !== v2_major) { return number_compare(v1_major, v2_major) }
	if (v1_minor !== v2_minor) { return number_compare(v1_minor, v2_minor) }
	return number_compare(v1_patch, v2_patch)
}

/** parses and sorts a collection of semantic versions in increasing order. */
export const sort = (versions: (SemverString | Semver)[]): Semver[] => {
	const semvers = versions.map((v) => isString(v) ? parse(v)! : v)
	return semvers.toSorted(compare)
}

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
export const normalize = (version: string): SemverString => {
	// split version by dots. if any part is missing or is a wildcard, set it to "x".
	const
		wildcard_char = "x",
		release_and_build_info_idx = version.search(semver_prerelease_or_build_sep),
		release_and_build_info_sep = release_and_build_info_idx >= 0 ? version[release_and_build_info_idx] : "-",
		[core_version = "", release_and_build_info = ""] = version.split(release_and_build_info_sep, 2) as (string | undefined)[],
		segments = core_version.split(".").toReversed(),
		normalized_segments: string[] = []
	let segment_is_illegible = array_isEmpty(segments)
	for (let i = 0; i < 3; i++) {
		const
			segment = segments.pop() || wildcard_char,
			segment_normalized = semver_wildcard_regex.test(segment) ? wildcard_char : segment!
		segment_is_illegible ||= !digits_regex.test(segment_normalized)
		normalized_segments.push(segment_is_illegible ? wildcard_char : segment_normalized)
	}
	return normalized_segments.join(".") + (release_and_build_info ? (release_and_build_info_sep + release_and_build_info) : "")
}

/** semver comparison operators.
 * 
 * > [!note]
 * > the caret ("^") operator and the tilde ("~") operators can be expressed using the less-than and greater-than comparators,
 * > so they can be thought as syntactic sugar.
*/
export type SemverComparatorOperator =
	| undefined // equivalent to "="
	| "="
	| "!="
	| ">"
	| ">="
	| "<"
	| "<="

/** semver unary operators.
 * 
 * the caret ("^") operator and the tilde ("~") operators are not quite fundamental,
 * as they can be expressed using the less-than and greater-than comparators,
 * which is why they can be thought as syntactic sugar.
*/
export type SemverOperator =
	| SemverComparatorOperator
	| "^"
	| "~"

/** an interface for carrying optional comparator operation information, along with wildcards (undefined fields). */
export interface Comparator extends Partial<Semver> {
	/** the comparison operator.
	 * 
	 * @defaultValue `"="`
	*/
	operator?: SemverComparatorOperator
}

/** an interface for carrying optional operator information, along with wildcards (undefined fields). */
export interface Operator extends Partial<Semver> {
	/** the unary operator.
	 * 
	 * @defaultValue `"="`
	*/
	operator?: SemverOperator
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
export const parseOperator = (comp: SemverComparatorString): Operator => {
	// now, we apply a regex to extract the comparator operator, and the version string.
	// allowed operators are: ">", ">=", "<", "<=", "=", "!=", "^". and "~".
	const
		match = semver_operator_regex.exec(comp),
		wildcard_char = "x"
	if (!match) { throw new Error(`[semver]: invalid comparator: "${comp}"`) }
	const
		{ operator: _operator = "", semver: _semver = "" } = match.groups!,
		// when no operator matches, then an exact version match is being performed, which is equivalent to the "=" operator.
		operator = (_operator || "=") as SemverComparatorOperator,
		// now we normalize all wildcard notations into a single format: `5.x.x`.
		semver_match = semver_regex.exec(normalize(clean(_semver)))
	if (!semver_match) { throw new Error(`[semver]: error parsing semver: "${_semver}"`) }
	const
		{ major = wildcard_char, minor = wildcard_char, patch = wildcard_char, prerelease = "", build = "" } = semver_match.groups as ({ [k in keyof Semver]: string }),
		major_num = (major === wildcard_char) ? undefined : number_parseInt(major),
		minor_num = (minor === wildcard_char) ? undefined : number_parseInt(minor),
		patch_num = (patch === wildcard_char) ? undefined : number_parseInt(patch)
	return {
		operator,
		major: major_num,
		minor: minor_num,
		patch: patch_num,
		prerelease,
		build,
	}
}

/** a type representing a semantic version range.
 * the ranges consist of a nested array, which represents a set of **OR** comparisons,
 * while the inner array represents **AND** comparisons.
*/
export type Range = DetailedComparator[][]

interface MiniLexer {
	tokenExp: string
	parseExp: RegExp
	lexer: (substr: string) => (string[] | undefined)
}

const _1_OrLexer: MiniLexer = {
	tokenExp: "[OR]",
	parseExp: /\s*\|\|\s*/g,
	lexer(substr: string) { return substr.split(this.tokenExp) },
}

const _2_HyphenLexer: MiniLexer = {
	tokenExp: "[HYPHEN]",
	parseExp: /\s+\-\s+/g,
	lexer(substr: string) {
		const hyphen_match = substr.match(hyphen_range_regex)
		if (!hyphen_match) { return undefined }
		const
			low_ver = clean(hyphen_match[1]),
			high_ver = clean(hyphen_match[2])
		return [low_ver, high_ver]
	},
}

const hyphen_range_regex = new RegExp(`^(.+?)${escapeLiteralStringForRegex(_2_HyphenLexer.tokenExp)}(.+?)$`)

const _3_AndLexer: MiniLexer = {
	tokenExp: "[AND]",
	parseExp: /\s+/g,
	lexer(substr: string) { return substr.split(this.tokenExp) },
}

const
	all_operators = ["=", "!=", ">=", "<=", ">", "<", "~", "^"],
	all_impossible_major_xrange_operators: SemverOperator[] = [">", "<", "!="]
const clean_range = (range: SemverRangeString): SemverRangeString => {
	// cleans up a range string
	for (const op of all_operators) {
		range = range.replaceAll(new RegExp(`${escapeLiteralStringForRegex(op)}\\s*`, "g"), op)
	}
	return range
}

/** a fully defined (no wildcards) {@link Comparator} expression. */
export type DetailedComparator = Require<Comparator, "operator" | "major" | "minor" | "patch">

/** desugars an {@link Operator} to a list of {@link Comparator}s (joined by an AND statement). */
const desugar_operator = (operator_expression: string | Operator): DetailedComparator[] => {
	if (isString(operator_expression)) {
		// check for the existence of the "[HYPHEN]" token (for hyphen ranges such as "1.2.3 - 2.3.4"),
		// which would need to be transformed to the form ">=1.2.3 <=2.3.4".
		const hyphen_match = _2_HyphenLexer.lexer(operator_expression)
		if (hyphen_match) {
			const [lower, upper] = hyphen_match
			return [...desugar_operator(`>=${lower}`), ...desugar_operator(`<=${upper}`)]
		}
		operator_expression = parseOperator(operator_expression)
	}
	const { operator = "=", major, minor, patch, prerelease, build } = operator_expression

	// first we handle all possible ranges
	if (major === undefined) {
		// handling impossible ranges by annotating everything as `-1`.
		return all_impossible_major_xrange_operators.includes(operator)
			? [{ operator: "=", major: -1, minor: -1, patch: -1 }]
			: [{ operator: ">=", major: 0, minor: 0, patch: 0 }]
	}
	if (minor === undefined) {
		switch (operator) {
			case "!=": return [
				{ operator: "<", major, minor: 0, patch: 0 },
				{ operator: ">=", major: major + 1, minor: 0, patch: 0 },
			]
			case "<": return [{ operator: "<", major, minor: 0, patch: 0 }]
			case "<=": return [{ operator: "<", major: major + 1, minor: 0, patch: 0 }]
			case ">": return [{ operator: ">=", major: major + 1, minor: 0, patch: 0 }]
			case ">=": return [{ operator: ">=", major, minor: 0, patch: 0 }]
			default: return desugar_operator({ operator: "^", major, minor: 0, patch: 0 })
		}
	}
	if (patch === undefined) {
		switch (operator) {
			case "!=": return [
				{ operator: "<", major, minor, patch: 0 },
				{ operator: ">=", major, minor: minor + 1, patch: 0 },
			]
			case "<": return [{ operator: "<", major, minor, patch: 0 }]
			case "<=": return [{ operator: "<", major, minor: minor + 1, patch: 0 }]
			case ">": return [{ operator: ">=", major, minor: minor + 1, patch: 0 }]
			case ">=": return [{ operator: ">=", major, minor, patch: 0 }]
			case "^": if (major > 0 || minor > 0) {
				return desugar_operator({ operator: "^", major, minor, patch: 0 })
			}
			/* falls through */
			default: return desugar_operator({ operator: "~", major, minor, patch: 0 })
		}
	}

	// now we handle all fully defined core-versions
	switch (operator) {
		// a caret allows increments that do not change the first non-zero core-version number.
		case "^": {
			let lower: DetailedComparator, upper: DetailedComparator
			if (major > 0) {
				lower = { operator: ">=", major, minor, patch, prerelease, build }
				upper = { operator: "<", major: major + 1, minor: 0, patch: 0 }
			} else if (minor > 0) {
				lower = { operator: ">=", major: 0, minor, patch, prerelease, build }
				upper = { operator: "<", major: 0, minor: minor + 1, patch: 0 }
			} else {
				lower = { operator: "=", major: 0, minor: 0, patch, prerelease, build }
				upper = lower
			}
			return [lower, upper]
		}
		case "~": {
			// a tilde allows for patch level increments.
			const
				lower: DetailedComparator = { operator: ">=", major, minor, patch, prerelease, build },
				upper: DetailedComparator = { operator: "<", major, minor: minor + 1, patch: 0 }
			return [lower, upper]
		}
		default: {
			return [{ operator, major, minor, patch, prerelease, build }]
		}
	}
}

/** parse a range string into a {@link Range} type. */
export const parseRange = (range: SemverRangeString): Range => {
	// first and foremost, we parse the range expression and insert token strings in place of AND (" "), OR ("||"), and HYPHEN ("-") operators.
	const tokenized_range = clean_range(range)
		.replaceAll(_1_OrLexer.parseExp, _1_OrLexer.tokenExp)
		.replaceAll(_2_HyphenLexer.parseExp, _2_HyphenLexer.tokenExp)
		.replaceAll(_3_AndLexer.parseExp, _3_AndLexer.tokenExp)
	const or_comparisons: Range = []
	// split on "[OR]" token to support OR ranges.
	for (const part of _1_OrLexer.lexer(tokenized_range)!) {
		const and_comparators: DetailedComparator[] = []
		or_comparisons.push(and_comparators)
		// split on "[AND]" token to support AND ranges.
		const and_parts = _3_AndLexer.lexer(part)!
			// desugar all operations into simpler ones
			.map(desugar_operator)
			.flat(1)
		and_comparators.push(...and_parts)
	}
	return or_comparisons
}

const comparison_result_satisfies_operator: Array<NonNullable<SemverComparatorOperator>[]> = [
	["=", "<=", ">="], // accepted operators when `compare(version, range_segment) === 0`
	["!=", ">", ">="], // accepted operators when `compare(version, range_segment) === 1`
	["!=", "<", "<="], // accepted operators when `compare(version, range_segment) === -1`
]

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
export const isSatisfying = (version: Semver | SemverString, range: Range | SemverRangeString): boolean => {
	version = isString(version) ? parse(version)! : version
	range = isString(range) ? parseRange(range) : range
	for (const and_parts of range) {
		let does_satisfy_OR_segment = true
		for (const comp of and_parts) {
			const
				operator = comp.operator,
				comparison_result = compare(version, comp),
				does_satisfy_AND_segment = comparison_result_satisfies_operator.at(comparison_result)!.includes(operator)
			// below, we also ignore impossible results when the core version is in negative
			if ((does_satisfy_AND_segment === false) || (comp.major < 0)) {
				does_satisfy_OR_segment = false
				break
			}
		}
		if (does_satisfy_OR_segment) { return true }
	}
	return false
}

/** get the highest version that satisfies a given `range` from your list of `versions`. */
export const maxSatisfying = (versions: (Semver | SemverString)[], range: Range | SemverRangeString): SemverString | undefined => {
	range = isString(range) ? parseRange(range) : range
	const sorted_versions = sort(versions).toReversed()
	for (const version of sorted_versions) {
		if (isSatisfying(version, range)) { return stringify(version) }
	}
	return
}

/** get the lowest version that satisfies a given `range` from your list of `versions`. */
export const minSatisfying = (versions: (Semver | SemverString)[], range: Range | SemverRangeString): SemverString | undefined => {
	range = isString(range) ? parseRange(range) : range
	const sorted_versions = sort(versions)
	for (const version of sorted_versions) {
		if (isSatisfying(version, range)) { return stringify(version) }
	}
	return
}
