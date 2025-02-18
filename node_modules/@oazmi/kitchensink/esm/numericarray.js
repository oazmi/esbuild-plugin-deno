/** utility functions for numeric array manipulation and array math functions.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { resolveRange } from "./array1d.js";
import { constructorOf } from "./struct.js";
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
export const transpose2D = (matrix) => (matrix[0].map((_row_0_col_i, i) => matrix.map(row_arr => row_arr[i])));
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
export const diff = (arr, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    const diff_arr = arr.slice(start + 1, end);
    for (let i = 0; i < diff_arr.length; i++) {
        diff_arr[i] -= arr[start + i];
    }
    return diff_arr;
};
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
export const diff_right = (arr, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    const diff_arr = arr.slice(start, end - 1);
    for (let i = 0; i < diff_arr.length; i++) {
        diff_arr[i] -= arr[start + i + 1];
    }
    return diff_arr;
};
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
export const cumulativeSum = (arr) => {
    const len = arr.length, cum_sum = new (constructorOf(arr))(len + 1).fill(0);
    for (let i = 0; i < len; i++) {
        cum_sum[i + 1] = cum_sum[i] + arr[i];
    }
    return cum_sum;
};
/** conduct in-place unary arithmetic operations on numeric arrays
 * TODO: find out why I'm not exporting this function. did I simply forget?
 * @category inplace
*/
const unaryArithmetic = (operation, arr, start, end) => {
    const [xs, xe] = resolveRange(start, end, arr.length);
    switch (operation) {
        case "abs": return abs(arr, xs, xe);
        case "neg": return neg(arr, xs, xe);
        case "comp": return bcomp(arr, xs, xe);
    }
};
/** conduct in-place scalar arithmetic operations on numeric arrays
 * TODO: find out why I'm not exporting this function. did I simply forget?
 * @category inplace
*/
const scalarArithmetic = (operation, arr, value, start, end) => {
    const [xs, xe] = resolveRange(start, end, arr.length);
    switch (operation) {
        case "add": return add(arr, value, xs, xe);
        case "sub": return sub(arr, value, xs, xe);
        case "mult": return mult(arr, value, xs, xe);
        case "div": return div(arr, value, xs, xe);
        case "pow": return pow(arr, value, xs, xe);
        case "rem": return rem(arr, value, xs, xe);
        case "mod": return mod(arr, value, xs, xe);
        case "and": return band(arr, value, xs, xe);
        case "or": return bor(arr, value, xs, xe);
        case "xor": return bxor(arr, value, xs, xe);
        case "<<": return blsh(arr, value, xs, xe);
        case ">>": return brsh(arr, value, xs, xe);
        case ">>>": return bursh(arr, value, xs, xe);
    }
};
/// UNARY OPERATIONS
/** mutate array in-place to get **absolute** value of elements.
 *
 * @category unaryOperator
 * @category inplace
 */
export const abs = (arr, start = 0, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] *= arr[i] < 0 ? -1 : 1;
    }
    return arr;
};
/** mutate array in-place to get **negative** value of elements.
 *
 * @category unaryOperator
 * @category inplace
 */
export const neg = (arr, start = 0, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] *= -1;
    }
    return arr;
};
/** mutate array in-place to get **bitwise complement** value of elements.
 *
 * @category unaryOperator
 * @category inplace
*/
export const bcomp = (arr, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] = ~arr[i];
    }
    return arr;
};
/// SCALAR OPERATIONS
/// TODO consider replacing some functions entirely with a linear function `y = ax + b`.
/** mutate array in-place to get **bitwise and** against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const band = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] &= value;
    }
    return arr;
};
/** mutate array in-place to get **bitwise or** against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const bor = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] |= value;
    }
    return arr;
};
/** mutate array in-place to get **bitwise xor** against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const bxor = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] ^= value;
    }
    return arr;
};
/** mutate array in-place to get **bitwise left-shift** (`<<`) against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const blsh = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] <<= value;
    }
    return arr;
};
/** mutate array in-place to get **bitwise right-shift** (`>>`) against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const brsh = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] >>= value;
    }
    return arr;
};
/** mutate array in-place to get **bitwise unsigned right-shift** (`>>>`) against a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const bursh = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] >>>= value;
    }
    return arr;
};
/** mutate array in-place to **add** a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const add = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] += value;
    }
    return arr;
};
/** mutate array in-place to **subtract** a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const sub = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] -= value;
    }
    return arr;
};
/** mutate array in-place to **multiply** by a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const mult = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] *= value;
    }
    return arr;
};
/** mutate array in-place to **divide** by a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const div = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] /= value;
    }
    return arr;
};
/** mutate array in-place to raise it to the **power** of a scalar `value`.
 *
 * @category scalarOperator
 * @category inplace
*/
export const pow = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] **= value;
    }
    return arr;
};
/** mutate array in-place to get the **remainder** (`%`) when divided by scalar `value`.
 *
 * note that this is slightly different from the modulo {@link mod} operator, as this can have a negative sign.
 *
 * @category scalarOperator
 * @category inplace
*/
export const rem = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] %= value;
    }
    return arr;
};
/** mutate array in-place to get the **modulo** when divided by scalar `value`.
 *
 * note that this is slightly different from the remainder {@link rem} operator, as this always returns a positive number.
 *
 * @category scalarOperator
 * @category inplace
*/
export const mod = (arr, value, start, end) => {
    [start, end] = resolveRange(start, end, arr.length);
    for (let i = start; i < end; i++) {
        arr[i] = ((arr[i] % value) + value) % value;
    }
    return arr;
};
