import type { EsbuildEntryPointsType, LoggerFunction } from "./typedefs.js";
/** alias for `console.log`. this is the default logging function. */
export declare const logLogger: LoggerFunction;
/** the history of the {@link arrayLogger} function gets contained here. */
export declare const arrayLoggerHistory: Array<any[]>;
/** an array based logging function. the log history is kept in the {@link arrayLoggerHistory} array. */
export declare const arrayLogger: LoggerFunction;
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