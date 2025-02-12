/** utility functions for creating other general purpose functions that can bind their passed function's functionality to some specific object.
 *
 * those are certainly a lot of words thrown in the air with no clarity as to what am I even saying.
 * just as they say, a code block example is worth a thousand assembly instructions. here's the gist of it:
 *
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const bind_pushing_to = bindMethodFactory(Array.prototype.push) // equivalent to `bindMethodFactoryByName(Array.prototype, "push")`
 * const bind_seek_to = bindMethodFactory(Array.prototype.at, -1) // equivalent to `bindMethodFactoryByName(Array.prototype, "at", -1)`
 * const bind_splicing_to = bindMethodFactoryByName(Array.prototype, "splice") // equivalent to `bindMethodFactory(Array.prototype.splice)`
 * const bind_clear_to = bindMethodFactoryByName(Array.prototype, "splice", 0) // equivalent to `bindMethodFactory(Array.prototype.splice, 0)`
 *
 * const my_array = [1, 2, 3, 4, 5, 6]
 * const push_my_array = bind_pushing_to(my_array)
 * const seek_my_array = bind_seek_to(my_array)
 * const splice_my_array = bind_splicing_to(my_array)
 * const clear_my_array = bind_clear_to(my_array) as (deleteCount?: number, ...items: number[]) => number[]
 *
 * push_my_array(7, 8, 9)
 * assertEquals(my_array, [1, 2, 3, 4, 5, 6, 7, 8, 9])
 * assertEquals(seek_my_array(), 9)
 * splice_my_array(4, 3)
 * assertEquals(my_array, [1, 2, 3, 4, 8, 9])
 * clear_my_array()
 * assertEquals(my_array, [])
 * ```
 *
 * you may have some amateur level questions about *why?* would anyone want to do that. here is why:
 * - calling a method via property access is slower. so when you call an array `arr`'s push or pop methods a million times,
 *   having a bound function for that specific purpose will be quicker by about x1.3 times:
 *
 * ```ts
 * import { assertLess } from "jsr:@std/assert"
 * import { timeIt } from "./timeman.ts"
 *
 * // WARNING: JIT is pretty smart, and the test consistiently fails for `i` and `j` > `10_000_000`,
 * // this is despite my efforts to make it difficult for the JIT to optimize the slow method, by computing some modulo and only popping when it is zero.
 * // thus to be safe, I tuned `i` and `j` down to `100_000` iterations
 *
 * let i = 100_000, j = 100_000, sum1 = 0, sum2 = 0
 * const
 * 	arr1 = Array(777).fill(0).map(Math.random),
 * 	arr2 = Array(777).fill(0).map(Math.random)
 *
 * // slower way:
 * const t1 = timeIt(() => {
 * 	while(i--) {
 * 		const new_length = arr1.push(Math.random())
 * 		sum1 += ((new_length + i) % 3 === 0 ? arr1.pop()! : arr1.at(-1)!)
 * 	}
 * })
 *
 * // faster way (allegedly):
 * const
 * 	push_arr2 = Array.prototype.push.bind(arr2),
 * 	pop_arr2 = Array.prototype.pop.bind(arr2),
 * 	seek_arr2 = Array.prototype.at.bind(arr2, -1)
 * const t2 = timeIt(() => {
 * 	while(j--) {
 * 		const new_length = push_arr2(Math.random())
 * 		sum2 += ((new_length + i) % 3 === 0 ? pop_arr2()! : seek_arr2()!)
 * 	}
 * })
 *
 * // assertLess(t2, t1) // TODO: RIP, performance gains have diminished in deno. curse you V8 JIT.
 * // I still do think that in non-micro-benchmarks and real life applications (where there are a variety of objects and structures),
 * // there still is a bit of performance gain. and lets not forget the benefit of minifiability.
 * ```
 *
 * next, you may be wondering why not destructure the method or assign it to a variable?
 * - this cannot be generally done for prototype-bound methods, because it needs the context of *who* is the caller (and therefor the *this* of interest).
 *   all builtin javascript class methods are prototype-bound. meaning that for every instance of a builtin class no new functions are specifically created for that instance,
 *   and instead, the instance holds a reference to the class's prototype object's method, but applies itself as the *this* when called.
 *
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert"
 *
 * const arr = [1, 2, 3, 4, 5, 6]
 *
 * // prototype-bound methods need to be called via property access, otherwise they will loose their `this` context when uncoupled from their parent object
 * const { push, pop } = arr
 * assertThrows(() => push(7, 8, 9)) // `TypeError: Cannot convert undefined or null to object`
 * assertThrows(() => pop()) // `TypeError: Cannot convert undefined or null to object`
 *
 * const
 * 	push2 = arr.push,
 * 	pop2 = arr.pop
 * assertThrows(() => push2(7, 8, 9)) // `TypeError: Cannot convert undefined or null to object`
 * assertThrows(() => pop2()) // `TypeError: Cannot convert undefined or null to object`
 *
 * // but you can do the binding yourself too to make it work
 * const push3 = arr.push.bind(arr) // equivalent to `Array.prototype.push.bind(arr)`
 * const pop3 = arr.pop.bind(arr) // equivalent to `Array.prototype.pop.bind(arr)`
 * push3(7, 8, 9) // will work
 * pop3() // will work
 *
 * // or use this submodule to do the same thing:
 * // import { bind_array_pop, bind_array_push } from "@oazmi/kitchensink/binder"
 * const push4 = bind_array_push(arr)
 * const pop4 = bind_array_pop(arr)
 * push4(7, 8, 9) // will work
 * pop4() // will work
 * ```
 * - finally, property accesses are not easily minifiable (although they do get compressed when gzipped).
 *   however, if you bind your method calls to a variable, then it will become minifiable, which is somewhat the primary motivation for this submodule.
 *
 * with full automatic typing, you won't be compensating in any way.
 * on the side note, it was figuring out the automatic typing that took me almost 16 hours just to write 3 lines of equivalent javascript code for the main 2 factory functions of this submodule.
 * **curse you typescript!**
 *
 * @module
*/
import "./_dnt.polyfills.js";
/** generates a factory function that binds a class-prototype-method `func` (by reference) to the passed object `S` (which should be an instance of the class).
 * @param func the method to generate the binding for
 * @param args partial tuple of the first few arguments that should be passed in by default
 * @returns a function that can bind any object `obj: S` to the said method
 *
 * @example
 * ```ts
 * const bind_map_set = bindMethodFactory(Map.prototype.set)
 * type ID = number
 * const graph_edges = new Map<ID, Set<ID>>()
 * const set_graph_edge = bind_map_set(graph_edges) // automatic type inference will correctly assign it the type: `(key: number, value: Set<number>) => Map<number, Set<number>>`
 * const edges: [ID, ID[]][] = [[1, [1,2,3]], [2, [3,5]], [3, [4, 7]], [4, [4,5]], [5, [7]]]
 * for (const [id, adjacent_ids] of edges) { set_graph_edge(id, new Set(adjacent_ids)) }
 * ```
 *
 * example with assigned default arguments
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const bind_queue_delete_bottom_n_elements = bindMethodFactory(Array.prototype.splice, 0)
 * const queue = [1, 2, 3, 7, 7, 7, 9, 9, 9]
 * const release_from_queue = bind_queue_delete_bottom_n_elements(queue) // automatic type inference will correctly assign it the type: `(deleteCount: number, ...items: number[]) => number[]`
 * const test_arr: number[][] = []
 * while (queue.length > 0) { test_arr.push(release_from_queue(3)) }
 * assertEquals(test_arr, [
 * 	[1, 2, 3],
 * 	[7, 7, 7],
 * 	[9, 9, 9],
 * ])
 * ```
*/
export const bindMethodFactory = /*@__PURE__*/ (func, ...args) => ((thisArg) => func.bind(thisArg, ...args));
/** generates a factory function that binds a class-prototype-method (by name) to the passed object `S` (which should be an instance of the class).
 * @param instance an object containing the the method (typically a prototype object, but it doesn't have to be that)
 * @param method_name the name of the method to generate the binding for
 * @param args partial tuple of the first few arguments that should be passed in by default
 * @returns a function that can bind any object `obj: S` to the said method
 *
 * @example
 * ```ts
 * const bind_map_set = bindMethodFactoryByName(Map.prototype, "set")
 * type ID = number
 * const graph_edges = new Map<ID, Set<ID>>()
 * const set_graph_edge = bind_map_set(graph_edges) // automatic type inference will correctly assign it the type: `(key: number, value: Set<number>) => Map<number, Set<number>>`
 * const edges: [ID, ID[]][] = [[1, [1,2,3]], [2, [3,5]], [3, [4, 7]], [4, [4,5]], [5, [7]]]
 * for (const [id, adjacent_ids] of edges) { set_graph_edge(id, new Set(adjacent_ids)) }
 * ```
 *
 * example with assigned default arguments
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const bind_queue_delete_bottom_n_elements = bindMethodFactoryByName(Array.prototype, "splice", 0)
 * const queue = [1, 2, 3, 7, 7, 7, 9, 9, 9]
 * const release_from_queue = bind_queue_delete_bottom_n_elements(queue) // automatic type inference will correctly assign it the type: `(deleteCount: number, ...items: number[]) => number[]`
 * const test_arr: number[][] = []
 * while (queue.length > 0) { test_arr.push(release_from_queue(3)) }
 * assertEquals(test_arr, [
 * 	[1, 2, 3],
 * 	[7, 7, 7],
 * 	[9, 9, 9],
 * ])
 * ```
*/
export const bindMethodFactoryByName = /*@__PURE__*/ (instance, method_name, ...args) => {
    return ((thisArg) => {
        return instance[method_name].bind(thisArg, ...args);
    });
};
/** binds a class-prototype-method `func` (by reference) to the passed object `self` (which should be an instance of the class), and returns that bound method.
 * @param self the object to bind the method `func` to
 * @param func the prototype-method to bind (by reference)
 * @param args partial tuple of the first few arguments that should be passed in by default
 * @returns a version of the function `func` that is now bound to the object `self`, with the default first few partial arguments `args`
 *
 * @example
 * ```ts
 * type ID = number
 * const graph_edges = new Map<ID, Set<ID>>()
 * const set_graph_edge = bindMethodToSelf(graph_edges, graph_edges.set) // automatic type inference will correctly assign it the type: `(key: number, value: Set<number>) => Map<number, Set<number>>`
 * const edges: [ID, ID[]][] = [[1, [1,2,3]], [2, [3,5]], [3, [4, 7]], [4, [4,5]], [5, [7]]]
 * for (const [id, adjacent_ids] of edges) { set_graph_edge(id, new Set(adjacent_ids)) }
 * ```
 *
 * example with assigned default arguments
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const queue = [1, 2, 3, 7, 7, 7, 9, 9, 9]
 * const release_from_queue = bindMethodToSelf(queue, queue.splice, 0) // automatic type inference will correctly assign it the type: `(deleteCount: number, ...items: number[]) => number[]`
 * const test_arr: number[][] = []
 * while (queue.length > 0) { test_arr.push(release_from_queue(3)) }
 * assertEquals(test_arr, [
 * 	[1, 2, 3],
 * 	[7, 7, 7],
 * 	[9, 9, 9],
 * ])
 * ```
*/
export const bindMethodToSelf = /*@__PURE__*/ (self, func, ...args) => func.bind(self, ...args);
/** binds a class-prototype-method (by name `method_name`) to the passed object `self` (which should be an instance of the class), and returns that bound method.
 * @param self the object to bind the method `method_name` to
 * @param method_name the name of the prototype-method to bind
 * @param args partial tuple of the first few arguments that should be passed in by default
 * @returns a version of the function `method_name` that is now bound to the object `self`, with the default first few partial arguments `args`
 *
 * @example
 * ```ts
 * type ID = number
 * const graph_edges = new Map<ID, Set<ID>>()
 * const set_graph_edge = bindMethodToSelfByName(graph_edges, "set") // automatic type inference will correctly assign it the type: `(key: number, value: Set<number>) => Map<number, Set<number>>`
 * const edges: [ID, ID[]][] = [[1, [1,2,3]], [2, [3,5]], [3, [4, 7]], [4, [4,5]], [5, [7]]]
 * for (const [id, adjacent_ids] of edges) { set_graph_edge(id, new Set(adjacent_ids)) }
 * ```
 *
 * example with assigned default arguments
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const queue = [1, 2, 3, 7, 7, 7, 9, 9, 9]
 * const release_from_queue = bindMethodToSelfByName(queue, "splice", 0) // automatic type inference will correctly assign it the type: `(deleteCount: number, ...items: number[]) => number[]`
 * const test_arr: number[][] = []
 * while (queue.length > 0) { test_arr.push(release_from_queue(3)) }
 * assertEquals(test_arr, [
 * 	[1, 2, 3],
 * 	[7, 7, 7],
 * 	[9, 9, 9],
 * ])
 * ```
*/
export const bindMethodToSelfByName = /*@__PURE__*/ (self, method_name, ...args) => self[method_name].bind(self, ...args);
const 
// NOTE: the `prototypeOfClass` over here is a clone of the one in `"./srtruct.ts"`, but I want this file to be dependency free, hence is why I have to clone it.
prototypeOfClass = (cls) => {
    return cls.prototype;
}, array_proto = /*@__PURE__*/ prototypeOfClass(Array), map_proto = /*@__PURE__*/ prototypeOfClass(Map), set_proto = /*@__PURE__*/ prototypeOfClass(Set), string_proto = /*@__PURE__*/ prototypeOfClass(String);
// default array methods
/** binding function for `Array.prototype.at`. */
export const bind_array_at = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "at");
/** binding function for `Array.prototype.concat`. */
export const bind_array_concat = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "concat");
/** binding function for `Array.prototype.copyWithin`. */
export const bind_array_copyWithin = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "copyWithin");
/** binding function for `Array.prototype.entries`. */
export const bind_array_entries = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "entries");
/** binding function for `Array.prototype.every`. */
export const bind_array_every = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "every");
/** binding function for `Array.prototype.fill`. */
export const bind_array_fill = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "fill");
/** binding function for `Array.prototype.filter`. */
export const bind_array_filter = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "filter");
/** binding function for `Array.prototype.find`. */
export const bind_array_find = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "find");
/** binding function for `Array.prototype.findIndex`. */
export const bind_array_findIndex = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "findIndex");
/** binding function for `Array.prototype.findLast`. */
export const bind_array_findLast = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "findLast");
/** binding function for `Array.prototype.findLastIndex`. */
export const bind_array_findLastIndex = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "findLastIndex");
/** binding function for `Array.prototype.flat`. */
export const bind_array_flat = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "flat");
/** binding function for `Array.prototype.flatMap`. */
export const bind_array_flatMap = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "flatMap");
/** binding function for `Array.prototype.forEach`. */
export const bind_array_forEach = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "forEach");
/** binding function for `Array.prototype.includes`. */
export const bind_array_includes = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "includes");
/** binding function for `Array.prototype.indexOf`. */
export const bind_array_indexOf = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "indexOf");
/** binding function for `Array.prototype.join`. */
export const bind_array_join = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "join");
/** binding function for `Array.prototype.keys`. */
export const bind_array_keys = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "keys");
/** binding function for `Array.prototype.lastIndexOf`. */
export const bind_array_lastIndexOf = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "lastIndexOf");
/** binding function for `Array.prototype.map`. */
export const bind_array_map = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "map");
/** binding function for `Array.prototype.pop`. */
export const bind_array_pop = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "pop");
/** binding function for `Array.prototype.push`. */
export const bind_array_push = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "push");
/** binding function for `Array.prototype.reduce`. */
export const bind_array_reduce = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "reduce");
/** binding function for `Array.prototype.reduceRight`. */
export const bind_array_reduceRight = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "reduceRight");
/** binding function for `Array.prototype.reverse`. */
export const bind_array_reverse = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "reverse");
/** binding function for `Array.prototype.shift`. */
export const bind_array_shift = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "shift");
/** binding function for `Array.prototype.slice`. */
export const bind_array_slice = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "slice");
/** binding function for `Array.prototype.some`. */
export const bind_array_some = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "some");
/** binding function for `Array.prototype.sort`. */
export const bind_array_sort = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "sort");
/** binding function for `Array.prototype.splice`. */
export const bind_array_splice = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "splice");
/** binding function for `Array.prototype.unshift`. */
export const bind_array_unshift = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "unshift");
/** binding function for `Array.prototype.toLocaleString`. */
export const bind_array_toLocaleString = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "toLocaleString");
/** binding function for `Array.prototype.toReversed`. */
export const bind_array_toReversed = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "toReversed");
/** binding function for `Array.prototype.toSorted`. */
export const bind_array_toSorted = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "toSorted");
/** binding function for `Array.prototype.toSpliced`. */
export const bind_array_toSpliced = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "toSpliced");
/** binding function for `Array.prototype.toString`. */
export const bind_array_toString = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "toString");
/** binding function for `Array.prototype.values`. */
export const bind_array_values = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "values");
/** binding function for `Array.prototype.with`. */
export const bind_array_with = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "with");
// specialized array methods
/** binding function for `Array.prototype.splice(0)`. */
export const bind_array_clear = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "splice", 0);
/** binding function for `Array.prototype.at(-1)`. */
export const bind_stack_seek = /*@__PURE__*/ bindMethodFactoryByName(array_proto, "at", -1);
// default set methods
/** binding function for `Set.prototype.add`. */
export const bind_set_add = /*@__PURE__*/ bindMethodFactoryByName(set_proto, "add");
/** binding function for `Set.prototype.clear`. */
export const bind_set_clear = /*@__PURE__*/ bindMethodFactoryByName(set_proto, "clear");
/** binding function for `Set.prototype.delete`. */
export const bind_set_delete = /*@__PURE__*/ bindMethodFactoryByName(set_proto, "delete");
/** binding function for `Set.prototype.entries`. */
export const bind_set_entries = /*@__PURE__*/ bindMethodFactoryByName(set_proto, "entries");
/** binding function for `Set.prototype.forEach`. */
export const bind_set_forEach = /*@__PURE__*/ bindMethodFactoryByName(set_proto, "forEach");
/** binding function for `Set.prototype.has`. */
export const bind_set_has = /*@__PURE__*/ bindMethodFactoryByName(set_proto, "has");
/** binding function for `Set.prototype.keys`. */
export const bind_set_keys = /*@__PURE__*/ bindMethodFactoryByName(set_proto, "keys");
/** binding function for `Set.prototype.values`. */
export const bind_set_values = /*@__PURE__*/ bindMethodFactoryByName(set_proto, "values");
// default map methods
/** binding function for `Map.prototype.clear`. */
export const bind_map_clear = /*@__PURE__*/ bindMethodFactoryByName(map_proto, "clear");
/** binding function for `Map.prototype.delete`. */
export const bind_map_delete = /*@__PURE__*/ bindMethodFactoryByName(map_proto, "delete");
/** binding function for `Map.prototype.entries`. */
export const bind_map_entries = /*@__PURE__*/ bindMethodFactoryByName(map_proto, "entries");
/** binding function for `Map.prototype.forEach`. */
export const bind_map_forEach = /*@__PURE__*/ bindMethodFactoryByName(map_proto, "forEach");
/** binding function for `Map.prototype.get`. */
export const bind_map_get = /*@__PURE__*/ bindMethodFactoryByName(map_proto, "get");
/** binding function for `Map.prototype.has`. */
export const bind_map_has = /*@__PURE__*/ bindMethodFactoryByName(map_proto, "has");
/** binding function for `Map.prototype.keys`. */
export const bind_map_keys = /*@__PURE__*/ bindMethodFactoryByName(map_proto, "keys");
/** binding function for `Map.prototype.set`. */
export const bind_map_set = /*@__PURE__*/ bindMethodFactoryByName(map_proto, "set");
/** binding function for `Map.prototype.values`. */
export const bind_map_values = /*@__PURE__*/ bindMethodFactoryByName(map_proto, "values");
// default string methods
/** binding function for `String.prototype.at`. */
export const bind_string_at = /*@__PURE__*/ bindMethodFactoryByName(string_proto, "at");
/** binding function for `String.prototype.charAt`. */
export const bind_string_charAt = /*@__PURE__*/ bindMethodFactoryByName(string_proto, "charAt");
/** binding function for `String.prototype.charCodeAt`. */
export const bind_string_charCodeAt = /*@__PURE__*/ bindMethodFactoryByName(string_proto, "charCodeAt");
/** binding function for `String.prototype.codePointAt`. */
export const bind_string_codePointAt = /*@__PURE__*/ bindMethodFactoryByName(string_proto, "codePointAt");
/** binding function for `String.prototype.startsWith`. */
export const bind_string_startsWith = /*@__PURE__*/ bindMethodFactoryByName(string_proto, "startsWith");
/** binding function for `String.prototype.endsWith`. */
export const bind_string_endsWith = /*@__PURE__*/ bindMethodFactoryByName(string_proto, "endsWith");
