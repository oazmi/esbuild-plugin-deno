/** utility functions for creating higher order functions.
 *
 * @module
*/
import { type BindableFunction } from "./binder.js";
import { HybridTree, type SimpleMap, StrongTree } from "./collections.js";
export interface MemorizeCoreControls<V, K> {
    fn: (arg: K) => V;
    memory: SimpleMap<K, V>;
}
export declare const memorizeCore: <V, K>(fn: (arg: K) => V, weak_ref?: boolean) => MemorizeCoreControls<V, K>;
/** memorize the return value of a single parameter function.
 * further calls with memorized arguments will return the value much quicker.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * let fn_call_count = 0
 * const fn = (arg: string | number) => {
 * 	fn_call_count++
 * 	return `you owe ${arg} to the bank.`
 * }
 * const memorized_fn = memorize(fn)
 *
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn(5)          , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 3)
 * assertEq(memorized_fn("your soul"), "you owe your soul to the bank.")
 * assertEq(fn_call_count            , 4)
 * assertEq(memorized_fn("your soul"), "you owe your soul to the bank.")
 * assertEq(fn_call_count            , 4)
 * ```
*/
export declare const memorize: <V, K>(fn: (arg: K) => V) => (typeof fn);
/** similar to {@link memorize}, but halts its memorization after `n`-unique unmemorized calls are made to the function.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * let fn_call_count = 0
 * const fn = (arg: string | number) => {
 * 	fn_call_count++
 * 	return `you owe ${arg} to the bank.`
 * }
 * const memorized_fn = memorizeAtmostN(2, fn)
 *
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * // from here on, memorization will be halted
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn(5)          , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 3)
 * assertEq(memorized_fn("your soul"), "you owe your soul to the bank.")
 * assertEq(fn_call_count            , 4)
 * assertEq(memorized_fn("your soul"), "you owe your soul to the bank.")
 * assertEq(fn_call_count            , 5)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 5)
 * ```
*/
export declare const memorizeAtmostN: <V, K>(n: number, fn: (arg: K) => V) => typeof fn;
/** memorizes a function's return value up-until `n`-calls,
 * and after this, unmemorized call arguments will either return the optional `default_value` (if it was provided),
 * or it will return value of the `n`th call (final call that got memorized).
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * let fn_call_count = 0
 * const fn = (arg: string | number) => {
 * 	fn_call_count++
 * 	return `you owe ${arg} to the bank.`
 * }
 * const memorized_fn = memorizeAfterN(2, fn, "DEFAULT VALUE!")
 *
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 1)
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * // from here on, memorization will be halted and only `"DEFAULT VALUE!"` will be returned for unmemorized args
 * assertEq(memorized_fn("5")        , "you owe 5 to the bank.")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn(5)          , "DEFAULT VALUE!")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn("your soul"), "DEFAULT VALUE!")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn("your soul"), "DEFAULT VALUE!")
 * assertEq(fn_call_count            , 2)
 * assertEq(memorized_fn("a camel")  , "you owe a camel to the bank.")
 * assertEq(fn_call_count            , 2)
 * ```
*/
export declare const memorizeAfterN: <K, V>(n: number, fn: (arg: K) => V, default_value?: V) => typeof fn;
/** memorize function and limit the caching memory used for it, through the use of LRU-scheme.
 *
 * [LRU](https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU) stands for _least recently used_,
 * and the LRU-memorization implemented here memorizes atmost `max_capacity` number of unique arguments,
 * before dropping its capacity down to `min_capacity` by discarding the oldest memorized results.
 *
 * since we are not actually tracking the number of calls made for each argument, this is not a real "LRU-cache",
 * since a real one would not discard the oldest memorized argument if it is being called consistiently.
 * but that's exactly what we do here: we remove the oldest one irrespective of how often/how-recently it has been used.
 *
 * TODO: for a more true LRU caching system, we will need to to reference count each memorized argument (I think),
 *   and that can be achieved via my `RcList` (reference counted list) from {@link "collections"} module.
 *   but we will first have to create a hybrid of `LimitedStack` and `RcList` before swapping it here with `LimitedStack`.
 *
 * TODO: put on some darn examples! but that's so much of a hassle. someone please kill me.
 * > Hi! It's Ronald McBigDonalds here! What can I do to satiate your hunger today? <br>
 * > Get me a BiGGuLP of Seppuku, with a CEO shooter on the side. Ariga-Thanks! <br>
 * > Wakarimashta! One juicy order of **bigg** last meal is on it way! Please enjoy your once-in-a-lifetime ketchup splatter moment.
*/
export declare const memorizeLRU: <K, V>(min_capacity: number, max_capacity: number, fn: (arg: K) => V) => typeof fn;
/** memorize the result of a function only once.
 * after that, further calls to the function will not invoke `fn` anymore,
 * and instead simply return the same memorized value all the time.
*/
export declare const memorizeOnce: <K, V>(fn: (arg: K) => V) => (typeof fn);
export interface memorizeMultiCore_Signature {
    <V, ARGS extends any[]>(fn: (...args: ARGS) => V, weak_ref?: false): {
        fn: (typeof fn);
        memory: typeof StrongTree<ARGS[number], V>;
    };
    <V, ARGS extends any[]>(fn: (...args: ARGS) => V, weak_ref: true): {
        fn: (typeof fn);
        memory: typeof HybridTree<ARGS[number], V>;
    };
}
export declare const memorizeMultiCore: memorizeMultiCore_Signature;
/** memorize the results of a multi-parameter function.
 *
 * since references to object type arguments are held strongly in the memorized function's cache, you will probably
 * want to manage clearing entries manually, using either {@link Map} methods, or {@link StrongTree} methods.
*/
export declare const memorizeMulti: <V, ARGS extends any[]>(fn: (...args: ARGS) => V) => (typeof fn);
/** memorize the results of a multi-parameter function, using a weak cache.
 *
 * the used arguments are cached _weakly_, meaning that if a non-primitive object `obj` was used as an argument,
 * then `obj` is **not** strongly bound to the memorized function's cache, meaning that if `obj` becomes inaccessible in all scopes,
 * then `obj` will become garbage collectible, which will then also clear the cache's reference to `obj` (and its memorized result).
*/
export declare const memorizeMultiWeak: <V, ARGS extends any[]>(fn: (...args: ARGS) => V) => (typeof fn);
/** this is the return type of {@link curry}, made for the sole purpose of type recursion. */
export type CurrySignature<FN extends (...args: any) => any, R extends ReturnType<FN> = ReturnType<FN>, ARGS extends Parameters<FN> = Parameters<FN>> = ARGS extends [infer ARG0, ...infer REST] ? (arg: ARG0) => CurrySignature<(...rest_args: REST) => R> : R;
/** this is the return type of {@link CurryMultiSignature}, made for the sole purpose of type recursion. */
export type CurryMultiSignature<FN extends BindableFunction<THIS, any, any, any>, R extends (FN extends BindableFunction<THIS, any, any, infer P> ? P : void) = ReturnType<FN>, THIS extends any = any> = <A extends (FN extends BindableFunction<THIS, infer P, any, R> ? P : never), B extends (FN extends BindableFunction<THIS, A, infer P, R> ? P : never), FN_B extends (B extends never[] ? never : (...args_b: B) => R)>(...args_a: A) => B extends never[] ? R : CurryMultiSignature<FN_B, ReturnType<FN_B> & R, THIS>;
/** curry a function `fn`, with optional `thisArg` option for binding as the `this`-object.
 *
 * what is currying? it allows a multi-parameter function to be transformed into a higher order function that always takes one argument,
 * and spits out another function which also take only one argument, and so on... until all parameters have been filled,
 * upon which the final function finally evaluates into the return value (type parameter {@link R} in this case).
 *
 * note that this function relies on `fn.length` property to identify the number of **required** arguments taken by `fn`.
 * this means that default valued arguments (such as `c` in `fn: (a: number, b: number, c = 5) => number`), or rest/spread
 * arguments (such as `args` in `fn: (a: number, b: number, ...args: number[]) => number`), are not considered as required,
 * and thus do not increment the count of `fn.length`.
 *
 * currying is usually poorly implemented through the use of closure.
 * for instance:
 *
 * ```ts ignore
 * const curried_fn = ((arg0) => (arg1) => (arg2) => fn(arg1, arg2, arg3))
 * const output = curried_fn("arg0")("arg1")("arg2")
 * ```
 *
 * this is bad because when you evaluate a curry with N-parameters, you also have to make N-calls (albeit it being tail-calls),
 * instead of just one call, should you have had all the parameters from the beginning.
 * not to mention that all javascript engines famously do not perform tail-call optimizations.
 *
 * so here, I've implemented currying using the `bind` method, which means that once all parameters are filled, the function goes through only one call (no overheads).
 * the same example from before would translate into the following when binding is used:
 *
 * ```ts ignore
 * const thisArg = undefined
 * const curried_fn = fn.bind(thisArg, arg0).bind(thisArg, arg1).bind(thisArg, arg2)
 * const output = curried_fn("arg0")("arg1")("arg2")
 * ```
 *
 * do note that it is very possible for the javascript engine to internally create tail-recursion closure for every argument binding,
 * resulting in the same unoptimized function that we discredited just a while ago.
 * without benchmarking, I cannot say for sure which implementation is more performant.
 *
 * @param fn the function to curry
 * @param thisArg provide an optional argument to use as the `this` object inside of `fn`
 * @returns a series of single argument partial functions that does not evaluate until all parameters have been provided
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * const abcd = (a: number, b: string, c: boolean, d: symbol): string => (String(a) + b + String(c) + " " + String(d))
 * const abcd_curry = curry(abcd)
 *
 * abcd_curry satisfies ((arg: number) => (arg: string) => (arg: boolean) => (arg: symbol) => string)
 *
 * assertEq(
 * 	((((abcd_curry(42)         satisfies ((arg: string) => (arg: boolean) => (arg: symbol) => string)
 * 	)(" hello to za warudo! ") satisfies ((arg: boolean) => (arg: symbol) => string)
 * 	)(true)                    satisfies ((arg: symbol) => string)
 * 	)(Symbol.iterator)         satisfies (string)
 * 	),
 * 	"42 hello to za warudo! true Symbol(Symbol.iterator)",
 * )
 * ```
*/
export declare const curry: <FN extends (...args: any) => any, R extends ReturnType<FN> = ReturnType<FN>, ARGS extends Parameters<FN> = Parameters<FN>>(fn: FN, thisArg?: ThisParameterType<FN>) => CurrySignature<FN, R, ARGS>;
/** come here, come all! greet the **Types' Olympic Champion** of winter 2024.
 *
 * it took a while to correctly apply a multitude of gymnastics to get it functioning, but the dedication has paid off!
 * please give `curryMulti` a round of applause!
 * and don't forget that currying a diverse variety of types all at once brings strength!
 * > (said a nation right before its downfall)
 *
 * now that introductions are over: {@link curryMulti} behaves very much like {@link curry},
 * the only difference being that you can bind an arbitrary number of arguments to the curried `fn` function,
 * instead of just a single argument at a time (like in the case of {@link curry}).
 *
 * @param fn the function to multi-curry
 * @param thisArg provide an optional argument to use as the `this` object inside of `fn`
 * @param remaining_args number of arguments remaining until all parameters (required kind, ideally) are filled. intended for internal use onkly
 * @returns a curried function that consumes variable number of arguments, until all required parameters are available, after which a return value is spat out
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * const abcd = (a: number, b: string, c: boolean, d: symbol): string => (String(a) + b + String(c) + " " + String(d))
 * const abcd_diversity_curry = curryMulti(abcd)
 *
 * abcd_diversity_curry satisfies CurryMultiSignature<(a: number, b: string, c: boolean, d: symbol) => string, string, any>
 *
 * assertEq(
 * 	(((abcd_diversity_curry(
 * 		42, " hello to za warudo! ") satisfies CurryMultiSignature<(c: boolean, d: symbol) => string, string, any>
 * 	)(true)                          satisfies CurryMultiSignature<(d: symbol) => string, string, any>
 * 	)(Symbol.iterator)               satisfies (string)
 * 	),
 * 	"42 hello to za warudo! true Symbol(Symbol.iterator)",
 * )
 * ```
*/
export declare const curryMulti: <FN extends BindableFunction<THIS, any, any, any>, R extends (FN extends BindableFunction<THIS, any, any, infer P> ? P : void) = ReturnType<FN>, THIS extends unknown = any>(fn: FN, thisArg?: THIS, remaining_args?: number) => CurryMultiSignature<FN, R, THIS>;
//# sourceMappingURL=lambda.d.ts.map