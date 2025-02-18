/** utility functions for numeric array manipulation and array math functions.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import type { NumericArray } from "./typedefs.js";
/** transpose a 2d array (matrix).
 *
 * if you're wondering what's the difference between this and {@link transposeArray2D} from the {@link "array2d"} submodule,
 * then be my guest, because I am just as puzzled as you.
 * perhaps I forgot that I made one or the other, resulting in duplication.
 *
 * however, there are a few implementation differences between the these two functions:
 * - {@link transpose2D} works by calling the array `map` method.
 * - {@link transposeArray2D} works by assigning values to the new array's transposed indexes.
 *
 * similarities between the two functions:
 * - both transpose sparse 2d arrays to full 2d arrays with the sparse entries replaced with `undefined`.
 * - both use the first element (the first row) to determine the number of columns your 2d array has.
 *   this can mean disastrous cropped results if a sparse 2d array is provided where the first row's
 *   number of elements (i.e. number of columns) is not the greatest out of all the other rows.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const sparse_arr2d: Array<number[]> = [
 * 	[1 , 2 , 3 , 4 , 5 ],
 * 	[6 , 7 , 8 , 9],
 * 	[11, 12, 13],
 * 	[16, 17, 18, 19, 20],
 * ]
 *
 * const sparse_arr2d_transposed = transpose2D(sparse_arr2d)
 *
 * sparse_arr2d_transposed satisfies Array<number>[]
 *
 * assertEquals(sparse_arr2d_transposed, [
 * 	[1 , 6         , 11        , 16],
 * 	[2 , 7         , 12        , 17],
 * 	[3 , 8         , 13        , 18],
 * 	[4 , 9         , undefined , 19],
 * 	[5 , undefined , undefined , 20],
 * ])
 * ```
*/
export declare const transpose2D: <T>(matrix: Array<T>[]) => Array<T>[];
/** compute the left-to-right running difference between successive elements.
 *
 * the returned array's length is decremented by one.
 * as a result, a single element array will turn into an empty array.
 *
 * > [!note]
 * > be careful when using with unsigned typed arrays.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // basic example
 * const arr1 = [1, 2, 3, 4, 5, 99, 88]
 * const arr1_diff = diff(arr1)
 * assertEquals(arr1_diff, [1, 1, 1, 1, 94, -11])
 *
 * // subarray slicing example
 * const arr2 = [1, 2, 3, 4, 5, 99, 88]
 * const arr2_diff = diff(arr2, 2, -1)
 * assertEquals(arr2_diff, [1, 1, 94])
 * ```
*/
export declare const diff: <A extends NumericArray = any>(arr: A, start?: number, end?: number) => A;
/** compute the right-to-left (ie reverse) running difference between preceding elements.
 *
 * the returned array's length is decremented by one.
 * as a result, a single element array will turn into an empty array.
 *
 * > [!note]
 * > be careful when using with unsigned typed arrays.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // basic example
 * const arr1 = [1, 2, 3, 4, 5, 99, 88]
 * const arr1_diff = diff_right(arr1)
 * assertEquals(arr1_diff, [-1, -1, -1, -1, -94, 11])
 *
 * // subarray slicing example
 * const arr2 = [1, 2, 3, 4, 5, 99, 88]
 * const arr2_diff = diff_right(arr2, 2, -1)
 * assertEquals(arr2_diff, [-1, -1, -94])
 * ```
*/
export declare const diff_right: <A extends NumericArray = any>(arr: A, start?: number, end?: number) => A;
/** cumulative summation of an array.
 *
 * the returned array has its length increased by one.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // basic example
 * const arr1 = [10, 20, 30, 40, 50]
 * const arr1_cum_sum = cumulativeSum(arr1)
 * assertEquals(arr1_cum_sum, [0, 10, 30, 60, 100, 150])
 * ```
*/
export declare const cumulativeSum: <A extends NumericArray = any>(arr: A) => A;
export type unaryOperator = "abs" | "neg" | "comp";
export type scalarOperator = "add" | "sub" | "mult" | "div" | "pow" | "rem" | "mod" | "and" | "or" | "xor" | "<<" | ">>" | ">>>";
export type elementwiseOperator = scalarOperator;
/** mutate array in-place to get **absolute** value of elements.
 *
 * @category unaryOperator
 * @category inplace
 */
export declare const abs: <A extends NumericArray = any>(arr: A, start?: number, end?: number) => A;
/** mutate array in-place to get **negative** value of elements.
 *
 * @category unaryOperator
 * @category inplace
 */
export declare const neg: <A extends NumericArray = any>(arr: A, start?: number, end?: number) => A;
/** mutate array in-place to get **bitwise complement** value of elements.
 *
 * @category unaryOperator
 * @category inplace
*/
export declare const bcomp: <A extends NumericArray = any>(arr: A, start?: number, end?: number) => A;
/** mutate array in-place to get **bitwise and** against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const band: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to get **bitwise or** against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const bor: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to get **bitwise xor** against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const bxor: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to get **bitwise left-shift** (`<<`) against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const blsh: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to get **bitwise right-shift** (`>>`) against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const brsh: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to get **bitwise unsigned right-shift** (`>>>`) against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const bursh: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to **add** a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const add: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to **subtract** a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const sub: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to **multiply** by a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const mult: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to **divide** by a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const div: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to raise it to the **power** of a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const pow: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to get the **remainder** (`%`) when divided by scalar `value`.
 *
 * note that this is slightly different from the modulo {@link mod} operator, as this can have a negative sign.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const rem: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
/** mutate array in-place to get the **modulo** when divided by scalar `value`.
 *
 * note that this is slightly different from the remainder {@link rem} operator, as this always returns a positive number.
 *
 * @category scalarOperator
 * @category inplace
*/
export declare const mod: <A extends NumericArray = any>(arr: A, value: number, start?: number, end?: number) => A;
//# sourceMappingURL=numericarray.d.ts.map