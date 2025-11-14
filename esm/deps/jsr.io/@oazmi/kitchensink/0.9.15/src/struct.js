/** utility functions for common object structures and `Object` manipulation.
 *
 * @module
*/
import { array_isArray, object_defineProperty, object_getOwnPropertyDescriptor, object_getOwnPropertyNames, object_getOwnPropertySymbols, object_getPrototypeOf } from "./alias.js";
import { resolveRange } from "./array1d.js";
import { max } from "./numericmethods.js";
/** get an equivalent rectangle where the `height` and `width` are positive.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	my_rect: Rect = { x: -20, y: 100, width: 50, height: -30 },
 * 	my_abs_rect = positiveRect(my_rect)
 *
 * assertEquals(my_abs_rect, {
 * 	x: -20,
 * 	y: 70,
 * 	width: 50,
 * 	height: 30,
 * })
 * ```
*/
export const positiveRect = (r) => {
    let { x, y, width, height } = r;
    if (width < 0) {
        width *= -1; // width is now positive
        x -= width; // x has been moved further to the left
    }
    if (height < 0) {
        height *= -1; // height is now positive
        y -= height; // y has been moved further to the top
    }
    return { x, y, width, height };
};
/** get the constructor of a class's instance.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * class K { constructor(public value: any) { } }
 *
 * const a = new K(1)
 * const b = new (constructorOf(a))(2) // equivalent to `const b = new K(2)`
 *
 * a satisfies K
 * b satisfies K
 * assertEquals(a !== b, true)
 * ```
*/
export const constructorOf = (class_instance) => {
    return object_getPrototypeOf(class_instance).constructor;
};
/** use the constructor of a class's instance to construct a new instance.
 *
 * this is useful for avoiding pollution of code with `new` keyword along with some wonky placement of braces to make your code work.
 *
 * @example
 * ```ts
 * class K {
 * 	value: number
 *
 * 	constructor(value1: number, value2: number) {
 * 		this.value = value1 + value2
 * 	}
 * }
 *
 * const a = new K(1, 1)
 * const b = constructFrom(a, 2, 2) // equivalent to `const b = new K(2, 2)`
 *
 * // vanilla way of constructing `const c = new K(3, 3)` using `a`
 * const c = new (Object.getPrototypeOf(a).constructor)(3, 3)
 *
 * a satisfies K
 * b satisfies K
 * c satisfies K
 * ```
*/
export const constructFrom = (class_instance, ...args) => {
    return new (constructorOf(class_instance))(...args);
};
/** get the prototype object of a class.
 *
 * this is useful when you want to access bound-methods of an instance of a class, such as the ones declared as:
 *
 * ```ts ignore
 * class X {
 * 	methodOfProto() { }
 * }
 * ```
 *
 * these bound methods are not available via destructure of an instance, because they then lose their `this` context.
 * the only functions that can be destructured without losing their `this` context are the ones declared via assignment:
 *
 * ```ts ignore
 * class X {
 * 	fn = () => { }
 * 	fn2 = function () { }
 * }
 * ```
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	array_proto = prototypeOfClass(Array<number>),
 * 	arr = [1, 2, 3, 4, 5]
 *
 * array_proto.push.call(arr, 6)
 * assertEquals(arr, [1, 2, 3, 4, 5, 6])
 *
 * const slow_push_to_arr = (...values: number[]) => (arr.push(...values))
 * // the following declaration is more performant than `slow_push_to_arr`,
 * // and it also has lower memory footprint.
 * const fast_push_to_arr = array_proto.push.bind(arr)
 *
 * slow_push_to_arr(7, 8)  // sloww & bigg
 * fast_push_to_arr(9, 10) // quicc & smol
 * assertEquals(arr, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
 * ```
*/
export const prototypeOfClass = (cls) => {
    return cls.prototype;
};
/** get the prototype chain of an object, with optional slicing options.
 *
 * @param obj the object whose prototype chain is to be found.
 * @param config optional configuration for slicing the full prototype chain.
 * @returns the sliced prototype chain of the given object.
 *
 * @example
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = prototypeChainOfObject,
 * 	eq = assertEquals
 *
 * class A extends Array { }
 * class B extends A { }
 * class C extends B { }
 * class D extends C { }
 *
 * const
 * 	a = new A(0),
 * 	b = new B(0),
 * 	c = new C(0),
 * 	d = new D(0)
 *
 * eq(fn(d), [D.prototype, C.prototype, B.prototype, A.prototype, Array.prototype, Object.prototype, null])
 * eq(fn(b), [B.prototype, A.prototype, Array.prototype, Object.prototype, null])
 *
 * // slicing the prototype chain, starting from index 2 till the end
 * eq(fn(d, { start: 2 }), [B.prototype, A.prototype, Array.prototype, Object.prototype, null])
 *
 * // slicing using a negative index
 * eq(fn(d, { start: -2 }), [Object.prototype, null])
 *
 * // slicing using an object
 * eq(fn(d, { start: B.prototype }), [B.prototype, A.prototype, Array.prototype, Object.prototype, null])
 *
 * // when the slicing object is not found, the start index will be assumed to be `0` (default value)
 * eq(fn(d, { start: Set.prototype }), [D.prototype, C.prototype, B.prototype, A.prototype, Array.prototype, Object.prototype, null])
 *
 * // slicing between the `start` index (inclusive) and the end index
 * eq(fn(d, { start: 2, end:    6 }), [B.prototype, A.prototype, Array.prototype, Object.prototype])
 * eq(fn(d, { start: 2, end:   -1 }), [B.prototype, A.prototype, Array.prototype, Object.prototype])
 * eq(fn(d, { start: 2, end: null }), [B.prototype, A.prototype, Array.prototype, Object.prototype])
 *
 * // if the end index is not found, the slicing will occur till the end
 * eq(fn(d, { end: Set.prototype}), [D.prototype, C.prototype, B.prototype, A.prototype, Array.prototype, Object.prototype, null])
 *
 * // slicing using a `delta` argument will let you define how many elements you wish to:
 * // - traverse forward from the `start` index
 * // - traverse backwards from the `end` index
 * eq(fn(d, { start:  2, delta: 3 }), [B.prototype, A.prototype, Array.prototype])
 * eq(fn(d, { end:   -2, delta: 2 }), [A.prototype, Array.prototype])
 * eq(fn(d, { end: null, delta: 4 }), [B.prototype, A.prototype, Array.prototype, Object.prototype])
 *
 * eq(fn(d,  { start: 1, delta: 1 }), fn(c,  { start: 0, delta: 1 }))
 * eq(fn(c,  { start: 1, delta: 1 }), fn(b,  { start: 0, delta: 1 }))
 * eq(fn(b,  { start: 1, delta: 1 }), fn(a,  { start: 0, delta: 1 }))
 * eq(fn(a,  { start: 1, delta: 1 }), fn([], { start: 0, delta: 1 }))
 * eq(fn([], { start: 1, delta: 1 }), fn({}, { start: 0, delta: 1 }))
 *
 * // you may also traverse through the inheritance chain of a class, but it will be a good idea to set your `end` point to `Function.prototype`,
 * // since all class objects are effectively functions (i.e. their common ancestral prototype if `Function.prototype`).
 * eq(fn(D, { start: 0, end: Function.prototype }), [C, B, A, Array])
 * eq(fn(D), [C, B, A, Array, Function.prototype, Object.prototype, null])
 * eq(fn(class {}), [Function.prototype, Object.prototype, null])
 * eq(fn(class extends Object {}), [Object, Function.prototype, Object.prototype, null])
 * eq(fn(class extends Map {}), [Map, Function.prototype, Object.prototype, null])
 *
 * // you cannot acquire the prototype chain of the `null` object
 * assertThrows(() => { fn(null) })
 * ```
*/
export function prototypeChainOfObject(obj, config = {}) {
    let { start, end, delta } = config;
    const full_chain = [];
    // collecting the full prototype chain, until `obj` becomes `null`, which is always the last thing in a prototype chain.
    while ((obj = object_getPrototypeOf(obj))) {
        full_chain.push(obj);
    }
    full_chain.push(null);
    const full_chain_length = full_chain.length;
    // NOTE: we not only check if `start` and `end` are of type `"object"`, but also if they're of type `"function"`.
    //   this is because `typeof Function.prototype === "function"`, and not `"object"`.
    //   and as it happens to be the case, I do use `Function.prototype` as the end point in my {@link subclassThroughComposition} function.
    if (isComplex(start)) {
        start = max(0, full_chain.indexOf(start));
    }
    if (isComplex(end)) {
        const end_index = full_chain.indexOf(end);
        end = end_index < 0 ? undefined : end_index;
    }
    // both `start` and `end` are either numbers or undefined now.
    if ((delta !== undefined) && ((start ?? end) !== undefined)) {
        // in here, `delta` is defined and one of either `start` or `end` is undefined
        if (start !== undefined) {
            end = start + delta;
        }
        else {
            start = end - delta;
        }
    }
    // now that any potential `delta` has been resolved into a `start` and `end`,
    // we only need to resolve possible negative indexes and then slice the prototype chain
    [start, end] = resolveRange(start, end, full_chain_length);
    return full_chain.slice(start, end);
}
/** get an object's list of **owned** keys (string keys and symbol keys).
 *
 * > [!note]
 * > **owned** keys of an object are not the same as just _any_ key of the object.
 * > an owned key is one that it **directly** owned by the object, not owned through inheritance, such as the class methods.
 * > more precisely, in javascript, which ever member of an object that we call a _property_, is an **owned** key.
 *
 * if you wish to acquire **all remaining** inherited keys of an object, you will want use {@link getInheritedPropertyKeys}.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	symbol_h = Symbol("symbol h"),
 * 	symbol_i = Symbol("symbol i"),
 * 	symbol_j = Symbol("symbol j")
 *
 * class A {
 * 	a = { v: 1 }
 * 	b = { v: 2 }
 * 	c: { v: number }
 * 	d() { return { v: 4 } }
 * 	e() { return { v: 5 } }
 * 	f = () => { return { v: 6 } }
 * 	g: () => ({ v: number })
 * 	[symbol_h]() { return { v: 8 } }
 * 	[symbol_i] = () => { return { v: 9 } }
 *
 * 	constructor() {
 * 		this.c = { v: 3 }
 * 		this.g = () => { return { v: 7 } }
 * 	}
 * }
 *
 * class B extends A {
 * 	override a = { v: 11 }
 * 	override e() { return { v: 15 } }
 * 	//@ts-ignore: typescript does not permit defining a method over the name of an existing property
 * 	override g() { return { v: 17 } }
 * 	[symbol_j] = () => { return { v: 20 } }
 *
 * 	constructor() { super() }
 * }
 *
 * const
 * 	a = new A(),
 * 	b = new B()
 *
 * assertEquals(b.a, { v: 11 })
 * assertEquals(b.b, { v: 2 })
 * assertEquals(b.c, { v: 3 })
 * assertEquals(b.d(), { v: 4 })
 * assertEquals(b.e(), { v: 15 })
 * assertEquals(b.f(), { v: 6 })
 * assertEquals(b.g(), { v: 7 }) // notice that the overridden method is not called, and the property is called instead
 * assertEquals(Object.getPrototypeOf(b).g(), { v: 17 })
 * assertEquals(b[symbol_h](), { v: 8 })
 * assertEquals(b[symbol_i](), { v: 9 })
 * assertEquals(b[symbol_j](), { v: 20 })
 *
 * assertEquals(
 * 	new Set(getOwnPropertyKeys(a)),
 * 	new Set(["a", "b", "c", "f", "g", symbol_i]),
 * )
 * assertEquals(
 * 	new Set(getOwnPropertyKeys(Object.getPrototypeOf(a))),
 * 	new Set(["constructor", "d", "e", symbol_h]),
 * )
 * assertEquals(
 * 	new Set(getOwnPropertyKeys(b)),
 * 	new Set(["a", "b", "c", "f", "g", symbol_i, symbol_j]),
 * )
 * assertEquals(
 * 	new Set(getOwnPropertyKeys(Object.getPrototypeOf(b))),
 * 	new Set(["constructor", "e", "g"]),
 * )
 * ```
*/
export const getOwnPropertyKeys = (obj) => {
    return [
        ...object_getOwnPropertyNames(obj),
        ...object_getOwnPropertySymbols(obj),
    ];
};
/** get all **inherited** list of keys (string keys and symbol keys) of an object, up till a certain `depth`.
 *
 * directly owned keys will not be returned.
 * for that, you should use the {@link getOwnPropertyKeys} function.
 *
 * the optional `depth` parameter lets you control how deep you'd like to go collecting the inherited keys.
 *
 * @param obj the object whose inherited keys are to be listed.
 * @param depth the inheritance depth until which the function will accumulate keys for.
 *   - if an object `A` is provided as the `depth`,
 *     then all inherited keys up until `A` is reached in the inheritance chain will be collected, but not including the keys of `A`.
 *   - if a number `N` is provided as the `depth`,
 *     then the function will collect keys from `N` number of prototypes up the inheritance chain.
 *     - a depth of `0` would imply no traversal.
 *     - a depth of `1` would only traverse the first direct prototype of `obj` (i.e. `getOwnPropertyKeys(Object.getPrototypeOf(obj))`).
 *   @defaultValue `Object.prototype`
 * @returns an array of keys that the object has inherited (string or symbolic keys).
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	symbol_h = Symbol("symbol h"),
 * 	symbol_i = Symbol("symbol i"),
 * 	symbol_j = Symbol("symbol j")
 *
 * class A {
 * 	a = { v: 1 }
 * 	b = { v: 2 }
 * 	c: { v: number }
 * 	d() { return { v: 4 } }
 * 	e() { return { v: 5 } }
 * 	f = () => { return { v: 6 } }
 * 	g: () => ({ v: number })
 * 	[symbol_h]() { return { v: 8 } }
 * 	[symbol_i] = () => { return { v: 9 } }
 *
 * 	constructor() {
 * 		this.c = { v: 3 }
 * 		this.g = () => { return { v: 7 } }
 * 	}
 * }
 *
 * class B extends A {
 * 	override a = { v: 11 }
 * 	override e() { return { v: 15 } }
 * 	//@ts-ignore: typescript does not permit defining a method over the name of an existing property
 * 	override g() { return { v: 17 } }
 * 	[symbol_j] = () => { return { v: 20 } }
 *
 * 	constructor() { super() }
 * }
 *
 * const
 * 	a = new A(),
 * 	b = new B()
 *
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(a)),
 * 	new Set(["constructor", "d", "e", symbol_h]),
 * )
 *
 * // below, notice how the inherited keys of `a` equal to its prototype's owned keys.
 * // this is because methods of instances of `A` are defined on the prototype (i.e. properties of the prototype, rather than the instances').
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(a)),
 * 	new Set(getOwnPropertyKeys(A.prototype)),
 * )
 *
 * // also notice that inherited keys of `A.prototype` comes out as empty here,
 * // even though it does techinally inherit members from its own prototype (which is `Object.prototype`).
 * // the reason is that by default, we do not go deeper than `Object.prototype` to look for more keys.
 * // this is because from an end-user's perspective, those keys are not useful.
 * assertEquals(
 * 	getInheritedPropertyKeys(A.prototype),
 * 	[],
 * )
 *
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(b)),
 * 	new Set(["constructor", "e", "g", "d", symbol_h]),
 * )
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(b)),
 * 	new Set([
 * 		...getOwnPropertyKeys(B.prototype),
 * 		...getInheritedPropertyKeys(B.prototype),
 * 	]),
 * )
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(B.prototype)),
 * 	new Set(["constructor", "e", "d", symbol_h]),
 * )
 *
 * // testing out various depth
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(a, 1)),
 * 	new Set(getOwnPropertyKeys(A.prototype)),
 * )
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(b, 1)),
 * 	new Set(getOwnPropertyKeys(B.prototype)),
 * )
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(b, A.prototype)),
 * 	new Set(getOwnPropertyKeys(B.prototype)),
 * )
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(b, 2)),
 * 	new Set([
 * 		...getOwnPropertyKeys(B.prototype),
 * 		...getOwnPropertyKeys(A.prototype),
 * 	]),
 * )
 * // below, we collect all inherited keys of `b`, including those that come from `Object.prototype`,
 * // which is the base ancestral prototype of all objects.
 * // to do that, we set the `depth` to `null`, which is the prototype of `Object.prototype`.
 * // the test below may fail in new versions of javascript, where
 * assertEquals(
 * 	new Set(getInheritedPropertyKeys(b, null)),
 * 	new Set([
 * 		"constructor", "e", "g", "d", symbol_h,
 * 		"__defineGetter__", "__defineSetter__", "hasOwnProperty", "__lookupGetter__", "__lookupSetter__",
 * 		"isPrototypeOf", "propertyIsEnumerable", "toString", "valueOf", "toLocaleString",
 * 	]),
 * )
 * ```
*/
export const getInheritedPropertyKeys = (obj, depth = prototypeOfClass(Object)) => {
    // weird but expected facts:
    // - `Object.prototype !== Object.getPrototypeOf(Object)`
    // - `Object.prototype === Object.getPrototypeOf({})`
    // - `null === Object.getPrototypeOf(Object.prototype)`
    // - `you === "ugly"`
    const prototype_chain = prototypeChainOfObject(obj, { start: 0, end: depth }), inherited_keys = prototype_chain
        .map((prototype) => (getOwnPropertyKeys(prototype)))
        .flat(1);
    return [...(new Set(inherited_keys))];
};
/** get all **owned** getter property keys of an object `obj` (string keys and symbol keys).
 *
 * TODO: in the future, consider creating a `getInheritedGetterKeys` function with the same signature as `getInheritedPropertyKeys`.
 *
 * > [!note]
 * > inherited getter property keys will not be included.
 * > only directly defined getter property keys (aka owned keys) will be listed.
*/
export const getOwnGetterKeys = (obj) => {
    return getOwnPropertyKeys(obj).filter((key) => ("get" in object_getOwnPropertyDescriptor(obj, key)));
};
/** get all **owned** setter property keys of an object `obj` (string keys and symbol keys).
 *
 * TODO: in the future, consider creating a `getInheritedSetterKeys` function with the same signature as `getInheritedPropertyKeys`.
 *
 * > [!note]
 * > inherited setter property keys will not be included.
 * > only directly defined setter property keys (aka owned keys) will be listed.
*/
export const getOwnSetterKeys = (obj) => {
    return getOwnPropertyKeys(obj).filter((key) => ("set" in object_getOwnPropertyDescriptor(obj, key)));
};
/** create a new object that mirrors that functionality of an existing object `obj`, through composition.
 *
 * @param obj the object that is to be mimicked and composed.
 * @param config control how the mirroring composition should behave.
 *   refer to the docs of {@link MirrorObjectThroughCompositionConfig} for more details.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * type TypeofB = Array<number> & { getLength(): number }
 * type TypeofC = TypeofB & { countZeros(): number }
 *
 * const a = Array.prototype
 * const b = {
 * 	getLength(): number { return this.length }
 * } as TypeofB
 * const c = {
 * 	countZeros(): number { return [...this].filter((value) => (value === 0)).length }
 * } as TypeofC
 *
 * Object.setPrototypeOf(b, a)
 * Object.setPrototypeOf(c, b)
 *
 * // below, we create an object `d` that mirrors the methods and protperties of `c`, but does not actually inherit it.
 * const d = mirrorObjectThroughComposition(c, {
 * 	baseKey: "_super",
 * 	propertyKeys: ["length"],
 * })
 *
 * // notice that `d` does not inherit `c` as its prototype, despite being able to utilize its methods and properties.
 * assertEquals(Object.getPrototypeOf(d), Object.prototype, "`d` does not inherit `c`")
 *
 * d.push(0, 0, 0, 0, 1)
 * assertEquals([...d], [0, 0, 0, 0, 1], "`d` also mirrors symbolic keys (such as iterators)")
 * assertEquals([...c], [0, 0, 0, 0, 1], "mutations made to `d` are applied to `c`")
 * assertEquals(d._super, c, "`c` is accessible via the `baseKey` (\"_super\") property")
 * assertEquals(d.length, 5)
 * assertEquals(c.length, 5)
 * assertEquals(d.getLength(), 5)
 * assertEquals(d.countZeros(), 4)
 * d.splice(0, 3)
 * assertEquals(d.countZeros(), 1)
 * assertEquals(c.countZeros(), 1)
 *
 * // you may even hot-swap the object that is being composed inside of `d`.
 * const e = [1, 2, 3, 4, 5, 6, 7, 8, 9]
 * Object.setPrototypeOf(e, c)
 * d._super = e as TypeofC
 * assertEquals(d.length, 9)
 * assertEquals(d.getLength(), 9)
 * assertEquals(d.countZeros(), 0)
 *
 * // it is also possible for you to provide an existing `target` object onto which the mirroring should occur.
 * // moreover, you can ignore specific keys which you would like not to be mirrored using the `ignoreKeys` option.
 * class F {
 * 	methodF() { return "press f for your fallen comrades" }
 * 	// to stop typescript from complaining, we declare the instance methods and properties that will be mirrored.
 * 	declare _super: typeof c
 * 	declare length: number
 * 	declare getLength: undefined
 * 	declare countZeros: () => number
 * }
 * mirrorObjectThroughComposition(c, {
 * 	target: F.prototype,
 * 	baseKey: "_super",
 * 	propertyKeys: ["length"],
 * 	ignoreKeys: ["getLength"],
 * })
 * const f = new F()
 * assertEquals(f instanceof F, true)
 * assertEquals(f._super, c)
 * assertEquals(f.length, 2)
 * assertEquals(f.countZeros(), 1)
 * assertEquals(f.getLength, undefined) // the `getLength` is not mirrored because it was present in the `ignoreKeys` option
 * assertEquals(f.methodF(), "press f for your fallen comrades")
 * ```
*/
export const mirrorObjectThroughComposition = (obj, config) => {
    const { baseKey, mirrorPrototype = true, propertyKeys = [], ignoreKeys = [], target = {} } = config, mirror_obj = target, property_keys = new Set(propertyKeys), ignore_keys = new Set(ignoreKeys), prototype_chain = isBoolean(mirrorPrototype) ? (mirrorPrototype
        ? prototypeChainOfObject(obj, { end: prototypeOfClass(Object) })
        : []) : isArray(mirrorPrototype)
        ? mirrorPrototype
        : prototypeChainOfObject(obj, mirrorPrototype);
    prototype_chain.unshift(obj);
    mirror_obj[baseKey] = obj;
    // dynamically defining the methods composed from the base object `obj`
    for (const prototype of prototype_chain) {
        const prototype_keys = getOwnPropertyKeys(prototype);
        for (const key of prototype_keys) {
            if ((key in mirror_obj) || property_keys.has(key) || ignore_keys.has(key)) {
                continue;
            }
            const { value, ...description } = object_getOwnPropertyDescriptor(prototype, key);
            if (isFunction(value)) {
                // `value` is very likely to be a prototype-bound method.
                // so we create an appropriate proxying/wrapper method for it.
                object_defineProperty(mirror_obj, key, {
                    ...description,
                    value(...args) {
                        // NOTE: the motivation behind returning `this[baseKey][key](...args)` instead of `obj[key](...args)` is that it would
                        //   allow us to later on dynamically replace the underlying object that is being mirrored, which is a necessity when
                        //   dealing with class-instance object mirroring that initially being defined on class's own prototype base constructor.
                        return this[baseKey][key](...args);
                    }
                });
            }
            else {
                // `value` is either an instance-bound property or does not exist exist (i.e. there's a getter/setter method in its place instead)
                property_keys.add(key);
            }
        }
    }
    // dynamically defining the potentially transparent properties (i.e. later defined) of the composed object
    for (const key of property_keys) {
        // TODO: what if there's more to the description of the given key? we're certainly not preserving that information here unfortunately.
        object_defineProperty(mirror_obj, key, {
            get() { return this[baseKey][key]; },
            set(new_value) { this[baseKey][key] = new_value; },
        });
    }
    return mirror_obj;
};
/** create a subclass of the given `cls` class through composition rather than ES6 inheritance (aka `extends`).
 * the composed instance resides under the property `this._super`, and all instance methods of the super class are copied/mirrored in the output class.
 *
 * TODO: provide a motivation/justification when compositional-mirroring subclass might be necessary to use instead of ES6 `extends` inheritance.
 *
 * @param cls the class to subclass through composition.
 * @param property_keys specify additional property keys that exist within the instance of the class that need to be mirrored.
 * @returns a class whose instances fully mirror the provided `cls` class's instance, without actually inheriting it.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * class A<T> extends Array<T> { constructor(quantity: number) { super(quantity) } }
 * class B<T> extends subclassThroughComposition(A, {
 * 	class: {},
 * 	instance: { propertyKeys: ["length"] },
 * })<T> { }
 *
 * // `B` mirrors the constructor of `A`, as well as provide an additional `"_super"` property to access the enclosed (class which is `A`)
 * B satisfies { new(amount: number): B<any> }
 * B._super satisfies typeof A
 * // the following cannot be satisfied due to `A`'s restrictive constructor: `B satisfies { new(item1: string, item2: string, item3: string): B<string> }`
 * // even though `A`'s super class (`Array`) does permit that kind of constructor signature:
 * Array satisfies { new(item1: string, item2: string, item3: string): Array<string> }
 *
 * const my_array = new B<number>(5)
 *
 * // `my_array` encloses an instance of its "subclass" (which is an instance of class `A`) under the `"_super"` key.
 * assertEquals(my_array instanceof B, true)
 * assertEquals(my_array._super instanceof A, true)
 * my_array._super satisfies A<unknown> // this should have been narrowed to `satisfies A<number>`, but typing class extensions with generics is nearly impossible
 *
 * // `my_array` mirrors the properties and methods of the instances of the "subclass" that it encloses.
 * my_array.fill(1)
 * my_array.push(2)
 * my_array.push(3)
 * assertEquals(my_array.at(-1), 3)
 * assertEquals(my_array._super.at(-1), 3)
 * assertEquals(my_array.length, 7)
 * assertEquals(my_array._super.length, 7)
 *
 * // `my_array` mirrors the symbolic properties and methods as well.
 * assertEquals([...my_array], [1, 1, 1, 1, 1, 2, 3]) // the `Symbol.iterator` method is mirrored successfully
 *
 * // `my_array` when a method that returns `new this.constructor(...)` (such as `Array.prototype.splice`), then an instance of
 * // the enclosed subclass `A` will be created instead of `B` (had we had a regular inheritance via `class B extends A { }`).
 * const
 * 	splice_of_my_array = my_array.splice(0, 4, 0, 0),
 * 	slice_of_my_array = my_array.slice(3, 4)
 * assertEquals(splice_of_my_array instanceof A, true)
 * assertEquals(slice_of_my_array instanceof A, true)
 * assertEquals([...splice_of_my_array], [1, 1, 1, 1])
 * assertEquals([...slice_of_my_array], [2])
 * assertEquals([...my_array], [0, 0, 1, 2, 3])
 * assertEquals([...my_array._super], [0, 0, 1, 2, 3])
 *
 * // the class `B` also mirrors static properties and static methods of `A` (and its inherited ones).
 * // this means that any static method that creates a new instance via `new this(...)` will create an instance of `A` instead of `B`.
 * const
 * 	new_array_1 = B.from(["hello", "world"]),
 * 	new_array_2 = B.of("goodbye", "world")
 * assertEquals(new_array_1 instanceof A, true)
 * assertEquals(new_array_2 instanceof A, true)
 * assertEquals(new_array_1, A.from(["hello", "world"]))
 * assertEquals(new_array_2, A.of("goodbye", "world"))
 * ```
*/
export const subclassThroughComposition = (cls, config = {}) => {
    const class_config = config.class ?? {}, instance_config = config.instance ?? {}, instance_base_key = instance_config.baseKey ?? "_super", class_ignore_keys = class_config.ignoreKeys ?? [], new_cls = class {
        constructor(...args) {
            const composite_instance = new cls(...args);
            // @ts-ignore: dynamic computed key assignment is not permitted in typescript
            this[instance_base_key] = composite_instance;
        }
    }, //as ConstructorOf<MirrorComposition<T, INSTANCE_KEY>, Args> & MirrorComposition<CLS, CLASS_KEY>,
    cls_prototype = prototypeOfClass(cls), new_cls_prototype = prototypeOfClass(new_cls);
    // mirroring the static class methods and static properties of `cls` onto `new_cls`
    mirrorObjectThroughComposition(cls, {
        // NOTE: all classes extend the `Function` constructor (i.e. if we had `class A {}`, then `Object.getPrototypeOf(A) === Function.prototype`).
        //   but obviously, we don't want to mirror the `Function` methods within `cls` (aka the static methods of `Function`),
        //   which is why we set our default class's config `mirrorPrototype.end` to `Function.prototype`.
        mirrorPrototype: { start: 0, end: prototypeOfClass(Function) },
        baseKey: "_super",
        ...class_config,
        // the ignore list ensures that we don't overwrite existing properties of the `target` class.
        // (even though there are checks in place that would prevent overwriting existing keys, it's better to be explicit)
        ignoreKeys: [...class_ignore_keys, "length", "name", "prototype"],
        target: new_cls,
    });
    // mirroring the instance methods and properties of `cls.prototype` onto `new_cls.prototype`
    mirrorObjectThroughComposition(cls_prototype, {
        baseKey: instance_base_key,
        ...instance_config,
        target: new_cls_prototype,
    });
    return new_cls;
};
/** monkey patch the prototype of a class.
 *
 * TODO: give usage examples and situations where this will be useful.
*/
export const monkeyPatchPrototypeOfClass = (cls, key, value) => {
    object_defineProperty(prototypeOfClass(cls), key, { value });
};
/** check if `obj` is either an object or function. */
export const isComplex = (obj) => {
    const obj_type = typeof obj;
    return obj_type === "object" || obj_type === "function";
};
/** check if `obj` is neither an object nor a function. */
export const isPrimitive = (obj) => {
    return !isComplex(obj);
};
/** check if `obj` is a `function`.
 *
 * TODO: consider if it would be a good idea to include a generic parameter for the function's signature.
 * i.e.: `<FN extends Function = Function>(obj: any): obj is FN`
*/
export const isFunction = (obj) => {
    return typeof obj === "function";
};
/** check if `obj` is an `Object`. */
export const isObject = (obj) => {
    return typeof obj === "object";
};
/** check if `obj` is an `Array`. */
export const isArray = array_isArray;
/** check if `obj` is a `Record`, which is any non-nullable object that isn't an array;
 * kind of like a dictionary.
*/
export const isRecord = (obj) => {
    return isObject(obj) && obj !== null && !isArray(obj);
};
/** check if `obj` is a `string`. */
export const isString = (obj) => {
    return typeof obj === "string";
};
/** check if `obj` is a `number`. */
export const isNumber = (obj) => {
    return typeof obj === "number";
};
/** check if `obj` is a `bigint`. */
export const isBigint = (obj) => {
    return typeof obj === "bigint";
};
/** check if `obj` is either a `number` or a `bigint`. */
export const isNumeric = (obj) => {
    return typeof obj === "number" || typeof obj === "bigint";
};
/** check if `obj` is `boolean`. */
export const isBoolean = (obj) => {
    return typeof obj === "boolean";
};
/** check if `obj` is a `symbol`. */
export const isSymbol = (obj) => {
    return typeof obj === "symbol";
};
