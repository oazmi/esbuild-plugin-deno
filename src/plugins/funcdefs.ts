import { bind_array_push, isArray, isString, object_entries } from "../deps.ts"
import type { EsbuildEntryPointsType, EsbuildEntryPointType, LoggerFunction } from "./typedefs.ts"


/** alias for `console.log`. this is the default logging function. */
export const logLogger: LoggerFunction = console.log

const arrayLoggerFactory = (history: Array<any[]>): LoggerFunction => {
	const history_push = bind_array_push(history)
	return (...data: any[]): void => { history_push(data) }
}

/** the history of the {@link arrayLogger} function gets contained here. */
export const arrayLoggerHistory: Array<any[]> = []

/** an array based logging function. the log history is kept in the {@link arrayLoggerHistory} array. */
export const arrayLogger: LoggerFunction = /*@__PURE__*/ arrayLoggerFactory(arrayLoggerHistory)

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
export const entryPointsToImportMapEntries = (entry_points: EsbuildEntryPointsType): Array<[input: string, output: string]> => {
	type ImportMapEntry = [input: string, output: string]
	if (!isArray(entry_points)) { entry_points = object_entries(entry_points) as ImportMapEntry[] }
	return entry_points.map((entry: EsbuildEntryPointType): ImportMapEntry => {
		return isString(entry) ? ([entry, entry])
			: !isArray(entry) ? ([entry.in, entry.out])
				: (entry)
	})
}
