/** utility functions for creating higher order functions.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { date_now, dom_clearTimeout, dom_setTimeout, promise_resolve } from "./alias.js";
import { bindMethodToSelfByName } from "./binder.js";
import { HybridTree, HybridWeakMap, LimitedStack, StrongTree, TREE_VALUE_UNSET } from "./collections.js";
import { DEBUG } from "./deps.js";
export const THROTTLE_REJECT = /*@__PURE__*/ Symbol(DEBUG.MINIFY || "a rejection by a throttled function");
export const TIMEOUT = /*@__PURE__*/ Symbol(DEBUG.MINIFY || "a timeout by an awaited promiseTimeout function");
/** creates a debounced version of the provided function that returns a new promise.
 *
 * the debounced function delays the execution of the provided function `fn` until the debouncing interval `wait_time_ms` amount of time has passed without any subsequent calls.
 *
 * if a `rejection_value` is provided, then any subsequent calls to the debounced function that are made within the debouncing interval, will reject the previous promises.
 * thus you will have to `catch` them in that case (otherwise it will result in an error).
 *
 * you may worry that too many calls to a non-rejectable debounced function (i.e. when `rejection_value === undefined`)
 * will create too many promise objects, possibly resulting in memory leaks.
 * however, luckily, modern javascript engines are not afflicted by too many pending promise objects.
 * in fact, choosing to reject promises (i.e. by setting `rejection_value`), might be more expensive down the line, as error catching is typically expensive.
 *
 * also check out {@link debounceAndShare}, which avoids this "lots of promise objects" issue by sharing the same promise across all quick callers of the debounce.
 * but it will require careful usage, as all promised callers will eventually get resolved, which may create an unintended avalaunch of subsequent `then` calls if not used carefully.
 *
 * @param wait_time_ms the time interval in milliseconds for debouncing
 * @param fn the function to be debounced
 * @param rejection_value if a rejection value is provided, then old unresolved pending promises will be rejected with the given value,
 * 	 when a new call to the debounced function is made (within the debouncing waiting period)
 * @returns a function (that takes arguments intended for `fn`) that returns a promise, which is resolved once `wait_time_ms` amount of time has passed with no further calls
 *
 * @example
 * ```ts
 * import {
 * 	assertEquals as assertEq,
 * 	assertLessOrEqual as assertLe,
 * 	assertGreaterOrEqual as assertGe,
 * } from "jsr:@std/assert"
 *
 * // a function that creates an asynchronous delay of the given number of milliseconds
 * const sleep = (time_ms: number) => (new Promise((resolve) => (setTimeout(resolve, time_ms))))
 *
 * const
 * 	log_history: Array<[time: number, value: number]> = [],
 * 	error_history: Array<[time: number, message: string]> = [],
 * 	t0 = performance.now(),
 * 	current_time = () => (performance.now() - t0)
 *
 * // the function that we plan to debounce
 * const fn = (v: number) => {
 * 	log_history.push([current_time(), v])
 * 	return v + 100
 * }
 *
 * // the debounced version of `fn`, that, when called too quickly, rejects with the reason `"SEPPUKU!"`.
 * const debounced_fn = debounce(1000, fn, "SEPPUKU!")
 *
 * // `a` is a promise that should resolve after 1000ms. but if it fails (which it will), it will log to `error_history`.
 * const a = debounced_fn(24).catch(
 * 	(reason) => { error_history.push([current_time(), `they want me to ${reason}`]) }
 * )
 *
 * await sleep(500) // promise `a` is still pending after the 500ms sleep
 *
 * // the new `debounced_fn(42)` below rejects `a`'s promise, and then returns a new promise (`b`) that will resolve in 1000ms.
 * // since `a` gets rejected as a consequence, it's error handling chain will immediately log `"they want me to SEPPUKU!"` in the console.
 * const b = debounced_fn(42)
 *
 * // we delay for a tiny while in order for the js-runtime to get `a` rejected. otherwise, without the sleep, `error_history` will be empty.
 * await sleep(50)
 * assertEq(log_history, [])
 * assertGe(error_history[0][0], 499)
 * assertLe(error_history[0][0], 540)
 * assertEq(error_history[0][1], "they want me to SEPPUKU!")
 *
 * // after 1000ms, the value `42` will be logged into `log_history` (due to promise `b`).
 * // however, no entry will be logged by `a`, since it gets rejected as soon as `b` is created.
 * await sleep(1000)
 * assertGe(log_history[0][0], 500 + 999)
 * assertLe(log_history[0][0], 500 + 1040)
 * assertEq(log_history[0][1], 42)
 * assertEq(await b, 100 + 42)
 *
 * // we can now safely create a new debounced call without rejecting the already resolved `b` promise, since it is over 1000ms since `b` was created.
 * const c = debounced_fn(99)
 *
 * // 1000ms later, the value `99` will be logged into `log_history` (due to promise `c`).
 * await sleep(1050)
 * assertGe(log_history[1][0], 1550 + 999)
 * assertLe(log_history[1][0], 1550 + 1100)
 * assertEq(log_history[1][1], 99)
 * assertEq(await c, 100 + 99)
 * ```
*/
export const debounce = (wait_time_ms, fn, rejection_value) => {
    let prev_timer, prev_reject = () => { };
    return (...args) => {
        dom_clearTimeout(prev_timer);
        if (rejection_value !== undefined) {
            prev_reject(rejection_value);
        }
        return new Promise((resolve, reject) => {
            prev_reject = reject;
            prev_timer = dom_setTimeout(() => resolve(fn(...args)), wait_time_ms);
        });
    };
};
/** creates a debounced version of the provided function that returns a shared promise.
 *
 * unlike conventional {@link debounce}, this function reuses and returns the same promise object for all calls that are made within the debouncing interval.
 * this means that all callers within this interval will receive the same promise, which will be resolved once `wait_time_ms` amount of time has passed with no further calls.
 *
 * if subsequent calls are made within the debouncing interval, the debounced function will return the same promise as before, further delaying its resolution.
 * however, once the debouncing interval has elapsed and the promise is resolved, any new calls to the debounced function will create and return a new promise.
 *
 * @param wait_time_ms the time interval in milliseconds for debouncing
 * @param fn the function to be debounced
 * @returns a function (that takes arguments intended for `fn`) that returns a promise, which is resolved once `wait_time_ms` amount of time has passed with no further calls
 *
 * @example
 * ```ts
 * import {
 * 	assertEquals as assertEq,
 * 	assertLessOrEqual as assertLe,
 * 	assertGreaterOrEqual as assertGe,
 * } from "jsr:@std/assert"
 *
 * // a function that creates an asynchronous delay of the given number of milliseconds
 * const sleep = (time_ms: number) => (new Promise((resolve) => (setTimeout(resolve, time_ms))))
 *
 * const
 * 	log_history: Array<[time: number, value: number]> = [],
 * 	t0 = performance.now(),
 * 	current_time = () => (performance.now() - t0)
 *
 * // the function that we plan to apply shareable-debouncing to
 * const fn = (v: number) => {
 * 	log_history.push([current_time(), v])
 * 	return v + 100
 * }
 *
 * // the debounced version of `fn`, that, when called too quickly, shares the existing promise, and prolongs its resolution by the wait time
 * const debounced_fn = debounceAndShare(1000, fn)
 *
 * // `a` is a promise that should resolve after 1000ms since the last interruption call to `debounced_fn` (i.e. 1000ms from now).
 * const a = debounced_fn(24)
 *
 * await sleep(500) // promise `a` is still pending after the 500ms sleep
 *
 * // since `a` has not been resolved yet, calling `debounced_fn` again to construct `b` will result in the reusage of the old existing promise `a`.
 * // in addition, due to the interuptive call, the resolution of the `a` and `b` promises will be delayed by another 1000ms from here on.
 * const b = debounced_fn(42)
 *
 * assertEq(a === b, true) // the promises `a` and `b` are one and the same, since `debounced_fn` shares the existing non-settled promises.
 *
 * // after the sleep below, 1050ms would have passed since the creation of `a`, and it would have been resolved had we _not_ created `b`.
 * // however, since we created `b` within the debounce interval of 1000ms, the promise's timer has been reset.
 * await sleep(550)
 * assertEq(log_history, [])
 *
 * // 1000ms after the creation of `b`, the value `42` will be logged into `log_history` (due to promise `a` and `b`).
 * await sleep(500)
 * assertGe(log_history[0][0], 500 + 999)
 * assertLe(log_history[0][0], 500 + 1040)
 * assertEq(log_history[0][1], 42)
 * assertEq(await a, 100 + 42) // notice that the value of `a` has changed to the expected output value of `b`, because they are one and the same.
 * assertEq(await b, 100 + 42)
 *
 * // now that promises `a` and `b` have been resolved, executing the shared-debounced function again will create a new promise that will resolve after 1000ms from now.
 * const c = debounced_fn(99)
 * assertEq(c === b, false)
 *
 * // 1000ms later, the value `99` will be logged into `log_history` (due to promise `c`).
 * await sleep(1050)
 * assertGe(log_history[1][0], 1550 + 999)
 * assertLe(log_history[1][0], 1550 + 1100)
 * assertEq(log_history[1][1], 99)
 * assertEq(await c, 100 + 99)
 *
 * // key takeaway:
 * // - notice that the promises made within the debounce interval are the same pomise objects (i.e. `a === b`).
 * // - however, once out of that interval, an entirely new promise is generated (i.e. `b !== c`)
 * ```
*/
export const debounceAndShare = (wait_time_ms, fn) => {
    let prev_timer, current_resolve, current_promise;
    const swap_current_promise_with_a_new_one = (value) => {
        current_promise = new Promise((resolve, reject) => (current_resolve = resolve)).then(swap_current_promise_with_a_new_one);
        return value;
    };
    swap_current_promise_with_a_new_one();
    return (...args) => {
        dom_clearTimeout(prev_timer);
        prev_timer = dom_setTimeout(() => (current_resolve(fn(...args))), wait_time_ms);
        return current_promise;
    };
};
/** a throttled function blocks the execution of `fn`, if less than `delta_time_ms` amount of time has passed since the previous non-rejected call.
 * a rejected caller would receive the {@link THROTTLE_REJECT} symbol, instead of the `fn` function's evaluated value.
 *
 * ### Visualization
 *
 * the following visual illustration should give you an idea of how a throttled function with `delta_time_ms = 1000` would behave.
 * - the intersections in the `call made` axis specifies the time where a call is made to the throttled function.
 * - successfully evaluated calls are labeled as `resolved` (with the legend marker `o`), and their caller will receive the evaluated value of `fn()`
 * - unsuccessful calls (i.e. rejected) are labeled as `rejected` (with the legend marker `x`), and their caller will receive the symbol value {@link THROTTLE_REJECT}.
 *
 * ```text
 * │resolved │  o         o                  o
 * │rejected │  │ x  x x  │ x                │ x x
 * │call made├──┴─┴──┴─┴──┴─┴────────────────┴─┴─┴─────────────────► time
 * │time     │  0         1         2         3         4         5
 * ```
 *
 * @param delta_time_ms the time interval in milliseconds for throttling
 * @param fn the function to be throttled
 * @returns a function (that takes arguments intended for `fn`) that returns the value of `fn` if it was not throttled,
 *   otherwise a {@link THROTTLE_REJECT} symbol is returned.
 *
 * @example
 * ```ts
 * import {
 * 	assertEquals as assertEq,
 * 	assertLessOrEqual as assertLe,
 * 	assertGreaterOrEqual as assertGe,
 * } from "jsr:@std/assert"
 *
 * // a function that creates an asynchronous delay of the given number of milliseconds
 * const sleep = (time_ms: number) => (new Promise((resolve) => (setTimeout(resolve, time_ms))))
 *
 * const
 * 	log_history: Array<[time: number, value: number]> = [],
 * 	t0 = performance.now(),
 * 	current_time = () => (performance.now() - t0)
 *
 * // the function that we plan to apply throttling to
 * const fn = (v: number) => {
 * 	log_history.push([current_time(), v])
 * 	return v + 100
 * }
 *
 * // the throttled version of `fn`, that blocks subsequent calls when they are made under the `delta_time` interval (1000ms here).
 * const throttled_fn = throttle(1000, fn)
 *
 * // first call to the `throttled_fn` will be evaluated successfully and immediately
 * const a = throttled_fn(24)
 *
 * assertEq(a, 100 + 24)
 * assertGe(log_history[0][0], 0)
 * assertLe(log_history[0][0], 100)
 * assertEq(log_history[0][1], 24)
 *
 * // subsequent calls to the `throttled_fn` that are made under 1000ms, will be immediately rejected with the symbol value `THROTTLE_REJECT`.
 * await sleep(200)
 * const b1 = throttled_fn(37)
 * const b2 = throttled_fn(42)
 *
 * assertEq(b1, THROTTLE_REJECT)
 * assertEq(b2, THROTTLE_REJECT)
 * assertGe(current_time(), 199)
 * assertLe(current_time(), 400)
 *
 * // finally, when 1000ms has passed, `throttled_fn` will permit another successful call
 * await sleep(800)
 * const c = throttled_fn(99)
 *
 * assertEq(c, 100 + 99)
 * assertGe(log_history[1][0], 999)
 * assertLe(log_history[1][0], 1300)
 * assertEq(log_history[1][1], 99)
 * ```
*/
export const throttle = (delta_time_ms, fn) => {
    let last_call = 0;
    return (...args) => {
        const time_now = date_now();
        if (time_now - last_call > delta_time_ms) {
            last_call = time_now;
            return fn(...args);
        }
        return THROTTLE_REJECT;
    };
};
/** a throttle function, similar to {@link throttle}, that also insures that the **final** call (aka trailing call) made to the throttled function **always** resolves eventually.
 *
 * this is useful in cases where it is of utmost importance that the throttled function is called **one last time** with before a prolonged delay.
 *
 * ### Visualization
 *
 * the following visual illustration shows the difference between the regular {@link throttle}, and {@link throttleAndTrail} functions:
 *
 * #### this {@link throttleAndTrail} function
 *
 * here is a function `fn` throttled with `trailing_time_ms = 1500`, and `delta_time_ms = 1000`.
 * as you can see below, the trailing calls to the throttled function do get resolved eventually (1500ms after the last call).
 *
 * ```text
 * │time     │         ╭╶╶╮ 1.2            2.7   3.3            4.8 5.2
 * ├─────────│       ╭╶┤  │ ┌───(delayed)──┐     ┌───(delayed)──┐   (rejected)
 * │         │    ╭╶╶┤ │  │ │              ▼   ╭╶┤              ▼   ╭╶╶╶╶╶╶╶╮
 * │resolved │  o ▼  ▼ ▼  o │              o o ▼ │              o o ▼       o
 * │rejected │  │ x  x x  │ │                │ x │                │ x       │
 * │call made├──┴─┴──┴─┴──┴─┴────────────────┴─┴─┴────────────────┴─┴───────┴──► time
 * │time     │  0         1         2         3         4         5         6
 * ```
 *
 * #### regular {@link throttle} function
 *
 * here is a function `fn` throttled with `delta_time_ms = 1000`.
 * as it can be seen below, the final call to the throttled function gets rejected, because it was called too quickly.
 *
 * ```text
 * │resolved │  o         o                  o
 * │rejected │  │ x  x x  │ x                │ x x
 * │call made├──┴─┴──┴─┴──┴─┴────────────────┴─┴─┴─────────────────► time
 * │time     │  0         1         2         3         4         5
 * ```
 *
 * @param trailing_time_ms the time in milliseconds after which a trailing (pending) call to the function gets resolved if no other calls are made during that time interval.
 *   you would definitely want this to be some value greater than {@link delta_time_ms}, otherwise it will be weird because if this value is smaller,
 *   then `trailing_time_ms` will become the "effective" throttling time interval, but also one that always resolved later rather than immediately.
 * @param delta_time_ms the time interval in milliseconds for throttling
 * @param fn the function to be throttled
 * @param rejection_value if a rejection value is provided, then old unresolved pending promises will be rejected with the given value,
 * 	 when a new call to the throttled function is made within the {@link trailing_time_ms} waiting period.
 *   if no rejection value is provided, then the promise will linger around unsettled forever.
 *   do note that having a rejection value means that you **will** have to catch any rejections if you wait for the promise,
 *   otherwise it will bubble to the top level as an unhandled error.
 * @returns a function (that takes arguments intended for `fn`) that returns a `Promise` to the value of `fn` if it is resolved (i.e. not throttled or when trailing),
 *   otherwise if throttled, then that promise will either be never be resolved, or rejected based on if a {@link rejection_value} was provided.
 *
 * @example
 * ```ts
 * import {
 * 	assertEquals as assertEq,
 * 	assertLessOrEqual as assertLe,
 * 	assertGreaterOrEqual as assertGe,
 * } from "jsr:@std/assert"
 *
 * // a function that creates an asynchronous delay of the given number of milliseconds
 * const sleep = (time_ms: number) => (new Promise((resolve) => (setTimeout(resolve, time_ms))))
 *
 * const
 * 	log_history: Array<[time: number, value: number]> = [],
 * 	t0 = performance.now(),
 * 	current_time = () => (performance.now() - t0)
 *
 * // the function that we plan to apply throttling to
 * const fn = (v: number) => {
 * 	log_history.push([current_time(), v])
 * 	return v + 100
 * }
 *
 * // the throttled version of `fn` with trailing enabled.
 * // a call is considered to be a trailing call if more than `trailing_time_ms` of 1500ms has passed since its inception.
 * // however after a successful call, subsequent non-trailing calls made under the `delta_time` interval of 1000ms will be rejected with the value `"REJECTED!"`.
 * const throttled_fn = throttleAndTrail(1500, 1000, fn, "REJECTED!")
 *
 * // first call to the `throttled_fn` will be evaluated successfully and immediately (albeit being wrapped under a promise)
 * const a = throttled_fn(24)
 *
 * await sleep(100)
 * assertGe(log_history[0][0], 0)
 * assertLe(log_history[0][0], 100)
 * assertEq(log_history[0][1], 24)
 * assertEq(await a, 100 + 24)
 *
 * // subsequent non-trailing calls to the `throttled_fn` that are made under 1000ms, will be rejected with the custom value `"REJECTED!"`.
 * await sleep(100)
 * const b1 = throttled_fn(37).catch(reason => reason)
 * const b2 = throttled_fn(42).catch(reason => reason)
 *
 * assertEq(await b1, "REJECTED!")
 * // we don't await for `b2`, because after 1500ms, it will be resolved due to being a trailing call, and we don't want that right now.
 * assertGe(current_time(), 199)
 * assertLe(current_time(), 400)
 *
 * // finally, we create a trailing call, which will take 1500ms to resolve, since less than 1000ms has passed since the last call (`b2`).
 * await sleep(100)
 * const c = throttled_fn(99)
 *
 * assertEq(await c, 100 + 99)
 * assertGe(log_history[1][0], 300 + 1499)
 * assertLe(log_history[1][0], 300 + 1700)
 * assertEq(log_history[1][1], 99)
 * assertEq(await b2, "REJECTED!")
 * ```
*/
export const throttleAndTrail = (trailing_time_ms, delta_time_ms, fn, rejection_value) => {
    let prev_timer, prev_reject = () => { };
    const throttled_fn = throttle(delta_time_ms, fn);
    return (...args) => {
        dom_clearTimeout(prev_timer);
        if (rejection_value !== undefined) {
            prev_reject(rejection_value);
        }
        const result = throttled_fn(...args);
        if (result === THROTTLE_REJECT) {
            return new Promise((resolve, reject) => {
                prev_reject = reject;
                prev_timer = dom_setTimeout(() => resolve(fn(...args)), trailing_time_ms);
            });
        }
        return promise_resolve(result);
    };
};
/** a promise that resolves (or rejects if `should_reject = true`) after a certain number of milliseconds.
 *
 * this is a useful shorthand for creating delays, and then following them up with a `.then` call.
 * you may also use this as a sleep/wait function in an async context where `await` is available.
*/
export const promiseTimeout = (wait_time_ms, should_reject) => {
    return new Promise((resolve, reject) => {
        dom_setTimeout(should_reject ? reject : resolve, wait_time_ms, TIMEOUT);
    });
};
export const memorizeCore = (fn, weak_ref = false) => {
    const 
    // TODO: use HybridWeakMap for memory instead of Map, so that key references to objects and functions are held loosely/weakly, and garbage collectible
    memory = weak_ref ? new HybridWeakMap() : new Map(), get = bindMethodToSelfByName(memory, "get"), set = bindMethodToSelfByName(memory, "set"), has = bindMethodToSelfByName(memory, "has"), memorized_fn = (arg) => {
        const arg_exists = has(arg), value = arg_exists ? get(arg) : fn(arg);
        if (!arg_exists) {
            set(arg, value);
        }
        return value;
    };
    return { fn: memorized_fn, memory };
};
/** memorize the return value of a single parameter function.
 * further calls with memorized arguments will return the value much quicker.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * let fn_call_count = 0
 * const fn = (arg: string | number) => {
 * 	fn_call_count++
 * 	return `you owe ${arg} to the bank.`
 * }
 * const memorized_fn = memorize(fn)
 *
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn(5)          , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 3)
 * assertEq(memorized_fn("your soul"), "you owe your soul to the bank.")
 * assertEq(fn_call_count            , 4)
 * assertEq(memorized_fn("your soul"), "you owe your soul to the bank.")
 * assertEq(fn_call_count            , 4)
 * ```
*/
export const memorize = (fn) => {
    return memorizeCore(fn).fn;
};
/** similar to {@link memorize}, but halts its memorization after `n`-unique unmemorized calls are made to the function.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * let fn_call_count = 0
 * const fn = (arg: string | number) => {
 * 	fn_call_count++
 * 	return `you owe ${arg} to the bank.`
 * }
 * const memorized_fn = memorizeAtmostN(2, fn)
 *
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * // from here on, memorization will be halted
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn(5)          , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 3)
 * assertEq(memorized_fn("your soul"), "you owe your soul to the bank.")
 * assertEq(fn_call_count            , 4)
 * assertEq(memorized_fn("your soul"), "you owe your soul to the bank.")
 * assertEq(fn_call_count            , 5)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 5)
 * ```
*/
export const memorizeAtmostN = (n, fn) => {
    const memorization_controls = memorizeCore(fn), memory_has = bindMethodToSelfByName(memorization_controls.memory, "has"), memorized_fn = memorization_controls.fn, memorized_atmost_n_fn = (arg) => {
        if (memory_has(arg) || (--n >= 0)) {
            return memorized_fn(arg);
        }
        return fn(arg);
    };
    return memorized_atmost_n_fn;
};
/** memorizes a function's return value up-until `n`-calls,
 * and after this, unmemorized call arguments will either return the optional `default_value` (if it was provided),
 * or it will return value of the `n`th call (final call that got memorized).
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * let fn_call_count = 0
 * const fn = (arg: string | number) => {
 * 	fn_call_count++
 * 	return `you owe ${arg} to the bank.`
 * }
 * const memorized_fn = memorizeAfterN(2, fn, "DEFAULT VALUE!")
 *
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * // from here on, memorization will be halted and only `"DEFAULT VALUE!"` will be returned for unmemorized args
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn(5)          , "DEFAULT VALUE!")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn("your soul"), "DEFAULT VALUE!")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn("your soul"), "DEFAULT VALUE!")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 2)
 * ```
*/
export const memorizeAfterN = (n, fn, default_value) => {
    const memorization_controls = memorizeCore(fn), memory_has = bindMethodToSelfByName(memorization_controls.memory, "has"), memorized_fn = memorization_controls.fn, memorized_after_n_fn = (arg) => {
        const value = memory_has(arg) || (--n >= 0) ? memorized_fn(arg) : default_value;
        if (n === 0) {
            default_value ??= value;
        }
        return value;
    };
    return memorized_after_n_fn;
};
/** memorize function and limit the caching memory used for it, through the use of LRU-scheme.
 *
 * [LRU](https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU) stands for _least recently used_,
 * and the LRU-memorization implemented here memorizes atmost `max_capacity` number of unique arguments,
 * before dropping its capacity down to `min_capacity` by discarding the oldest memorized results.
 *
 * since we are not actually tracking the number of calls made for each argument, this is not a real "LRU-cache",
 * since a real one would not discard the oldest memorized argument if it is being called consistiently.
 * but that's exactly what we do here: we remove the oldest one irrespective of how often/how-recently it has been used.
 *
 * TODO: for a more true LRU caching system, we will need to to reference count each memorized argument (I think),
 *   and that can be achieved via my `RcList` (reference counted list) from {@link "collections"} module.
 *   but we will first have to create a hybrid of `LimitedStack` and `RcList` before swapping it here with `LimitedStack`.
 *
 * TODO: put on some darn examples! but that's so much of a hassle. someone please kill me.
 * > Hi! It's Ronald McBigDonalds here! What can I do to satiate your hunger today? <br>
 * > Get me a BiGGuLP of Seppuku, with a CEO shooter on the side. Ariga-Thanks! <br>
 * > Wakarimashta! One juicy order of **bigg** last meal is on it way! Please enjoy your once-in-a-lifetime ketchup splatter moment.
*/
export const memorizeLRU = (min_capacity, max_capacity, fn) => {
    const memorization_controls = memorizeCore(fn), memory_has = bindMethodToSelfByName(memorization_controls.memory, "has"), memory_del = bindMethodToSelfByName(memorization_controls.memory, "delete"), memorized_fn = memorization_controls.fn, memorized_args_lru = new LimitedStack(min_capacity, max_capacity, (discarded_items) => {
        discarded_items.forEach(memory_del);
    }), memorized_args_lru_push = bindMethodToSelfByName(memorized_args_lru, "push"), memorized_lru_fn = (arg) => {
        const arg_memorized = memory_has(arg);
        if (!arg_memorized) {
            memorized_args_lru_push(arg);
        }
        return memorized_fn(arg);
    };
    return memorized_lru_fn;
};
/** memorize the result of a function only once.
 * after that, further calls to the function will not invoke `fn` anymore,
 * and instead simply return the same memorized value all the time.
*/
export const memorizeOnce = (fn) => {
    return memorizeAfterN(1, fn);
};
export const memorizeMultiCore = (fn, weak_ref = false) => {
    const tree = weak_ref ? new HybridTree() : new StrongTree(), memorized_fn = (...args) => {
        const subtree = tree.getDeep(args.toReversed()), args_exist = subtree.value !== TREE_VALUE_UNSET, value = args_exist ? subtree.value : fn(...args);
        if (!args_exist) {
            subtree.value = value;
        }
        return value;
    };
    return { fn: memorized_fn, memory: tree };
};
/** memorize the results of a multi-parameter function.
 *
 * since references to object type arguments are held strongly in the memorized function's cache, you will probably
 * want to manage clearing entries manually, using either {@link Map} methods, or {@link StrongTree} methods.
*/
export const memorizeMulti = (fn) => {
    return memorizeMultiCore(fn, false).fn;
};
/** memorize the results of a multi-parameter function, using a weak cache.
 *
 * the used arguments are cached _weakly_, meaning that if a non-primitive object `obj` was used as an argument,
 * then `obj` is **not** strongly bound to the memorized function's cache, meaning that if `obj` becomes inaccessible in all scopes,
 * then `obj` will become garbage collectible, which will then also clear the cache's reference to `obj` (and its memorized result).
*/
export const memorizeMultiWeak = (fn) => {
    return memorizeMultiCore(fn, true).fn;
};
/** curry a function `fn`, with optional `thisArg` option for binding as the `this`-object.
 *
 * what is currying? it allows a multi-parameter function to be transformed into a higher order function that always takes one argument,
 * and spits out another function which also take only one argument, and so on... until all parameters have been filled,
 * upon which the final function finally evaluates into the return value (type parameter {@link R} in this case).
 *
 * note that this function relies on `fn.length` property to identify the number of **required** arguments taken by `fn`.
 * this means that default valued arguments (such as `c` in `fn: (a: number, b: number, c = 5) => number`), or rest/spread
 * arguments (such as `args` in `fn: (a: number, b: number, ...args: number[]) => number`), are not considered as required,
 * and thus do not increment the count of `fn.length`.
 *
 * currying is usually poorly implemented through the use of closure.
 * for instance:
 *
 * ```ts ignore
 * const curried_fn = ((arg0) => (arg1) => (arg2) => fn(arg1, arg2, arg3))
 * const output = curried_fn("arg0")("arg1")("arg2")
 * ```
 *
 * this is bad because when you evaluate a curry with N-parameters, you also have to make N-calls (albeit it being tail-calls),
 * instead of just one call, should you have had all the parameters from the beginning.
 * not to mention that all javascript engines famously do not perform tail-call optimizations.
 *
 * so here, I've implemented currying using the `bind` method, which means that once all parameters are filled, the function goes through only one call (no overheads).
 * the same example from before would translate into the following when binding is used:
 *
 * ```ts ignore
 * const thisArg = undefined
 * const curried_fn = fn.bind(thisArg, arg0).bind(thisArg, arg1).bind(thisArg, arg2)
 * const output = curried_fn("arg0")("arg1")("arg2")
 * ```
 *
 * do note that it is very possible for the javascript engine to internally create tail-recursion closure for every argument binding,
 * resulting in the same unoptimized function that we discredited just a while ago.
 * without benchmarking, I cannot say for sure which implementation is more performant.
 *
 * @param fn the function to curry
 * @param thisArg provide an optional argument to use as the `this` object inside of `fn`
 * @returns a series of single argument partial functions that does not evaluate until all parameters have been provided
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * const abcd = (a: number, b: string, c: boolean, d: symbol): string => (String(a) + b + String(c) + " " + String(d))
 * const abcd_curry = curry(abcd)
 *
 * abcd_curry satisfies ((arg: number) => (arg: string) => (arg: boolean) => (arg: symbol) => string)
 *
 * assertEq(
 * 	((((abcd_curry(42)         satisfies ((arg: string) => (arg: boolean) => (arg: symbol) => string)
 * 	)(" hello to za warudo! ") satisfies ((arg: boolean) => (arg: symbol) => string)
 * 	)(true)                    satisfies ((arg: symbol) => string)
 * 	)(Symbol.iterator)         satisfies (string)
 * 	),
 * 	"42 hello to za warudo! true Symbol(Symbol.iterator)",
 * )
 * ```
*/
export const curry = (fn, thisArg) => {
    // note that we don't actually bind `fn` to `thisArg`, not until `fn.length <= 1`.
    // this is because then we would be binding `fn` to `thisArg` again and again, on every curried recursive call.
    // it might be more performant to bind `fn` to `thisArg` on only the final execution call,
    // when all parameters, except for the last one, have been provided.
    // which is what the `(fn.bind(thisArg) as (arg: ARGS[0]) => R) as any` line below does on the final call
    return fn.length > 1 ?
        ((arg) => curry(fn.bind(undefined, arg))) :
        fn.bind(thisArg);
};
/** come here, come all! greet the **Types' Olympic Champion** of winter 2024.
 *
 * it took a while to correctly apply a multitude of gymnastics to get it functioning, but the dedication has paid off!
 * please give `curryMulti` a round of applause!
 * and don't forget that currying a diverse variety of types all at once brings strength!
 * > (said a nation right before its downfall)
 *
 * now that introductions are over: {@link curryMulti} behaves very much like {@link curry},
 * the only difference being that you can bind an arbitrary number of arguments to the curried `fn` function,
 * instead of just a single argument at a time (like in the case of {@link curry}).
 *
 * @param fn the function to multi-curry
 * @param thisArg provide an optional argument to use as the `this` object inside of `fn`
 * @param remaining_args number of arguments remaining until all parameters (required kind, ideally) are filled. intended for internal use onkly
 * @returns a curried function that consumes variable number of arguments, until all required parameters are available, after which a return value is spat out
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * const abcd = (a: number, b: string, c: boolean, d: symbol): string => (String(a) + b + String(c) + " " + String(d))
 * const abcd_diversity_curry = curryMulti(abcd)
 *
 * abcd_diversity_curry satisfies CurryMultiSignature<(a: number, b: string, c: boolean, d: symbol) => string, string, any>
 *
 * assertEq(
 * 	(((abcd_diversity_curry(
 * 		42, " hello to za warudo! ") satisfies CurryMultiSignature<(c: boolean, d: symbol) => string, string, any>
 * 	)(true)                          satisfies CurryMultiSignature<(d: symbol) => string, string, any>
 * 	)(Symbol.iterator)               satisfies (string)
 * 	),
 * 	"42 hello to za warudo! true Symbol(Symbol.iterator)",
 * )
 * ```
*/
export const curryMulti = (fn, thisArg, remaining_args = fn.length) => {
    return (...args_a) => {
        remaining_args -= args_a.length;
        // note that we don't actually bind `fn` to `thisArg`, not until `remaining_args === 0`.
        // this is because then we would be binding `fn` to `thisArg` again and again, on every curried recursive call.
        // it might be more performant to bind `fn` to `thisArg` on only the final execution call, when all parameters have been provided.
        // which is what the `(curried_fn as () => R).call(thisArg) as R` line below does on the final call.
        const curried_fn = fn.bind(undefined, ...args_a);
        return (remaining_args <= 0 ?
            curried_fn.call(thisArg) :
            curryMulti(curried_fn, thisArg, remaining_args));
    };
};
