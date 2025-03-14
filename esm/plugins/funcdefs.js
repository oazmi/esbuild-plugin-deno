import { bind_array_push, DEBUG, dom_decodeURI, getUriScheme, isString, pathToPosixPath, promise_outside, promise_resolve } from "../deps.js";
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
const windows_local_path_correction_regex = /^[\/\\]([a-z])\:[\/\\]/i;
/** a utility function to convert file-uri to your filesystem's local-path.
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
export const fileUriToLocalPath = (file_url) => {
    if (isString(file_url)) {
        if (getUriScheme(file_url) !== "file") {
            return;
        }
        file_url = new URL(file_url);
    }
    if (!file_url?.protocol.startsWith("file:")) {
        return;
    }
    // the `file_url.pathname` always starts with a leading slash, which is invalid for windows (at least esbuild doesn't recognize it).
    // thus we replace any leading slashes in any windows-looking path that we encounter, without actually consulting what os is being ran.
    const local_path_with_leading_slash = pathToPosixPath(dom_decodeURI(file_url.pathname)), corrected_local_path = local_path_with_leading_slash.replace(windows_local_path_correction_regex, "$1:/");
    return corrected_local_path;
};
/** a fault tolerant variant of {@link fileUriToLocalPath} that converts the provided path into a filesystem local-path when possible,
 * otherwise the string representation of the original path will be returned.
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
export const ensureLocalPath = (path) => {
    const path_is_string = isString(path), file_uri_to_local_path_conversion = fileUriToLocalPath(path);
    if (DEBUG.ASSERT && !file_uri_to_local_path_conversion) {
        const scheme = path_is_string ? getUriScheme(path) : "http";
        if (scheme !== "local" && scheme !== "relative") {
            logLogger(`[ensureLocalPath] WARNING! received non-convertible remote path: "${path_is_string ? path : path.href}"`);
        }
    }
    return file_uri_to_local_path_conversion ?? (path_is_string
        ? pathToPosixPath(path)
        : path.href);
};
/** a factory function that generates a synchronous task queuer,
 * which ensures that the task-functions it receives are executed sequentially,
 * one after the other, in the order they were enqueued.
 *
 * TODO: consider adding this utility function to `@oazmi/kitchensink/lambda`.
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
