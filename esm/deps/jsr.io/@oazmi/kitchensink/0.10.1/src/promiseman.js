/** this submodule contains _promise_, _task_, and _scheduling_ related utility functions.
 *
 * @module
*/
import { date_now, dom_clearTimeout, dom_setTimeout, promise_forever, promise_outside, promise_resolve } from "./alias.js";
import { DEBUG } from "./deps.js";
import { min } from "./numericmethods.js";
import { isFunction } from "./struct.js";
/** this is a re-export of {@link promise_outside}.
 *
 * {@inheritDoc promise_outside}
*/
export const promiseOutside = promise_outside;
// TODO: consider creating disposable timeout/schedule functions that return a dispose function, which when called, will clear the timeout.
// I can't quite come up with a good design that functions both, as a promise,
// and as a dispose function, without an array or a record as the return value.
// this is because I want to be be able to chain the returned promise.
// one option is to accept an object parameter that will be side-loaded with a "dispose" function for the user to use.
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
/** schedule a promise that resolves when a specific local epoch-time (based on `Date.now()`) is reached.
 *
 * see what configuration options are available to you in {@link ScheduleTimeoutConfig}.
 *
 * // TODO: add tests maybe?
*/
export const scheduleTimeout = (epoch_time_ms, config = {}) => {
    const delay = epoch_time_ms - date_now();
    let { reject = false, runExpired = true } = config;
    if (delay < 0) {
        if (isFunction(runExpired)) {
            runExpired = runExpired();
        }
        if (runExpired === false) {
            return promise_forever();
        }
        reject = runExpired === "resolve" ? false
            : runExpired === "reject" ? true
                : reject;
    }
    return promiseTimeout(delay, reject);
};
/** a special symbol that signifies when a throttle function
 * (such as {@link throttle} and {@link throttleAndTrail})
 * has rejected to run a function, due to calling rate throttling.
*/
export const THROTTLE_REJECT = /*@__PURE__*/ Symbol(DEBUG.MINIFY || "a rejection by a throttled function");
/** a special symbol that signifies when a timeout function (such as {@link promiseTimeout}) has timed out. */
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
/** a factory function that generates a synchronous task queuer,
 * which ensures that the task-functions it receives are executed sequentially,
 * one after the other, in the order they were enqueued.
 *
 * TODO: consider adding this utility function to `@oazmi/kitchensink/lambda`, or the planned `@oazmi/kitchensink/duty` or `@oazmi/kitchensink/obligate`.
 *
 * @returns see {@link SyncTaskQueue} for the return type, and check out the example below.
 *
 * @example
 * ```ts
 * import { assert } from "jsr:@std/assert"
 *
 * // some utility functions
 * const
 * 	getTime = () => (performance.now()),
 * 	assertBetween = (value: number, min: number, max: number) => (assert(value >= min && value <= max)),
 * 	promiseTimeout = (wait_time_ms: number): Promise<void> => {
 * 		return new Promise((resolve, reject) => { setTimeout(resolve, wait_time_ms) })
 * 	}
 *
 * const
 * 	my_task_queue = syncTaskQueueFactory(),
 * 	start_time = getTime()
 *
 * const
 * 	task1 = my_task_queue(promiseTimeout, 500),
 * 	task2 = my_task_queue(promiseTimeout, 500),
 * 	task3 = my_task_queue(promiseTimeout, 500),
 * 	task4 = my_task_queue((value: string) => (value + " world"), "hello"),
 * 	task5 = my_task_queue(async (value: string) => (value + " world"), "bye bye")
 *
 * await task2 // will take ~1000ms to resolve.
 * assertBetween(getTime() - start_time, 950, 1100)
 *
 * await task1 // will already be resolved, since `task1` preceded `task2` in the queue.
 * assertBetween(getTime() - start_time, 950, 1100)
 *
 * await task3 // will take an additional ~500ms to resolve (so ~1500ms in total).
 * assertBetween(getTime() - start_time, 1450, 1600)
 *
 * assert(task4 instanceof Promise)
 * assert(await task4, "hello world") // almost instantaneous promise-resolution
 * assertBetween(getTime() - start_time, 1450, 1600)
 *
 * assert(task5 instanceof Promise)
 * assert(await task5, "bye bye world") // almost instantaneous promise-resolution
 * assertBetween(getTime() - start_time, 1450, 1600)
 * ```
*/
export const syncTaskQueueFactory = () => {
    // since javascript is single threaded, the following pattern guarantees that we'll be able to swap the `latest_promise` with a new one,
    // even before the next caller of `task_queuer` gets the chance to query the `latest_promise`.
    // this permits us to chain async-task generators, so that they execute synchronously, one after the other.
    let latest_promise = promise_resolve();
    const task_queuer = (task_fn, ...args) => {
        const original_latest_promise = latest_promise, [promise_current_task_value, resolve_current_task_value] = promise_outside();
        latest_promise = promise_current_task_value;
        original_latest_promise.finally(() => {
            resolve_current_task_value(task_fn(...args));
        });
        return promise_current_task_value;
    };
    return task_queuer;
};
/** create a queue list that can be asynchronously awaited to receive new items.
 *
 * TODO: should I also make the `items` non-private, so that they're accessible from super classes?
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	queue = new AwaitableQueue<string>(),
 * 	promise1 = queue.shift(),
 * 	promise2 = queue.shift()
 *
 * assertEquals(queue.getSize(), -2)
 *
 * queue.push("hello")
 * assertEquals(await promise1, "hello")
 * assertEquals(queue.getSize(), -1)
 *
 * queue.push("world")
 * assertEquals(await promise2, "world")
 * assertEquals(queue.getSize(), 0)
 *
 * queue.push("abcd")
 * assertEquals(queue.getSize(), 1)
 * // notice that when extra items are present,
 * // an immediate value is returned rather than a promise.
 * assertEquals(queue.shift(), "abcd")
 *
 * queue.push("1", "2", "3")
 * // dump all immediately available items, clearing off the internal list.
 * assertEquals(queue.dump(), ["1", "2", "3"])
 * assertEquals(queue.dump(), []) // nothing else to dump.
 *
 * const
 * 	promise3 = queue.shift(),
 * 	promise4 = queue.shift(),
 * 	promise5 = queue.shift(),
 * 	// drop all promise resolvers, clearing off the internal list.
 * 	[resolve3, resolve4, resolve5] = queue.drop()
 *
 * assertEquals(queue.drop(), []) // no more promise resolvers remain to be dropped.
 * queue.push("1", "2", "3", "4", "5")
 * assertEquals(queue.shift(), "1")
 * assertEquals(queue.shift(), "2")
 *
 * // `promise3` to `promise5` remain unresolved right now.
 * // but since we don't want forever hagging promises, we will resolve them below:
 * resolve3(await queue.shift())
 * resolve4(await queue.shift())
 * resolve5(await queue.shift())
 * assertEquals(await promise3, "3")
 * assertEquals(await promise4, "4")
 * assertEquals(await promise5, "5")
 * ```
*/
export class AwaitableQueue {
    #items = [];
    #queuedResolvers = [];
    // TODO: consider also adding a `queuedRejectors: Array<(reason?: string) => void>`,
    // which will be triggered when a user pushes a specific `REJECT_VALUE: unique symbol` as the `item`.
    /** push items into the queue, and immediately resolve any queued up promises,
     * otherwise just queue up the new items in the internal array.
    */
    push(...items) {
        const queued_resolvers = this.#queuedResolvers, queued_resolvers_len = queued_resolvers.length, items_len = items.length, iterations = min(queued_resolvers_len, items_len), items_in_excess = items_len - queued_resolvers_len, 
        // the reason why we splice below instead of shifting is because splicing,
        // even with one element, is faster than shifting.
        // after the splice, either `items` or `queued_resolvers` will have a zero length,
        // or both might get a zero length.
        items_for_resolving = items.splice(0, iterations), resolvers_to_resolve = queued_resolvers.splice(0, iterations);
        for (let i = 0; i < iterations; i++) {
            resolvers_to_resolve[i](items_for_resolving[i]);
        }
        return items_in_excess > 0
            ? this.#items.push(...items)
            : items_in_excess;
    }
    // TODO: I was initially returning `Promise<T>` and keeping the function `async`,
    // however, if it might be more performant if we do not always generate a promised return value.
    // so for now, I'm staying with a return value of `MaybePromise<T>`.
    // the method consumer can always add an `await` if they want to be certain that their value is resolved before consuming.
    /** make a request to pop the first item in the queue.
     * if no queued item is currently available,
     * you will receive a promise that will resolve as soon as an item is pushed,
     * and after all other promises that came before you have been served.
    */
    shift() {
        const items = this.#items;
        if (items.length > 0) {
            return items.shift();
        }
        const [promise, resolve, reject] = promise_outside();
        this.#queuedResolvers.push(resolve);
        return promise;
    }
    /** dump off all currently available queued items, and receive them as a returned value.
     *
     * > [!note]
     * > the first item in the returned array is the first item in the queue (highest priority/first to be served),
     * > while the last item in the array is at the end of the queue (least priority/last to be served).
    */
    dump() {
        return this.#items.splice(0);
    }
    /** drop off the resolvers of all currently unresolved promises in the queue.
     * this means that all existing promises will remain hanging,
     * unless you resolve them yourself with the returned resolver functions.
     *
     * > [!note]
     * > the first item in the returned array is the first resolver function in the queue (highest priority/first to be served),
     * > while the last item in the array is the last resolver that should be served in the queue (least priority).
    */
    drop() {
        return this.#queuedResolvers.splice(0);
    }
    /** returns the number of immediately available items, or the number of queued up requests.
     *
     * - when the return value is a positive value `n`, it indicates that `|n|` number of items are queued up,
     *   and you can immediately {@link shift} `|n|` number of times.
     * - when the return value is a negative value `n`, it indicates that `|n|` number of promises are waiting to be resolved,
     *   and that if you {@link shift} right now, you will be receiving a promise to the `|n| + 1` item in the future (relative to now).
    */
    getSize() {
        const items_len = this.#items.length;
        return items_len > 0 ? (items_len) : (-this.#queuedResolvers.length);
    }
}
/** create a stack list that can be asynchronously awaited to receive new items.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	stack = new AwaitableStack<string>(),
 * 	promise1 = stack.pop(),
 * 	promise2 = stack.pop()
 *
 * assertEquals(stack.getSize(), -2)
 *
 * // since this is a stack, the last promise is the first one to be served.
 * stack.push("hello")
 * assertEquals(await promise2, "hello")
 * assertEquals(stack.getSize(), -1)
 *
 * stack.push("world")
 * assertEquals(await promise1, "world")
 * assertEquals(stack.getSize(), 0)
 *
 * stack.push("abcd")
 * assertEquals(stack.getSize(), 1)
 * // notice that when extra items are present,
 * // an immediate value is returned rather than a promise.
 * assertEquals(stack.pop(), "abcd")
 *
 * stack.push("1", "2", "3")
 * // dump all immediately available items, clearing off the internal list.
 * // the last item in the array (`"3"`) is at the top of the stack.
 * assertEquals(stack.dump(), ["1", "2", "3"])
 * assertEquals(stack.dump(), [])  // nothing else to dump.
 *
 * const
 * 	promise3 = stack.pop(),
 * 	promise4 = stack.pop(),
 * 	promise5 = stack.pop(),
 * 	// drop all promise resolvers, clearing off the internal list.
 * 	[resolve3, resolve4, resolve5] = stack.drop()
 *
 * assertEquals(stack.drop(), []) // no more promise resolvers remain to be dropped.
 * stack.push("1", "2", "3", "4", "5")
 * assertEquals(stack.pop(), "5")
 * assertEquals(stack.pop(), "4")
 *
 * // `promise3` to `promise5` remain unresolved right now.
 * // but since we don't want forever hagging promises, we will resolve them below:
 * resolve5(await stack.pop())
 * resolve4(await stack.pop())
 * resolve3(await stack.pop())
 * assertEquals(await promise5, "3")
 * assertEquals(await promise4, "2")
 * assertEquals(await promise3, "1")
 * ```
*/
export class AwaitableStack {
    #items = [];
    #stackedResolvers = [];
    /** push a items into the stack, and immediately resolve any lingering promises,
     * otherwise the new items will just get stacked up in the internal items array.
    */
    push(...items) {
        const stacked_resolvers = this.#stackedResolvers, stacked_resolvers_len = stacked_resolvers.length, items_len = items.length, iterations = min(stacked_resolvers_len, items_len), items_in_excess = items_len - stacked_resolvers_len, items_for_resolving = items.splice(0, iterations);
        for (let i = 0; i < iterations; i++) {
            stacked_resolvers.pop()(items_for_resolving[i]);
        }
        return items_in_excess > 0
            ? this.#items.push(...items)
            : items_in_excess;
    }
    /** make a request to pop the top item in the stack.
     * if no stacked item is currently available,
     * you will receive a promise that will resolve if an item is pushed,
     * after all other promises that came _after_ you have been served.
    */
    pop() {
        const items = this.#items;
        if (items.length > 0) {
            return items.pop();
        }
        const [promise, resolve, reject] = promise_outside();
        this.#stackedResolvers.push(resolve);
        return promise;
    }
    /** dump off all currently available stacked items, and receive them as a returned value.
     *
     * > [!note]
     * > the last item in the returned array is at the top of the stack,
     * > while the first item in the array is the bottom of the stack.
    */
    dump() {
        return this.#items.splice(0);
    }
    /** drop off the resolvers of all currently unresolved promises in the stack.
     * this means that all existing promises will remain hanging,
     * unless you resolve them yourself with the returned resolver functions.
     *
     * > [!note]
     * > the last item in the returned array is at the top of the stack, meaning that it should be served/resolved first,
     * > while the first item in the array is the last resolver that should be served (bottom of the stack).
    */
    drop() {
        return this.#stackedResolvers.splice(0);
    }
    /** returns the number of immediately available items, or the number of queued up requests.
     *
     * - when the return value is a positive value `n`, it indicates that `|n|` number of items are queued up,
     *   and you can immediately {@link shift} `|n|` number of times.
     * - when the return value is a negative value `n`, it indicates that `|n|` number of promises are waiting to be resolved,
     *   and that if you {@link shift} right now, you will be receiving a promise to the `|n| + 1` item in the future (relative to now).
    */
    getSize() {
        const items_len = this.#items.length;
        return items_len > 0 ? (items_len) : (-this.#stackedResolvers.length);
    }
}
