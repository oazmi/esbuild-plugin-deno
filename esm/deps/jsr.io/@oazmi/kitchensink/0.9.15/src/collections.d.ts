/** contains a set of common collections.
 *
 * @module
*/
import type { MaybePromiseLike, PrefixProps } from "./typedefs.js";
/** a very simple python-like `List`s class, that allows for in-between insertions, deletions, and replacements, to keep the list compact.
 *
 * TODO: add examples
*/
export declare class List<T> extends Array<T> {
    /** ensure that built-in class methods create a primitive `Array`, instead of an instance of this `List` class.
     *
     * > [!note]
     * > it is extremely important that we set the `[Symbol.species]` static property to `Array`,
     * > otherwise any Array method that creates another Array (such as `map` and `splice`) will create an instance of `List` instead of an `Array`.
     * > this will eventually become a huge hindrance in future computationally heavy subclasses of this class that utilize the splice often.
     *
     * related reading material:
     * - about the `Symbol.species` static property: [mdn link](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/species).
     * - about possible deprecation of this feature: [tc39 proposal link](https://github.com/tc39/proposal-rm-builtin-subclassing).
     * - about why use `Symbol.species` instead of `symbol_species` from "alias.ts": see the comment inside the body of {@link Deque[Symbol.iterator]}.
    */
    static [Symbol.species]: ArrayConstructor;
    constructor(items?: Iterable<T>);
    /** inserts an item at the specified index, shifting all items ahead of it one position to the front.
     *
     * negative indices are also supported for indicating the position of the newly added item _after_ the array's length has incremented.
     *
     * @example
     * ```ts
     * import { assertEquals } from "jsr:@std/assert"
     *
     * const arr = new List([0, 1, 2, 3, 4])
     * arr.insert(-1, 5) // similar to pushing
     * assertEquals([...arr], [0, 1, 2, 3, 4, 5])
     * arr.insert(-2, 4.5)
     * assertEquals([...arr], [0, 1, 2, 3, 4, 4.5, 5])
     * arr.insert(1, 0.5)
     * assertEquals([...arr], [0, 0.5, 1, 2, 3, 4, 4.5, 5])
     * ```
    */
    insert(index: number, item: T): void;
    /** deletes an item at the specified index, shifting all items ahead of it one position to the back.
     *
     * negative indices are also supported for indicating the deletion index from the end of the array.
     *
     * @example
     * ```ts
     * import { assertEquals } from "jsr:@std/assert"
     *
     * const arr = new List([0, 0.5, 1, 2, 3, 4, 4.5, 5])
     * arr.delete(-1) // similar to popping
     * assertEquals([...arr], [0, 0.5, 1, 2, 3, 4, 4.5])
     * arr.delete(-2)
     * assertEquals([...arr], [0, 0.5, 1, 2, 3, 4.5])
     * arr.delete(1)
     * assertEquals([...arr], [0, 1, 2, 3, 4.5])
     * ```
    */
    delete(index: number): T | undefined;
    /** swap the position of two items by their index.
     *
     * if any of the two indices is out of bound, then appropriate number of _empty_ elements will be created to fill the gap;
     * similar to how index-based assignment works (i.e. `my_list[off_bound_index] = "something"` will increase `my_list`'s length).
     *
     * @example
     * ```ts
     * import { assertEquals } from "jsr:@std/assert"
     *
     * const arr = new List<string>(["0", "4", "2", "3", "1", "5", "6"])
     * arr.swap(1, 4)
     * assertEquals(arr.slice(), ["0", "1", "2", "3", "4", "5", "6"])
     *
     * // swapping elements with an out of bound index will create additional intermediate `empty` elements.
     * // moreover, the existing element that is swapped will have `undefined` put in its place instead of `empty`.
     * assertEquals(arr.length, 7)
     * arr.swap(5, 9)
     * assertEquals(arr.length, 10)
     * assertEquals(arr.slice(), ["0", "1", "2", "3", "4", undefined, "6", , , "5"]) // notice the empty entries.
     * ```
    */
    swap(index1: number, index2: number): void;
    /** get an item at the specified `index`.
     *
     * this is equivalent to using index-based getter: `my_list[index]`.
    */
    get(index: number): T | undefined;
    /** sets the value at the specified index.
     *
     * prefer using this method instead of index-based assignment, because subclasses may additionally cary out more operations with this method.
     * for attaining compatibility between `List` and its subclasses, it would be in your best interest to use the `set` method.
     * - **not recommended**: `my_list[index] = "hello"`
     * - **preferred**: `my_list.set(index, "hello")`
    */
    set(index: number, value: T): T;
    static from<T, U = T>(arrayLike: ArrayLike<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): List<U>;
    static of<T>(...items: T[]): List<T>;
}
/** a specialized list that keeps track of the number of duplicates of each item in the list, similar to a reference counter.
 *
 * this class automatically updates the reference counter on any mutations to the list at `O(log(n))`, where `n` is the number of unique items.
 *
 * > [!note]
 * > note that you **must** use the {@link set} method for index-based assignment, otherwise the class will not be able track the changes made.
 * - **don't do**: `my_list[index] = "hello"`
 * - **do**: `my_list.set(index, "hello")`
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	logs: string[] = [],
 * 	get_logs = (): string[] => {
 * 		// the `logs` are cleared once this function is called
 * 		return logs.splice(0, logs.length)
 * 	}
 *
 * class TrackedList<T> extends RcList<T> {
 * 	constructor(items?: T[]) {
 * 		super(items)
 * 	}
 *
 * 	protected override onAdded(item: T): void {
 * 		logs.push(`new item introduced: ${item}`)
 * 	}
 *
 * 	protected override onDeleted(item: T): void {
 * 		logs.push(`item completely removed: ${item}`)
 * 	}
 * }
 *
 * const list = new TrackedList<number>()
 * list.push(1, 2, 2, 3)
 * assertEquals(get_logs(), ["new item introduced: 1", "new item introduced: 2", "new item introduced: 3"])
 *
 * list.pop() // removes the `3`
 * assertEquals(get_logs(), ["item completely removed: 3"])
 *
 * list.splice(0, 1) // removes the `1`
 * assertEquals(get_logs(), ["item completely removed: 1"])
 *
 * list.unshift(4, 4, 5)
 * assertEquals(get_logs(), ["new item introduced: 4", "new item introduced: 5"])
 *
 * list.shift() // removes the first `4`, but another copy still exists, so it shouldn't log anything
 * assertEquals(get_logs(), [])
 *
 * list.shift() // removes the second `4`, and now, all copies of `4` have been removed
 * assertEquals(get_logs(), ["item completely removed: 4"])
 *
 * list.set(1, 6) // replaces the first `2` with `6`
 * assertEquals(get_logs(), ["new item introduced: 6"])
 *
 * list.set(2, 7) // replaces the other `2` with `7`
 * assertEquals(get_logs(), ["new item introduced: 7", "item completely removed: 2"])
 *
 * assertEquals([...list], [5, 6, 7])
 *
 * list.set(99, 9999) // set `list[99] = 9999`, and extends the length of the list to `100`
 * assertEquals(get_logs(), ["new item introduced: 9999"])
 *
 * // the reference counter of `undefined` is now `96`, because the length of the list was extended by `97` elements,
 * // and the final element (index `99`) was assigned the value of `9999`.
 * // we can get the reference count of a certain value using the `getRc` method.
 * assertEquals(list.getRc(undefined as any), 96)
 * assertEquals(list.getRc(5), 1)
 * assertEquals(list.getRc(6), 1)
 * assertEquals(list.getRc(7), 1)
 *
 * // note that `onAdded` is not called for `undefined` elements that are introduced as a consequence of the list extending after assignment.
 * // but `onAdded` will be called when the user _actually_ inserts an `undefined` element via direct mutation methods.
 * ```
*/
export declare class RcList<T> extends List<T> {
    /** the reference counting `Map`, that bookkeeps the multiplicity of each item in the list. */
    protected readonly rc: Map<T, number>;
    /** get the reference count (multiplicity) of a specific item in the list.
     *
     * note that the reference count for a non-existing item is `undefined` instead of `0`.
    */
    readonly getRc: (key: T) => number | undefined;
    /** set the reference count of a specific item in the list. */
    protected readonly setRc: (key: T, value: number) => Map<T, number>;
    /** delete the reference counting of a specific item in the list. a `true` is returned if the item did exist in {@link rc}, prior to deletion. */
    protected readonly delRc: (key: T) => boolean;
    constructor(items?: Iterable<T>);
    /** this overridable method gets called when a new unique item is determined to be added to the list.
     *
     * this method is called _before_ the item is actually added to the array, but it is executed right _after_ its reference counter has incremented to `1`.
     *
     * > [!note]
     * > avoid accessing or mutating the array itself in this method's body (consider it an undefined behavior).
     *
     * @param item the item that is being added.
    */
    protected onAdded(item: T): void;
    /** this overridable method gets called when a unique item (reference count of 1) is determined to be removed from the list.
     *
     * this method is called _before_ the item is actually removed from the array, but it is executed right _after_ its reference counter has been deleted.
     *
     * > [!note]
     * > avoid accessing or mutating the array itself in this method's body (consider it an undefined behavior).
     *
     * @param item the item that is being removed.
    */
    protected onDeleted(item: T): void;
    /** increments the reference count of each item in the provided array of items.
     *
     * @param items the items whose counts are to be incremented.
    */
    protected incRcs(...items: T[]): void;
    /** decrements the reference count of each item in the provided array of items.
     *
     * @param items the items whose counts are to be decremented.
    */
    protected decRcs(...items: T[]): void;
    push(...items: T[]): number;
    pop(): T | undefined;
    shift(): T | undefined;
    unshift(...items: T[]): number;
    splice(start: number, deleteCount?: number, ...items: T[]): T[];
    swap(index1: number, index2: number): void;
    /** sets the value at the specified index, updating the counter accordingly.
     *
     * always use this method instead of index-based assignment, because the latter is not interceptable (except when using proxies):
     * - **don't do**: `my_list[index] = "hello"`
     * - **do**: `my_list.set(index, "hello")`
    */
    set(index: number, value: T): T;
    static from<T, U = T>(arrayLike: ArrayLike<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): RcList<U>;
    static of: <T>(...items: T[]) => RcList<T>;
}
/** a resizable double-ended circular queue, similar to python's `collection.deque`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const deque = new Deque<number>(5)
 *
 * // pushing to the front
 * deque.pushFront(1, 2)
 * assertEquals(deque.getFront(), 2)
 *
 * // pushing to the rear
 * deque.pushBack(0, -1)
 * assertEquals(deque.getBack(), -1)
 * assertEquals(deque.getFront(), 2)
 *
 * // iterating over the queue, starting from the rear-most element to the front most
 * assertEquals([...deque], [-1, 0, 1, 2])
 *
 * // popping the front and rear
 * assertEquals(deque.popFront(), 2)
 * assertEquals(deque.popBack(), -1)
 * assertEquals([...deque], [0, 1])
 *
 * // pushing more items into the deque than its capacity (which is `5` elements) removes elements from the other end
 * deque.pushFront(2, 3, 4, 5, 6)
 * assertEquals([...deque], [2, 3, 4, 5, 6]) // the two rear-most elements have been removed
 * deque.pushBack(1)
 * assertEquals([...deque], [1, 2, 3, 4, 5]) // the front-most element has been removed
 *
 * // rotating the deque when its capacity is full
 * deque.rotate(2) // rotate forward/to-the-right by 2 steps
 * assertEquals([...deque], [4, 5, 1, 2, 3])
 * deque.rotate(-1) // rotate backwards/to-the-left by 1 step
 * assertEquals([...deque], [5, 1, 2, 3, 4])
 * deque.rotate(11) // rotating forward by 11 steps is equivalent to 1 forward step
 * assertEquals([...deque], [4, 5, 1, 2, 3])
 *
 * // rotating the deque when it is partially filled
 * deque.popBack()
 * deque.popBack()
 * assertEquals([...deque], [1, 2, 3])
 * deque.rotate(1) // rotate forward by 1 step
 * assertEquals([...deque], [3, 1, 2])
 * deque.rotate(-2) // rotate backwards by 2 steps
 * assertEquals([...deque], [2, 3, 1])
 * deque.rotate(-5) // rotate backwards by 5 steps, which is equivalent to 2 backward steps
 * assertEquals([...deque], [1, 2, 3])
 *
 * // reversing the ordering of a partially filled deque
 * deque.reverse()
 * assertEquals([...deque], [3, 2, 1])
 *
 * // reversing the ordering of a completely filled deque
 * deque.pushBack(4, 5)
 * assertEquals([...deque], [5, 4, 3, 2, 1])
 * deque.reverse()
 * assertEquals([...deque], [1, 2, 3, 4, 5])
 *
 * // acquiring elements through indexing using the `at` method
 * assertEquals(deque.at(0),  1)
 * assertEquals(deque.at(-1), 5) // negative indices are supported
 * assertEquals(deque.at(-2), 4)
 * assertEquals(deque.at(2),  3)
 * assertEquals(deque.at(11), 2) // overflowing indices are also supported
 * assertEquals(deque.at(-9), 2) // negative overflowing indices are supported as well
 *
 * // making the deque only partially filled
 * deque.popFront()
 * deque.popFront()
 * assertEquals([...deque], [1, 2, 3])
 *
 * // indexing using the `at` method will return `undefined` if the deque is partially filled, and the given index slot is empty.
 * // this is because the index provided to the `at` method circulates (i.e. modulo) around the `length` of the deque,
 * // as opposed to its current element `count` amount.
 * assertEquals(deque.at(1),  2)
 * assertEquals(deque.at(-1), undefined)
 * assertEquals(deque.at(-2), undefined)
 * assertEquals(deque.at(-3), 3)
 * assertEquals(deque.at(4),  undefined)
 * assertEquals(deque.at(5),  1)
 * assertEquals(deque.at(6),  2)
 * assertEquals(deque.at(11), 2)
 * assertEquals(deque.at(-8), 3)
 *
 * // to acquire items based on the index that circulates around the current element `count` amount (instead of `length`), use the `seek` method.
 * assertEquals(deque.seek(1),  2)
 * assertEquals(deque.seek(-1), 3)
 * assertEquals(deque.seek(-2), 2)
 * assertEquals(deque.seek(-3), 1)
 * assertEquals(deque.seek(4),  2)
 * assertEquals(deque.seek(5),  3)
 * assertEquals(deque.seek(6),  1)
 * assertEquals(deque.seek(11), 3)
 * assertEquals(deque.seek(-8), 2)
 *
 * // to replace an existing item with a new one, using the `seek` index, use the `replace` method
 * assertEquals([...deque], [1, 2, 3])
 * deque.replace(0,  9)
 * deque.replace(10, 8)
 * deque.replace(-1, 7)
 * assertEquals([...deque], [9, 8, 7])
 *
 * // to insert in-between elements, use the `insert` method
 * deque.insert(-1, 6, 5, 4, 3)
 * assertEquals([...deque], [9, 8, 7, 6, 5]) // the excess elements `4` and `3` cannot be inserted, since the length capacity of 5 has been reached.
 * deque.insert(-4, 77, 66)
 * assertEquals([...deque], [9, 8, 77, 66, 7])
 * deque.insert(1, 88)
 * assertEquals([...deque], [9, 88, 8, 77, 66])
 *
 * // to resize the deque, use the `resize` method
 * assertEquals(deque.length, 5)
 * deque.resize(8)
 * assertEquals(deque.length, 8)
 * deque.insert(0, 99, 98, 97, 96)
 * assertEquals([...deque], [99, 98, 97, 96, 9, 88, 8, 77])
 * deque.resize(3) // if you resize to a shorter length, then you'll lose the excess elements from the front.
 * assertEquals([...deque], [99, 98, 97])
 * deque.resize(5)
 * assertEquals([...deque], [99, 98, 97])
 * deque.pushFront(96, 95, 94)
 * assertEquals([...deque], [98, 97, 96, 95, 94])
 * ```
*/
export declare class Deque<T> {
    readonly length: number;
    private items;
    private front;
    private back;
    count: number;
    /** a double-ended circular queue, similar to python's `collection.deque`.
     *
     * @param length specify the maximum length of the queue.
     *   pushing more items than the length will remove the items from the opposite side, so as to maintain the size.
    */
    constructor(length: number);
    /** iterate over the items in this deque, starting from the rear-most item, and ending at the front-most item. */
    [Symbol.iterator](): Iterator<T>;
    /** inserts one or more items to the rear of the deque.
     *
     * if the deque is full, it will remove the front item before adding a new item.
    */
    pushBack(...items: T[]): void;
    /** inserts one or more items to the front of the deque.
     *
     * if the deque is full, it will remove the rear item before adding a new item.
    */
    pushFront(...items: T[]): void;
    /** get the item at the back of the deque without removing/popping it. */
    getBack(): T | undefined;
    /** get the item at the front of the deque without removing/popping it. */
    getFront(): T | undefined;
    /** removes/pops the item at the back of the deque and returns it. */
    popBack(): T | undefined;
    /** removes/pops the item at the front of the deque and returns it. */
    popFront(): T | undefined;
    /** rotates the deque `steps` number of positions to the right.
     *
     * if `steps` is negative, then it will rotate in the left direction.
     * when the deque is not empty, rotating with `step = 1` is equivalent to `this.pushBack(this.popFront())`
    */
    rotate(steps: number): void;
    /** reverses the order of the items in the deque. */
    reverse(): void;
    /** normalize the internal `items` array so that it beings with the first element of the deque.
     *
     * this method effectively makes it so that `this.back` becomes `this.length - 1`, and `this.front` becomes `this.count`.
     * this is useful for when you'd like to carry out a slightly complex re-indexing or mutation task on `this.items`,
     * but don't want to compute the indexes at every iteration of the subtasks involved.
    */
    private normalize;
    /** provide an index relative to `this.back + 1`, and get the appropriate resolved index `i` that can be used to retrieve `this.items[i]`.
     *
     * example:
     * - given that a `deque` has a `length` of `5` and a `count` of `3` (i.e. carrying three elements), then:
     * - `deque.items[deque.resolveIndex(0)] === "rear-most element of the deque"`
     * - `deque.items[deque.resolveIndex(-1)] === "fifth element ahead of the rear of the deque"`
     * - `deque.items[deque.resolveIndex(5)] === "fifth element ahead of the rear of the deque"`
     * - `deque.items[deque.resolveIndex(6)] === "rear-most element of the deque"`
    */
    private resolveIndex;
    /** provide an index relative to `this.back + 1`, and get the resolved seek-index `i` that is always within the current {@link count} amount of elements.
     * the returned resolved index `i` can be used to retrieve the element at that index by using `this.items[i]`.
     *
     * example:
     * - given that a `deque` has a `length` of `5` and a `count` of `3` (i.e. carrying three elements), then:
     * - `deque.items[deque.resolveSeekIndex(0)] === "rear-most element of the deque"`
     * - `deque.items[deque.resolveSeekIndex(-1)] === "third element ahead of the rear of the deque"`
     * - `deque.items[deque.resolveSeekIndex(2)] === "third element ahead of the rear of the deque"`
     * - `deque.items[deque.resolveSeekIndex(3)] === "rear-most element of the deque"`
    */
    private resolveSeekIndex;
    /** returns the item at the specified index, relative to the rear of the deque.
     *
     * if the capacity (element {@link count}) of this deque is not full,
     * then you may receive `undefined` when you provide an index where an empty element exists.
     * in other words, this method is not aware of the number of elements currently stored in the deque.
     *
     * to obtain an element that is _always_ within the current partial capacity limit, use the {@link seek} method instead.
     *
     * @param index The index of the item to retrieve, relative to the rear-most element.
     * @returns The item at the specified index, or `undefined` if the index is out of range with respect to the current {@link count} number of items.
    */
    at(index: number): T | undefined;
    /** returns the item at the specified index, relative to the rear of the deque,
     * ensuring that the index circulates back if it goes off the current item {@link count} amount.
     *
     * if the capacity (element {@link count}) of this deque is not full,
     * then you may receive `undefined` when you provide an index where an empty element exists.
     * in other words, this method is not aware of the number of elements currently stored in the deque.
     *
     * to obtain an element that is _always_ within the current partial capacity limit, use the {@link seek} method instead.
     *
     * @param seek_index The index of the item to retrieve, relative to the rear-most element.
     * @returns The item at the specified index (within the element {@link count} amount of this deque), or `undefined` if there are absolutely no items in the deque.
    */
    seek(seek_index: number): T | undefined;
    /** replaces the item at the specified index with a new item, always ensuring the index is bound to the current element {@link count} amount
     * (as opposed the the full deque {@link length}), so that unoccupied element slots are **not** replaced.
     * i.e. only existing items can be replaced.
    */
    replace(seek_index: number, item: T): void;
    /** inserts additional items at the specified seek-index, shifting all items ahead of it to the front.
     * if the deque is full, it removes the front item before adding the new additional items.
     *
     * ~~TODO: current implementation is incomplete, because it involves too many index computations, and I'm too lazy for that.
     * plus, president biden is going to drop the "ball" in times square today on new year's eve.
     * obviously I wouldn't want to miss this historic moment. /s~~
     * in place of a lackluster "ball drop", we got a much more exciting thunder show from the Almighty Himself!
    */
    insert(seek_index: number, ...insert_items: T[]): void;
    resize(new_length: number): void;
}
/** invert a `Map<F, Set<R>>` to `Map<R, Set<F>>`. */
export declare const invertMap: <F, R>(forward_map: Map<F, Set<R>>) => Map<R, Set<F>>;
export type InvertibleMapBase<K, V> = Map<K, Set<V>> & Omit<PrefixProps<Map<V, Set<K>>, "r">, "rclear" | "rset"> & {
    rset: (key: V, value: Iterable<K>) => InvertibleMapBase<K, V>;
};
/** an invertible map maintains a bidirectional one-to-many mapping between `keys` (of kind `K`) and collection of values (of kind `Set<V>`). <br>
 * the reverse mapping is also a one-to-many between `keys` (of kind `V`) and collection of values (of kind `Set<K>`). <br>
 * the dual map model of this class allows for quick lookups and mutations both directions. <br>
 * this data structure highly resembles a directed graph's edges. <br>
 *
 * @typeParam K the type of keys in the forward map
 * @typeParam V the type of values in the reverse map
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const bimap = new InvertibleMap<number, string>()
 *
 * // add values to the forward map
 * bimap.add(1, "one", "first")
 * bimap.add(2, "two", "second")
 *
 * // add values to the reverse map
 * bimap.radd("second", 3, 4, 5)
 *
 * // perform lookups in both directions
 * assertEquals(bimap.get(1), new Set(["one", "first"]))
 * assertEquals(bimap.rget("second"), new Set([2, 3, 4, 5]))
 *
 * // remove entries while maintaining invertibility
 * bimap.delete(6) // `false` because the key never existed
 * bimap.delete(2) // `true`
 * assertEquals(bimap.rget("second"), new Set([3, 4, 5]))
 * bimap.rremove("second", 4, 5, 6, 7)
 * assertEquals(bimap.rget("second"), new Set([3]))
 *
 * // iterate over the forward map
 * const bimap_entries: [key: number, values: string[]][] = []
 * for (const [k, v] of bimap) { bimap_entries.push([k, [...v]]) }
 * assertEquals(bimap_entries, [
 * 	[1, ["one", "first"]],
 * 	[3, ["second"]],
 * 	[4, []],
 * 	[5, []],
 * ])
 *
 * // clear the entire bidirectional map
 * bimap.clear()
 * assertEquals([...bimap.entries()], [])
 * ```
*/
export declare class InvertibleMap<K, V> implements InvertibleMapBase<K, V> {
    /** forward mapping. not intended for direct access, since manually mutating it will ruin the invertibility with the reverse map if you're not careful. */
    fmap: Map<K, Set<V>>;
    /** reverse mapping. not intended for direct access, since manually mutating it will ruin the invertibility with the forward map if you're not careful. */
    rmap: Map<V, Set<K>>;
    /** size of the forward map */
    size: number;
    /** size of the reverse map */
    rsize: number;
    /** at a specific `key` in the forward map, add the list of `items`,
     * and then also assign `key` to the list of items in the reverse map to maintain invertibility.
    */
    add: (key: K, ...items: V[]) => void;
    /** at a specific `key` in the reverse map, add the list of `items`,
     * and then also assign `key` to the list of items in the forward map to maintain invertibility.
    */
    radd: (key: V, ...items: K[]) => void;
    /** clear out both forward and reverse maps completely of all their entries */
    clear: () => void;
    /** delete a `key` in the forward map, and also remove its mentions from the reverse map's entries. <br>
     * if `keep_key` is optionally set to `true`, we will only clear out the set of items held by the forward map at the key,
     * and keep the key itself intact (along with the original (now mutated and clear) `Set<V>` which the key refers to)
    */
    delete: (key: K, keep_key?: boolean) => boolean;
    /** delete a `key` in the reverse map, and also remove its mentions from the forward map's entries. <br>
     * if `keep_key` is optionally set to `true`, we will only clear out the set of items held by the reverse map at the key,
     * and keep the key itself intact (along with the original (now mutated and clear) `Set<V>` which the key refers to)
    */
    rdelete: (key: V, keep_key?: boolean) => boolean;
    /** at a specific `key` in the forward map, remove/delete the list of `items`,
     * and then also remove `key` from the list of items in the reverse map to maintain invertibility.
    */
    remove: (key: K, ...items: V[]) => void;
    /** at a specific `key` in the reverse map, remove/delete the list of `items`,
     * and then also remove `key` from the list of items in the forward map to maintain invertibility.
    */
    rremove: (key: V, ...items: K[]) => void;
    forEach: (callbackfn: (value: Set<V>, key: K, map: Map<K, Set<V>>) => void, thisArg?: any) => void;
    rforEach: (callbackfn: (value: Set<K>, key: V, map: Map<V, Set<K>>) => void, thisArg?: any) => void;
    get: (key: K) => Set<V> | undefined;
    rget: (key: V) => Set<K> | undefined;
    has: (key: K) => boolean;
    rhas: (key: V) => boolean;
    set: (key: K, value: Iterable<V>) => this;
    rset: (key: V, value: Iterable<K>) => this;
    entries: Map<K, Set<V>>["entries"];
    rentries: Map<V, Set<K>>["entries"];
    keys: Map<K, V>["keys"];
    rkeys: Map<V, K>["keys"];
    values: Map<K, Set<V>>["values"];
    rvalues: Map<V, Set<K>>["values"];
    [Symbol.iterator]: Map<K, Set<V>>["entries"];
    [Symbol.toStringTag]: string;
    /** create an empty invertible map. <br>
     * optionally provide an initial `forward_map` to populate the forward mapping, and then automatically deriving the reverse mapping from it. <br>
     * or provide an initial `reverse_map` to populate the reverse mapping, and then automatically deriving the froward mapping from it. <br>
     * if both `forward_map` and `reverse_map` are provided, then it will be up to YOU to make sure that they are actual inverses of each other. <br>
     * @param forward_map initiallize by populating with an optional initial forward map (the reverse map will be automatically computed if `reverse_map === undefined`)
     * @param reverse_map initiallize by populating with an optional initial reverse map (the forward map will be automatically computed if `forward_map === undefined`)
     */
    constructor(forward_map?: Map<K, Set<V>> | undefined, reverse_map?: Map<V, Set<K>> | undefined);
}
/** a directed acyclic graph edges mapping optimized for looking up number of connections going **into** and **out of** a node */
export type GraphEdges<ID, FROM extends ID = ID, TO extends ID = ID> = Map<FROM, Set<TO>>;
export declare class TopologicalScheduler<ID, FROM extends ID = ID, TO extends ID = ID> {
    /** the edges depict the directed edge from an id (`key: FROM`) to a set of ids (`value: Set<TO>`) */
    readonly edges: GraphEdges<ID, FROM, TO>;
    /** after a source id is fired, this stack will get filled up with dependent node ids in topological order. <br>
     * the top item in the stack will correspond to the first node id that must be processed (least dependency),
     * while the bottom one will be the last to be resolved (most dependencies). <br>
     * use the {@link pop} method to pop out the top from this stack, or use the {@link seek} method just to view the top without popping.
    */
    readonly stack: ID[];
    /** declare ids that need to be fired simultaneously.
     * once the ids are fired, the function will topologically traverse the {@link edges} (via DFS),
     * and eventually push the order of resoluion into the {@link stack}. <br>
     * make sure that the source ids are NOT dependent on one another, because that will break the topological ordering of the output stack.
    */
    fire: (...source_ids: FROM[]) => void;
    /** while processing topologically ordered {@link stack}, you may block certain ids so that they and
     * their (pure) dependents down the line are removed from the {@link stack}. <br>
     * if no id is provided (no arguments), then we will assume that you wish to block the most recently popped id.
    */
    block: (...block_ids: FROM[] | never[]) => void;
    /** clear the topologically ordered {@link stack}, perhaps to restart the traversal. */
    clear: () => void;
    /** pop the top element from the topologically ordered {@link stack}. */
    pop: () => ID | undefined;
    /** view the top element from the topologically ordered {@link stack} without popping it. */
    seek: () => ID | undefined;
    /** iterate over the topologically ordered {@link stack} of ids */
    [Symbol.iterator]: () => IterableIterator<ID>;
    constructor(edges: GraphEdges<ID, FROM, TO>);
}
export type InvertibleGraphEdges<ID extends PropertyKey, FROM extends ID = ID, TO extends ID = ID> = InvertibleMap<FROM, TO>;
export declare class TopologicalAsyncScheduler<ID extends PropertyKey, FROM extends ID = ID, TO extends ID = ID> {
    pending: Set<TO>;
    clear: () => void;
    fire: (...source_ids: FROM[]) => void;
    resolve: (...ids: ID[]) => TO[];
    constructor(invertible_edges: InvertibleGraphEdges<ID, FROM, TO>);
}
/** definition of an object that provides map-like methods */
export interface SimpleMap<K, V> {
    get(key: K): V | undefined;
    set(key: K, value: V): this;
    has(key: K): boolean;
    delete(key: K): boolean;
}
/** a map like object, similar to a {@link WeakMap}, that weakly stores keys of Objects and Functions,
 * but can also (strongly) store primitive objects as keys, similar to {@link Map}. hence the name, `HybridWeakMap` <br>
*/
export declare class HybridWeakMap<K, V> implements SimpleMap<K, V> {
    wmap: WeakMap<K & WeakKey, V>;
    smap: Map<K & PropertyKey, V>;
    private pick;
    get(key: K): V | undefined;
    set(key: K, value: V): this;
    has(key: K): boolean;
    delete(key: K): boolean;
}
/** a tree object (constructed by class returned by {@link treeClass_Factory}) with no initialized value will have this symbol set as its default value */
export declare const TREE_VALUE_UNSET: unique symbol;
export declare const treeClass_Factory: (base_map_class: new <KT, VT>(...args: any[]) => SimpleMap<KT, VT>) => {
    new <K, V>(value?: V | typeof TREE_VALUE_UNSET): {
        value: V | typeof TREE_VALUE_UNSET;
        getDeep(reverse_keys: K[], create_intermediate?: true): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        };
        getDeep(reverse_keys: K[], create_intermediate?: boolean): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        };
        setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        /** check if a deep child exists with the provided array of reversed keys. <br>
         * this is implemented to be slightly quicker than {@link getDeep}
        */
        hasDeep(reverse_keys: K[]): boolean;
        delDeep(reverse_keys: K[]): boolean;
        get(key: K): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        set(key: K, value: {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        }): any;
        has(key: K): boolean;
        delete(key: K): boolean;
    };
};
export declare const WeakTree: {
    new <K, V>(value?: V | typeof TREE_VALUE_UNSET): {
        value: V | typeof TREE_VALUE_UNSET;
        getDeep(reverse_keys: K[], create_intermediate?: true): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        };
        getDeep(reverse_keys: K[], create_intermediate?: boolean): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        };
        setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        /** check if a deep child exists with the provided array of reversed keys. <br>
         * this is implemented to be slightly quicker than {@link getDeep}
        */
        hasDeep(reverse_keys: K[]): boolean;
        delDeep(reverse_keys: K[]): boolean;
        get(key: K): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        set(key: K, value: {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        }): any;
        has(key: K): boolean;
        delete(key: K): boolean;
    };
};
export declare const StrongTree: {
    new <K, V>(value?: V | typeof TREE_VALUE_UNSET): {
        value: V | typeof TREE_VALUE_UNSET;
        getDeep(reverse_keys: K[], create_intermediate?: true): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        };
        getDeep(reverse_keys: K[], create_intermediate?: boolean): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        };
        setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        /** check if a deep child exists with the provided array of reversed keys. <br>
         * this is implemented to be slightly quicker than {@link getDeep}
        */
        hasDeep(reverse_keys: K[]): boolean;
        delDeep(reverse_keys: K[]): boolean;
        get(key: K): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        set(key: K, value: {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        }): any;
        has(key: K): boolean;
        delete(key: K): boolean;
    };
};
export declare const HybridTree: {
    new <K, V>(value?: V | typeof TREE_VALUE_UNSET): {
        value: V | typeof TREE_VALUE_UNSET;
        getDeep(reverse_keys: K[], create_intermediate?: true): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        };
        getDeep(reverse_keys: K[], create_intermediate?: boolean): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        };
        setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        /** check if a deep child exists with the provided array of reversed keys. <br>
         * this is implemented to be slightly quicker than {@link getDeep}
        */
        hasDeep(reverse_keys: K[]): boolean;
        delDeep(reverse_keys: K[]): boolean;
        get(key: K): {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        } | undefined;
        set(key: K, value: {
            value: any;
            getDeep(reverse_keys: K[], create_intermediate?: true): any;
            getDeep(reverse_keys: K[], create_intermediate?: boolean): any | undefined;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): any;
            setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): any | undefined;
            /** check if a deep child exists with the provided array of reversed keys. <br>
             * this is implemented to be slightly quicker than {@link getDeep}
            */
            hasDeep(reverse_keys: K[]): boolean;
            delDeep(reverse_keys: K[]): boolean;
            get(key: K): any | undefined;
            set(key: K, value: any): any;
            has(key: K): boolean;
            delete(key: K): boolean;
        }): any;
        has(key: K): boolean;
        delete(key: K): boolean;
    };
};
export declare class StackSet<T> extends Array<T> {
    static [Symbol.species]: ArrayConstructor;
    $set: Set<T>;
    $add: (value: T) => Set<T>;
    $del: (value: T) => boolean;
    /** determines if an item exists in the stack. <br>
     * this operation is as fast as {@link Set.has}, because that's what's being used internally.
     * so expect no overhead.
    */
    includes: (value: T) => boolean;
    /** peek at the top item of the stack without popping */
    top: (...args: this["at"] extends import("./binder.js").BindableFunction<this, [number], infer P extends any[], ReturnType<this["at"]>> ? P : never) => ReturnType<this["at"]>;
    /** synchronize the ordering of the stack with the underlying {@link $set} object's insertion order (i.e. iteration ordering). <br>
     * the "f" in "fsync" stands for "forward"
    */
    fsync(): number;
    /** synchronize the insertion ordering of the underlying {@link $set} with `this` stack array's ordering. <br>
     * this process is more expensive than {@link fsync}, as it has to rebuild the entirety of the underlying set object. <br>
     * the "r" in "rsync" stands for "reverse"
    */
    rsync(): number;
    /** reset a `StackSet` with the provided initializing array of unique items */
    reset(initial_items?: Array<T>): void;
    constructor(initial_items?: Array<T>);
    /** pop the item at the top of the stack. */
    pop(): T | undefined;
    /** push **new** items to stack. doesn't alter the position of already existing items. <br>
     * @returns the new length of the stack.
    */
    push(...items: T[]): number;
    /** push items to front of stack, even if they already exist in the middle. <br>
     * @returns the new length of the stack.
    */
    pushFront(...items: T[]): number;
    /** remove the item at the bottom of the stack. */
    shift(): T | undefined;
    /** insert **new** items to the rear of the stack. doesn't alter the position of already existing items. <br>
     * note that this operation is expensive, because it clears and then rebuild the underlying {@link $set}
     * @returns the new length of the stack.
    */
    unshift(...items: T[]): number;
    /** inserts items to the rear of the stack, even if they already exist in the middle. <br>
     * note that this operation is expensive, because it clears and then rebuild the underlying {@link $set}
     * @returns the new length of the stack.
    */
    unshiftRear(...items: T[]): number;
    /** delete an item from the stack */
    del(item: T): boolean;
    /** delete multiple items from the stack */
    delMany(...items: T[]): void;
}
/** a stack object with limited capacity. <br>
 * when the capacity hits the maximum length, then it is reduced down to the minimum capacity.
*/
export declare class LimitedStack<T> extends Array<T> {
    static [Symbol.species]: ArrayConstructor;
    /** minimum capacity of the stack. <br>
     * when the stack size hits the maximum capacity {@link max}, the oldest items (at the
     * bottom of the stack) are discarded so that the size goes down to the minimum specified here
    */
    min: number;
    /** maximum capacity of the stack. <br>
     * when the stack size hits this maximum capacity, the oldest items (at the
     * bottom of the stack) are discarded so that the size goes down to {@link min}
    */
    max: number;
    /** provide an optional callback function which is called everytime items are discarded by the stack resizing function {@link resize} */
    resize_cb?: (discarded_items: T[]) => void;
    constructor(min_capacity: number, max_capacity: number, resize_callback?: (discarded_items: T[]) => void);
    /** enforce resizing of stack if necessary. oldest item (at the bottom of the stack) are discarded if the max capacity has been exceeded. <br> */
    resize(arg: any): typeof arg;
    push(...items: T[]): number;
}
/** a stack set object with limited capacity. <br>
 * when the capacity hits the maximum length, then it is reduced down to the minimum capacity.
*/
export declare class LimitedStackSet<T> extends StackSet<T> {
    /** minimum capacity of the stack. <br>
     * when the stack size hits the maximum capacity {@link max}, the oldest items (at the
     * bottom of the stack) are discarded so that the size goes down to the minimum specified here
    */
    min: number;
    /** maximum capacity of the stack. <br>
     * when the stack size hits this maximum capacity, the oldest items (at the
     * bottom of the stack) are discarded so that the size goes down to {@link min}
    */
    max: number;
    /** provide an optional callback function which is called everytime items are discarded by the stack resizing function {@link resize} */
    resize_cb?: (discarded_items: T[]) => void;
    constructor(min_capacity: number, max_capacity: number, resize_callback?: (discarded_items: T[]) => void);
    /** enforce resizing of stack if necessary. oldest item (at the bottom of the stack) are discarded if the max capacity has been exceeded. <br> */
    resize(arg: any): typeof arg;
    push(...items: T[]): number;
    pushFront(...items: T[]): number;
}
export interface ChainedPromiseQueueConfig<T> {
    /** provide a callback whenever the queue of promises goes empty (each promise element is fulfilled) */
    onEmpty?: () => void;
    /** specify if {@link onEmpty} should be immediately called when the queue is first created. defaults to `false` */
    isEmpty?: boolean;
}
/** a collection of promises that can be further chained with a sequence of "then" functions.
 * once a certain promise in the collection is completed (i.e. goes through all of the chained then functions),
 * then it gets deleted from this collection.
 *
 * TODO: things to renovate about this class
 * - rename this class
 * - move it to the promiseman submodule that you'll create in the future
 * - revise the algorithm and make improvements/enhace the logic if possible
 * - use `[Symbol.species] = Array` so that array instances spawned from this class would create a regular `Array` instead of a subclass of it.
 * - see if `Symbol.asyncIterator` can be used for iterating over the current list of task/job bundles asynchronously
 *
 * @example
 * ```ts
 * const promise_queue = new ChainedPromiseQueue([
 * 	[(value: string) => value.toUpperCase()],
 * 	[(value: string) => "Result: " + value],
 * 	[(value: string) => new Promise((resolve) => {setTimeout(() => {resolve(value)}, 500)})],
 * 	[(value: string) => console.log(value)],
 * ])
 * // push a new promise into the collection, which will be processed through the defined sequence of chained actions.
 * let a: Promise<string>, b: Promise<string>
 * promise_queue.push(
 * 	(a = new Promise((resolve) => resolve("hello"))),
 * )
 * // the promise will go through the action chain: [toUpperCase, "Result: " + value, 500ms delay, console.log(value)]
 * // console output: "Result: HELLO" after 500ms
 *
 * // we can repeat this chain of promises with yet another value:
 * promise_queue.push((b = Promise.resolve("world")))
 * // console output: "Result: WORLD" after 500ms
 *
 * // wait for the two 500ms pending promises
 * await Promise.all(promise_queue.pending)
 * await a
 * await b
 * ```
*/
export declare class ChainedPromiseQueue<T> extends Array<Promise<T>> {
    static [Symbol.species]: ArrayConstructor;
    /** the chain of the "then" functions to run each newly pushed promise through. <br>
     * you may dynamically modify this sequence so that all newly pushed promises will have to go through a different set of "then" functions. <br>
     * do note that old (already existing) promises will not be affected by the modified chain of "then" functions.
     * they'll stick to their original sequence of thens because that gets decided during the moment when a promise is pushed into this collection.
    */
    chain: [
        then0?: [
            onfulfilled: (value: T) => MaybePromiseLike<any | void>,
            onrejected?: (reason: any) => MaybePromiseLike<any | void>
        ],
        ...Array<[
            onfulfilled: (value: any) => MaybePromiseLike<any | void>,
            onrejected?: (reason: any) => MaybePromiseLike<any | void>
        ]>
    ];
    /** an array of promises consisting of all the final "then" calls, after which (when fulfilled) the promise would be shortly deleted since it will no longer be pending.
     * the array indexes of `this.pending` line up with `this`, in the sense that `this.pending[i] = this[i].then(this.chain.at(0))...then(this.chain.at(-1))`.
     * once a promise inside of `pending` is fulfilled, it will be shortly deleted (via splicing) from `pending`,
     * and its originating `Promise` which was pushed  into `this` collection will also get removed. <br>
     * (the removal is done by the private {@link del} method)
     *
     * ```ts
     * const do_actions = new ChainedPromiseQueue<string>([
     * 	[(value: string) => value.toUpperCase()],
     * 	[(value: string) => "Result: " + value],
     * 	[(value: string) => new Promise((resolve) => {setTimeout(() => {resolve(value)}, 1000)})],
     * 	[(value: string) => console.log(value)],
     * ])
     * const chain_of_actions = do_actions.chain
     * const number_of_actions = chain_of_actions.length
     *
     * // const my_promise = new Promise<string>((resolve, reject) => {
     * // 	//do async stuff
     * // })
     * // do_actions.push(my_promise)
     * // let index = do_actions.indexOf(my_promise) // === do_actions.length - 1
     * //
     * // // the following two are functionally/structurally equivalent:
     * // do_actions.pending[index] == do_actions[index]
     * // 		.then(chain_of_actions[0]![0], chain_of_actions[0]![1])
     * // 		.then(chain_of_actions[1]![0], chain_of_actions[1]![1])
     * // 		// ... lots of thens
     * // 		.then(chain_of_actions[number_of_actions - 1]![0], chain_of_actions[number_of_actions - 1]![1])
     * ```
    */
    pending: Promise<any>[];
    onEmpty?: ChainedPromiseQueueConfig<T>["onEmpty"];
    constructor(then_functions_sequence?: ChainedPromiseQueue<T>["chain"], { onEmpty, isEmpty }?: ChainedPromiseQueueConfig<T>);
    push(...new_promises: Promise<T>[]): number;
    /** delete a certain promise that has been chained with the "then" functions.
     * @param completed_pending_promise the promise to be deleted from {@link pending} and {@link this} collection of promises
     * @returns `true` if the pending promise was found and deleted, else `false` will be returned
    */
    private del;
    /** @illegal this method should not be called, as it will break the internal indexing */
    shift: never;
    /** @illegal this method should not be called, as it will break the internal indexing */
    unshift: never;
    /** @illegal this method should not be called, as it will break the internal indexing */
    pop: never;
}
//# sourceMappingURL=collections.d.ts.map