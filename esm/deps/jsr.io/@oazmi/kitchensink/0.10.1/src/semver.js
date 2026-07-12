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
import { array_isEmpty, number_isFinite, number_parseInt } from "./alias.js";
import { escapeLiteralStringForRegex } from "./stringman.js";
import { isString } from "./struct.js";
const digits_regex_str = "x|0|[1-9]\\d*", semver_core_regex_str = `(?<major>${digits_regex_str})\\.(?<minor>${digits_regex_str})\\.(?<patch>${digits_regex_str})`, semver_prerelease_str = `(?<prerelease>[^\\+\\s]*)`, semver_build_str = `(?<build>[^\\s]*)`, semver_regex = new RegExp(`${semver_core_regex_str}(?:\\-${semver_prerelease_str})?(?:\\+${semver_build_str})?`), semver_unclean_prefix = /^\=*v*\s*/i, semver_wildcard_regex = /^[xX\\*]$/, semver_prerelease_or_build_sep = /\-|\+/, digits_regex = new RegExp(`\^${digits_regex_str}\$`), semver_operator_regex_str = "<=|>=|!=|<|>|=|\\^|\\~", semver_operator_regex = new RegExp(`^(?<operator>${semver_operator_regex_str})?\\s*(?<semver>.*)$`);
const number_compare = (n1, n2) => {
    return n1 > n2 ? 1
        : n1 === n2 ? 0
            : -1;
};
const clean_parse = (version) => {
    const match = semver_regex.exec(version);
    if (!match) {
        return undefined;
    }
    const { major = "0", minor = "0", patch = "0", prerelease = "", build = "" } = match.groups, major_num = number_parseInt(major), minor_num = number_parseInt(minor), patch_num = number_parseInt(patch);
    return (number_isFinite(major_num) && number_isFinite(minor_num) && number_isFinite(patch_num)) ? {
        major: major_num,
        minor: minor_num,
        patch: patch_num,
        prerelease,
        build,
    } : undefined;
};
/** cleans up a semver string to trim leading and trailing spaces, in addition to remove unnecessary prefixes (such as the `v` in `"v 1.2.3"`). */
export const clean = (version) => (version.trim().replace(semver_unclean_prefix, ""));
/** cleans up and parse a semver string to a {@link Semver} object. */
export const parse = (version) => {
    return clean_parse(clean(version));
};
/** stringify a {@link Semver} object. */
export const stringify = (version) => {
    const { major = "x", minor = "x", patch = "x", build = "", prerelease = "" } = version;
    return `${major}.${minor}.${patch}`
        + (prerelease ? ("-" + prerelease) : "")
        + (build ? ("+" + build) : "");
};
/** compares between two {@link Semver} objects.
 * this function can be used for sorting an array of semantic versions.
*/
export const compare = (v1, v2) => {
    v1 = isString(v1) ? parse(v1) : v1;
    v2 = isString(v2) ? parse(v2) : v2;
    const { major: v1_major, minor: v1_minor, patch: v1_patch } = v1, { major: v2_major, minor: v2_minor, patch: v2_patch } = v2;
    if (v1_major !== v2_major) {
        return number_compare(v1_major, v2_major);
    }
    if (v1_minor !== v2_minor) {
        return number_compare(v1_minor, v2_minor);
    }
    return number_compare(v1_patch, v2_patch);
};
/** parses and sorts a collection of semantic versions in increasing order. */
export const sort = (versions) => {
    const semvers = versions.map((v) => isString(v) ? parse(v) : v);
    return semvers.toSorted(compare);
};
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
export const normalize = (version) => {
    // split version by dots. if any part is missing or is a wildcard, set it to "x".
    const wildcard_char = "x", release_and_build_info_idx = version.search(semver_prerelease_or_build_sep), release_and_build_info_sep = release_and_build_info_idx >= 0 ? version[release_and_build_info_idx] : "-", [core_version = "", release_and_build_info = ""] = version.split(release_and_build_info_sep, 2), segments = core_version.split(".").toReversed(), normalized_segments = [];
    let segment_is_illegible = array_isEmpty(segments);
    for (let i = 0; i < 3; i++) {
        const segment = segments.pop() || wildcard_char, segment_normalized = semver_wildcard_regex.test(segment) ? wildcard_char : segment;
        segment_is_illegible ||= !digits_regex.test(segment_normalized);
        normalized_segments.push(segment_is_illegible ? wildcard_char : segment_normalized);
    }
    return normalized_segments.join(".") + (release_and_build_info ? (release_and_build_info_sep + release_and_build_info) : "");
};
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
export const parseOperator = (comp) => {
    // now, we apply a regex to extract the comparator operator, and the version string.
    // allowed operators are: ">", ">=", "<", "<=", "=", "!=", "^". and "~".
    const match = semver_operator_regex.exec(comp), wildcard_char = "x";
    if (!match) {
        throw new Error(`[semver]: invalid comparator: "${comp}"`);
    }
    const { operator: _operator = "", semver: _semver = "" } = match.groups, 
    // when no operator matches, then an exact version match is being performed, which is equivalent to the "=" operator.
    operator = (_operator || "="), 
    // now we normalize all wildcard notations into a single format: `5.x.x`.
    semver_match = semver_regex.exec(normalize(clean(_semver)));
    if (!semver_match) {
        throw new Error(`[semver]: error parsing semver: "${_semver}"`);
    }
    const { major = wildcard_char, minor = wildcard_char, patch = wildcard_char, prerelease = "", build = "" } = semver_match.groups, major_num = (major === wildcard_char) ? undefined : number_parseInt(major), minor_num = (minor === wildcard_char) ? undefined : number_parseInt(minor), patch_num = (patch === wildcard_char) ? undefined : number_parseInt(patch);
    return {
        operator,
        major: major_num,
        minor: minor_num,
        patch: patch_num,
        prerelease,
        build,
    };
};
const _1_OrLexer = {
    tokenExp: "[OR]",
    parseExp: /\s*\|\|\s*/g,
    lexer(substr) { return substr.split(this.tokenExp); },
};
const _2_HyphenLexer = {
    tokenExp: "[HYPHEN]",
    parseExp: /\s+\-\s+/g,
    lexer(substr) {
        const hyphen_match = substr.match(hyphen_range_regex);
        if (!hyphen_match) {
            return undefined;
        }
        const low_ver = clean(hyphen_match[1]), high_ver = clean(hyphen_match[2]);
        return [low_ver, high_ver];
    },
};
const hyphen_range_regex = new RegExp(`^(.+?)${escapeLiteralStringForRegex(_2_HyphenLexer.tokenExp)}(.+?)$`);
const _3_AndLexer = {
    tokenExp: "[AND]",
    parseExp: /\s+/g,
    lexer(substr) { return substr.split(this.tokenExp); },
};
const all_operators = ["=", "!=", ">=", "<=", ">", "<", "~", "^"], all_impossible_major_xrange_operators = [">", "<", "!="];
const clean_range = (range) => {
    // cleans up a range string
    for (const op of all_operators) {
        range = range.replaceAll(new RegExp(`${escapeLiteralStringForRegex(op)}\\s*`, "g"), op);
    }
    return range;
};
/** desugars an {@link Operator} to a list of {@link Comparator}s (joined by an AND statement). */
const desugar_operator = (operator_expression) => {
    if (isString(operator_expression)) {
        // check for the existence of the "[HYPHEN]" token (for hyphen ranges such as "1.2.3 - 2.3.4"),
        // which would need to be transformed to the form ">=1.2.3 <=2.3.4".
        const hyphen_match = _2_HyphenLexer.lexer(operator_expression);
        if (hyphen_match) {
            const [lower, upper] = hyphen_match;
            return [...desugar_operator(`>=${lower}`), ...desugar_operator(`<=${upper}`)];
        }
        operator_expression = parseOperator(operator_expression);
    }
    const { operator = "=", major, minor, patch, prerelease, build } = operator_expression;
    // first we handle all possible ranges
    if (major === undefined) {
        // handling impossible ranges by annotating everything as `-1`.
        return all_impossible_major_xrange_operators.includes(operator)
            ? [{ operator: "=", major: -1, minor: -1, patch: -1 }]
            : [{ operator: ">=", major: 0, minor: 0, patch: 0 }];
    }
    if (minor === undefined) {
        switch (operator) {
            case "!=": return [
                { operator: "<", major, minor: 0, patch: 0 },
                { operator: ">=", major: major + 1, minor: 0, patch: 0 },
            ];
            case "<": return [{ operator: "<", major, minor: 0, patch: 0 }];
            case "<=": return [{ operator: "<", major: major + 1, minor: 0, patch: 0 }];
            case ">": return [{ operator: ">=", major: major + 1, minor: 0, patch: 0 }];
            case ">=": return [{ operator: ">=", major, minor: 0, patch: 0 }];
            default: return desugar_operator({ operator: "^", major, minor: 0, patch: 0 });
        }
    }
    if (patch === undefined) {
        switch (operator) {
            case "!=": return [
                { operator: "<", major, minor, patch: 0 },
                { operator: ">=", major, minor: minor + 1, patch: 0 },
            ];
            case "<": return [{ operator: "<", major, minor, patch: 0 }];
            case "<=": return [{ operator: "<", major, minor: minor + 1, patch: 0 }];
            case ">": return [{ operator: ">=", major, minor: minor + 1, patch: 0 }];
            case ">=": return [{ operator: ">=", major, minor, patch: 0 }];
            case "^": if (major > 0 || minor > 0) {
                return desugar_operator({ operator: "^", major, minor, patch: 0 });
            }
            /* falls through */
            default: return desugar_operator({ operator: "~", major, minor, patch: 0 });
        }
    }
    // now we handle all fully defined core-versions
    switch (operator) {
        // a caret allows increments that do not change the first non-zero core-version number.
        case "^": {
            let lower, upper;
            if (major > 0) {
                lower = { operator: ">=", major, minor, patch, prerelease, build };
                upper = { operator: "<", major: major + 1, minor: 0, patch: 0 };
            }
            else if (minor > 0) {
                lower = { operator: ">=", major: 0, minor, patch, prerelease, build };
                upper = { operator: "<", major: 0, minor: minor + 1, patch: 0 };
            }
            else {
                lower = { operator: "=", major: 0, minor: 0, patch, prerelease, build };
                upper = lower;
            }
            return [lower, upper];
        }
        case "~": {
            // a tilde allows for patch level increments.
            const lower = { operator: ">=", major, minor, patch, prerelease, build }, upper = { operator: "<", major, minor: minor + 1, patch: 0 };
            return [lower, upper];
        }
        default: {
            return [{ operator, major, minor, patch, prerelease, build }];
        }
    }
};
/** parse a range string into a {@link Range} type. */
export const parseRange = (range) => {
    // first and foremost, we parse the range expression and insert token strings in place of AND (" "), OR ("||"), and HYPHEN ("-") operators.
    const tokenized_range = clean_range(range)
        .replaceAll(_1_OrLexer.parseExp, _1_OrLexer.tokenExp)
        .replaceAll(_2_HyphenLexer.parseExp, _2_HyphenLexer.tokenExp)
        .replaceAll(_3_AndLexer.parseExp, _3_AndLexer.tokenExp);
    const or_comparisons = [];
    // split on "[OR]" token to support OR ranges.
    for (const part of _1_OrLexer.lexer(tokenized_range)) {
        const and_comparators = [];
        or_comparisons.push(and_comparators);
        // split on "[AND]" token to support AND ranges.
        const and_parts = _3_AndLexer.lexer(part)
            // desugar all operations into simpler ones
            .map(desugar_operator)
            .flat(1);
        and_comparators.push(...and_parts);
    }
    return or_comparisons;
};
const comparison_result_satisfies_operator = [
    ["=", "<=", ">="], // accepted operators when `compare(version, range_segment) === 0`
    ["!=", ">", ">="], // accepted operators when `compare(version, range_segment) === 1`
    ["!=", "<", "<="], // accepted operators when `compare(version, range_segment) === -1`
];
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
export const isSatisfying = (version, range) => {
    version = isString(version) ? parse(version) : version;
    range = isString(range) ? parseRange(range) : range;
    for (const and_parts of range) {
        let does_satisfy_OR_segment = true;
        for (const comp of and_parts) {
            const operator = comp.operator, comparison_result = compare(version, comp), does_satisfy_AND_segment = comparison_result_satisfies_operator.at(comparison_result).includes(operator);
            // below, we also ignore impossible results when the core version is in negative
            if ((does_satisfy_AND_segment === false) || (comp.major < 0)) {
                does_satisfy_OR_segment = false;
                break;
            }
        }
        if (does_satisfy_OR_segment) {
            return true;
        }
    }
    return false;
};
/** get the highest version that satisfies a given `range` from your list of `versions`. */
export const maxSatisfying = (versions, range) => {
    range = isString(range) ? parseRange(range) : range;
    const sorted_versions = sort(versions).toReversed();
    for (const version of sorted_versions) {
        if (isSatisfying(version, range)) {
            return stringify(version);
        }
    }
    return;
};
/** get the lowest version that satisfies a given `range` from your list of `versions`. */
export const minSatisfying = (versions, range) => {
    range = isString(range) ? parseRange(range) : range;
    const sorted_versions = sort(versions);
    for (const version of sorted_versions) {
        if (isSatisfying(version, range)) {
            return stringify(version);
        }
    }
    return;
};
