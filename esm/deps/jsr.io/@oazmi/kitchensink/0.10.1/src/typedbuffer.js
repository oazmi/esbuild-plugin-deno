/** utility functions for handling buffers and typed arrays, and also reading and writing data to them.
 *
 * TODO: needs more tests and a lot more examples on how to use, or provide visualization of the function's action.
 *
 * @module
*/
import { console_error } from "./alias.js";
import { resolveRange } from "./array1d.js";
import { DEBUG } from "./deps.js";
import { min } from "./numericmethods.js";
import { constructorOf } from "./struct.js";
/** checks if an object `obj` is a {@link TypedArray}, based on simply checking whether `obj.buffer` exists or not.
 *
 * this is certainly not a very robust way of verifying.
 * a better approach would be to check if `obj instanceof Object.getPrototypeOf(Uint8Array)`, but this is quicker.
*/
export const isTypedArray = (obj) => (obj.buffer ? true : false);
/** get a typed array constructor by specifying the type as a string. */
export const typed_array_constructor_of = (type) => {
    if (type[2] === "c") {
        return Uint8ClampedArray;
    }
    type = (type[0] + type[1]); // this is to trim excessive tailing characters
    switch (type) {
        case "u1": return Uint8Array;
        case "u2": return Uint16Array;
        case "u4": return Uint32Array;
        //case "u8": return BigUint64Array as TypedArrayConstructor<DType>
        case "i1": return Int8Array;
        case "i2": return Int16Array;
        case "i4": return Int32Array;
        //case "i8": return BigInt64Array as TypedArrayConstructor<DType>
        case "f4": return Float32Array;
        case "f8": return Float64Array;
    }
    console_error(DEBUG.ERROR && "an unrecognized typed array type `\"${type}\"` was provided");
    return Uint8Array;
};
/** dictates if the native endianness of your `TypedArray`s is little endian. */
export const getEnvironmentEndianness = () => ((new Uint8Array(Uint32Array.of(1).buffer))[0] === 1
    ? true
    : false);
/** this variable dictates if the native endianness of your `TypedArray`s is little endian. */
export const env_is_little_endian = /*@__PURE__*/ getEnvironmentEndianness();
/** swap the endianness of the provided `Uint8Array` buffer array **in-place**,
 * given that each element has a byte-size of `bytesize`.
 *
 * @category inplace
*/
export const swapEndiannessInplace = (buf, bytesize) => {
    const len = buf.byteLength;
    for (let i = 0; i < len; i += bytesize) {
        buf.subarray(i, i + bytesize).reverse();
    }
    return buf;
};
/** 10x faster implementation of {@link swapEndiannessInplace} that does not mutatate the original `buf` array.
 *
 * @category copy
*/
export const swapEndiannessFast = (buf, bytesize) => {
    const len = buf.byteLength, swapped_buf = new Uint8Array(len), bs = bytesize;
    for (let offset = 0; offset < bs; offset++) {
        const a = bs - 1 - offset * 2;
        for (let i = offset; i < len + offset; i += bs) {
            swapped_buf[i] = buf[i + a];
        }
    }
    /* the above loop is equivalent to the following:
     * ```ts
     * for (let offset = 0; offset < bs; offset++) {
     * 	for (let i = 0; i < len; i += bs) { swapped_buf[i + offset] = buf[i + bs - 1 - offset] }
     * }
     * ```
    */
    return swapped_buf;
};
/** concatenate a bunch of `Uint8Array` and `Array<number>` into a single `Uint8Array` array.
 *
 * @category copy
*/
export const concatBytes = (...arrs) => {
    const offsets = [0];
    for (const arr of arrs) {
        offsets.push(offsets[offsets.length - 1] + arr.length);
    }
    const outarr = new Uint8Array(offsets.pop());
    for (const arr of arrs) {
        outarr.set(arr, offsets.shift());
    }
    return outarr;
};
/** concatenate a bunch of {@link TypedArray}.
 *
 * @category copy
*/
export const concatTyped = (...arrs) => {
    const offsets = [0];
    for (const arr of arrs) {
        offsets.push(offsets[offsets.length - 1] + arr.length);
    }
    const outarr = new (constructorOf(arrs[0]))(offsets.pop());
    for (const arr of arrs) {
        outarr.set(arr, offsets.shift());
    }
    return outarr;
};
/** split {@link TypedArray} **in-place**, after every `step` number of elements through the use of subarray views.
 *
 * @deprecated kind of pointless, when {@link sliceSkipTypedSubarray} and {@link sliceSkip} exist.
 * @category inplace
*/
export const splitTypedSubarray = (arr, step) => sliceSkipTypedSubarray(arr, step);
/** slice `slice_length` number of elements, then jump forward `skip_length` number of elements, and repeat.
 *
 * optionally provide a `start` index to begin at, and an `end` index to stop at.
 *
 * if you want to skip first and slice second, you can set `start = skip_length` to get the desired equivalent result.
 *
 * @category copy
*/
export const sliceSkip = (arr, slice_length, skip_length = 0, start, end) => {
    [start, end,] = resolveRange(start, end, arr.length);
    const out_arr = [];
    for (let offset = start; offset < end; offset += slice_length + skip_length) {
        out_arr.push(arr.slice(offset, offset + slice_length));
    }
    return out_arr;
};
/** similar to {@link sliceSkip}, but for subarray views of {@link TypedArray}.
 *
 * @category inplace
*/
export const sliceSkipTypedSubarray = (arr, slice_length, skip_length = 0, start, end) => {
    [start, end,] = resolveRange(start, end, arr.length);
    const out_arr = [];
    for (let offset = start; offset < end; offset += slice_length + skip_length) {
        out_arr.push(arr.subarray(offset, offset + slice_length));
    }
    return out_arr;
};
/** find out if two regular, or typed arrays are element wise equal, and have the same lengths. */
export const isIdentical = (arr1, arr2) => {
    if (arr1.length !== arr2.length) {
        return false;
    }
    return isSubidentical(arr1, arr2);
};
/** find out if two regular, or typed arrays are element wise equal upto the last element of the shorter of the two arrays. */
export const isSubidentical = (arr1, arr2) => {
    const len = min(arr1.length, arr2.length);
    for (let i = 0; i < len; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
};
/** continuously slice an array (or string) at the provided continuous interval indexes.
 *
 * @example
 * ```ts
 * const arr = Array(100).map((v, i) => i) // === [0, 1, 2, ..., 99]
 * const slices: ContinuousIntervals = [0, 20, 30, 70, undefined]
 * sliceContinuous(arr, slices) // === [[0, 1, 2, ..., 19], [20, 21, ..., 29], [30, ..., 69], [70, ..., 99]]
 * ```
*/
export const sliceContinuous = (arr, slice_intervals) => {
    const out_arr = [];
    for (let i = 1; i < slice_intervals.length; i++) {
        out_arr.push(arr.slice(slice_intervals[i - 1], slice_intervals[i]));
    }
    return out_arr;
};
/** exactly similar to {@link sliceContinuous}, but catered toward providing {@link TypedArray}'s subarray views, instead of doing actual copy-slicing. */
export const sliceContinuousTypedSubarray = (arr, slice_intervals) => {
    const out_arr = [];
    for (let i = 1; i < slice_intervals.length; i++) {
        out_arr.push(arr.subarray(slice_intervals[i - 1], slice_intervals[i]));
    }
    return out_arr;
};
/** slice an array (or string) at the provided flattened 2-tuple of interval indexes.
 *
 * @example
 * ```ts
 * const arr = Array(100).map((v, i) => i) // === [0, 1, 2, ..., 99]
 * const slices: Intervals = [0, 10, 20, 30, 90, undefined, 15, -15]
 * sliceIntervals(arr, slices) // === [[0, 1, 2, ..., 9], [20, 21, ..., 29], [90, ..., 99], [15, ..., 84]]
 * ```
*/
export const sliceIntervals = (arr, slice_intervals) => {
    const out_arr = [];
    for (let i = 1; i < slice_intervals.length; i += 2) {
        out_arr.push(arr.slice(slice_intervals[i - 1], slice_intervals[i]));
    }
    return out_arr;
};
/** exactly similar to {@link sliceIntervals}, but catered toward providing {@link TypedArray}'s subarray views, instead of doing actual copy-slicing. */
export const sliceIntervalsTypedSubarray = (arr, slice_intervals) => {
    const out_arr = [];
    for (let i = 1; i < slice_intervals.length; i += 2) {
        out_arr.push(arr.subarray(slice_intervals[i - 1], slice_intervals[i]));
    }
    return out_arr;
};
/** slice an array (or string) at the provided flattened 2-tuple of (interval starting index, interval length).
 *
 * @example
 * ```ts
 * const arr = Array(100).map((v, i) => i) // === [0, 1, 2, ..., 99]
 * const slices: IntervalLengths = [0, 10, 20, 10, 90, undefined, 15, 70]
 * sliceIntervalLengths(arr, slices) // === [[0, 1, 2, ..., 9], [20, 21, ..., 29], [90, ..., 99], [15, ..., 84]]
 * ```
*/
export const sliceIntervalLengths = (arr, slice_intervals) => {
    const out_arr = [];
    for (let i = 1; i < slice_intervals.length; i += 2) {
        out_arr.push(arr.slice(slice_intervals[i - 1], slice_intervals[i] === undefined
            ? undefined
            : slice_intervals[i - 1] + slice_intervals[i]));
    }
    return out_arr;
};
/** exactly similar to {@link sliceIntervalLengths}, but catered toward providing {@link TypedArray}'s subarray views, instead of doing actual copy-slicing. */
export const sliceIntervalLengthsTypedSubarray = (arr, slice_intervals) => {
    const out_arr = [];
    for (let i = 1; i < slice_intervals.length; i += 2) {
        out_arr.push(arr.subarray(slice_intervals[i - 1], slice_intervals[i] === undefined
            ? undefined
            : slice_intervals[i - 1] + slice_intervals[i]));
    }
    return out_arr;
};
