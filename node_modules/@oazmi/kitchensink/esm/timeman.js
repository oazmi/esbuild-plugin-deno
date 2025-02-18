/** this submodule has some basic tools for timing functions.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { date_now, performance_now } from "./alias.js";
import { DEBUG } from "./deps.js";
const parseTimeFn = (time_fn) => {
    return time_fn === "perf" ? performance_now
        : time_fn === "date" ? date_now
            : time_fn;
};
/** time the execution of a function.
 *
 * @returns millisecond time for function execution.
 *
 * @example
 * ```ts
 * import {
 * 	assertLessOrEqual as assertLe,
 * 	assertGreaterOrEqual as assertGe,
 * } from "jsr:@std/assert"
 *
 * const
 * 	testFn = (a: number, b: number): number => { return a + b },
 * 	delta_time = timeIt(testFn, 5, 10),
 * 	log = `execution time: ${delta_time} ms`
 *
 * assertGe(delta_time, 0) // computing a sum should take more than `0` milliseconds
 * assertLe(delta_time, 2) // computing a sum should take less than `2` milliseconds
 * ```
*/
export const timeIt = (fn, ...args) => {
    const t1 = performance_now();
    fn(...args);
    return performance_now() - t1;
};
/** asynchronously time the execution of an async function.
 *
 * if you are going to provide a synchronous function with certainty, then you might be better off using {@link timeIt} instead.
 *
 * @returns millisecond time for function execution.
 *
 * @example
 * ```ts
 * import {
 * 	assertLessOrEqual as assertLe,
 * 	assertGreaterOrEqual as assertGe,
 * } from "jsr:@std/assert"
 *
 * const asyncTestFn = async (a: number, b: number): Promise<number> => new Promise((resolve) => {
 * 	setTimeout(() => { resolve(a + b) }, 300)
 * })
 * const
 * 	delta_time = await asyncTimeIt(asyncTestFn, 5, 10),
 * 	log = `execution time: ${delta_time} ms`
 *
 * assertGe(delta_time, 290) // completing the promise should take more than `290` milliseconds
 * assertLe(delta_time, 400) // completing the promise should take less than `400` milliseconds
 * ```
*/
export const asyncTimeIt = async (fn, ...args) => {
    const t1 = performance_now();
    await fn(...args);
    return performance_now() - t1;
};
/** a stopwatch class that provides convince methods for timing.
 *
 * this module exports a global {@link defaultStopwatch} available to all importing scripts,
 * which is beneficial if you want to use a single stop watch across many modules,
 * otherwise, if you want a dedicated stopwatch, you can create a new instance of this class.
 *
 * this stopwatch operates on the principals of a stack data-structure:
 * - that is, you can `push`, `pop`, and `seek` the time.
 * - the `Delta` methods provide the *elapsed* time since the last `push`.
 *
 * @example
 * ```ts
 * import {
 * 	assertLessOrEqual as assertLe,
 * 	assertGreaterOrEqual as assertGe,
 * 	assertThrows,
 * } from "jsr:@std/assert"
 *
 * const stop_watch = new Stopwatch("perf")
 * stop_watch.push()
 *
 * const
 * 	resolved_value: "hello" = await (new Promise((resolve) => {
 * 		setTimeout(() => { resolve("hello") }, 300)
 * 	})),
 * 	delta_time = stop_watch.popDelta(),
 * 	log = `execution time: ${delta_time} ms`
 *
 * assertGe(delta_time, 290) // completing the promise should take more than `290` milliseconds
 * assertLe(delta_time, 400) // completing the promise should take less than `400` milliseconds
 *
 * // the stack of `stop_watch` is empty now, so trying to `popDelta` will throw an error (intentional by design)
 * assertThrows(() => stop_watch.popDelta())
 * ```
*/
export class Stopwatch {
    /** the stack in which we push timestamps. */
    stack = [];
    /** a function that returns the current time */
    time;
    constructor(get_time_fn = "perf") {
        this.time = parseTimeFn(get_time_fn);
    }
    /** get the current time. */
    getTime() { return this.time(); }
    /** push the current time into the stack, and get the value of the current time returned. */
    push() {
        const current_time = this.time();
        this.stack.push(current_time);
        return current_time;
    }
    /** push the current time into the stack, and get the time elapsed since the last push.
     * if this is the first push, then the returned value will be `undefined`.
    */
    pushDelta() {
        const current_time = this.time(), prev_time = this.seek();
        this.stack.push(current_time);
        return prev_time === undefined
            ? prev_time
            : current_time - prev_time;
    }
    /** pop the top most time from the time stack.
     * if the time stack is empty, then an `undefined` will be returned.
    */
    pop() { return this.stack.pop(); }
    /** get the time elapsed since the most recent push into the time stack, and also pop.
     *
     * @throws `Error` this function will throw an error if the time stack was already empty.
     *   this is intentional, since it would hint that you are using this method non-deterministically, and thus incorrectly.
    */
    popDelta() {
        const current_time = this.time(), prev_time = this.pop();
        if (prev_time === undefined) {
            throw new Error(DEBUG.ERROR ? "there was nothing in the time stack to pop" : "");
        }
        return current_time - prev_time;
    }
    /** preview the top most time in the stack without popping.
     * if the time stack is empty, then an `undefined` will be returned.
    */
    seek() { return this.stack.at(-1); }
    /** preview the time elapsed since the most recent push into the time stack, without popping.
     * if there is nothing in the time stack, then an `undefined` will be returned.
    */
    seekDelta() {
        const current_time = this.time(), prev_time = this.seek();
        return prev_time === undefined
            ? prev_time
            : current_time - prev_time;
    }
}
/** a default instance of {@link Stopwatch} (in `performance.now` timer mode) is exported for convenience,
 * so that it is easily shareable among all libraries that import this submodule.
*/
export const defaultStopwatch = /*@__PURE__*/ new Stopwatch("perf");
