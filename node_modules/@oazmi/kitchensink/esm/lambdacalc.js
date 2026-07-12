/** utility functions for numeric array manipulation through lambda calculus (aka higher order functions, or `HOF` for short)
 *
 * many functions in the {@link "numericarray"} module can be recreated here with a much smaller minified-size footprint.
 * naturally, this comes at a performance cost of around 5 times when dealing with complex equation with many parameters.
 * however, when dealing with simple computations and few parameters (such as the addition of two arrays),
 * lambdacalc functions are exactly as fast as their `for...loop` counterparts, despite the abstraction.
 * this is all thanks to modren JIT.
 *
 * check out my benchmarks if you're not convinced: (whom am I even speaking to besides myself? go commit seppuku concurrently)
 * - benchmark for abstracting arithmetics as a function then applying it over a loop (aka vectorization):
 *   - [https://gist.github.com/omar-azmi/27295d0e2b0116ccdbdf42e04ea51103](https://gist.github.com/omar-azmi/27295d0e2b0116ccdbdf42e04ea51103)
 * - benchmark for testing different vectorization techniques against fastest possible `for...loop` computation:
 *   - [https://gist.github.com/omar-azmi/52795febf5789b6e8c9033afb703bba0](https://gist.github.com/omar-azmi/52795febf5789b6e8c9033afb703bba0)
 *
 * @module
*/
/** vectorize a zero parameter function.
 *
 * @example
 * ```ts
 * import {
 * 	assertLessOrEqual as assertLe,
 * 	assertGreaterOrEqual as assertGe,
 * } from "jsr:@std/assert"
 *
 * const rand = () => 100 * Math.random()
 * const arr = new Float32Array(10_000)
 *
 * vectorize0(rand, arr) // `arr` is now filled with random numbers ranging from `0.0` to `100.0`
 *
 * const average_of_arr = arr.reduce((cumulative_sum, value) => (cumulative_sum + value), 0) / arr.length
 * assertLe(average_of_arr, 60.0)
 * assertGe(average_of_arr, 40.0)
 * ```
 *
 * despite being a simple operation with no inputs, this still performs 4 times quicker than `array.map`,
 * probably due to the fact that `array.map` passes three arguments.
*/
export const vectorize0 = (map_func, write_to) => {
    for (let i = 0; i < write_to.length; i++) {
        write_to[i] = map_func();
    }
};
/** vectorize a one parameter function.
 *
 * @example
 * ```ts
 * import {
 * 	assertLessOrEqual as assertLe,
 * 	assertGreaterOrEqual as assertGe,
 * } from "jsr:@std/assert"
 *
 * const abs = (v: number): number => (v >= 0 ? v : -v)
 * const arr = new Float32Array(10_000).map(() => 100 * (Math.random() - 0.5))
 *
 * vectorize1(abs, arr, arr) // `arr` is now filled with absolute valued random numbers
 *
 * const average_of_arr = arr.reduce((cumulative_sum, value) => (cumulative_sum + value), 0) / arr.length
 * assertLe(average_of_arr, 30.0)
 * assertGe(average_of_arr, 20.0)
 * ```
*/
export const vectorize1 = (map_func, write_to, arr1) => {
    for (let i = 0; i < write_to.length; i++) {
        write_to[i] = map_func(arr1[i]);
    }
};
/** vectorize a two parameter function.
 *
 * @example
 * ```ts
 * const mult = (v1: number, v2: number): number => (v1 * v2)
 * const arr1 = new Float32Array(10_000).map(() => 123 * (Math.random() - 0.5))
 * const arr2 = new Float32Array(10_000).map(() => 321 * (Math.random() - 0.5))
 * const arr = new Float32Array(10_000)
 *
 * vectorize2(mult, arr, arr1, arr2) // `arr` is now filled with products of two random numbers
 * ```
*/
export const vectorize2 = (map_func, write_to, arr1, arr2) => {
    for (let i = 0; i < write_to.length; i++) {
        write_to[i] = map_func(arr1[i], arr2[i]);
    }
};
/** vectorize a three parameter function.
 *
 * @example
 * ```ts
 * const linear = (x: number, a: number, b: number) => (a * x + b)
 * const arrX = new Float32Array(10_000).map(() => 123 * (Math.random() - 0.5))
 * const arrA = new Float32Array(10_000).map(() => 321 * (Math.random() - 0.5))
 * const arrB = new Float32Array(10_000).fill(42)
 * const arr = new Float32Array(10_000)
 *
 * vectorize3(linear, arr, arrX, arrA, arrB)
 * ```
*/
export const vectorize3 = (map_func, write_to, arr1, arr2, arr3) => {
    for (let i = 0; i < write_to.length; i++) {
        write_to[i] = map_func(arr1[i], arr2[i], arr3[i]);
    }
};
/** vectorize a four parameter function.
 *
 * see {@link vectorize3} for lower parameter case.
*/
export const vectorize4 = (map_func, write_to, arr1, arr2, arr3, arr4) => {
    for (let i = 0; i < write_to.length; i++) {
        write_to[i] = map_func(arr1[i], arr2[i], arr3[i], arr4[i]);
    }
};
/** vectorize a five parameter function.
 *
 * see {@link vectorize4} for lower parameter case.
*/
export const vectorize5 = (map_func, write_to, arr1, arr2, arr3, arr4, arr5) => {
    for (let i = 0; i < write_to.length; i++) {
        write_to[i] = map_func(arr1[i], arr2[i], arr3[i], arr4[i], arr5[i]);
    }
};
/** this is a {@link Vectorizer} for a `map_func` function with arbitrary number of input parameters.
 *
 * due to its generalization, it is nearly 40 times slower than the numbered vectorized functions: {@link vectorize0} to {@link vectorize5}.
*/
export const vectorizeN = (map_func, write_to, ...arrs) => {
    const param_length = arrs.length;
    const params = Array(param_length).fill(0);
    for (let i = 0; i < write_to.length; i++) {
        for (let p = 0; p < param_length; p++) {
            params[p] = arrs[p][i];
        }
        write_to[i] = map_func(...params);
    }
};
/** TODO: needs better documentation.
 *
 * @example
 * ```ts ignore
 * declare const
 * 	arrA: number[],
 * 	arrB: number[],
 * 	arrC: number[],
 * 	arrD: number[],
 * 	arrE: number[],
 * 	arr: number[]
 *
 * const
 * 	add2_fromindex_HOF:  IndexNumericMapFunc<2> = (a1, a2)             => (i) => (a1[i] + a2[i]),
 * 	poly4_fromindex_HOF: IndexNumericMapFunc<4> = (a1, a2, a3, a4)     => (i) => (a1[i] + a2[i] ** (3 / 2) + a3[i] ** (4 / 3) + a4[i] ** (5 / 4)),
 * 	add5_fromindex_HOF:  IndexNumericMapFunc<5> = (a1, a2, a3, a4, a5) => (i) => (a1[i] + a2[i] + a3[i] + a4[i] + a5[i])
 *
 * vectorizeIndexHOF(add2_fromindex_HOF, arrC, arrA, arrB)
 * vectorizeIndexHOF(poly4_fromindex_HOF, arrE, arrA, arrB, arrC, arrD)
 * vectorizeIndexHOF(add5_fromindex_HOF, arr, arrA, arrB, arrC, arrD, arrE)
 * ```
 *
 * ### Issue
 *
 * the original code's type annotations causes `deno_v1.35.3` to crash due to out-of-memory.
 *
 * this did not happen back in `deno_v1.32.1`, so I'll leave the original code below.
 * but the actual source code has been dumbed down in order to prevent deno LSP from crashing.
 *
 * ```ts ignore
 * export const vectorizeIndexHOF = <
 * 	ParamLength extends number,
 * 	A extends NumericArray = any
 * >(
 * 	index_map_func_hof: IndexNumericMapFunc<ParamLength>,
 * 	write_to: A,
 * 	...input_arrs: ArrayFixedLength<NumericArray, ParamLength>
 * ): void => {
 * 	const map_func_index = index_map_func_hof(...input_arrs)
 * 	for (let i = 0; i < write_to.length; i++) write_to[i] = map_func_index(i)
 * }
 * ```
*/
export const vectorizeIndexHOF = (index_map_func_hof, // IndexNumericMapFunc<ParamLength>,
write_to, ...input_arrs) => {
    const map_func_index = index_map_func_hof(...input_arrs);
    for (let i = 0; i < write_to.length; i++) {
        write_to[i] = map_func_index(i);
    }
};
