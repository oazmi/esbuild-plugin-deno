/** utility functions for 1d arrays.
 *
 * @module
*/
import { array_isEmpty, math_min, math_random, number_POSITIVE_INFINITY, symbol_iterator } from "./alias.js";
import { bind_array_map, bind_array_push } from "./binder.js";
import { absolute, max, min, modulo, roundFloat, sign } from "./numericmethods.js";
export function resolveRange(start, end, length, offset) {
    start ??= 0;
    offset ??= 0;
    if (length === undefined) {
        return [start + offset, end === undefined ? end : end + offset, length];
    }
    end ??= length;
    start += start >= 0 ? 0 : length;
    end += end >= 0 ? 0 : length;
    length = end - start;
    return [start + offset, end + offset, max(0, length)];
}
/** mutate and rotate the given array by the specified amount to the right.
 *
 * given an array `arr`, this function would rotate its rows by the specified `amount`.
 * a positive `amount` would rotate the rows to the right, and a negative `amount` would rotate it to the left.
 *
 * @param arr the array to be rotated.
 * @param amount The number of indexes to rotate the major-axis to the right.
 *   positive values rotate right, while negative values rotate left.
 * @returns The original array is returned back after the rotation.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const arr: Array<number> = [1, 2, 3, 4, 5]
 *
 * rotateArray(arr, 2)
 * assertEquals(arr, [4, 5, 1, 2, 3])
 *
 * rotateArray(arr, -3)
 * assertEquals(arr, [2, 3, 4, 5, 1])
 * ```
*/
export const rotateArray = (arr, amount) => {
    const len = arr.length;
    // compute the effective right-rotation amount so that it handles negative values and full rotations
    amount = modulo(amount, len === 0 ? 1 : len);
    // there is nothing to rotate if the effective amount is zero
    if (amount === 0) {
        return arr;
    }
    const right_removed_rows = arr.splice(len - amount, amount);
    arr.splice(0, 0, ...right_removed_rows);
    return arr;
};
/** shuffle a 1D array via mutation. the ordering of elements will be randomized by the end.
 *
 * ```ts
 * import { assertEquals, assertNotEquals } from "jsr:@std/assert"
 *
 * const
 * 	range_100 = Array(100).fill(0).map((_, i) => (i)), // sequntially numbered array
 * 	my_arr = range_100.slice()
 * shuffleArray(my_arr) // shuffling our array via mutation
 *
 * // the shuffled array is very unlikely to equal to the original unshuffled form
 * assertNotEquals(my_arr, range_100)
 * // sort the shuffled array to assert the preservation of the contained items
 * assertEquals(my_arr.toSorted((a, b) => (a - b)), range_100)
 * ```
*/
export const shuffleArray = (arr) => {
    const len = arr.length, rand_int = () => (math_random() * len) | 0, swap = (i1, i2) => {
        const temp = arr[i1];
        arr[i1] = arr[i2];
        arr[i2] = temp;
    };
    for (let i = 0; i < len; i++) {
        swap(i, rand_int());
    }
    return arr;
};
/** a generator that shuffles your 1D array via mutation, then yields randomly selected non-repeating elements out of it, one by one,
 * until all elements have been yielded, at which a new cycle begins, and the items in the array are re-shuffled again.
 * i.e. after every new cycle, the ordering of the randomly yielded elements will differ from the ordering of the previous cycle.
 *
 * moreover, you can call the iterator with an optional number argument that specifies if you wish to skip ahead or go back a certain number of elements.
 * - `1`: go to next element (default behavior)
 * - `0`: receive the same element as before
 * - `-1`: go to previous next element
 * - `+ve number`: skip to next `number` of elements
 * - `-ve number`: go back `number` of elements
 *
 * note that once a cycle is complete, going back won't restore the correct element from the previous cycle, because the info about the previous cycle gets lost.
 *
 * ```ts
 * import { assert, assertEquals, assertNotEquals } from "jsr:@std/assert"
 *
 * const
 * 	my_playlist = ["song1", "song2", "song3", "song4"],
 * 	my_queue = my_playlist.slice(),
 * 	track_iter = shuffledDeque(my_queue) // shuffles our play queue via mutation, and then indefinitely provides unique items each cycle
 *
 * const
 * 	track1 = track_iter.next().value,
 * 	track2 = track_iter.next(1).value,
 * 	track3 = track_iter.next().value
 *
 * assertEquals(track1, track_iter.next(-2).value)
 * assertEquals(track2, track_iter.next(1).value)
 * assertEquals(track3, track_iter.next().value)
 *
 * const track4 = track_iter.next().value // final track of the current queue
 * const track5 = track_iter.next().value // the queue has been reset, and re-shuffled
 *
 * assert([track1, track2, track3].includes(track4) === false)
 * assert([track1, track2, track3, track4].includes(track5) === true)
 * ```
*/
export const shuffledDeque = function* (arr) {
    let i = arr.length; // this is only temporary. `i` immediately becomes `0` when the while loop begins
    while (!array_isEmpty(arr)) {
        if (i >= arr.length) {
            i = 0;
            shuffleArray(arr);
        }
        i = max(i + ((yield arr[i]) ?? 1), 0);
    }
};
/** a function to splice any stack (see the {@link GenericStack} interface).
 *
 * splicing alone lets you effectively implement all sorts of array mutation methods, such as
 * `push`, `pop`, `unshift`, `shift`, `insert`, `rotate`, and many more.
 *
 * > [!note]
 * > the `length` property of your `stack` is not mutated/assigned by this function.
 * > you will have to do that manually yourself if your `stack` does not modify the `length` property upon the `push` and `pop` operations.
 *
 * @param stack the generic stack object to splice.
 * @param start the starting index to begin splicing from.
 *   you must provide only positive starting index values.
 *   defaults to `0`.
 * @param deleteCount the number of elements to remove from the `start` index (inclusive).
 *   if it is set to `undefined`, then all elements until the end of the generic stack array will be removed.
 *   defaults to `undefined`.
 * @param items insert items at the `start` index, so that the first inserted item will occupy the `start` index _after_ the splicing.
 * @returns an array of deleted items in the generic stack will be returned.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = spliceGenericStack,
 * 	eq = assertEquals
 *
 * const my_stack = [0, 1, 2, 3, 4, 5, 6, 7]
 *
 * eq(fn(my_stack, 4), [4, 5, 6, 7])
 * eq(my_stack,        [0, 1, 2, 3])
 *
 * eq(fn(my_stack, 0, 0, -3, -2, -1), [])
 * eq(my_stack,        [-3, -2, -1, 0, 1, 2, 3])
 *
 * eq(fn(my_stack, 4, 2, 0.1, 0.2, 0.3), [1, 2])
 * eq(my_stack,        [-3, -2, -1, 0, 0.1, 0.2, 0.3, 3])
 *
 * eq(fn(my_stack),    [-3, -2, -1, 0, 0.1, 0.2, 0.3, 3])
 * eq(my_stack,        [])
 * ```
*/
export const spliceGenericStack = (stack, start = 0, deleteCount, ...items) => {
    const initial_length = stack.length, maxDeleteCount = initial_length - start;
    deleteCount ??= maxDeleteCount;
    deleteCount = min(deleteCount, maxDeleteCount);
    const end = start + deleteCount, retained_items = [], removed_items = [], retained_items_push = bind_array_push(retained_items), removed_items_push = bind_array_push(removed_items);
    // collect the items that will be be retained and re-pushed back into the `arr` later on
    for (let i = initial_length; i > end; i--) {
        retained_items_push(stack.pop());
    }
    // collect the items that will be removed
    for (let i = end; i > start; i--) {
        removed_items_push(stack.pop());
    }
    // then push the new `items`, followed by the reverse of `retained_items`
    stack.push(...items, ...retained_items.toReversed()); // `toReversed()` is faster than the `reverse()` method for large arrays.
    return removed_items.toReversed();
};
/** generate a numeric array with sequentially increasing value, within a specific range interval.
 * similar to python's `range` function.
 *
 * however, unlike python's `range`, you **must** always supply the starting index **and** the ending index,
 * even if the start index is supposed to be `0`, you cannot substitute the first argument with the ending index.
 * only the {@link step} argument is optional. moreover, the {@link step} argument must always be a positive number.
 *
 * > [!note]
 * > there is also an iterator generator variant of this function that is also capable of indefinite sequences.
 * > check out {@link rangeIterator} for details.
 *
 * @param start the initial number to begin the output range sequence from.
 * @param end the final exclusive number to end the output range sequence at. its value will **not** be in the output array.
 * @param step a **positive** number, dictating how large each step from the `start` to the `end` should be.
 *   for safety, so that a user doesn't run into an infinite loop by providing a negative step value,
 *   we always take the absolute value of this parameter.
 *   defaults to `1`.
 * @param decimal_precision an integer that specifies the number of decimal places to which the output
 *   numbers should be rounded to, in order to nullify floating point arithmetic inaccuracy.
 *   for instance, in javascript `0.1 + 0.2 = 0.30000000000000004` instead of `0.3`.
 *   now, you'd certainly not want to see this kind of number in our output, which is why we round it so that it becomes `0.3`.
 *   defaults to `6` (6 decimal places; i.e. rounds to the closest micro-number (10**(-6))).
 * @returns a numeric array with sequentially increasing value from the `start` to the `end` interval, with steps of size `step`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = rangeArray,
 * 	eq = assertEquals
 *
 * eq(fn(0, 5),       [0, 1, 2, 3, 4])
 * eq(fn(-2, 3),      [-2, -1, 0, 1, 2])
 * eq(fn(2, 7),       [2, 3, 4, 5, 6])
 * eq(fn(2, 7.1),     [2, 3, 4, 5, 6, 7])
 * eq(fn(0, 1, 0.2),  [0, 0.2, 0.4, 0.6, 0.8])
 * eq(fn(0, 100, 20), [0, 20, 40, 60, 80])
 * eq(fn(2, -3),      [2, 1, 0, -1, -2])
 * eq(fn(2, -7, 2),   [2, 0, -2, -4, -6])
 * eq(fn(2, -7, -2),  [2, 0, -2, -4, -6]) // as a protective measure, only the `abs(step)` value is ever taken.
 * eq(fn(2, 7, -1),   [2, 3, 4, 5, 6])    // as a protective measure, only the `abs(step)` value is ever taken.
 * ```
*/
export const rangeArray = (start, end, step = 1, decimal_precision = 6) => {
    return [...rangeIterator(start, end, step, decimal_precision)];
};
/** this function is the iterator version of {@link rangeArray}, mimicking python's `range` function.
 *
 * you can iterate indefinitely with this function if you set the {@link end} parameter to `undefined`,
 * and then define the direction of the step increments with the {@link step} parameter.
 * (a negative `step` will result in a decreasing sequence of numbers).
 *
 * @param start the initial number to begin the output range sequence from. defaults to `0`.
 * @param end the final exclusive number to end the output range sequence at. its value will **not** be in the last output number.
 *   if left `undefined`, then it will be assumed to be `Number.POSITIVE_INFINITY` if `step` is a positive number (default),
 *   or it will become `Number.NEGATIVE_INFINITY` if `step` is a negative number.
 *   defaults to `undefined`.
 * @param step a number, dictating how large each step from the `start` to the `end` should be. defaults to `1`.
 * @param decimal_precision an integer that specifies the number of decimal places to which the output
 *   numbers should be rounded to, in order to nullify floating point arithmetic inaccuracy.
 *   defaults to `6` (6 decimal places; i.e. rounds to the closest micro-number (10**(-6))).
 * @yields a number in the sequence of the given range.
 * @returns the total number of elements that were outputted.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = rangeIterator,
 * 	eq = assertEquals
 *
 * eq([...fn(0, 5)],        [0, 1, 2, 3, 4])
 * eq([...fn(-2, 3)],       [-2, -1, 0, 1, 2])
 * eq([...fn(2, 7)],        [2, 3, 4, 5, 6])
 * eq([...fn(2, 7.1)],      [2, 3, 4, 5, 6, 7])
 * eq([...fn(0, 1, 0.2)],   [0, 0.2, 0.4, 0.6, 0.8])
 * eq([...fn(1, -1, 0.4)],  [1, 0.6, 0.2, -0.2, -0.6])
 * eq([...fn(1, -1, -0.4)], [1, 0.6, 0.2, -0.2, -0.6])
 *
 * // indefinite sequence in the positive direction
 * const
 * 	loop_limit = 10,
 * 	accumulation_arr: number[] = []
 * for (const v of fn(0)) {
 * 	if (v >= loop_limit) { break }
 * 	accumulation_arr.push(v)
 * }
 * eq(accumulation_arr, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
 * accumulation_arr.splice(0) // clearing our array for the next test
 *
 * // indefinite sequence in the negative direction
 * for (const v of fn(0, undefined, -1)) {
 * 	if (v <= -loop_limit) { break }
 * 	accumulation_arr.push(v)
 * }
 * eq(accumulation_arr, [0, -1, -2, -3, -4, -5, -6, -7, -8, -9])
 * ```
*/
export const rangeIterator = function* (start = 0, end, step = 1, decimal_precision = 6) {
    end ??= sign(step) * number_POSITIVE_INFINITY;
    const delta = end - start, signed_step = absolute(step) * sign(delta), end_index = delta / signed_step;
    let i = 0;
    for (; i < end_index; i++) {
        yield roundFloat(start + i * signed_step, decimal_precision);
    }
    return i;
};
/** zip together a list of input arrays as tuples, similar to python's `zip` function.
 *
 * > [!note]
 * > if one of the input arrays is shorter in length than all the other input arrays,
 * > then this zip function will only generate tuples up until the shortest array is expended,
 * > similar to how python's `zip` function behaves.
 * > in a sense, this feature is what sets it apart from the 2d array transpose function {@link transposeArray2D},
 * > which decides its output length based on the first array's length.
 *
 * > [!tip]
 * > applying the zip function twice will give you back the original arrays (assuming they all had the same length).
 * > so in a sense, to unzip the output of `zipArrays`, you simply apply `zipArrays` to again (after performing an array spread operation).
 *
 * > [!important]
 * > this function only accepts array inputs to zip, and **not** iterators.
 * > to zip a sequence of iterators, use the {@link zipIterators} function (which has a slightly slower performance).
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * type MyObj   = { key: string }
 * type MyTuple = [number, boolean, MyObj]
 *
 * const
 * 	my_num_arr:  number[]  = [100, 101, 102, 103, 104],
 * 	my_bool_arr: boolean[] = [true, false, false, true, false],
 * 	my_obj_arr:  MyObj[]   = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }]
 * // notice that `my_obj_arr` is shorter than the other two arrays. (i.e. has a length of `4`, while others are `5`)
 * // this would mean that zipping them together would only generate a 3-tuple array of `4` elements.
 *
 * const my_tuples_arr: MyTuple[] = zipArrays<[number, boolean, MyObj]>(my_num_arr, my_bool_arr, my_obj_arr)
 * assertEquals(my_tuples_arr, [
 * 	[100, true,  { key: "a" }],
 * 	[101, false, { key: "b" }],
 * 	[102, false, { key: "c" }],
 * 	[103, true,  { key: "d" }],
 * ])
 *
 * // to unzip the array of tuples, and receive back the original (trimmed) arrays, simply apply `zipArrays` again.
 * const my_arrs = [
 * 	[   1,     2,    3,    4],
 * 	[true, false, true, true],
 * 	[ "w",   "x",  "y",  "z"],
 * ]
 * assertEquals(zipArrays(...zipArrays(...my_arrs)), my_arrs)
 *
 * // zipping no input arrays should not iterate infinitely.
 * assertEquals(zipArrays(), [])
 * ```
*/
export const zipArrays = (...arrays) => {
    const output = [], output_push = bind_array_push(output), 
    // NOTE: `math_min()` returns `Infinity` when no input is given!
    // thus we must check for zero sized `arrays` in order to not loop infinitely. (learned it the hard way)
    min_len = array_isEmpty(arrays) ? 0 : math_min(...arrays.map((arr) => (arr.length)));
    for (let i = 0; i < min_len; i++) {
        // TODO: CONSIDER: honestly, using `arrays.map` doesn't seem too performant.
        //   I feel like using array indexing would be faster, but that will turn this
        //   function to basically `transposeArray2D`, implementation wise.
        output_push(arrays.map((arr) => arr[i]));
    }
    return output;
};
/** zip together a list of input iterators or iterable objects as tuples, similar to python's `zip` function.
 *
 * > [!note]
 * > this zip function stops yielding as soon as one of its input iterators is "done" iterating (i.e. out of elements).
 *
 * if all of your input `iterators` are arrays, then use the {@link zipArrays} function, which is more performant (and smaller in footprint).
 *
 * @param iterators the list of iterators/iterable objects which should be zipped.
 * @yields a tuple of each entry from the given list of `iterators`, until one of the iterators is "done" iterating (i.e. out of elements).
 * @returns the number of items that were yielded/iterated (i.e. length of iterator).
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * type MyObj   = { key: string }
 * type MyTuple = [number, boolean, MyObj]
 *
 * const
 * 	my_num_iter:  Iterable<number>  = rangeIterator(100), // infnite iterable, with values `[100, 101, 102, ...]`
 * 	my_bool_iter: Iterator<boolean> = [true, false, false, true, false][Symbol.iterator](),
 * 	my_obj_iter:  Iterable<MyObj>   = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }]
 * // notice that `my_obj_iter` is shorter than the other two arrays. (i.e. has a length of `4`)
 * // this would mean that zipping them together would only generate a 3-tuple array of `4` elements.
 *
 * const my_tuples_iter: Iterator<MyTuple> = zipIterators<[number, boolean, MyObj]>(my_num_iter, my_bool_iter, my_obj_iter)
 * assertEquals(my_tuples_iter.next(), { value: [100, true,  { key: "a" }], done: false })
 * assertEquals(my_tuples_iter.next(), { value: [101, false, { key: "b" }], done: false })
 * assertEquals(my_tuples_iter.next(), { value: [102, false, { key: "c" }], done: false })
 * assertEquals(my_tuples_iter.next(), { value: [103, true,  { key: "d" }], done: false })
 * assertEquals(my_tuples_iter.next(), { value: 4, done: true }) // the return value of the iterator dictates its length.
 *
 *
 * // since the actual output of `zipIterators` is an `IterableIterator`,
 * // so we may even use it in a for-of loop, or do an array spreading with the output.
 * const my_tuples_iter2 = zipIterators<[number, boolean]>(my_num_iter, [false, true, false, false, true])
 * my_tuples_iter2 satisfies Iterable<[number, boolean]>
 *
 * // IMPORTANT: notice that the first tuple is not `[104, false]`, but instead `[105, false]`.
 * // this is because our first zip iterator (`my_tuples_iter`) utilized the `my_num_iter` iterable one additional time
 * // before realizing that one of the input iterables (the `my_bool_iter`) had gone out of elements to provide.
 * // thus, the ordering of the iterators do matter, and it is possible to have one iterated value to disappear into the void.
 * assertEquals([...my_tuples_iter2], [
 * 	[105, false],
 * 	[106, true ],
 * 	[107, false],
 * 	[108, false],
 * 	[109, true ],
 * ])
 *
 * // zipping with zero sized input iterators should not yield anything.
 * assertEquals([...zipIterators([], [], [])], [])
 *
 * // zipping with no input iterators at all should not iterate infinitely.
 * assertEquals([...zipIterators()], [])
 * ```
*/
export const zipIterators = function* (...iterators) {
    // if there are no `iterators`, then we should return immediately, otherwise we will be stuck in an infinitely yielding loop.
    if (array_isEmpty(iterators)) {
        return 0;
    }
    // first we convert all potential `Iterable` entries to an `Iterator`.
    const pure_iterators = iterators.map((iter) => {
        return iter instanceof Iterator
            ? iter
            : iter[symbol_iterator]();
    }), pure_iterators_map = bind_array_map(pure_iterators);
    let length = 0, continue_iterating = true;
    const iterator_map_fn = (iter) => {
        const { value, done } = iter.next();
        if (done) {
            continue_iterating = false;
        }
        return value;
    };
    for (let tuple_values = pure_iterators_map(iterator_map_fn); continue_iterating; tuple_values = pure_iterators_map(iterator_map_fn)) {
        length++;
        yield tuple_values;
    }
    return length;
};
/** create a mapping function that operates on a list of iterable/iterator inputs, that are zipped together as tuples,
 * and then passed on to the {@link map_fn} for transformation, one by one.
 *
 * > [!note]
 * > if one of the input arrays or iterators is shorter in length than all the rest,
 * > then the mapping function will only operate up till the shortest array/iterator.
 * > similar to how python's `zip` function generates tuples up till the end of the shortest input array.
 *
 * @param map_fn a function that maps each tuple `T` (from the collection of input iterators) to some type `V`.
 * @returns a generator function that will accept a list of iterators as its input,
 *   and that yields back the result of each zipped tuple being mapped via `map_fn`.
 *   the return value of the generator (after it concludes) is the length of the number of items that it had yielded.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * type MyObj   = { key: string }
 * type MyTuple = [number, boolean, MyObj]
 *
 * const myTupleMapper = zipIteratorsMapperFactory((tuple: MyTuple, index: number): string => {
 * 	const [my_number, my_boolean, my_object] = tuple
 * 	return `${index}-${my_object.key}/${my_number}/${my_boolean}`
 * })
 *
 * myTupleMapper satisfies ((number_arr: number[], boolean_arr: boolean[], object_arr: MyObj[]) => IterableIterator<string>)
 *
 * const
 * 	my_num_iter = rangeIterator(100), // infnite iterable, with values `[100, 101, 102, ...]`
 * 	my_bool_arr = [true, false, false, true, false],
 * 	my_obj_arr  = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }]
 * // notice that `my_obj_arr` is shorter than the other two arrays. (i.e has a length of `4`).
 * // this would mean that `myTupleMapper` would only operate on the first `4` elements of all the 3 arrays.
 *
 * const outputs_iter: Iterable<string> = myTupleMapper(my_num_iter, my_bool_arr, my_obj_arr)
 * assertEquals([...outputs_iter], [
 * 	"0-a/100/true",
 * 	"1-b/101/false",
 * 	"2-c/102/false",
 * 	"3-d/103/true",
 * ])
 *
 * // zipping with zero sized input iterators should not yield anything.
 * assertEquals([...myTupleMapper([], [], [])], [])
 *
 * // for safety, map-zipping with no input iterators should not yield anything.
 * assertEquals([...myTupleMapper()], [])
 * ```
*/
export const zipIteratorsMapperFactory = (map_fn) => {
    return function* (...iterators) {
        let i = 0;
        for (const tuple of zipIterators(...iterators)) {
            yield map_fn(tuple, i);
            i++;
        }
        return i;
    };
};
/** a generator function that slices your input `array` to smaller chunks of your desired `chunk_size`.
 *
 * note that the final chunk that gets yielded may be smaller than your `chunk_size` if it does not divide `array.length` precisely.
 *
 * @param chunk_size a **positive** integer dictating the length of each chunk that gets yielded.
 * @param array your input array that needs to be yielded in chunks.
 * @yields a chunk of length `chunk_size` from your input `array`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const my_arr = rangeArray(0, 30) // equals to `[0, 1, 2, ..., 28, 29]`
 *
 * // below, we split `my_arr` into smaller array chunks of size `8`, except for the last chunk, which is smaller.
 * assertEquals([...chunkGenerator(8, my_arr)], [
 * 	[ 0,  1,  2,  3,  4,  5,  6, 7 ],
 * 	[ 8,  9, 10, 11, 12, 13, 14, 15],
 * 	[16, 17, 18, 19, 20, 21, 22, 23],
 * 	[24, 25, 26, 27, 28, 29],
 * ])
 *
 * // chunking zero length array will not yield anything
 * assertEquals([...chunkGenerator(8, [])], [])
 * ```
*/
export const chunkGenerator = function* (chunk_size, array) {
    const len = array.length;
    for (let i = 0; i < len; i += chunk_size) {
        yield array.slice(i, i + chunk_size);
    }
};
