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
export type BindableFunction<T, A extends any[], B extends any[], R> = ((this: T, ...args: [...A, ...B]) => R);
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
export declare const bindMethodFactory: <T, A extends any[], B extends any[], R>(func: BindableFunction<T, A, B, R>, ...args: A) => <S extends T>(thisArg: S) => (...args: B) => R;
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
export declare const bindMethodFactoryByName: <T extends Record<M, BindableFunction<T, any[], unknown[], any>>, M extends PropertyKey, A extends (T[M] extends BindableFunction<T, infer P, any[], R> ? P : never), R extends ReturnType<T[M]>>(instance: T, method_name: M, ...args: A) => <S extends T, SB extends (S[M] extends BindableFunction<S, A, infer P, SR> ? P : never), SR extends ReturnType<S[M]>>(thisArg: S) => (...args: SB) => SR;
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
export declare const bindMethodToSelf: <S, A extends any[], B extends any[], R>(self: S, func: BindableFunction<S, A, B, R>, ...args: A) => (...args: B) => R;
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
export declare const bindMethodToSelfByName: <S extends Record<M, BindableFunction<S, A, any[], any>>, M extends PropertyKey, A extends (S[M] extends BindableFunction<S, (infer P)[], any[], R> ? P[] : never), R extends ReturnType<S[M]>>(self: S, method_name: M, ...args: A) => (...args: S[M] extends BindableFunction<S, A, infer B extends any[], R> ? B : never) => R;
/** binding function for `Array.prototype.at`. */
export declare const bind_array_at: <S extends unknown[], SB extends S["at"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["at"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.concat`. */
export declare const bind_array_concat: <S extends unknown[], SB extends S["concat"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["concat"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.copyWithin`. */
export declare const bind_array_copyWithin: <S extends unknown[], SB extends S["copyWithin"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["copyWithin"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.entries`. */
export declare const bind_array_entries: <S extends unknown[], SB extends S["entries"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["entries"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.every`. */
export declare const bind_array_every: <S extends unknown[], SB extends S["every"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["every"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.fill`. */
export declare const bind_array_fill: <S extends unknown[], SB extends S["fill"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["fill"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.filter`. */
export declare const bind_array_filter: <S extends unknown[], SB extends S["filter"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["filter"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.find`. */
export declare const bind_array_find: <S extends unknown[], SB extends S["find"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["find"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.findIndex`. */
export declare const bind_array_findIndex: <S extends unknown[], SB extends S["findIndex"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["findIndex"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.findLast`. */
export declare const bind_array_findLast: <S extends unknown[], SB extends S["findLast"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["findLast"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.findLastIndex`. */
export declare const bind_array_findLastIndex: <S extends unknown[], SB extends S["findLastIndex"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["findLastIndex"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.flat`. */
export declare const bind_array_flat: <S extends unknown[], SB extends S["flat"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["flat"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.flatMap`. */
export declare const bind_array_flatMap: <S extends unknown[], SB extends S["flatMap"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["flatMap"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.forEach`. */
export declare const bind_array_forEach: <S extends unknown[], SB extends S["forEach"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["forEach"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.includes`. */
export declare const bind_array_includes: <S extends unknown[], SB extends S["includes"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["includes"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.indexOf`. */
export declare const bind_array_indexOf: <S extends unknown[], SB extends S["indexOf"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["indexOf"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.join`. */
export declare const bind_array_join: <S extends unknown[], SB extends S["join"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["join"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.keys`. */
export declare const bind_array_keys: <S extends unknown[], SB extends S["keys"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["keys"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.lastIndexOf`. */
export declare const bind_array_lastIndexOf: <S extends unknown[], SB extends S["lastIndexOf"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["lastIndexOf"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.map`. */
export declare const bind_array_map: <S extends unknown[], SB extends S["map"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["map"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.pop`. */
export declare const bind_array_pop: <S extends unknown[], SB extends S["pop"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["pop"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.push`. */
export declare const bind_array_push: <S extends unknown[], SB extends S["push"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["push"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.reduce`. */
export declare const bind_array_reduce: <S extends unknown[], SB extends S["reduce"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["reduce"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.reduceRight`. */
export declare const bind_array_reduceRight: <S extends unknown[], SB extends S["reduceRight"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["reduceRight"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.reverse`. */
export declare const bind_array_reverse: <S extends unknown[], SB extends S["reverse"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["reverse"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.shift`. */
export declare const bind_array_shift: <S extends unknown[], SB extends S["shift"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["shift"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.slice`. */
export declare const bind_array_slice: <S extends unknown[], SB extends S["slice"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["slice"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.some`. */
export declare const bind_array_some: <S extends unknown[], SB extends S["some"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["some"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.sort`. */
export declare const bind_array_sort: <S extends unknown[], SB extends S["sort"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["sort"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.splice`. */
export declare const bind_array_splice: <S extends unknown[], SB extends S["splice"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["splice"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.unshift`. */
export declare const bind_array_unshift: <S extends unknown[], SB extends S["unshift"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["unshift"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.toLocaleString`. */
export declare const bind_array_toLocaleString: <S extends unknown[], SB extends S["toLocaleString"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["toLocaleString"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.toReversed`. */
export declare const bind_array_toReversed: <S extends unknown[], SB extends S["toReversed"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["toReversed"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.toSorted`. */
export declare const bind_array_toSorted: <S extends unknown[], SB extends S["toSorted"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["toSorted"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.toSpliced`. */
export declare const bind_array_toSpliced: <S extends unknown[], SB extends S["toSpliced"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["toSpliced"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.toString`. */
export declare const bind_array_toString: <S extends unknown[], SB extends S["toString"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["toString"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.values`. */
export declare const bind_array_values: <S extends unknown[], SB extends S["values"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["values"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.with`. */
export declare const bind_array_with: <S extends unknown[], SB extends S["with"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["with"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Array.prototype.splice(0)`. */
export declare const bind_array_clear: <T>(array: T[]) => ((deleteCount?: number, ...items: T[]) => T[]);
/** binding function for `Array.prototype.at(-1)`. */
export declare const bind_stack_seek: <S extends unknown[], SB extends S["at"] extends BindableFunction<S, [number], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["at"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Set.prototype.add`. */
export declare const bind_set_add: <S extends Set<unknown>, SB extends S["add"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["add"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Set.prototype.clear`. */
export declare const bind_set_clear: <S extends Set<unknown>, SB extends S["clear"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["clear"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Set.prototype.delete`. */
export declare const bind_set_delete: <S extends Set<unknown>, SB extends S["delete"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["delete"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Set.prototype.entries`. */
export declare const bind_set_entries: <S extends Set<unknown>, SB extends S["entries"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["entries"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Set.prototype.forEach`. */
export declare const bind_set_forEach: <S extends Set<unknown>, SB extends S["forEach"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["forEach"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Set.prototype.has`. */
export declare const bind_set_has: <S extends Set<unknown>, SB extends S["has"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["has"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Set.prototype.keys`. */
export declare const bind_set_keys: <S extends Set<unknown>, SB extends S["keys"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["keys"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Set.prototype.values`. */
export declare const bind_set_values: <S extends Set<unknown>, SB extends S["values"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["values"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Map.prototype.clear`. */
export declare const bind_map_clear: <S extends Map<unknown, unknown>, SB extends S["clear"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["clear"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Map.prototype.delete`. */
export declare const bind_map_delete: <S extends Map<unknown, unknown>, SB extends S["delete"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["delete"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Map.prototype.entries`. */
export declare const bind_map_entries: <S extends Map<unknown, unknown>, SB extends S["entries"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["entries"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Map.prototype.forEach`. */
export declare const bind_map_forEach: <S extends Map<unknown, unknown>, SB extends S["forEach"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["forEach"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Map.prototype.get`. */
export declare const bind_map_get: <S extends Map<unknown, unknown>, SB extends S["get"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["get"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Map.prototype.has`. */
export declare const bind_map_has: <S extends Map<unknown, unknown>, SB extends S["has"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["has"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Map.prototype.keys`. */
export declare const bind_map_keys: <S extends Map<unknown, unknown>, SB extends S["keys"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["keys"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Map.prototype.set`. */
export declare const bind_map_set: <S extends Map<unknown, unknown>, SB extends S["set"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["set"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `Map.prototype.values`. */
export declare const bind_map_values: <S extends Map<unknown, unknown>, SB extends S["values"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["values"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `String.prototype.at`. */
export declare const bind_string_at: <S extends String, SB extends S["at"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["at"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `String.prototype.charAt`. */
export declare const bind_string_charAt: <S extends String, SB extends S["charAt"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["charAt"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `String.prototype.charCodeAt`. */
export declare const bind_string_charCodeAt: <S extends String, SB extends S["charCodeAt"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["charCodeAt"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `String.prototype.codePointAt`. */
export declare const bind_string_codePointAt: <S extends String, SB extends S["codePointAt"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["codePointAt"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `String.prototype.startsWith`. */
export declare const bind_string_startsWith: <S extends String, SB extends S["startsWith"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["startsWith"]>>(thisArg: S) => (...args: SB) => SR;
/** binding function for `String.prototype.endsWith`. */
export declare const bind_string_endsWith: <S extends String, SB extends S["endsWith"] extends BindableFunction<S, [], infer P extends any[], SR> ? P : never, SR extends ReturnType<S["endsWith"]>>(thisArg: S) => (...args: SB) => SR;
//# sourceMappingURL=binder.d.ts.map