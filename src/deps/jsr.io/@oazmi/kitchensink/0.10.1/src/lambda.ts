/** utility functions for creating higher order functions.
 * 
 * @module
*/

import { type BindableFunction, bindMethodToSelfByName } from "./binder.js"
import { HybridTree, HybridWeakMap, LimitedStack, type SimpleMap, StrongTree, TREE_VALUE_UNSET } from "./collections.js"


// TODO: add missing documentation comments to memorize functions

export interface MemorizeCoreControls<V, K> {
	fn: (arg: K) => V
	// TODO: use HybridWeakMap for memory instead of Map, so that key references to objects and functions are held loosely/weakly, and garbage collectible
	memory: SimpleMap<K, V>
}

export const memorizeCore = <V, K>(fn: (arg: K) => V, weak_ref: boolean = false): MemorizeCoreControls<V, K> => {
	const
		// TODO: use HybridWeakMap for memory instead of Map, so that key references to objects and functions are held loosely/weakly, and garbage collectible
		memory: SimpleMap<K, V> = weak_ref ? new HybridWeakMap<K, V>() : new Map<K, V>(),
		get = bindMethodToSelfByName(memory, "get"),
		set = bindMethodToSelfByName(memory, "set"),
		has = bindMethodToSelfByName(memory, "has"),
		memorized_fn: typeof fn = (arg: K): V => {
			const
				arg_exists = has(arg),
				value = arg_exists ? get(arg)! : fn(arg)
			if (!arg_exists) { set(arg, value) }
			return value
		}
	return { fn: memorized_fn, memory }
}

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
export const memorize = <V, K>(fn: (arg: K) => V): (typeof fn) => {
	return memorizeCore(fn).fn
}

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
export const memorizeAtmostN = <V, K>(n: number, fn: (arg: K) => V): typeof fn => {
	const
		memorization_controls = memorizeCore(fn),
		memory_has = bindMethodToSelfByName(memorization_controls.memory, "has"),
		memorized_fn = memorization_controls.fn,
		memorized_atmost_n_fn: typeof fn = (arg: K) => {
			if (memory_has(arg) || (--n >= 0)) {
				return memorized_fn(arg)
			}
			return fn(arg)
		}
	return memorized_atmost_n_fn
}

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
export const memorizeAfterN = <K, V>(n: number, fn: (arg: K) => V, default_value?: V): typeof fn => {
	const
		memorization_controls = memorizeCore(fn),
		memory_has = bindMethodToSelfByName(memorization_controls.memory, "has"),
		memorized_fn = memorization_controls.fn,
		memorized_after_n_fn: typeof fn = (arg: K) => {
			const value = memory_has(arg) || (--n >= 0) ? memorized_fn(arg) : default_value
			if (n === 0) { default_value ??= value }
			return value as V
		}
	return memorized_after_n_fn
}

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
export const memorizeLRU = <K, V>(min_capacity: number, max_capacity: number, fn: (arg: K) => V): typeof fn => {
	const
		memorization_controls = memorizeCore(fn),
		memory_has = bindMethodToSelfByName(memorization_controls.memory, "has"),
		memory_del = bindMethodToSelfByName(memorization_controls.memory, "delete"),
		memorized_fn = memorization_controls.fn,
		memorized_args_lru = new LimitedStack<K>(min_capacity, max_capacity, (discarded_items: K[]) => {
			discarded_items.forEach(memory_del)
		}),
		memorized_args_lru_push = bindMethodToSelfByName(memorized_args_lru, "push"),
		memorized_lru_fn: typeof fn = (arg: K) => {
			const arg_memorized = memory_has(arg)
			if (!arg_memorized) { memorized_args_lru_push(arg) }
			return memorized_fn(arg)
		}
	return memorized_lru_fn
}

/** memorize the result of a function only once.
 * after that, further calls to the function will not invoke `fn` anymore,
 * and instead simply return the same memorized value all the time.
*/
export const memorizeOnce = <K, V>(fn: (arg: K) => V): (typeof fn) => {
	return memorizeAfterN(1, fn)
}

export interface memorizeMultiCore_Signature {
	<V, ARGS extends any[]>(fn: (...args: ARGS) => V, weak_ref?: false): { fn: (typeof fn), memory: typeof StrongTree<ARGS[number], V> }
	<V, ARGS extends any[]>(fn: (...args: ARGS) => V, weak_ref: true): { fn: (typeof fn), memory: typeof HybridTree<ARGS[number], V> }
}

export const memorizeMultiCore: memorizeMultiCore_Signature = <V, ARGS extends any[]>(fn: (...args: ARGS) => V, weak_ref: boolean = false) => {
	const
		tree = weak_ref ? new HybridTree<ARGS[number], V>() : new StrongTree<ARGS[number], V>(),
		memorized_fn: typeof fn = (...args: ARGS): V => {
			const
				subtree = tree.getDeep(args.toReversed()),
				args_exist = subtree.value !== TREE_VALUE_UNSET,
				value: V = args_exist ? subtree.value : fn(...args)
			if (!args_exist) { subtree.value = value }
			return value
		}
	return { fn: memorized_fn, memory: tree as any }
}

/** memorize the results of a multi-parameter function.
 * 
 * since references to object type arguments are held strongly in the memorized function's cache, you will probably
 * want to manage clearing entries manually, using either {@link Map} methods, or {@link StrongTree} methods.
*/
export const memorizeMulti = <V, ARGS extends any[]>(fn: (...args: ARGS) => V): (typeof fn) => {
	return memorizeMultiCore(fn, false).fn
}

/** memorize the results of a multi-parameter function, using a weak cache.
 * 
 * the used arguments are cached _weakly_, meaning that if a non-primitive object `obj` was used as an argument,
 * then `obj` is **not** strongly bound to the memorized function's cache, meaning that if `obj` becomes inaccessible in all scopes,
 * then `obj` will become garbage collectible, which will then also clear the cache's reference to `obj` (and its memorized result).
*/
export const memorizeMultiWeak = <V, ARGS extends any[]>(fn: (...args: ARGS) => V): (typeof fn) => {
	return memorizeMultiCore(fn, true).fn
}

// TODO: implement a multi-parameter memorize function. you could possibly use a form of currying + basic memorization, or you could build a tree structure around the passed arguments for looking up past results

/** this is the return type of {@link curry}, made for the sole purpose of type recursion. */
export type CurrySignature<
	FN extends (...args: any) => any,
	R extends ReturnType<FN> = ReturnType<FN>,
	ARGS extends Parameters<FN> = Parameters<FN>,
> = ARGS extends [infer ARG0, ...infer REST] ? (arg: ARG0) => CurrySignature<(...rest_args: REST) => R> : R

/** this is the return type of {@link CurryMultiSignature}, made for the sole purpose of type recursion. */
export type CurryMultiSignature<
	FN extends BindableFunction<THIS, any, any, any>,
	R extends (FN extends BindableFunction<THIS, any, any, infer P> ? P : void) = ReturnType<FN>,
	THIS extends any = any,
> = <
	A extends (FN extends BindableFunction<THIS, infer P, any, R> ? P : never),
	B extends (FN extends BindableFunction<THIS, A, infer P, R> ? P : never),
	FN_B extends (B extends never[] ? never : (...args_b: B) => R),
> (...args_a: A) => B extends never[] ?
		R :
		CurryMultiSignature<FN_B, ReturnType<FN_B> & R, THIS>

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
export const curry = <
	FN extends (...args: any) => any,
	R extends ReturnType<FN> = ReturnType<FN>,
	ARGS extends Parameters<FN> = Parameters<FN>,
>(fn: FN, thisArg?: ThisParameterType<FN>): CurrySignature<FN, R, ARGS> => {
	// note that we don't actually bind `fn` to `thisArg`, not until `fn.length <= 1`.
	// this is because then we would be binding `fn` to `thisArg` again and again, on every curried recursive call.
	// it might be more performant to bind `fn` to `thisArg` on only the final execution call,
	// when all parameters, except for the last one, have been provided.
	// which is what the `(fn.bind(thisArg) as (arg: ARGS[0]) => R) as any` line below does on the final call
	return fn.length > 1 ?
		((arg: ARGS[0]) => curry(fn.bind(undefined, arg))) as any :
		(fn.bind(thisArg) as (arg: ARGS[0]) => R) as any
}

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
export const curryMulti = <
	FN extends BindableFunction<THIS, any, any, any>,
	R extends (FN extends BindableFunction<THIS, any, any, infer P> ? P : void) = ReturnType<FN>,
	THIS extends any = any,
>(
	fn: FN,
	thisArg?: THIS,
	remaining_args: number = fn.length
): CurryMultiSignature<FN, R, THIS> => {
	return <
		A extends (FN extends BindableFunction<THIS, infer P, any, R> ? P : never),
		B extends (FN extends BindableFunction<THIS, A, infer P, R> ? P : never),
		FN_B extends (B extends never[] ? never : (...args_b: B) => R),
	>(...args_a: A): (
			B extends never[] ?
			R :
			CurryMultiSignature<FN_B, ReturnType<FN_B> & R, THIS>
		) => {
		remaining_args -= args_a.length
		// note that we don't actually bind `fn` to `thisArg`, not until `remaining_args === 0`.
		// this is because then we would be binding `fn` to `thisArg` again and again, on every curried recursive call.
		// it might be more performant to bind `fn` to `thisArg` on only the final execution call, when all parameters have been provided.
		// which is what the `(curried_fn as () => R).call(thisArg) as R` line below does on the final call.
		const curried_fn = fn.bind(undefined as THIS, ...args_a) as FN_B
		return (
			remaining_args <= 0 ?
				(curried_fn as () => R).call(thisArg) as R :
				curryMulti(curried_fn, thisArg, remaining_args)
		) as B extends never[] ? R : CurryMultiSignature<FN_B, ReturnType<FN_B> & R, THIS>
	}
}

/** TODO: */
declare const curryLeft: <T extends any, ARG0 extends any, ARGS extends (ARG0 extends never ? never : any[]) >(fn: (arg0: ARG0, ...args: ARGS) => T) => (ARGS extends never ? ((arg: ARG0) => T) : ((arg: ARG0) => (...args: ARGS) => T))

/** TODO: */
declare const curryRight: <T extends any, ARGN extends any, ARGS extends (ARGN extends never ? never : any[]) >(fn: (...args: ARGS) => T) => ((...args: ARGS) => T)
