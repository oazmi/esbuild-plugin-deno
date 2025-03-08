import { bind_array_push, dom_decodeURI, getUriScheme, isString, pathToPosixPath } from "../deps.ts"
import type { LoggerFunction } from "./typedefs.ts"


/** alias for `console.log`. this is the default logging function. */
export const logLogger: LoggerFunction = console.log

const arrayLoggerFactory = (history: Array<any[]>): LoggerFunction => {
	const history_push = bind_array_push(history)
	return (...data: any[]): void => { history_push(data) }
}

/** the history of the {@link arrayLogger} function gets contained here. */
export const arrayLoggerHistory: Array<any[]> = []

/** an array based logging function. the log history is kept in the {@link arrayLoggerHistory} array. */
export const arrayLogger = /*@__PURE__*/ arrayLoggerFactory(arrayLoggerHistory)

const windows_local_path_correction_regex = /^[\/\\]([a-z])\:[\/\\]/i

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
export const fileUriToLocalPath = (file_url?: URL | string): string | undefined => {
	if (isString(file_url)) {
		if (getUriScheme(file_url) !== "file") { return }
		file_url = new URL(file_url)
	}
	if (!file_url?.protocol.startsWith("file:")) { return }
	// the `file_url.pathname` always starts with a leading slash, which is invalid for windows (at least esbuild doesn't recognize it).
	// thus we replace any leading slashes in any windows-looking path that we encounter, without actually consulting what os is being ran.
	const
		local_path_with_leading_slash = pathToPosixPath(dom_decodeURI(file_url.pathname)),
		corrected_local_path = local_path_with_leading_slash.replace(windows_local_path_correction_regex, "$1:/")
	return corrected_local_path
}
