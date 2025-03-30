/** this submodule provides semver range satisfaction operations.
 * 
 * > [!caution]
 * > some portions of the parsing functions in this submodule were initially coded by [chat-gpt](https://chatgpt.com/share/67e66d59-ce8c-800b-b143-10de3cad4c8a),
 * > so there's a possibility that it may not work under rare circumstances.
 * 
 * @module
*/
// TODO: move the imports from "semver-ts" to "deps.ts" and re-export them.
import { compare as semverCompare, inc as semverInc, parse as semverParse } from "semver-ts"
import { escapeLiteralStringForRegex, isString, number_isFinite, number_parseInt } from "../deps.ts"


const
	comparators = ["=", ">=", "<=", ">", "<", "~", "^"],
	clean = (ver: string) => (ver.trim().replace(/^[=v]+/, "")),
	cleanRange = (range: string): string => {
		// cleans up a range string
		for (const comp of comparators) {
			range = range.replaceAll(new RegExp(`${escapeLiteralStringForRegex(comp)}\\s*`, "g"), comp)
		}
		return range
	},
	compare = (v1: string, v2: string): (-1 | 0 | 1) => {
		return (v1 === v2) ? 0
			: (v1 === ZERO || v2 === INFINITY) ? -1
				: (v2 === ZERO || v1 === INFINITY) ? 1
					: semverCompare(v1, v2)
	},
	strictParse = (ver: string) => (semverParse(ver, undefined, true)!),
	fully_wildcard_regex = /^[xX\*]/,
	has_standard_wildcard_regex = /^x|\d\.x/,
	INFINITY = "infinity",
	ZERO = "0.0.0"

/** a semver interval is simply a continuous range of inclusive versions. */
export interface SemverInterval {
	lower: string
	upper: string
}

/** describes a discontinuous range of versions. */
export interface SemverRange {
	/** the original semver range. */
	raw: string

	/** a union collection of continuous version intervals that must be satisfied for a semver be within this {@link raw | range's description}. */
	intervals: Array<SemverInterval>
}

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

/** this function consumes a semver range string and returns the {@link SemverRange} object type,
 * which contains an array of {@link SemverInterval}s that the original range string represents.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * // aliasing our functions and constants for brevity
 * const
 * 	fn = semverParseRange,
 * 	eq = assertEquals
 * 
 * eq(fn("0.2.1 -  2.1.3 >2.0.1 || 5.4.2 || 3.2.1 || >=4.5 <6 x.x"), {
 * 	raw: "0.2.1 -  2.1.3 >2.0.1 || 5.4.2 || 3.2.1 || >=4.5 <6 x.x",
 * 	intervals: [
 * 		{ lower: "2.0.2", upper: "2.1.3" },
 * 		{ lower: "5.4.2", upper: "5.4.2" },
 * 		{ lower: "3.2.1", upper: "3.2.1" },
 * 		{ lower: "4.5.0", upper: "5.9999.9999" },
 * 	]
 * })
 * 
 * eq(fn("x.x.5"), {
 * 	raw: "x.x.5",
 * 	intervals: [
 * 		{ lower: "0.0.5", upper: "9999.9999.5" },
 * 	]
 * })
 * 
 * eq(fn(">=x.5"), {
 * 	raw: ">=x.5",
 * 	intervals: [
 * 		{ lower: "0.5.0", upper: "infinity" },
 * 	]
 * })
 * ```
*/
export const semverParseRange = (range: string): SemverRange => {
	const intervals: Array<SemverInterval> = []
	// first and foremost, we parse the range expression and insert token strings in place of AND (" "), OR ("||"), and HYPHEN ("-") operators.
	const tokenized_range = cleanRange(range)
		.replaceAll(_1_OrLexer.parseExp, _1_OrLexer.tokenExp)
		.replaceAll(_2_HyphenLexer.parseExp, _2_HyphenLexer.tokenExp)
		.replaceAll(_3_AndLexer.parseExp, _3_AndLexer.tokenExp)

	// split on "[OR]" token to support OR ranges.
	for (const part of _1_OrLexer.lexer(tokenized_range)!) {
		// each part may consist of multiple comparators (combined with AND).
		// default lower bound is "0.0.0", while the default upper bound is unbounded by "infinity".
		let
			lowerBound: string = ZERO,
			upperBound: string = INFINITY

		// split on "[AND]" token to support AND ranges.
		for (const comp of _3_AndLexer.lexer(part)!) {
			// check for the existence of the "[HYPHEN]" token (for hyphen ranges such as "1.2.3 - 2.3.4"),
			// which would require a different set of rules for handling than a regular comparator.
			const
				hyphen_match = _2_HyphenLexer.lexer(comp),
				{ lower, upper } = hyphen_match
					// hyphen ranges are equivalent to `>=lower` and `<=upper`.
					? { lower: normalizeXRange(hyphen_match[0], false), upper: normalizeXRange(hyphen_match[1], true) }
					// otherwise, parse a single comparator into its lower/upper bound.
					: semverParseComparator(comp)
			if (lower && (compare(lower, lowerBound) > 0)) { lowerBound = lower }
			if (upper && (compare(upper, upperBound) < 0)) { upperBound = upper }
		}

		// only add intervals that make sense (non-empty interval).
		if (compare(lowerBound, upperBound) <= 0) {
			intervals.push({ lower: lowerBound, upper: upperBound })
		}
	}

	return { raw: range, intervals }
}

/** parses a single comparator string (">=1.x.*", etc...),
 * and returns an interval with lower and upper bounds.
 * 
 * TODO: this function does not currently parse dual comparators like `~>=x.y.z` or `^>=x.y.z`.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * // aliasing our functions and constants for brevity
 * const
 * 	fn = semverParseComparator,
 * 	eq = assertEquals,
 * 	inf = "infinity"
 * 
 * eq(fn("1.2.3"),  { lower: "1.2.3", upper: "1.2.3" })
 * eq(fn("x"),      { lower: "0.0.0", upper: inf })
 * eq(fn("1.x"),    { lower: "1.0.0", upper: "1.9999.9999" })
 * eq(fn("=1.x"),   { lower: "1.0.0", upper: "1.9999.9999" })
 * eq(fn("1.x.*"),  { lower: "1.0.0", upper: "1.9999.9999" })
 * eq(fn("1"),      { lower: "1.0.0", upper: "1.9999.9999" })
 * eq(fn(">1.2"),   { lower: "1.2.0", upper: inf })
 * eq(fn(">1.2.0"), { lower: "1.2.1", upper: inf })
 * eq(fn(">=1.2"),  { lower: "1.2.0", upper: inf })
 * eq(fn("<1.2"),   { lower: "0.0.0", upper: "1.2.9999" })
 * eq(fn("<=1.2"),  { lower: "0.0.0", upper: "1.2.9999" })
 * eq(fn("<1.0.0"), { lower: "0.0.0", upper: "0.9999.9999" })
 * eq(fn("<1.x"),   { lower: "0.0.0", upper: "1.9999.9999" })
 * eq(fn("<=1.x"),  { lower: "0.0.0", upper: "1.9999.9999" })
 * eq(fn("~1"),     { lower: "1.0.0", upper: "1.9999.9999" })
 * eq(fn("~1.2"),   { lower: "1.2.0", upper: "1.2.9999" })
 * eq(fn("~1.2.3"), { lower: "1.2.3", upper: "1.2.9999" })
 * eq(fn("~0.2.3"), { lower: "0.2.3", upper: "0.2.9999" })
 * eq(fn("~0.x.3"), { lower: "0.0.0", upper: "0.9999.9999" })
 * eq(fn("~x.2.3"), { lower: "0.0.0", upper: inf })
 * eq(fn("~x"),     { lower: "0.0.0", upper: inf })
 * eq(fn("^1"),     { lower: "1.0.0", upper: "1.9999.9999" })
 * eq(fn("^1.2.3"), { lower: "1.2.3", upper: "1.9999.9999" })
 * eq(fn("^0.2.3"), { lower: "0.2.3", upper: "0.2.9999" })
 * eq(fn("^0.2.x"), { lower: "0.2.0", upper: "0.2.9999" })
 * eq(fn("^0.x.3"), { lower: "0.0.0", upper: "0.9999.9999" })
 * eq(fn("^x.2.3"), { lower: "0.2.3", upper: "0.2.9999" })
 * ```
*/
export const semverParseComparator = (comp: string): SemverInterval => {
	// handle full wildcard cases (e.g. "*", "x", "X", and "").
	if (fully_wildcard_regex.test(comp || "x")) { return { lower: ZERO, upper: INFINITY } }

	// now, we apply a regex to extract the comparator operator, and the version string.
	// allowed operators are: ">", ">=", "<", "<=", "=", "~", and "^".
	const op_match = comp.match(/^(>=|>|<=|<|=|~|\^)?\s*(.+)$/)
	if (!op_match) { throw new Error(`[semver]: invalid comparator: ${comp}`) }
	const
		// when no operator matches, then an exact version match is being performed, which is equivalent to the "=" operator.
		op = op_match[1] || "=",
		// now we normalize all wildcard notations into a single format: `5.x.x`.
		ver = normalizeX(clean(op_match[2]))
	if (fully_wildcard_regex.test(ver)) { return { lower: ZERO, upper: INFINITY } }
	const
		has_wildcard = has_standard_wildcard_regex.test(ver),
		ver_min = normalizeXRange(ver, false),
		ver_max = normalizeXRange(ver, true)

	switch (op) {
		case "=": return { lower: ver_min, upper: ver_max }
		case ">=": return { lower: ver_min, upper: INFINITY }
		case "<=": return { lower: ZERO, upper: ver_max }
		// for exclusive lower: use next patch of the given version.
		case ">": return { lower: has_wildcard ? ver_min : semverInc(ver_min, "patch")!, upper: INFINITY }
		// for exclusive upper, get the "immediately previous" version.
		case "<": return { lower: ZERO, upper: has_wildcard ? ver_max : dec(ver_max) }
		// tilde range: "~v" is equivalent to ">=v" and "< tildeUpperBound(v)"
		case "~": {
			const tildeUpper = getTildeUpperBound(ver)
			return { lower: ver_min, upper: dec(tildeUpper) }
		}
		// caret range: "^v" is equivalent to ">=v" and "< caretUpperBound(v)"
		case "^": {
			const caretUpper = getCaretUpperBound(ver)
			return { lower: ver_min, upper: dec(caretUpper) }
		}
		default: throw new Error(`[semver]: received an unsupported operator: "${op}", for the comparator version "${comp}"`)
	}
}

/** this function converts versions with various forms of wildcards ("x", "X", "*"), or missing segments,
 * into a normalized `"1.x.x"` representation.
 * 
 * for example:
 * - "1.x" becomes "1.x.x".
 * - "*" becomes "x.x.x".
 * - "" becomes "x.x.x".
 * - "2.3" becomes "2.3.x".
 * - "X.2.1" becomes "x.x.x".
*/
const normalizeX = (ver: string): string => {
	// split version by dots. if any part is missing or is a wildcard, set it to "x".
	const
		wildcard_char = "x",
		[major_part, minor_part, patch_part] = ver.split(".") as (string | undefined)[],
		major = (major_part && !fully_wildcard_regex.test(major_part)) ? major_part : wildcard_char,
		minor = (major !== wildcard_char)
			&& (minor_part && !fully_wildcard_regex.test(minor_part)) ? minor_part : wildcard_char,
		patch = (minor !== wildcard_char)
			&& (patch_part && !fully_wildcard_regex.test(patch_part)) ? patch_part : wildcard_char
	return `${major}.${minor}.${patch}`
}

/** this function converts versions with wildcards ("x", "X", "*"), or missing segments, into a full base versions.
 * for example:
 * - "1.x" becomes "1.0.0" for `is_upper = false`.
 * - "1" becomes "1.0.0" for `is_upper = false`.
 * - "1.x" becomes "1.9999.9999" for `is_upper = true`.
 * - "1" becomes "1.9999.9999" for `is_upper = true`.
*/
const normalizeXRange = (ver: string, is_upper: boolean = false): string => {
	// split version by dots. if any part is missing or is a wildcard, set it to 0.
	ver = normalizeX(ver)
	const
		wildcard_char = "x",
		wildcard_value = is_upper ? 9999 : 0,
		[major_part, minor_part, patch_part] = ver.split(".") as string[],
		major = major_part !== wildcard_char ? number_parseInt(major_part) : wildcard_value,
		minor = minor_part !== wildcard_char ? number_parseInt(minor_part) : wildcard_value,
		patch = patch_part !== wildcard_char ? number_parseInt(patch_part) : wildcard_value
	return `${major}.${minor}.${patch}`
}

/** returns the next version that is not allowed in a tilde range.
 * 
 * a tilde range, according to [node-semver](https://github.com/npm/node-semver) is:
 * > allows patch-level changes if a minor version is specified on the comparator.
 * > allows minor-level changes if not.
 * 
 * for example:
 * - "~1.2.3" is equivalent to "<1.3.0".
 * - "~1.2.x" is equivalent to "<1.3.0".
 * - "~1.x.x" is equivalent to "<2.0.0".
*/
const getTildeUpperBound = (ver: string): string => {
	const
		wildcard_char = "x",
		[major_part, minor_part, patch_part] = ver.split(".") as string[],
		major = major_part !== wildcard_char ? number_parseInt(major_part) : undefined,
		minor = minor_part !== wildcard_char ? number_parseInt(minor_part) : undefined,
		patch = patch_part !== wildcard_char ? number_parseInt(patch_part) : undefined
	// if only major is provided, then assume `minor = 0`, `patch = 0`.
	return number_isFinite(major) ? (number_isFinite(minor)
		? `${major!}.${minor! + 1}.0`
		: `${major! + 1}.0.0`
	) : (number_isFinite(minor)
		? `0.${minor! + 1}.0`
		: "1.0.0"
	)
}

/** returns the next non-zero version that is not allowed in a caret range.
 * 
 * a caret range, according to [node-semver]() is:
 * > allows changes that do not modify the left-most non-zero element in the `[major, minor, patch]` tuple.
 * > in other words, this allows patch and minor updates for versions `1.0.0` and above,
 * > patch updates for versions `0.x >=0.1.0`, and no updates for versions `0.0.x`.
 * 
 * examples:
 * - "^1.2.3" is equivalent to "<2.0.0".
 * - "^0.2.3" is equivalent to "<0.3.0".
 * - "^0.0.3" is equivalent to "<0.0.4" (i.e. "=0.0.3").
 * - "^0.x.x" is equivalent to "<0.9999.9999".
*/
const getCaretUpperBound = (ver: string): string => {
	const
		wildcard_char = "x",
		wildcard_value = 9999,
		[major_part, minor_part, patch_part] = ver.split(".") as string[],
		major = major_part !== wildcard_char ? number_parseInt(major_part) : wildcard_value,
		minor = minor_part !== wildcard_char ? number_parseInt(minor_part) : wildcard_value,
		patch = patch_part !== wildcard_char ? number_parseInt(patch_part) : wildcard_value
	if (major > 0) { return `${major + 1}.0.0` }
	if (minor > 0) { return `0.${minor + 1}.0` }
	return `0.0.${patch + 1}`
}

/** returns a version string that is "just below" the given version.
 * 
 * > [!note]
 * > because semver is not continuous, the implementation is a best–effort approach.
*/
const dec = (ver: string): string => {
	const { major, minor, patch } = strictParse(ver)
	if (patch > 0) { return `${major}.${minor}.${patch - 1}` }
	// use a very high patch number as a stand–in for the maximal patch.
	if (minor > 0) { return `${major}.${minor - 1}.9999` }
	// use a very high minor number as a stand–in for the maximal minor.
	if (major > 0) { return `${major - 1}.9999.9999` }
	return ZERO
}

/** check if provided version satisfied the given `range` description.
 * 
 * @param ver version string to validate.
 * @param range range of versions that are accepted.
 * @returns `true` is returned if the provided `ver` is within the provided `range` description, otherwise `false` is returned.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * // aliasing our functions and constants for brevity
 * const
 * 	fn = semverSatisfies,
 * 	eq = assertEquals
 * 
 * eq(fn("1.2.3", "1.x || >=2.5.0 || 5.0.0 - 7.2.3"), true)
 * ```
*/
export const semverSatisfies = (ver: string, range: string | SemverRange): boolean => {
	ver = normalizeXRange(ver)
	range = isString(range) ? semverParseRange(range) : range
	for (const { lower, upper } of range.intervals) {
		if (compare(ver, lower) >= 0 && compare(upper, ver) >= 0) { return true }
	}
	return false
}

/** find the highest version in your list of `versions` that satisfies the provided `range` description.
 * 
 * @param versions a list of unordered versions to pick the highest satisfiying version from.
 * @param range range of versions that are accepted.
 * @returns the highest version that satisfies your `range`.
*/
export const semverMaxSatisfying = (versions: string[], range: string | SemverRange): string | undefined => {
	range = isString(range) ? semverParseRange(range) : range
	// sorting the versions from highest to lowest
	versions = versions.toSorted(compare).toReversed()
	for (const ver of versions) {
		if (semverSatisfies(ver, range)) { return ver }
	}
	return undefined
}

/** find the lowest version in your list of `versions` that satisfies the provided `range` description.
 * 
 * @param versions a list of unordered versions to pick the lowest satisfiying version from.
 * @param range range of versions that are accepted.
 * @returns the lowest version that satisfies your `range`.
*/
export const semverMinSatisfying = (versions: string[], range: string | SemverRange): string | undefined => {
	range = isString(range) ? semverParseRange(range) : range
	// sorting the versions from highest to lowest
	versions = versions.toSorted(compare)
	for (const ver of versions) {
		if (semverSatisfies(ver, range)) { return ver }
	}
	return undefined
}
