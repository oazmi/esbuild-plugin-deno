import type { EsbuildEntryPointsType, LoggerFunction } from "./typedefs.js";
/** alias for `console.log`. this is the default logging function. */
export declare const logLogger: LoggerFunction;
/** the history of the {@link arrayLogger} function gets contained here. */
export declare const arrayLoggerHistory: Array<any[]>;
/** an array based logging function. the log history is kept in the {@link arrayLoggerHistory} array. */
export declare const arrayLogger: LoggerFunction;
/** a utility function to convert file-uri to your filesystem's local-path.
 * // TODO: import from `@oazmi/kitchensink`
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = fileUriToLocalPath,
 * 	eq = assertEquals
 *
 * eq(fn(        "file:///C:/Users/me/projects/"),           "C:/Users/me/projects/")
 * eq(fn(        "file:///C:\\Users\\me/projects/"),         "C:/Users/me/projects/")
 * eq(fn(        "file:///sys/etc/bin/deno.so"),             "/sys/etc/bin/deno.so")
 * eq(fn(        "file:///sys\\etc/bin\\deno.so"),           "/sys/etc/bin/deno.so")
 * eq(fn(        "file://localhost/C:/Users/me/projects/"),  "C:/Users/me/projects/")
 * eq(fn(        "file://localhost/sys/etc/bin/deno.so"),    "/sys/etc/bin/deno.so")
 * eq(fn(new URL("file:///C:/Users/me/projects/")),          "C:/Users/me/projects/")
 * eq(fn(new URL("file:///sys/etc/bin/deno.so")),            "/sys/etc/bin/deno.so")
 * eq(fn(new URL("file://localhost/C:/Users/me/projects/")), "C:/Users/me/projects/")
 * eq(fn(new URL("file://localhost/sys/etc/bin/deno.so")),   "/sys/etc/bin/deno.so")
 * eq(fn(        "http://localhost:8000/hello/world/"),      undefined)
 * eq(fn(        "C:/Users/me/projects/"),                   undefined)
 * eq(fn(        "/sys/etc/bin/deno.so"),                    undefined)
 * eq(fn(),                                                  undefined)
 * ```
*/
export declare const fileUriToLocalPath: (file_url?: URL | string) => string | undefined;
/** a fault tolerant variant of {@link fileUriToLocalPath} that converts the provided path into a filesystem local-path when possible,
 * otherwise the string representation of the original path will be returned.
 *
 * // TODO: import from `@oazmi/kitchensink`
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = ensureLocalPath,
 * 	eq = assertEquals
 *
 * eq(fn(        "C:/Users/me/projects/"),                  "C:/Users/me/projects/")
 * eq(fn(        "C:\\Users\\me/projects/"),                "C:/Users/me/projects/")
 * eq(fn(        "/sys\\etc/bin\\deno.so"),                 "/sys/etc/bin/deno.so")
 * eq(fn(        "file:///C:/Users/me/projects/"),          "C:/Users/me/projects/")
 * eq(fn(        "file:///C:\\Users\\me/projects/"),        "C:/Users/me/projects/")
 * eq(fn(        "file:///sys\\etc/bin\\deno.so"),          "/sys/etc/bin/deno.so")
 * eq(fn(        "file://localhost/C:/Users/me/projects/"), "C:/Users/me/projects/")
 * eq(fn(new URL("file://localhost/sys/etc/bin/deno.so")),  "/sys/etc/bin/deno.so")
 * eq(fn(        "http://localhost:8000/hello/world/"),     "http://localhost:8000/hello/world/")
 * eq(fn(        "npm:react-jsx"),                          "npm:react-jsx")
 * eq(fn(        "jsr:@std/assert"),                        "jsr:@std/assert")
 * eq(fn(        "./src/mod.ts"),                           "./src/mod.ts")
 * eq(fn(        ""),                                       "")
 * ```
*/
export declare const ensureLocalPath: (path: string | URL) => string;
/** type definition of the return type of {@link syncTaskQueueFactory}.
 *
 * this is a synchronous task queuing function that enqueues task-functions to be executed sequentially.
 * each task is supposed to be a function whose return value (or resolved value, if it returns a `Promise`)
 * is wrapped in a promise and returned once the task is executed.
 *
 * @typeParam FN the type of the task function to be enqueued.
 * @param task the task function to execute.
 * @param args the arguments to be passed to the task function.
 * @returns a promise that resolves to the return value of the task function,
 *   once all prior tasks have been executed.
*/
export type SyncTaskQueue = <FN extends ((...args: any) => any)>(task: FN, ...args: Parameters<FN>) => Promise<ReturnType<FN>>;
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
export declare const syncTaskQueueFactory: () => SyncTaskQueue;
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
export declare const entryPointsToImportMapEntries: (entry_points: EsbuildEntryPointsType) => Array<[input: string, output: string]>;
//# sourceMappingURL=funcdefs.d.ts.map