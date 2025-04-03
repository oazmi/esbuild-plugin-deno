import { bind_array_push, isArray, isString, object_entries, promise_outside, promise_resolve } from "../deps.js";
/** alias for `console.log`. this is the default logging function. */
export const logLogger = console.log;
const arrayLoggerFactory = (history) => {
    const history_push = bind_array_push(history);
    return (...data) => { history_push(data); };
};
/** the history of the {@link arrayLogger} function gets contained here. */
export const arrayLoggerHistory = [];
/** an array based logging function. the log history is kept in the {@link arrayLoggerHistory} array. */
export const arrayLogger = /*@__PURE__*/ arrayLoggerFactory(arrayLoggerHistory);
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
    // even before the next caller of `task_queuer` get the chance to query the `latest_promise`.
    // this permit us to chain async-task generators, so that they execute synchronously, one after the other.
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
/** this function accepts various forms of entry-points that are accepted by esbuild, and transforms them into an array of 2-tuples.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = entryPointsToImportMapEntries,
 * 	eq = assertEquals
 *
 * eq(fn(["input-a", "input-b", "input-c"]), [
 * 	["input-a", "input-a"],
 * 	["input-b", "input-b"],
 * 	["input-c", "input-c"],
 * ])
 *
 * eq(fn({
 * 	"input-a": "output-a",
 * 	"input-b": "output-b",
 * 	"input-c": "output-c",
 * }), [
 * 	["input-a", "output-a"],
 * 	["input-b", "output-b"],
 * 	["input-c", "output-c"],
 * ])
 *
 * eq(fn([
 * 	["input-a", "output-a"],
 * 	["input-b", "output-b"],
 * 	["input-c", "output-c"],
 * ]), [
 * 	["input-a", "output-a"],
 * 	["input-b", "output-b"],
 * 	["input-c", "output-c"],
 * ])
 *
 * eq(fn([
 * 	{ in: "input-a", out: "output-a" },
 * 	{ in: "input-b", out: "output-b" },
 * 	{ in: "input-c", out: "output-c" },
 * ]), [
 * 	["input-a", "output-a"],
 * 	["input-b", "output-b"],
 * 	["input-c", "output-c"],
 * ])
 *
 * eq(fn([
 * 	"input-a",
 * 	["input-b", "output-b"],
 * 	{ in: "input-c", out: "output-c" },
 * ]), [
 * 	["input-a", "input-a"],
 * 	["input-b", "output-b"],
 * 	["input-c", "output-c"],
 * ])
 * ```
*/
export const entryPointsToImportMapEntries = (entry_points) => {
    if (!isArray(entry_points)) {
        entry_points = object_entries(entry_points);
    }
    return entry_points.map((entry) => {
        return isString(entry) ? ([entry, entry])
            : !isArray(entry) ? ([entry.in, entry.out])
                : (entry);
    });
};
