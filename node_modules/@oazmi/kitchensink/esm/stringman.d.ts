/** utility functions for manipulating, generating, or parsing `string`s.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import type { NumericArray } from "./typedefs.js";
/** configuration for customizing the hex-string representation made by {@link hexStringOfArray}.
 *
 * the default configuration is:
 *
 * ```ts
 * const default_HexStringReprConfig: HexStringReprConfig = {
 * 	sep: ", ",
 * 	prefix: "0x",
 * 	postfix: "",
 * 	trailingSep: false,
 * 	bra: "[",
 * 	ket: "]",
 * 	toUpperCase: true,
 * 	radix: 16,
 * }
 * ```
*/
export interface HexStringReprConfig {
    /** separator character string between bytes.
     *
     * @defaultValue `", "`
    */
    sep: string;
    /** what string to prefix every hex-string byte with?
     *
     * @defaultValue  `"0x"`
    */
    prefix: string;
    /** what string to add to the end of every hex-string byte?
     *
     * @defaultValue `""` (an empty string)
    */
    postfix: string;
    /** specify if you want to include a trailing {@link sep} after the final byte.
     *
     * - example output when `true`: `"[0x01, 0x02, 0x03,]"`,
     * - example output when `false`: `"[0x01, 0x02, 0x03]"`.
     *
     * @defaultValue `false`
    */
    trailingSep: boolean;
    /** the left bracket string.
     *
     * @defaultValue `"["`
    */
    bra: string;
    /** the right bracket string.
     *
     * @defaultValue `"]"`
    */
    ket: string;
    /** specify if you want upper case letters for the hex-string.
     *
     * @defaultValue  `true`
    */
    toUpperCase: boolean;
    /** provide an alternate number base to encode the numbers into.
     * see {@link Number.toString} for more details.
     *
     * use `16` for a hex-string, or `2` for binary-string.
     * accepted values must be between `2` and `36`.
     *
     * @defaultValue `16`
    */
    radix: number;
}
/** convert an array of integer numbers to hex-string, for the sake of easing representation, or for visual purposes.
 *
 * to customize the apearance of the hex-string, or to use a different radix, use the {@link HexStringReprConfig} interface to change the default `options`.
 *
 * you must make sure that every element of your array `arr` is non-negative, in addition to being less than `options.radix ** 2`.
 * since the default `options.radix === 16`, each of your number must be smaller than `256` on the default config.
 *
 * to invert the operation of this function (i.e. parse an array of integers from a string), use the {@link hexStringToArray} function with the same config `options`.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * const
 * 	my_binary_code = [1, 2, 3, 125, 126, 127, 192, 225, 255],
 * 	my_custom_config: Partial<HexStringReprConfig> = {
 * 		sep: ",",
 * 		trailingSep: true,
 * 		bra: "<",
 * 		ket: ">",
 * 	}
 *
 * const my_binary_code_repr = hexStringOfArray(my_binary_code, my_custom_config)
 *
 * assertEq(my_binary_code_repr, "<0x01,0x02,0x03,0x7D,0x7E,0x7F,0xC0,0xE1,0xFF,>")
 * ```
*/
export declare const hexStringOfArray: (arr: NumericArray, options: Partial<HexStringReprConfig>) => string;
/** convert hex-string back to an array of integers,
 * provided that you know the exact {@link HexStringReprConfig} config of your particular hex-string.
 *
 * this function performs the inverse operation of {@link hexStringOfArray}, given that you use the same `options`.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * const
 * 	my_binary_code_repr = "<0x01,0x02,0x03,0x7D,0x7E,0x7F,0xC0,0xE1,0xFF,>",
 * 	my_custom_config: Partial<HexStringReprConfig> = {
 * 		sep: ",",
 * 		trailingSep: true,
 * 		bra: "<",
 * 		ket: ">",
 * 	}
 *
 * const my_binary_code: number[] = hexStringToArray(my_binary_code_repr, my_custom_config)
 *
 * assertEq(my_binary_code, [1, 2, 3, 125, 126, 127, 192, 225, 255])
 * ```
*/
export declare const hexStringToArray: (hex_str: string, options: Partial<HexStringReprConfig>) => Array<number>;
/** a shorthand function for either getting the upper or lower case of a string `str`, based on the numeric `option`.
 *
 * options:
 * - `option > 0` => input string is turned to uppercase
 * - `option < 0` => input string is turned to lowercase
 * - `option = 0` => input string is unmodified
*/
export declare const toUpperOrLowerCase: (str: string, option: 1 | 0 | -1) => string;
/** finds the index of next uppercase character, starting from index `start` and optionally ending at exclusive-index `end`.
 * if an uppercase character is not found, then `undefined` is returned.
*/
export declare const findNextUpperCase: (str: string, start?: number, end?: number | undefined) => number | undefined;
/** finds the index of next lowercase character, starting from index `start` and optionally ending at exclusive-index `end`.
 * if a lowercase character is not found, then `undefined` is returned.
*/
export declare const findNextLowerCase: (str: string, start?: number, end?: number | undefined) => number | undefined;
/** find either the next upper or next lower case character index in string `str`, based on the numeric `option`,
 * starting from index `start` and optionally ending at exclusive-index `end`.
 * if your selected uppercase/lowercase option is not found, or if your `option === 0`, then `undefined` is returned.
 *
 * this function is just a composition of the functions {@link findNextUpperCase} and {@link findNextLowerCase}.
*/
export declare const findNextUpperOrLowerCase: (str: string, option: 1 | -1, start?: number, end?: number | undefined) => number | undefined;
/** this interface is used by various functions in this submodule to parse and unparse word tokens of various styles.
 * it provides the description of your tokens, so that it can be broken down into words, or vice-versa.
 *
 * here is a list of functions that make use of this interface:
 * - {@link wordsToToken}, {@link tokenToWords}, {@link convertCase}, {@link convertCase_Factory}
 *
 * the `NamingCaseTuple` consists of the following configurable options, as an array:
 *
 * - index `0`: specifies the `first_letter_upper` option: <br>
 *   _is the first letter an upper case letter?_
 *   - ` 1` => yes.
 *   - `-1` => no.
 *   - ` 0` => impartial (in other words, it will depend-on/inherit `word_first_letter_upper`).
 *
 * - index `1`: specifies the `word_first_letter_upper` option: <br>
 *   _is the first letter of each word an upper case letter?_
 *   - ` 1` => yes.
 *   - `-1` => no.
 *   - ` 0` => preserve original.
 *
 * - index `2`: specifies the `rest_word_letters_upper` option: <br>
 *   _are the remaining letters in each word in upper case?_
 *   - ` 1` => yes.
 *   - `-1` => no.
 *   - ` 0` => preserve original.
 *
 * - index `3`: specifies the `delimiter` option: <br>
 *   _what is the separator between words in a single token (if any)?_
 *   - `    ""` => (default) indicates that there's no delimiter character.
 *     so we must rely on letter case change to detect word splitting.
 *     this is what is used for camelCase and PascalCase.
 *   - `   "_"` => delimiter is used by snake_case.
 *   - `   "-"` => delimiter is used by kebab-case.
 *   - `string` => define a custom delimiter string.
 *
 * - index `4`: specifies the `prefix` option: <br>
 *   _what is the prefix string (if any)?_
 *
 * - index `5`: specifies the `suffix` option: <br>
 *   _what is the suffix string (if any)?_
*/
export type NamingCaseTuple = [
    first_letter_upper: 1 | 0 | -1,
    word_first_letter_upper: 1 | 0 | -1,
    rest_word_letters_upper: 1 | 0 | -1,
    delimiter?: "" | "_" | "-" | string,
    prefix?: string,
    suffix?: string
];
/** convert an array of `words` to a single token, based on the configuration provided in `casetype`.
 *
 * to reverse the operation of this function, use the {@link tokenToWords} function with the same `casetype` config that you use here.
 *
 * @example
 * ```ts
 * import { assertEquals as eq } from "jsr:@std/assert"
 *
 * const words = ["convert", "windows", "path", "to", "unix"]
 *
 * const
 * 	snakeCase: NamingCaseTuple = [-1, -1, -1, "_"],
 * 	kebabCase: NamingCaseTuple = [-1, -1, -1, "-"],
 * 	camelCase: NamingCaseTuple = [-1, 1, -1, ""],
 * 	pascalCase: NamingCaseTuple = [1, 1, -1, ""],
 * 	screamingSnakeCase: NamingCaseTuple = [1, 1, 1, "_"],
 * 	screamingKebabCase: NamingCaseTuple = [1, 1, 1, "-"]
 *
 * eq(wordsToToken(snakeCase, words),          "convert_windows_path_to_unix")
 * eq(wordsToToken(kebabCase, words),          "convert-windows-path-to-unix")
 * eq(wordsToToken(camelCase, words),          "convertWindowsPathToUnix")
 * eq(wordsToToken(pascalCase, words),         "ConvertWindowsPathToUnix")
 * eq(wordsToToken(screamingSnakeCase, words), "CONVERT_WINDOWS_PATH_TO_UNIX")
 * eq(wordsToToken(screamingKebabCase, words), "CONVERT-WINDOWS-PATH-TO-UNIX")
 * ```
*/
export declare const wordsToToken: (casetype: NamingCaseTuple, words: string[]) => string;
/** breakdown a single `token` into its constituent words, based on the configuration provided in `casetype`.
 *
 * this function performs the inverse operation of {@link wordsToToken}, provided that you use the same `casetype` config.
 *
 * @example
 * ```ts
 * import { assertEquals as eq } from "jsr:@std/assert"
 *
 * const
 * 	snakeCase: NamingCaseTuple = [-1, -1, -1, "_"],
 * 	kebabCase: NamingCaseTuple = [-1, -1, -1, "-"],
 * 	camelCase: NamingCaseTuple = [-1, 1, -1, ""],
 * 	pascalCase: NamingCaseTuple = [1, 1, -1, ""],
 * 	screamingSnakeCase: NamingCaseTuple = [1, 1, 1, "_"],
 * 	screamingKebabCase: NamingCaseTuple = [1, 1, 1, "-"]
 *
 * // the expected list of words that our tokens should breakdown into
 * const words = ["convert", "windows", "path", "to", "unix"]
 *
 * eq(tokenToWords(snakeCase,          "convert_windows_path_to_unix"), words)
 * eq(tokenToWords(kebabCase,          "convert-windows-path-to-unix"), words)
 * eq(tokenToWords(camelCase,          "convertWindowsPathToUnix"),     words)
 * eq(tokenToWords(pascalCase,         "ConvertWindowsPathToUnix"),     words)
 * eq(tokenToWords(screamingSnakeCase, "CONVERT_WINDOWS_PATH_TO_UNIX"), words)
 * eq(tokenToWords(screamingKebabCase, "CONVERT-WINDOWS-PATH-TO-UNIX"), words)
 * ```
*/
export declare const tokenToWords: (casetype: NamingCaseTuple, token: string) => string[];
/** converts a string token from one case type to another,
 * by performing a composition operation of {@link tokenToWords} and {@link wordsToToken}.
 *
 * @example
 * ```ts
 * import { assertEquals as eq } from "jsr:@std/assert"
 *
 * const
 * 	snakeCase: NamingCaseTuple = [-1, -1, -1, "_"],
 * 	kebabCase: NamingCaseTuple = [-1, -1, -1, "-"],
 * 	camelCase: NamingCaseTuple = [-1, 1, -1, ""],
 * 	pascalCase: NamingCaseTuple = [1, 1, -1, ""],
 * 	screamingSnakeCase: NamingCaseTuple = [1, 1, 1, "_"],
 * 	screamingKebabCase: NamingCaseTuple = [1, 1, 1, "-"]
 *
 * eq(convertCase(
 * 	snakeCase, screamingSnakeCase,
 * 	"convert_windows_path_to_unix",
 * ), "CONVERT_WINDOWS_PATH_TO_UNIX")
 *
 * eq(convertCase(
 * 	kebabCase, camelCase,
 * 	"convert-windows-path-to-unix",
 * ), "convertWindowsPathToUnix")
 *
 * eq(convertCase(
 * 	camelCase, kebabCase,
 * 	"convertWindowsPathToUnix",
 * ), "convert-windows-path-to-unix")
 *
 * eq(convertCase(
 * 	kebabCase, kebabCase,
 * 	"convert-windows-path-to-unix",
 * ), "convert-windows-path-to-unix")
 *
 * eq(convertCase(
 * 	screamingKebabCase, pascalCase,
 * 	"CONVERT-WINDOWS-PATH-TO-UNIX",
 * ), "ConvertWindowsPathToUnix")
 * ```
*/
export declare const convertCase: (from_casetype: NamingCaseTuple, to_casetype: NamingCaseTuple, token: string) => string;
/** generate a specific case converter. convenient for continued use.
 *
 * see {@link kebabToCamel} and {@link camelToKebab} as examples that are generated via this function.
*/
export declare const convertCase_Factory: (from_casetype: NamingCaseTuple, to_casetype: NamingCaseTuple) => ((token: string) => string);
/** the token name casing configuration for a "snake_case". */
export declare const snakeCase: NamingCaseTuple;
/** the token name casing configuration for a "kebab-case". */
export declare const kebabCase: NamingCaseTuple;
/** the token name casing configuration for a "camelCase". */
export declare const camelCase: NamingCaseTuple;
/** the token name casing configuration for a "PascalCase". */
export declare const pascalCase: NamingCaseTuple;
/** the token name casing configuration for a "SCREAMING_SNAKE_CASE". */
export declare const screamingSnakeCase: NamingCaseTuple;
/** the token name casing configuration for a "SCREAMING-SNAKE-CASE". */
export declare const screamingKebabCase: NamingCaseTuple;
/** a function to convert snake case token to a kebab case token. */
export declare const snakeToKebab: (token: string) => string;
/** a function to convert snake case token to a camel case token. */
export declare const snakeToCamel: (token: string) => string;
/** a function to convert snake case token to a pascal case token. */
export declare const snakeToPascal: (token: string) => string;
/** a function to convert kebab case token to a snake case token. */
export declare const kebabToSnake: (token: string) => string;
/** a function to convert kebab case token to a camel case token. */
export declare const kebabToCamel: (token: string) => string;
/** a function to convert kebab case token to a pascal case token. */
export declare const kebabToPascal: (token: string) => string;
/** a function to convert camel case token to a snake case token. */
export declare const camelToSnake: (token: string) => string;
/** a function to convert camel case token to a kebab case token. */
export declare const camelToKebab: (token: string) => string;
/** a function to convert camel case token to a pascal case token. */
export declare const camelToPascal: (token: string) => string;
/** a function to convert pascal case token to a snake case token. */
export declare const PascalToSnake: (token: string) => string;
/** a function to convert pascal case token to a kebab case token. */
export declare const PascalToKebab: (token: string) => string;
/** a function to convert pascal case token to a camel case token. */
export declare const PascalTocamel: (token: string) => string;
/** surround a string with double quotation.
 *
 * someone should nominate this function for 2025 mathematics nobel prize.
*/
export declare const quote: (str: string) => string;
/** reversing a string is not natively supported by javascript, and performing it is not so trivial when considering that
 * you can have composite UTF-16 characters (such as emojis and characters with accents).
 *
 * see this excellent solution in stackoverflow for reversing a string: [stackoverflow.com/a/60056845](https://stackoverflow.com/a/60056845).
 * we use the slightly less reliable technique provided by the answer, as it has a better browser support.
*/
export declare const reverseString: (input: string) => string;
/** find the longest common prefix among a list of `inputs`.
 *
 * for efficiency, this function starts off by using the shortest string among `inputs`, then performs a binary search.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * assertEq(commonPrefix([
 * 	"C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"C:/Hello/World/This/Is/Not/An/Example/",
 * 	"C:/Hello/Earth/Bla/Bla/Bla",
 * ]), "C:/Hello/")
 *
 * assertEq(commonPrefix([
 * 	"C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"C:/Hello/World/This/is/an/example/bla.cs",
 * 	"C:/Hello/World/This/Is/Not/An/Example/",
 * ]), "C:/Hello/World/This/")
 *
 * assertEq(commonPrefix([
 * 	"C:/Hello/World/Users/This/Is/An/Example/Bla.cs",
 * 	"C:/Hello/World Users/This/Is/An/example/bla.cs",
 * 	"C:/Hello/World-Users/This/Is/Not/An/Example/",
 * ]), "C:/Hello/World")
 * ```
*/
export declare const commonPrefix: (inputs: string[]) => string;
/** find the longest common suffix among a list of `inputs`.
 *
 * for efficiency, this function simply reverses the character ordering of each input, and then uses {@link commonPrefix}.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * assertEq(commonSuffix([
 * 	"file:///C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"file:///C:/Hello/Users/This/Is-An/Example/Bla.cs",
 * 	"file:///C:/Hello/Users/This/Is/YetAnother-An/Example/Bla.cs",
 * 	"file:///C:/Hello/Earth/This/Is/Not/An/Example/Bla.cs",
 * ]), "An/Example/Bla.cs")
 * ```
*/
export declare const commonSuffix: (inputs: string[]) => string;
/** this regex contains all characters that need to be escaped in a regex.
 * it is basically defined as `/[.*+?^${}()|[\]\\]/g`.
*/
export declare const escapeLiteralCharsRegex: RegExp;
/** escape a string so that it can be matched exactly in a regex constructor.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * const
 * 	substring = String.raw`(\|[++h.e.\\.o++]|/)`,
 * 	substring_escaped = escapeLiteralStringForRegex(substring),
 * 	my_regex = new RegExp(`${substring_escaped}\\(world\\)`),
 * 	my_string = String.raw`this string consist of (\|[++h.e.\\.o++]|/)(world) positioned somewhere in the middle`
 *
 * assertEq(my_regex.test(my_string), true)
 * ```
*/
export declare const escapeLiteralStringForRegex: (str: string) => string;
/** replace the `prefix` of of a given `input` string with the given replace `value`.
 * if a matching prefix is not found, then `undefined` will be returned.
 *
 * @param input the input string to apply the prefix replacement to.
 * @param prefix the prefix string of the input to replace.
 * @param value the optional value to replace the the prefix with. defaults to `""` (empty string).
 * @returns if a matching `prefix` is found in the `input`, then it will be replaced with the given `value`.
 *   otherwise, `undefined` will be returned if the `input` does not begin with the `prefix`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our function for brevity
 * const
 * 	eq = assertEquals,
 * 	fn = replacePrefix
 *
 * eq(fn("hello-world/abc-123", "hello-", "goodbye-"), "goodbye-world/abc-123")
 * eq(fn("hello-world/abc-123", "hello-"),             "world/abc-123")
 * eq(fn("hello-world/abc-123", "abc"),                undefined)
 * eq(fn("hello-world/abc-123", ""),                   "hello-world/abc-123")
 * eq(fn("hello-world/abc-123", "", "xyz-"),           "xyz-hello-world/abc-123")
 * ```
*/
export declare const replacePrefix: (input: string, prefix: string, value?: string) => string | undefined;
/** replace the `suffix` of of a given `input` string with the given replace `value`.
 * if a matching suffix is not found, then `undefined` will be returned.
 *
 * @param input the input string to apply the suffix replacement to.
 * @param suffix the suffix string of the input to replace.
 * @param value the optional value to replace the the suffix with. defaults to `""` (empty string).
 * @returns if a matching `suffix` is found in the `input`, then it will be replaced with the given `value`.
 *   otherwise, `undefined` will be returned if the `input` does not begin with the `suffix`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our function for brevity
 * const
 * 	eq = assertEquals,
 * 	fn = replaceSuffix
 *
 * eq(fn("hello-world/abc-123", "-123", "-xyz"), "hello-world/abc-xyz")
 * eq(fn("hello-world/abc-123", "-123"),         "hello-world/abc")
 * eq(fn("hello-world/abc-123", "abc"),          undefined)
 * eq(fn("hello-world/abc-123", ""),             "hello-world/abc-123")
 * eq(fn("hello-world/abc-123", "", "-xyz"),     "hello-world/abc-123-xyz")
 * ```
*/
export declare const replaceSuffix: (input: string, suffix: string, value?: string) => string | undefined;
/** remove comments and trailing commas from a "jsonc" (json with comments) string.
 *
 * in a jsonc-string, there three additional features that supersede a regular json-string:
 * - inline comments: anything affer a double forward-slash `//` (that is not part of a string) is a comment, until the end of the line.
 * - multiline comments: anything inside the c-like multiline comment block (`/* ... *\/`) is a comment.
 * - trailing commas: you can add up to one trailing comma (`,`) after the last element of an array, or the last entry of a dictionary.
 *
 * moreover, this function also trims unnecessary whitespaces and newlines outside of string literals.
 *
 * once you have converted your jsonc-string to a json-string, you will probably want to use `JSON.parse` to parse the output.
 *
 * @param jsonc_string - The jsonc string from which comments need to be removed.
 * @returns A string representing the jsonc-equivalent content, without comments and trailing commas.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const my_jsonc = `
 * {
 * 	// inline comment
 * 	"key1": "value1",
 * 	/* block comment *\/ "key2": 2,
 * 	/* multiline block comment
 * 	 * hello
 * 	 * world
 * 	*\/
 * 	"key3": {
 * 		"//key4": "value4 //",
 * 		"jsonInComment": "/* { \\"key\\": \\"value\\" } *\/",
 * 		"trickyEscapes": "a string with \\\\\\"escaped quotes\\\\\\" and /* fake comment *\/ inside and \\newline",
 * 	},
 * 	"array1": [
 * 	"/* not a comment *\/",
 * 	"// also not a comment",
 * 	"has a trailing comma" // trailing comma below	\t \t tab characters.
 * 	,   		           // <-- trailing comma here. and some more 	\t	\t tab characters.
 * 	],
 * 	/* Block comment containing JSON:
 * 	{ "fakeKey": "fakeValue" },
 * 	*\/
 * 	"arr//ay2": [
 * 	true, false, { "1": false, "2": true, },
 * 	42,7,
 * 	// scientific notation
 * 	1e10,],
 * }`
 *
 * const expected_value = {
 * 	key1: "value1",
 * 	key2: 2,
 * 	key3: {
 * 		"//key4": "value4 //",
 * 		jsonInComment: `/* { "key": "value" } *\/`,
 * 		trickyEscapes: `a string with \\"escaped quotes\\" and /* fake comment *\/ inside and \newline`,
 * 	},
 * 	array1: [
 * 		"/* not a comment *\/",
 * 		"// also not a comment",
 * 		"has a trailing comma",
 * 	],
 * 	"arr//ay2": [ true, false, { "1": false, "2": true }, 42, 7, 10000000000, ]
 * }
 *
 * const
 * 	my_json = jsoncRemoveComments(my_jsonc),
 * 	my_parsed_json = JSON.parse(my_json)
 *
 * assertEquals(my_parsed_json, expected_value)
 * ```
*/
export declare const jsoncRemoveComments: (jsonc_string: string) => string;
//# sourceMappingURL=stringman.d.ts.map