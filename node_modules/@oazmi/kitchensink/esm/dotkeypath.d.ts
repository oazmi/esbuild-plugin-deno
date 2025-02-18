/** utility functions for querying/traversing a nested object through the use of either:
 * - a dot-separated string query (`dot-path`)
 * - or an array of keys (`key-path`)
 *
 * this submodule is made to be somewhat strictly typed,
 * so you can expect to get type hints when accessing narrowly typed data via `key-path` or `dot-path` get/set functions.
 * think of it as analogous to `xpath` for xml, and `document.querySelector` for html.
 *
 * TODO: consider allowing `getKeyPath` and `setKeyPath` to accept `create_missing: boolean = false` option to create missing intermediate keys/entires
 *
 * @module
*/
import "./_dnt.polyfills.js";
import type { NonSymbolKeys } from "./typedefs.js";
/** get an array of all possible `key-path`s.
 *
 * @example
 * ```ts
 * let data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } } as const
 * let path_to_noice: KeyPathsOf<typeof data> = ["kill", "your", "self", 2, 1, "noice"]
 * ```
*/
export type KeyPathsOf<T> = KeyPathTree<T>[NonSymbolKeys<T>];
type KeyPathTree<T> = {
    [P in NonSymbolKeys<T>]-?: T[P] extends object ? [P] | [P, ...KeyPathsOf<T[P]>] : [P];
};
type SerializableKey = string | number;
/** this is just an alias for `string`, but it's here just to create a distinction between regular strings and `dot-path`s.
 *
 * @example
 * ```ts
 * const
 * 	my_obj = { hello: ["world", { za: "warudo", toki: "wa tomare" }], yare: "yare daze" },
 * 	dotpath_to_the_warudo: DotPath = "hello.1.za",
 * 	dotpath_to_yare_daze: DotPath = "yare"
 * ```
*/
export type DotPath = `${string}.${string}` | string;
/** a `key-path` is an array of one or more string keys (number keys work too).
 * they are not strongly typed with respect to whatever structure you are trying to traverse.
 *
 * TODO: why not also permit `symbol`s? one issue it might raise is the inability to convert a `KeyPath` to a `DotPath`.
 *
 * @example
 * ```ts
 * const data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } }
 * const possible_keypath: KeyPath = ["kill", "your", "self", 2, "1"]
 * ```
*/
export type KeyPath = [SerializableKey, ...(SerializableKey)[]];
/** get the `leaf-key` of a `dot-path` (ie: end point).
 *
 * @example
 * ```ts
 * let leaf_key: DotPathLeaf<"kill.your.self"> = "self"           // correct assignment
 * // @ts-ignore
 * let incorrect_leaf_key: DotPathLeaf<"kill.your.self"> = "your" // typescript error
 * ```
*/
export type DotPathLeaf<DP extends DotPath> = DP extends `${string}.${infer K}` ? DotPathLeaf<K> : DP;
/** get the `parent-key` `dot-path` of a `dot-path`.
 * but if there's no parent key, then the key itself is returned.
 *
 * @example
 * ```ts
 * let dotpath0: DotPathParent<"kill.your.self.once"> = "kill.your.self"
 * let dotpath1: DotPathParent<typeof dotpath0> = "kill.your"
 * let dotpath2: DotPathParent<typeof dotpath1> = "kill"
 * let dotpath3: DotPathParent<typeof dotpath2> = "kill"
 * ```
*/
export type DotPathParent<DP extends DotPath> = DP extends `${infer P}.${DotPathLeaf<DP>}` ? P : DP;
/** convert `dot-path` to an array of `key-path` in the format compliant with the type {@link KeyPathsOf}.
 *
 * @example
 * ```ts
 * const
 * 	data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } },
 * 	dotpath_to_noice = "kill.your.self.2.1.noice",
 * 	keypath_to_noice:
 * 		DotPathToKeyPath<typeof dotpath_to_noice> & KeyPathsOf<typeof data>
 * 		= ["kill", "your", "self", "2", "1", "noice"]
 * ```
*/
export type DotPathToKeyPath<DP extends DotPath> = DP extends `${infer P}.${DotPathLeaf<DP>}` ? [...DotPathToKeyPath<P>, DotPathLeaf<DP>] : [DP];
/** get the type of nested data through the use of a dot-path.
 *
 * @example
 * ```ts
 * const
 * 	data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } } as const,
 * 	dotpath_to_noice_parent = "kill.your.self.2.1",
 * 	noice_parent:
 * 		DotPathValue<typeof data, typeof dotpath_to_noice_parent>
 * 		= { noice: "YAHAHA", 0: "you found me!" }
 * ```
*/
export type DotPathValue<T extends {
    [key: string]: any;
}, DP extends DotPath> = DP extends `${infer P}.${infer C}` ? DotPathValue<T[P], C> : T[DP];
/** get the type of nested data through the use of an array of key-path.
 *
 * @example
 * ```ts
 * const
 * 	data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } } as const,
 * 	keypath_to_noice_parent: ["kill", "your", "self", 2, 1] = ["kill", "your", "self", 2, 1],
 * 	noice_parent:
 * 		KeyPathValue<typeof data, typeof keypath_to_noice_parent>
 * 		= { noice: "YAHAHA", 0: "you found me!" }
 * ```
*/
export type KeyPathValue<T extends {
    [key: (SerializableKey)]: any;
}, KP extends KeyPath> = (KP extends [KP[0], ...infer R] ? (R extends KeyPath ? KeyPathValue<T[KP[0]], R> : T[KP[0]]) : unknown);
/** get value of nested `obj` at a given `key-path`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } } as const
 *
 * // weakly typed variant
 * const
 * 	keypath_to_noice_parent = ["kill", "your", "self", 2, 1], // note: adding `as const` will not make it strongly typed because of a limitation/bug in `KeyPathsOf`
 * 	noice_parent = getKeyPath(data, keypath_to_noice_parent)  // type: `unknown`
 *
 * assertEquals(noice_parent, { noice: "YAHAHA", 0: "you found me!" })
 *
 * // strongly typed variant
 * const
 * 	strong_keypath_to_noice_parent: ["kill", "your", "self", 2, 1] = ["kill", "your", "self", 2, 1],
 * 	strong_noice_parent: { noice: "YAHAHA", 0: "you found me!" } = getKeyPath(data, strong_keypath_to_noice_parent)
 *
 * assertEquals(strong_noice_parent, { noice: "YAHAHA", 0: "you found me!" })
 * ```
*/
export declare const getKeyPath: <T extends object = object, KP = KeyPathsOf<T>>(obj: T, kpath: KP) => KeyPathValue<T, KP>;
/** set the value of nested `obj` at a given `key-path`, and then returns the object back.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } } as const
 *
 * // weakly typed variant
 * // note: adding `as const` will not make it strongly typed because of a limitation/bug in `KeyPathsOf`
 * const keypath_to_yahaha = ["kill", "your", "self", 2, 1, "noice"]
 * setKeyPath(data, keypath_to_yahaha, "YEEEE")
 *
 * assertEquals(getKeyPath(data, keypath_to_yahaha), "YEEEE")
 *
 * // strongly typed variant
 * const strong_keypath_to_yahaha: ["kill", "your", "self", 2, 1, "noice"] = ["kill", "your", "self", 2, 1, "noice"]
 * // @ts-ignore: since `data` is declared as `const`, we cannot technically assign the value `"YOSHIII"` to the original `"YAHAHA"`.
 * setKeyPath(data, strong_keypath_to_yahaha, "YOSHIII")
 *
 * assertEquals(getKeyPath(data, strong_keypath_to_yahaha), "YOSHIII")
 * ```
*/
export declare const setKeyPath: <T extends object = object, KP = KeyPathsOf<T>>(obj: T, kpath: KP, value: KeyPathValue<T, KP>) => T;
/** similar to {@link bindDotPathTo}, but for `key-path`s. */
export declare const bindKeyPathTo: (bind_to: object) => [get: <KP extends KeyPath>(kpath: KP) => KeyPathValue<typeof bind_to, KP>, set: <KP extends KeyPath>(kpath: KP, value: KeyPathValue<typeof bind_to, KP>) => typeof bind_to];
/** convert a `dot-path` to `key-path`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	my_dotpath = "kill.your.self.2abc.1.tasukete",
 * 	my_keypath = dotPathToKeyPath(my_dotpath)
 *
 * assertEquals(my_keypath, ["kill", "your", "self", "2abc", 1, "tasukete"])
 * ```
*/
export declare const dotPathToKeyPath: <DP extends DotPath>(dpath: DP) => DotPathToKeyPath<DP>;
/** get value of nested `obj` at a given `dot-path`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } },
 * 	dotpath_to_noice_parent = "kill.your.self.2.1"
 *
 * assertEquals(getDotPath(data, dotpath_to_noice_parent), { noice: "YAHAHA", 0: "you found me!" })
 * ```
*/
export declare const getDotPath: <T extends object = object, DP extends DotPath = string>(obj: T, dpath: DP) => DotPathValue<T, DP>;
/** set the value of nested `obj` at a given `dot-path`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } },
 * 	dotpath_to_yahaha = "kill.your.self.2.1.noice"
 *
 * setDotPath(data, dotpath_to_yahaha, "REEE")
 *
 * assertEquals(getDotPath(data, dotpath_to_yahaha), "REEE")
 * ```
*/
export declare const setDotPath: <T extends object = object, DP extends DotPath = string>(obj: T, dpath: DP, value: DotPathValue<T, DP>) => T;
/** generate a `dot-path` getter and setter for a specific object given by `bind_to`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	data = { kill: { your: { self: [0, 1, { 0: 0, 1: { noice: "YAHAHA", 0: "you found me!" } }] } } },
 * 	[getData, setData] = bindDotPathTo(data)
 *
 * assertEquals(getData("kill.your.self.2.1"), {0: "you found me!", noice: "YAHAHA"})
 *
 * setData("kill.your.self.2.1.noice", ["arr", "ree", "eek"])
 *
 * assertEquals(getData("kill.your.self.2.1"), {0: "you found me!", noice: ["arr", "ree", "eek"]})
 * ```
*/
export declare const bindDotPathTo: (bind_to: object) => [get: <DP extends DotPath>(dpath: DP) => DotPathValue<typeof bind_to, DP>, set: <DP extends DotPath>(dpath: DP, value: DotPathValue<typeof bind_to, DP>) => typeof bind_to];
export {};
//# sourceMappingURL=dotkeypath.d.ts.map