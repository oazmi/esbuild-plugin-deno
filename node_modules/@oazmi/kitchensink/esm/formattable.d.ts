/** utility functions for creating and formatting string representations of mostly numeric data.
 *
 * TODO: add documentation, you filthy swine!
 *
 * @module
*/
import "./_dnt.polyfills.js";
import type { Degrees, UByte, UnitInterval } from "./typedefs.js";
/** represents a function that formats an atomic-value `T` to its string representation */
export type FormatValue<T extends any = number> = (value: T, i?: number, arr?: Array<unknown>) => string;
/** represents signature of a function that formats either an atomic-value `T`, or an array thereof (`T[]`), to its/their string representation */
export interface FormatValueOrArray<T> {
    (value: T): string;
    (array: T[]): string[];
}
/** format atomic-value `v: T` or atomic-elements inside of `v: Array<T>`, using the given `formatter` atomic-value mapping function */
export declare const formatEach: <T, S = string | string[]>(formatter: FormatValue<T>, v: T | T[]) => S;
export declare const percent_fmt: FormatValue<UnitInterval>;
export declare const percent: FormatValueOrArray<UnitInterval>;
export declare const ubyte_fmt: FormatValue<UByte>;
export declare const ubyte: FormatValueOrArray<UnitInterval>;
export declare const udegree_fmt: FormatValue<Degrees>;
export declare const udegree: FormatValueOrArray<Degrees>;
export declare const hex_fmt: FormatValue<UByte>;
export declare const rgb_hex_fmt: FormatValue<[R: UByte, G: UByte, B: UByte]>;
export declare const rgba_hex_fmt: FormatValue<[R: UByte, G: UByte, B: UByte, A?: UnitInterval]>;
export declare const rgb_fmt: FormatValue<[R: UByte, G: UByte, B: UByte]>;
export declare const rgba_fmt: FormatValue<[R: UByte, G: UByte, B: UByte, A: UnitInterval]>;
export declare const hsl_fmt: FormatValue<[H: Degrees, S: UnitInterval, L: UnitInterval]>;
export declare const hsla_fmt: FormatValue<[H: Degrees, S: UnitInterval, L: UnitInterval, A: UnitInterval]>;
//# sourceMappingURL=formattable.d.ts.map