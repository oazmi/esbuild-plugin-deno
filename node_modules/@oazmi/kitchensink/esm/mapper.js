/** utility functions for mapping generic arrays and objects (records/dictionaries).
 *
 * to utilize the strict-narrow typing features of this submodule, you will have to write your mapping functions in a certain way.
 * moreover you will need to use `typescript 4.9`'s `satisfies` operator for narrowing the type checker.
 *
 * @module
*/
/** represents an `Object` consisting of a collection of single-parameter functions that map the entries of type `R` to entries of type `U`.
 * however, if `U` does not contain a certain key that's in `R`, then we will assume that it is being mapped to a single default type `D`.
 *
 * to give you an idea, here is a flawed example: (more is covered on the flaw right after)
 *
 * ```ts
 * // here is a scenario where we want to remap game player stats from version `v1` to `v2`,
 * // in addition to wanting to count the number of player name duplications in `NamesTallyDB`.
 *
 * // a record that keeps a tally (value) of the number of occurrences of each name (key)
 * const NamesTallyDB: Record<string, number> = {}
 *
 * // some player's stats in version `v1`
 * const my_stats_v1 = {
 * 	name: "haxxor",
 * 	game: "league of fools and falafel",
 * 	fame: 505,
 * 	tame: false,
 * 	lame: ["yes", 735],
 * }
 *
 * // a collection of functions that maps each entry of a player's stats in `v1` to `v2`.
 * const stats_v1_to_v2: RecordMapper<typeof my_stats_v1> = {
 * 	name: (s) => {
 * 		// `s` is automatically inferred as a `string`, thanks to `typeof my_stats_v1` generic parameter
 * 		NamesTallyDB[s] ??= 0
 * 		const repetitions = NamesTallyDB[s]++
 * 		return [s, repetitions]
 * 	},
 * 	game: (s) => s,
 * 	fame: (v) => v * 1.5,
 * 	tame: (b) => undefined,
 * 	lame: (a) => ({
 * 		current_status: a[0] === "yes" ? true : false,
 * 		bad_reputation_history: [["pre-v2", a[1]], ["original-sin", 5], ]
 * 	})
 * }
 * ```
 *
 * uh oh, did you notice the problem? the IDE thinks that `stats_v1_to_v2` maps each entry of `my_stats_v1` to `unknown`.
 * you must provide a second type parameter that specifies the new type of each entry (which in this context would be `StatsV2`).
 *
 * ```ts ignore
 * type StatsV2 = {
 * 	name: [string, number],
 * 	game: string,
 * 	fame: number,
 * 	tame: undefined,
 * 	lame: {
 * 		current_status: boolean,
 * 		bad_reputation_history: Array<[occasion: string, value: number]>
 * 	}
 * }
 *
 * const stats_v1_to_v2: RecordMapper<typeof my_stats_v1, StatsV2> = {
 * 	// just as before
 * }
 * ```
 *
 * but this is a lot of repetition in typing, and the additional type will be utterly useless if it's not being used elsewhere.
 * luckily, with the introduction of the `satisfies` operator in `tsc 4.9`, you can be far more concise:
 *
 * ```ts
 * // a record that keeps a tally (value) of the number of occurrences of each name (key)
 * const NamesTallyDB: Record<string, number> = {}
 *
 * // some player's stats in version `v1`
 * const my_stats_v1 = {
 * 	name: "haxxor",
 * 	game: "league of fools and falafel",
 * 	fame: 505,
 * 	tame: false,
 * 	lame: ["yes", 735],
 * }
 *
 * // the map function parameters `s`, `v`, `b`, and `a` all have their types automatically inferred thanks to the `satisfies` operator.
 * // `stats_v1_to_v2` now indeed maps the correct `stats_v2` interface, without us having to write out what that interface is.
 * const stats_v1_to_v2: RecordMapper<typeof my_stats_v1> = {
 * 	name: (s) => {
 * 		// `s` is automatically inferred as a `string`, thanks to `typeof my_stats_v1` generic parameter
 * 		NamesTallyDB[s] ??= 0
 * 		const repetitions = NamesTallyDB[s]++
 * 		return [s, repetitions]
 * 	},
 * 	game: (s) => s,
 * 	fame: (v) => v * 1.5,
 * 	tame: (b) => undefined,
 * 	lame: (a) => ({
 * 		current_status: a[0] === "yes" ? true : false,
 * 		bad_reputation_history: [["pre-v2", a[1]], ["original-sin", 5], ]
 * 	})
 * } satisfies RecordMapper<typeof my_stats_v1>
 * ```
 *
 * now, for an example that uses the optional generic type parameter `D` (3rd parameter) for declaring the default output type:
 *
 * ```ts
 * const now_i_know_my = { a: 1, b: 2, c: 3, s: "nein" }
 *
 * const latin_to_greek: RecordMapper<
 * 	typeof now_i_know_my, // these are the inputs that will be mapped
 * 	{ s: number },        // the entry `"s"` will be mapped to a `number`
 * 	string                // all other entries will be mapped to `string`
 * > = {
 * 	a: (v) => `${v}-alpha`,
 * 	b: (v) => `${v}-beta`,
 * 	c: (v) => `${v}-theta`,
 * 	s: (v) => 9,
 * }
 *
 * latin_to_greek satisfies ({
 * 	a: (v: number) => string,
 * 	b: (v: number) => string,
 * 	c: (v: number) => string,
 * 	s: (v: string) => number,
 * })
 * ```
*/
import "./_dnt.polyfills.js";
/** applies the function `mapping_funcs[K]` to input `input_data[K]`, for every key `K in mapping_funcs`.
 *
 * see {@link RecordMapper} to get an understanding of what `mapping_funcs` is supposed to look like, and how to type it.
 * moreover, the 3 generic parameters (`R`, `U`, `D`) used here are the same as the ones at {@link RecordMapper}, so check it out.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const now_i_know_my = { a: 1, b: 2, c: 3, s: "nein" }
 *
 * const now_i_know_my_greek = recordMap({
 * 	a: (v) => `${v}-alpha`,
 * 	b: (v) => `${v}-beta`,
 * 	c: (v) => `${v}-theta`,
 * 	s: (v) => 9,
 * }, now_i_know_my)
 *
 * now_i_know_my_greek satisfies ({ a: string, b: string, c: string, s: number })
 *
 * assertEquals(now_i_know_my_greek, { a: "1-alpha", b: "2-beta", c: "3-theta", s: 9 })
 * ```
*/
export const recordMap = (mapping_funcs, input_data) => {
    const out_data = {};
    for (const k in mapping_funcs) {
        out_data[k] = mapping_funcs[k](input_data[k]);
    }
    //for (const [k, fn] of Object.entries(mapping_funcs) as ([keyof R, F[keyof R]])[]) out_data[k] = fn(input_data[k] as any) as typeof out_data[keyof R]
    return out_data;
};
/** similar to {@link recordMap}, but made for variable number of function argument parameters.
 * also see {@link RecordArgsMapper} to get an understanding of what `mapping_funcs` is supposed to look like, and how to type it.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * type Vec1 = [number]
 * type Vec2 = [number, number]
 * type Vec3 = [number, number, number]
 *
 * const now_i_know_my = {
 * 	a: [1] as Vec1,
 * 	b: [2, 2] as Vec2,
 * 	c: [9, 4, 5] as Vec3,
 * 	s: ["nein" as string, "mein", "fuhrer"] as const
 * }
 *
 * const now_i_know_my_fuhrer = recordArgsMap({
 * 	a: (v0) => v0 ** 2,
 * 	b: (...vs) => vs[0] + vs[1] ** 2,
 * 	c: (v0, v1, v2) => v0 ** 0.5 + v1 + v2 ** 2,
 * 	s: (arg0, ...args) => [arg0 === "nein" ? 9 : arg0, ...args] as const,
 * }, now_i_know_my)
 *
 * now_i_know_my_fuhrer satisfies ({
 * 	a: number, b: number, c: number,
 * 	s: readonly [string | 9, "mein", "fuhrer"],
 * })
 *
 * assertEquals(now_i_know_my_fuhrer, { a: 1, b: 6, c: 32, s: [9, "mein", "fuhrer"] })
 * ```
*/
export const recordArgsMap = (mapping_funcs, input_args) => {
    const out_data = {};
    for (const k in mapping_funcs) {
        out_data[k] = mapping_funcs[k](...input_args[k]);
    }
    return out_data;
};
/** a element mapping function, similar to {@link recordMap}, except that it operates on `Array` indexes instead of string keys.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const vec3 = [1, 2, "halla"] as const
 *
 * const vecc = sequenceMap<typeof vec3, [unknown, unknown, string], boolean>([
 * 	(v) => v + 4 > 0 ? true : false,
 * 	(v) => v + 3 > 100 ? true : false,
 * 	(s) => s === "halla" ? "hello" : "un-greetful",
 * ], vec3)
 *
 * vecc satisfies (readonly [boolean, boolean, string])
 *
 * assertEquals(vecc, [true, false, "hello"])
 * ```
*/
export const sequenceMap = (mapping_funcs, input_data) => {
    const out_data = [], len = mapping_funcs.length;
    for (let i = 0; i < len; i++) {
        out_data.push(mapping_funcs[i](input_data[i]));
    }
    return out_data;
};
/** similar to {@link sequenceMap}, but made for variable number of function argument parameters.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * type Vec1 = [number]
 * type Vec2 = [number, number]
 * type Vec3 = [string, string, string]
 *
 * const vec3 = [
 * 	[1] as Vec1,
 * 	[2, 2] as Vec2,
 * 	["halla", "mein", "fuhrer"] as Vec3,
 * ] as const
 *
 * const vecc = sequenceArgsMap<typeof vec3, [boolean, number, string]>([
 * 	(v0) => v0 + 4 > 0 ? true : false,
 * 	(v0, v1) => v0 + v1**2,
 * 	(s0, ...args) => ([
 * 		(s0 === "halla" ? "hello" : "un-greetful"),
 * 		...args
 * 	].join(" ")),
 * ], vec3)
 *
 * vecc satisfies (readonly [boolean, number, string])
 *
 * assertEquals(vecc, [true, 6, "hello mein fuhrer"])
 * ```
*/
export const sequenceArgsMap = (mapping_funcs, input_args) => {
    const out_data = [], len = mapping_funcs.length;
    for (let i = 0; i < len; i++) {
        out_data.push(mapping_funcs[i](...input_args[i]));
    }
    return out_data;
};
