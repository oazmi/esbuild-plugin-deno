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
import { number_parseInt } from "./alias.js";
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
// @ts-expect-error: `KP` is not bound to extend `KeyPath`, which in turn breaks `KeyPathValue<T, KP>` (due to its unboundedness).
export const getKeyPath = (obj, kpath) => {
    let value = obj;
    for (const k of kpath) {
        value = value[k];
    }
    return value;
};
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
// @ts-expect-error: `KP` is not bound to extend `KeyPath`, which in turn breaks `KeyPathValue<T, KP>` (due to its unboundedness).
export const setKeyPath = (obj, kpath, value) => {
    const child_key = kpath.pop(), parent = getKeyPath(obj, kpath);
    kpath.push(child_key);
    parent[child_key] = value;
    return obj;
};
/** similar to {@link bindDotPathTo}, but for `key-path`s. */
export const bindKeyPathTo = (bind_to) => ([
    (kpath) => getKeyPath(bind_to, kpath),
    (kpath, value) => setKeyPath(bind_to, kpath, value)
]);
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
export const dotPathToKeyPath = (dpath) => dpath
    .split(".")
    .map((key) => (
// the reason why we explicitly check if the value is finite before parsing as an integer,
// is because there are cases where `parseInt` would produce a finite number out of an incorrect string.
// for instance: `parseInt("20abc") === 20` (one would expect it to be `NaN`, but it isn't).
// however, `isFinite` solves this by _only_ being truthy when its input is purely numerical.
// in other words: `isFinite("20abc") === false` (just as one would expect).
// one more thing: notice that we use `globalThis.isFinite` instead of `Number.isFinite`. this is because the two are apparently not the same.
// `globalThis.isFinite` is capable of parsing string inputs, while `Number.isFinite` strictly takes numeric inputs, and will return a false on string inputs.
// you can verify it yourself: `Number.isFinite !== globalThis.isFinite`, but `Number.parseInt === globalThis.parseInt`, and `Number.parseFloat === globalThis.parseFloat`.
isFinite(key) ? number_parseInt(key) : key));
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
export const getDotPath = (obj, dpath) => getKeyPath(obj, dotPathToKeyPath(dpath));
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
export const setDotPath = (obj, dpath, value) => setKeyPath(obj, dotPathToKeyPath(dpath), value);
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
export const bindDotPathTo = (bind_to) => ([
    (dpath) => getDotPath(bind_to, dpath),
    (dpath, value) => setDotPath(bind_to, dpath, value)
]);
