/** utility functions for common number manipulation functions.
 * 
 * these functions go nicely with the {@link "mapper"} and {@link "lambdacalc"} submodules.
 * 
 * @module
*/

import { math_round, number_MAX_VALUE } from "./alias.js"
import type { abs } from "./numericarray.js"
import type { UnitInterval } from "./typedefs.js"


/** clamp a `number` to inclusive `min` and `max` intervals.
 * 
 * you can also provide a type alias for the output interval `OutInterval` number through the use of the generic parameter.
 * 
 * @param value value to clamp
 * @param min inclusive minimum of the interval
 * @param max inclusive maximum of the interval
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(clamp(-5, -1, 10), -1)
 * assertEquals(clamp(5, -1, 10),  5)
 * assertEquals(clamp(15, -1, 10), 10)
 * ```
*/
export const clamp = <
	OutInterval extends number = number
>(
	value: number,
	min: OutInterval = -number_MAX_VALUE as OutInterval,
	max: OutInterval = number_MAX_VALUE as OutInterval,
): OutInterval => (value < min ? min : value > max ? max : value) as OutInterval

/** get the mathematical modulo: `value` **mod** `mod`.
 * 
 * **modulo** is different from javascript's `%` **remainder** operator in that the **modulo** operation always returns a positive number.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(modulo( 5, 3), 2)
 * assertEquals(modulo(-5, 3), 1)
 * assertEquals(modulo(-4, 3), 2)
 * assertEquals(modulo(-3, 3), 0)
 * assertEquals( 5 % 3,  2)
 * assertEquals(-5 % 3, -2)
 * assertEquals(-4 % 3, -1)
 * assertEquals(-3 % 3, -0)
 * ```
*/
export const modulo = (value: number, mod: number) => (((value % mod) + mod) % mod)

/** get the linearly interpolated value between two scalar points `x0` and `x1`, decided by unit interval time `t`.
 * 
 * in other words:
 * - `lerp(x0, x1, 0.0) === x0`
 * - `lerp(x0, x1, 1.0) === x1`
 * - `x0 < lerp(x0, x1, t > 0.0 && t < 1.0) < x1`
 * 
 * > [!note]
 * > this lerp function does not clamp the time parameter `t` to the closed {@link UnitInterval} `[0.0, 1.0]`.
 * > to ensure clamping of `t` to the unit interval, use the {@link lerpClamped} function.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(lerp( 0, 100,  0.5),  50)
 * assertEquals(lerp(50, 100,  0.5),  75)
 * assertEquals(lerp(50, 100,  0.0),  50)
 * assertEquals(lerp(50, 100,  1.0), 100)
 * assertEquals(lerp(50, 100,  1.5), 125)
 * assertEquals(lerp(50, 100, -0.5),  25)
 * assertEquals(lerp(50, 100, -1.0),   0)
 * assertEquals(lerp(50, 100, -2.5), -75)
 * ```
*/
export const lerp = (x0: number, x1: number, t: UnitInterval) => (t * (x1 - x0) + x0)

/** same as {@link lerp}, except the time `t` is Clamped to the closed {@link UnitInterval} `[0.0, 1.0]`. */
export const lerpClamped = (x0: number, x1: number, t: UnitInterval) => ((t < 0 ? 0 : t > 1 ? 1 : t) * (x1 - x0) + x0)

/** get the {@link lerp} interpolation of the `i`th dimension of two array vector points `v0` and `v1`, at time `t`.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(lerpi([ 0, 40], [100, 80],  0.5, 0),  50)
 * assertEquals(lerpi([ 0, 40], [100, 80],  0.5, 1),  60)
 * assertEquals(lerpi([50, 40], [100, 80],  0.5, 0),  75)
 * assertEquals(lerpi([50, 40], [100, 80],  0.0, 0),  50)
 * assertEquals(lerpi([50, 40], [100, 80],  1.0, 0), 100)
 * assertEquals(lerpi([50, 40], [100, 80],  1.5, 0), 125)
 * assertEquals(lerpi([50, 40], [100, 80], -0.5, 0),  25)
 * assertEquals(lerpi([50, 40], [100, 80], -1.0, 0),   0)
 * assertEquals(lerpi([50, 40], [100, 80], -2.5, 0), -75)
 * ```
*/
export const lerpi = <Vec extends number[] = number[]>(v0: Vec, v1: Vec, t: UnitInterval, i: number): number => (t * (v1[i] - v0[i]) + v0[i])

/** get the {@link lerpClamped} interpolation of the `i`th dimension of two array vector points `v0` and `v1`, at time `t`. */
export const lerpiClamped = <Vec extends number[] = number[]>(v0: Vec, v1: Vec, t: UnitInterval, i: number): number => (t < 0 ? 0 : t > 1 ? 1 : t) * (v1[i] - v0[i]) + v0[i]

/** get the {@link lerp} interpolation vector between two array vector points `v0` and `v1`, at time `t`.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(lerpv([ 0, 40], [100, 80],  0.5), [ 50,  60])
 * assertEquals(lerpv([50,  0], [100, 80],  0.5), [ 75,  40])
 * assertEquals(lerpv([50, 40], [100, 80],  0.0), [ 50,  40])
 * assertEquals(lerpv([50, 40], [100, 80],  1.0), [100,  80])
 * assertEquals(lerpv([50, 40], [100, 80],  1.5), [125, 100])
 * assertEquals(lerpv([50, 40], [100, 80], -0.5), [ 25,  20])
 * assertEquals(lerpv([50, 40], [100, 80], -1.0), [  0,   0])
 * assertEquals(lerpv([50, 40], [100, 80], -2.5), [-75, -60])
 * assertEquals(lerpv(
 * 	[   0,  10, 100, 1000],
 * 	[1000, 100,  10,    0],
 * 	0.25,
 * ), [250, 32.5, 77.5, 750])
 * ```
*/
export const lerpv = <Vec extends number[] = number[]>(v0: Vec, v1: Vec, t: UnitInterval): Vec => {
	const
		len = v0.length,
		v: Vec = Array(len).fill(0) as Vec
	for (let i = 0; i < len; i++) { v[i] = t * (v1[i] - v0[i]) + v0[i] }
	return v
}

/** get the {@link lerpClamped} interpolation vector between two array vector points `v0` and `v1`, at time `t`. */
export const lerpvClamped = <Vec extends number[] = number[]>(v0: Vec, v1: Vec, t: UnitInterval): Vec => lerpv<Vec>(v0, v1, t < 0 ? 0 : t > 1 ? 1 : t)

/** get the inverse of the interpolation {@link lerp}`(x0, x1, t)`, which is to say:
 * find the {@link UnitInterval} parameter `t`, given a scalar number `x` in the closed interval `[x0, x1]`.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(invlerp( 0, 100,   50),  0.5)
 * assertEquals(invlerp(50, 100,   75),  0.5)
 * assertEquals(invlerp(50, 100,   50),  0.0)
 * assertEquals(invlerp(50, 100,  100),  1.0)
 * assertEquals(invlerp(50, 100,  125),  1.5)
 * assertEquals(invlerp(50, 100,   25), -0.5)
 * assertEquals(invlerp(50, 100,    0), -1.0)
 * assertEquals(invlerp(50, 100,  -75), -2.5)
 * ```
*/
export const invlerp = (x0: number, x1: number, x: number): UnitInterval => ((x - x0) / (x1 - x0))

/** same as {@link invlerp}, except that we force clamp the output {@link UnitInterval} `t` to the closed interval `[0, 1]`. */
export const invlerpClamped = (x0: number, x1: number, x: number): UnitInterval => {
	const t = (x - x0) / (x1 - x0)
	return t < 0 ? 0 : t > 1 ? 1 : t
}

/** get the {@link invlerp} (inverse interpolation) of the `i`th dimension of two vector point intervals `v0` and `v1`, at vector position `v`. */
export const invlerpi = <Vec extends number[] = number[]>(v0: Vec, v1: Vec, v: Vec, i: number): UnitInterval => (v[i] - v0[i]) / (v1[i] - v0[i])

/** get the {@link invlerpClamped} of the `i`th dimension of two array vector point intervals `v0` and `v1`, at vector position `v`. */
export const invlerpiClamped = <Vec extends number[] = number[]>(v0: Vec, v1: Vec, v: Vec, i: number): UnitInterval => {
	const t = (v[i] - v0[i]) / (v1[i] - v0[i])
	return t < 0 ? 0 : t > 1 ? 1 : t
}

/** `limp` is a made up abbreviation for _linear interval map_, which linearly maps:
 * - a scalar value `x0`, that's in a
 * - scalar interval `u0: [min: number, max: number]` to
 * - a scalar output return value `x1`, that's in the
 * - scalar interval `u1: [min: number, max: number]`
 * 
 * the math equation is simply `x1 = u1[0] + (x - u0[0]) * (u1[1] - u1[0]) / (u0[1] - u0[0])`.
 * which is basically doing inverse_lerp on `x0` to find `t`, then applying lerp onto interval `u1` with the found `t`.
 * 
 * you may think of this function as a means for finding the "y-coordinate" (`x1`) of a point at the "x-coordinate" `x0`,
 * that is between two connected line segment points `(u0[0], u1[0])` and `(u0[1], u1[1])`.
*/
export const limp = (u0: [min: number, max: number], u1: [min: number, max: number], x0: number): number => (u1[0] + (x0 - u0[0]) * (u1[1] - u1[0]) / (u0[1] - u0[0]))

/** same as {@link limp}, except the output `x1` is force clamped to the interval `u1`. */
export const limpClamped = (u0: [min: number, max: number], u1: [min: number, max: number], x0: number): number => {
	const t = (x0 - u0[0]) / (u0[1] - u0[0])
	return (t < 0 ? 0 : t > 1 ? 1 : t) * (u1[1] - u1[0]) + u1[0]
}

/** sum up an array of numbers.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(sum([0, 1, 2, 3, 4]),  10)
 * assertEquals(sum([-11, 7, 5, -8]),  -7)
 * ```
*/
export const sum = (values: number[]): number => {
	let
		total = 0,
		len = values.length
	for (let i = 0; i < len; i++) { total += values[i] }
	return total
}

/** get the minimum between two numbers.
 * 
 * this function is faster than `Math.min` as it uses the ternary conditional operator, which makes it highly JIT optimized.
*/
export const min = (v0: number, v1: number) => (v0 < v1 ? v0 : v1)

/** get the maximum between two numbers.
 * 
 * this function is faster than `Math.max` as it uses the ternary conditional operator, which makes it highly JIT optimized.
*/
export const max = (v0: number, v1: number) => (v0 > v1 ? v0 : v1)

/** get the sign of a number. you'll get a `1` for positive numbers (or zero), and `-1` otherwise.
 * 
 * this function is faster than `Math.sign` as it uses the ternary conditional operator, which makes it highly JIT optimized.
*/
export const sign = (value: number): (1 | -1) => (value >= 0 ? 1 : -1)

/** get the absolute positive value of a number.
 * 
 * this function is faster than `Math.abs` as it uses the ternary conditional operator, which makes it highly JIT optimized.
 * 
 * the reason why we don't call this function `abs` is because one such function already exists in the numericarray submodule ({@link abs}).
*/
export const absolute = (value: number): number => ((value >= 0 ? 1 : -1) * value)

/** round a float number to a certain precision, so that floating floating-point arithmetic inaccuracies can be nullified.
 * 
 * the way it works is by multiplying the initial `value` by a large number, so that it is at least a whole number,
 * and then we round it to the closest integer value with `Math.round`,
 * and finally we follow it up with a division by the very same old large number.
 * 
 * @param value the floating number to round.
 * @param precision an integer dictating the number of decimal points to which the `value` should be rounded to.
 *   you may use negative integer for rounding to `10s`, `100s`, etc..., or use a value of `0` for rounding to nearest integer.
 *   also, you would want to the `precision` to be less than the number of decimal digits representable by your js-runtime's floating-point.
 *   so for 64-bit runtime (double), the max precision limit is `15`, and for a 32-bit runtime (single), the limit is `7`.
 *   picking a precision that is higher than your runtime's limit will result in even worse value rounding than your original `value`.
 *   defaults to `9` (i.e. rounds to closest nano-number (10**(-9))).
 * @returns the float number rounded to the given precision.
 * 
 * @examples
 * ```ts
 * import { assert } from "jsr:@std/assert"
 * 
 * // aliasing our function for brevity
 * const fn = roundFloat
 *  
 * // notice that due to floating inaccuracy `0.2 + 0.4` equals to `0.6000000000000001` instead of `0.6`
 * assert((0.2 + 0.4) !== 0.6)
 * assert((0.2 + 0.4) === 0.6000000000000001)
 * 
 * // so, it is often desirable to round the resulting number to some precision to negate this slight deviation.
 * assert(fn(0.2 + 0.4) === 0.6)
 * 
 * // you can also provide a custom precision with the second parameter
 * assert(fn(123.456789,  2) === 123.46) // rounding to  2 decimal places
 * assert(fn(123.456789,  1) === 123.5)  // rounding to  1 decimal places
 * assert(fn(123.456789,  0) === 123)    // rounding to  0 decimal places (i.e. closest integer)
 * assert(fn(123.456789, -1) === 120)    // rounding to -1 decimal places (i.e. closest 10s)
 * assert(fn(123.456789, -2) === 100)    // rounding to -2 decimal places (i.e. closest 100s)
 * 
 * // other examples:
 * assert(  (0.2 - 0.7) === -0.49999999999999994)
 * assert(fn(0.2 - 0.7) === -0.5)
 * assert(  (0.2 * 3.0) === 0.6000000000000001)
 * assert(fn(0.2 * 3.0) === 0.6)
 * ```
*/
export const roundFloat = (value: number, precision: number = 9): number => {
	const large_number = 10 ** precision
	return math_round((value * large_number)) / large_number
}
