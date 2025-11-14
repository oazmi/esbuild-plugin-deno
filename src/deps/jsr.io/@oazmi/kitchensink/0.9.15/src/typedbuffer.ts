/** utility functions for handling buffers and typed arrays, and also reading and writing data to them.
 * 
 * TODO: needs more tests and a lot more examples on how to use, or provide visualization of the function's action.
 * 
 * @module
*/

import { console_error } from "./alias.js"
import { resolveRange } from "./array1d.js"
import { DEBUG } from "./deps.js"
import { min } from "./numericmethods.js"
import { constructorOf } from "./struct.js"
import type { NumericArray, NumericDType, TypedArray, TypedArrayConstructor } from "./typedefs.js"


/** checks if an object `obj` is a {@link TypedArray}, based on simply checking whether `obj.buffer` exists or not.
 * 
 * this is certainly not a very robust way of verifying.
 * a better approach would be to check if `obj instanceof Object.getPrototypeOf(Uint8Array)`, but this is quicker.
*/
export const isTypedArray = (obj: unknown): obj is TypedArray => ((obj as TypedArray).buffer ? true : false)

/** get a typed array constructor by specifying the type as a string. */
export const typed_array_constructor_of = <DType extends NumericDType = NumericDType>(type: `${DType}${string}`): TypedArrayConstructor<DType> => {
	if (type[2] === "c") { return Uint8ClampedArray as TypedArrayConstructor<DType> }
	type = (type[0] + type[1]) as typeof type // this is to trim excessive tailing characters
	switch (type as DType) {
		case "u1": return Uint8Array as TypedArrayConstructor<DType>
		case "u2": return Uint16Array as TypedArrayConstructor<DType>
		case "u4": return Uint32Array as TypedArrayConstructor<DType>
		//case "u8": return BigUint64Array as TypedArrayConstructor<DType>
		case "i1": return Int8Array as TypedArrayConstructor<DType>
		case "i2": return Int16Array as TypedArrayConstructor<DType>
		case "i4": return Int32Array as TypedArrayConstructor<DType>
		//case "i8": return BigInt64Array as TypedArrayConstructor<DType>
		case "f4": return Float32Array as TypedArrayConstructor<DType>
		case "f8": return Float64Array as TypedArrayConstructor<DType>
	}
	console_error(DEBUG.ERROR && "an unrecognized typed array type `\"${type}\"` was provided")
	return Uint8Array as TypedArrayConstructor<DType>
}

/** dictates if the native endianness of your `TypedArray`s is little endian. */
export const getEnvironmentEndianness = (): boolean => (
	(new Uint8Array(Uint32Array.of(1).buffer))[0] === 1
		? true
		: false
)

/** this variable dictates if the native endianness of your `TypedArray`s is little endian. */
export const env_is_little_endian: boolean = /*@__PURE__*/ getEnvironmentEndianness()

/** swap the endianness of the provided `Uint8Array` buffer array **in-place**,
 * given that each element has a byte-size of `bytesize`.
 * 
 * @category inplace
*/
export const swapEndiannessInplace = (buf: Uint8Array, bytesize: number): Uint8Array => {
	const len = buf.byteLength
	for (let i = 0; i < len; i += bytesize) { buf.subarray(i, i + bytesize).reverse() }
	return buf
}

/** 10x faster implementation of {@link swapEndiannessInplace} that does not mutatate the original `buf` array.
 * 
 * @category copy
*/
export const swapEndiannessFast = (buf: Uint8Array, bytesize: number): Uint8Array => {
	const
		len = buf.byteLength,
		swapped_buf = new Uint8Array(len),
		bs = bytesize
	for (let offset = 0; offset < bs; offset++) {
		const a = bs - 1 - offset * 2
		for (let i = offset; i < len + offset; i += bs) { swapped_buf[i] = buf[i + a] }
	}
	/* the above loop is equivalent to the following:
	 * ```ts
	 * for (let offset = 0; offset < bs; offset++) {
	 * 	for (let i = 0; i < len; i += bs) { swapped_buf[i + offset] = buf[i + bs - 1 - offset] }
	 * }
	 * ```
	*/
	return swapped_buf
}

/** concatenate a bunch of `Uint8Array` and `Array<number>` into a single `Uint8Array` array.
 * 
 * @category copy
*/
export const concatBytes = (...arrs: (Uint8Array | Array<number>)[]): Uint8Array => {
	const offsets: number[] = [0]
	for (const arr of arrs) { offsets.push(offsets[offsets.length - 1] + arr.length) }
	const outarr = new Uint8Array(offsets.pop()!)
	for (const arr of arrs) { outarr.set(arr, offsets.shift()) }
	return outarr
}

/** concatenate a bunch of {@link TypedArray}.
 * 
 * @category copy
*/
export const concatTyped = <TA extends TypedArray>(...arrs: TA[]): TA => {
	const offsets: number[] = [0]
	for (const arr of arrs) { offsets.push(offsets[offsets.length - 1] + arr.length) }
	const outarr = new (constructorOf(arrs[0]))(offsets.pop()!)
	for (const arr of arrs) { outarr.set(arr, offsets.shift()) }
	return outarr
}

/** split {@link TypedArray} **in-place**, after every `step` number of elements through the use of subarray views.
 * 
 * @deprecated kind of pointless, when {@link sliceSkipTypedSubarray} and {@link sliceSkip} exist.
 * @category inplace
*/
export const splitTypedSubarray = <TA extends TypedArray>(arr: TA, step: number): Array<TA> => sliceSkipTypedSubarray(arr, step)

/** slice `slice_length` number of elements, then jump forward `skip_length` number of elements, and repeat.
 * 
 * optionally provide a `start` index to begin at, and an `end` index to stop at.
 * 
 * if you want to skip first and slice second, you can set `start = skip_length` to get the desired equivalent result.
 * 
 * @category copy
*/
export const sliceSkip = <A extends NumericArray>(arr: A, slice_length: number, skip_length: number = 0, start?: number, end?: number): Array<A> => {
	[start, end,] = resolveRange(start, end, arr.length)
	const out_arr = [] as A[]
	for (let offset = start; offset < end; offset += slice_length + skip_length) {
		out_arr.push(arr.slice(offset, offset + slice_length) as A)
	}
	return out_arr
}

/** similar to {@link sliceSkip}, but for subarray views of {@link TypedArray}.
 * 
 * @category inplace
*/
export const sliceSkipTypedSubarray = <TA extends TypedArray>(arr: TA, slice_length: number, skip_length: number = 0, start?: number, end?: number): Array<TA> => {
	[start, end,] = resolveRange(start, end, arr.length)
	const out_arr = [] as TA[]
	for (let offset = start; offset < end; offset += slice_length + skip_length) {
		out_arr.push(arr.subarray(offset, offset + slice_length) as TA)
	}
	return out_arr
}

/** find out if two regular, or typed arrays are element wise equal, and have the same lengths. */
export const isIdentical = <T extends ([] | TypedArray)>(arr1: T, arr2: T): boolean => {
	if (arr1.length !== arr2.length) { return false }
	return isSubidentical(arr1, arr2)
}

/** find out if two regular, or typed arrays are element wise equal upto the last element of the shorter of the two arrays. */
export const isSubidentical = <T extends ([] | TypedArray)>(arr1: T, arr2: T): boolean => {
	const len = min(arr1.length, arr2.length)
	for (let i = 0; i < len; i++) { if (arr1[i] !== arr2[i]) { return false } }
	return true
}

/** represents continuous intervals at which slices should be performed by {@link sliceContinuous}.
 * 
 * if the final entry/element is `undefined`, it would indicate an open end towards infinity (ie till end of array).
*/
export type ContinuousIntervals = [...number[], number | undefined]

/** continuously slice an array (or string) at the provided continuous interval indexes.
 * 
 * @example
 * ```ts
 * const arr = Array(100).map((v, i) => i) // === [0, 1, 2, ..., 99]
 * const slices: ContinuousIntervals = [0, 20, 30, 70, undefined]
 * sliceContinuous(arr, slices) // === [[0, 1, 2, ..., 19], [20, 21, ..., 29], [30, ..., 69], [70, ..., 99]]
 * ```
*/
export const sliceContinuous = <T extends any[] | string>(arr: T, slice_intervals: ContinuousIntervals): T[] => {
	const out_arr: T[] = []
	for (let i = 1; i < slice_intervals.length; i++) {
		out_arr.push(arr.slice(slice_intervals[i - 1], slice_intervals[i]) as T)
	}
	return out_arr
}

/** exactly similar to {@link sliceContinuous}, but catered toward providing {@link TypedArray}'s subarray views, instead of doing actual copy-slicing. */
export const sliceContinuousTypedSubarray = <T extends TypedArray>(arr: T, slice_intervals: ContinuousIntervals): T[] => {
	const out_arr: T[] = []
	for (let i = 1; i < slice_intervals.length; i++) {
		out_arr.push(arr.subarray(slice_intervals[i - 1], slice_intervals[i]) as T)
	}
	return out_arr
}

/** represents intervals at which slices should be performed by {@link sliceIntervals}.
 * 
 * - every even element dictates a `start` index, which should be:
 *   - a positive `number`
 * - every odd element dictates the subsequent `end` index, which can one of:
 *   - a positive `number`
 *   - a negative `number`, for reverse indexing
 *   - or `undefined`, for last element (inclusive) indexing
 * 
 * @example
 * ```ts
 * // mathematically represents the set of intervals: { [0, 10), [20, 30), [90, Inf), [15, arr.length - 15) }
 * const my_intervals: Intervals = [0, 10, 20, 30, 90, undefined, 15, -15]
 * ```
*/
export type Intervals = [start_0: number, end_0: number | undefined, ...start_i_end_i: (number | undefined)[]]

/** slice an array (or string) at the provided flattened 2-tuple of interval indexes.
 * 
 * @example
 * ```ts
 * const arr = Array(100).map((v, i) => i) // === [0, 1, 2, ..., 99]
 * const slices: Intervals = [0, 10, 20, 30, 90, undefined, 15, -15]
 * sliceIntervals(arr, slices) // === [[0, 1, 2, ..., 9], [20, 21, ..., 29], [90, ..., 99], [15, ..., 84]]
 * ```
*/
export const sliceIntervals = <T extends any[] | string>(arr: T, slice_intervals: Intervals): T[] => {
	const out_arr: T[] = []
	for (let i = 1; i < slice_intervals.length; i += 2) {
		out_arr.push(arr.slice(slice_intervals[i - 1], slice_intervals[i]) as T)
	}
	return out_arr
}

/** exactly similar to {@link sliceIntervals}, but catered toward providing {@link TypedArray}'s subarray views, instead of doing actual copy-slicing. */
export const sliceIntervalsTypedSubarray = <T extends TypedArray>(arr: T, slice_intervals: Intervals): T[] => {
	const out_arr: T[] = []
	for (let i = 1; i < slice_intervals.length; i += 2) {
		out_arr.push(arr.subarray(slice_intervals[i - 1], slice_intervals[i]) as T)
	}
	return out_arr
}

/** represents interval starting points and lengths at which slices should be performed by {@link sliceIntervalLengths}.
 * 
 * - every even element dictates a `start` index, which should be:
 *   - a positive `number`
 * - every odd element dictates the subsequent `len` length of the interval, which can one of:
 *   - a positive `number`
 *   - or `undefined`, for slicing till end
 * 
 * @example
 * ```ts
 * // mathematically represents the set of intervals: { [0, 0 + 10), [20, 20 + 10), [90, Inf), [15, 15 + 70) } === { [0, 10), [20, 30), [90, 100), [15, 85) }
 * const my_intervals: IntervalLengths = [0, 10, 20, 10, 90, undefined, 15, 70]
 * ```
*/
export type IntervalLengths = [start_0: number, len_0: number | undefined, ...start_i_len_i: (number | undefined)[]]

/** slice an array (or string) at the provided flattened 2-tuple of (interval starting index, interval length).
 * 
 * @example
 * ```ts
 * const arr = Array(100).map((v, i) => i) // === [0, 1, 2, ..., 99]
 * const slices: IntervalLengths = [0, 10, 20, 10, 90, undefined, 15, 70]
 * sliceIntervalLengths(arr, slices) // === [[0, 1, 2, ..., 9], [20, 21, ..., 29], [90, ..., 99], [15, ..., 84]]
 * ```
*/
export const sliceIntervalLengths = <T extends any[] | string>(arr: T, slice_intervals: IntervalLengths): T[] => {
	const out_arr: T[] = []
	for (let i = 1; i < slice_intervals.length; i += 2) {
		out_arr.push(arr.slice(
			slice_intervals[i - 1],
			slice_intervals[i] === undefined
				? undefined
				: slice_intervals[i - 1]! + slice_intervals[i]!
		) as T)
	}
	return out_arr
}

/** exactly similar to {@link sliceIntervalLengths}, but catered toward providing {@link TypedArray}'s subarray views, instead of doing actual copy-slicing. */
export const sliceIntervalLengthsTypedSubarray = <T extends TypedArray>(arr: T, slice_intervals: Intervals): T[] => {
	const out_arr: T[] = []
	for (let i = 1; i < slice_intervals.length; i += 2) {
		out_arr.push(arr.subarray(
			slice_intervals[i - 1],
			slice_intervals[i] === undefined
				? undefined
				: slice_intervals[i - 1]! + slice_intervals[i]!
		) as T)
	}
	return out_arr
}
