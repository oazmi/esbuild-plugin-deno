import type { LoggerFunction } from "./typedefs.js";
/** alias for `console.log`. this is the default logging function. */
export declare const logLogger: LoggerFunction;
/** the history of the {@link arrayLogger} function gets contained here. */
export declare const arrayLoggerHistory: Array<any[]>;
/** an array based logging function. the log history is kept in the {@link arrayLoggerHistory} array. */
export declare const arrayLogger: LoggerFunction;
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
export declare const fileUriToLocalPath: (file_url?: URL | string) => string | undefined;
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
export declare const ensureLocalPath: (path: string | URL) => string;
//# sourceMappingURL=funcdefs.d.ts.map