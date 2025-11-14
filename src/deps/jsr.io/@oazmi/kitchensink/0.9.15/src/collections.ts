/** contains a set of common collections.
 * 
 * @module
*/

import { array_from, array_isEmpty, console_log, object_assign, symbol_iterator, symbol_toStringTag } from "./alias.js"
import {
	bind_array_clear,
	bind_array_pop,
	bind_array_push,
	bind_map_delete,
	bind_map_entries,
	bind_map_forEach,
	bind_map_get,
	bind_map_has,
	bind_map_keys,
	bind_map_set,
	bind_map_values,
	bind_set_add,
	bind_set_delete,
	bind_set_has,
	bind_stack_seek,
} from "./binder.js"
import { DEBUG } from "./deps.js"
import { max, min, modulo } from "./numericmethods.js"
import { isComplex } from "./struct.js"
import type { MaybePromiseLike, PrefixProps } from "./typedefs.js"


/** a very simple python-like `List`s class, that allows for in-between insertions, deletions, and replacements, to keep the list compact.
 * 
 * TODO: add examples
*/
export class List<T> extends Array<T> {
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
	static override[Symbol.species] = Array

	constructor(items: Iterable<T> = []) {
		super()
		super.push(...items)
	}

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
	insert(index: number, item: T): void {
		const i = modulo(index, this.length) + (index < 0 ? 1 : 0)
		this.splice(i, 0, item)
	}

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
	delete(index: number): T | undefined {
		return this.splice(index, 1)[0]
	}

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
	swap(index1: number, index2: number): void {
		// destructured assignment at an array index is possible. see "https://stackoverflow.com/a/14881632".
		[this[index2], this[index1]] = [this[index1], this[index2]]
	}

	/** get an item at the specified `index`.
	 * 
	 * this is equivalent to using index-based getter: `my_list[index]`.
	*/
	get(index: number): T | undefined { return this[index] }

	/** sets the value at the specified index.
	 * 
	 * prefer using this method instead of index-based assignment, because subclasses may additionally cary out more operations with this method.
	 * for attaining compatibility between `List` and its subclasses, it would be in your best interest to use the `set` method.
	 * - **not recommended**: `my_list[index] = "hello"`
	 * - **preferred**: `my_list.set(index, "hello")`
	*/
	set(index: number, value: T): T { return (this[index] = value) }

	static override from<T, U = T>(arrayLike: ArrayLike<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): List<U> {
		return new this<U>(array_from(arrayLike, mapfn!, thisArg))
	}

	static override of<T>(...items: T[]): List<T> {
		return this.from<T>(items)
	}
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
export class RcList<T> extends List<T> {
	/** the reference counting `Map`, that bookkeeps the multiplicity of each item in the list. */
	protected readonly rc: Map<T, number> = new Map()

	/** get the reference count (multiplicity) of a specific item in the list.
	 * 
	 * note that the reference count for a non-existing item is `undefined` instead of `0`.
	*/
	readonly getRc = bind_map_get(this.rc)

	/** set the reference count of a specific item in the list. */
	protected readonly setRc = bind_map_set(this.rc)

	/** delete the reference counting of a specific item in the list. a `true` is returned if the item did exist in {@link rc}, prior to deletion. */
	protected readonly delRc = bind_map_delete(this.rc)

	constructor(items: Iterable<T> = []) {
		super()
		this.push(...items)
	}

	/** this overridable method gets called when a new unique item is determined to be added to the list.
	 * 
	 * this method is called _before_ the item is actually added to the array, but it is executed right _after_ its reference counter has incremented to `1`.
	 * 
	 * > [!note]
	 * > avoid accessing or mutating the array itself in this method's body (consider it an undefined behavior).
	 * 
	 * @param item the item that is being added.
	*/
	protected onAdded(item: T): void { }

	/** this overridable method gets called when a unique item (reference count of 1) is determined to be removed from the list.
	 * 
	 * this method is called _before_ the item is actually removed from the array, but it is executed right _after_ its reference counter has been deleted.
	 * 
	 * > [!note]
	 * > avoid accessing or mutating the array itself in this method's body (consider it an undefined behavior).
	 * 
	 * @param item the item that is being removed.
	*/
	protected onDeleted(item: T): void { }

	/** increments the reference count of each item in the provided array of items.
	 * 
	 * @param items the items whose counts are to be incremented.
	*/
	protected incRcs(...items: T[]) {
		const { getRc, setRc } = this
		items.forEach((item) => {
			const new_count = (getRc(item) ?? 0) + 1
			setRc(item, new_count)
			if (new_count === 1) { this.onAdded(item) }
		})
	}

	/** decrements the reference count of each item in the provided array of items.
	 * 
	 * @param items the items whose counts are to be decremented.
	*/
	protected decRcs(...items: T[]) {
		const { getRc, setRc, delRc } = this
		items.forEach((item) => {
			const new_count = (getRc(item) ?? 0) - 1
			if (new_count > 0) {
				setRc(item, new_count)
			} else {
				delRc(item)
				this.onDeleted(item)
			}
		})
	}

	override push(...items: T[]): number {
		const return_value = super.push(...items)
		this.incRcs(...items)
		return return_value
	}

	override pop(): T | undefined {
		const
			previous_length = this.length,
			item = super.pop()
		if (this.length < previous_length) { this.decRcs(item as T) }
		return item
	}

	override shift(): T | undefined {
		const
			previous_length = this.length,
			item = super.shift()
		if (this.length < previous_length) { this.decRcs(item as T) }
		return item
	}

	override unshift(...items: T[]): number {
		const return_value = super.unshift(...items)
		this.incRcs(...items)
		return return_value
	}

	override splice(start: number, deleteCount?: number, ...items: T[]): T[] {
		const removed_items = super.splice(start, deleteCount as number, ...items)
		this.incRcs(...items)
		this.decRcs(...removed_items)
		return removed_items
	}

	override swap(index1: number, index2: number): void {
		const max_index = max(index1, index2)
		if (max_index >= this.length) {
			// run the `this.set` method to extend the array, while reference counting the new gap filling insertions (of `undefined` elements).
			this.set(max_index, undefined as T)
		}
		super.swap(index1, index2)
	}

	/** sets the value at the specified index, updating the counter accordingly.
	 * 
	 * always use this method instead of index-based assignment, because the latter is not interceptable (except when using proxies):
	 * - **don't do**: `my_list[index] = "hello"`
	 * - **do**: `my_list.set(index, "hello")`
	*/
	override set(index: number, value: T): T {
		const
			old_value = super.get(index),
			old_length = this.length,
			increase_in_array_length = (index + 1) - old_length
		if (increase_in_array_length === 1) {
			// we handle this special case separately, because it would be more performant this way,
			// and the `onDelete` method will not get called (due to `this.decRcs(old_value)`) for the just recently added `undefined` element (which is also immediately deleted)
			this.push(value)
		} else if ((value !== old_value) || (increase_in_array_length > 1)) {
			value = super.set(index, value)
			this.incRcs(value)
			if (increase_in_array_length > 0) {
				// if the array's length has extended due to the assignment,
				// then we shall increment the count of `undefined` items, by the amount the array was extended by.
				const { getRc, setRc } = this
				setRc(undefined as T, (getRc(undefined as T) ?? 0) + increase_in_array_length)
			}
			this.decRcs(old_value as T)
		}
		return value
	}

	static override from<T, U = T>(arrayLike: ArrayLike<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): RcList<U> {
		return new this<U>(array_from(arrayLike, mapfn!, thisArg))
	}

	declare static of: <T>(...items: T[]) => RcList<T>
}

// TODO: in `tsignal_ts`, remove implementations of `List` and `RcList` and import them from here instead.

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
export class Deque<T> {
	private items: T[]
	private front: number = 0
	private back: number
	count: number = 0

	/** a double-ended circular queue, similar to python's `collection.deque`.
	 * 
	 * @param length specify the maximum length of the queue.
	 *   pushing more items than the length will remove the items from the opposite side, so as to maintain the size.
	*/
	constructor(public readonly length: number) {
		this.items = Array(length)
		this.back = length - 1
	}

	/** iterate over the items in this deque, starting from the rear-most item, and ending at the front-most item. */
	*[Symbol.iterator](): Iterator<T> {
		// NOTE: for this method, we **must** directly use `[Symbol.iterator]` instead of using `[symbol_iterator]` from "./alias.ts",
		//   because `esbuild >= 20.0` cannot treeshake the later expression, but it can treeshake/eliminate this class if it is not used during bundling.
		const count = this.count
		for (let i = 0; i < count; i++) {
			yield this.at(i)!
		}
	}

	/** inserts one or more items to the rear of the deque.
	 * 
	 * if the deque is full, it will remove the front item before adding a new item.
	*/
	pushBack(...items: T[]): void {
		for (const item of items) {
			if (this.count === this.length) { this.popFront() }
			this.items[this.back] = item
			this.back = modulo(this.back - 1, this.length)
			this.count++
		}
	}

	/** inserts one or more items to the front of the deque.
	 * 
	 * if the deque is full, it will remove the rear item before adding a new item.
	*/
	pushFront(...items: T[]): void {
		for (const item of items) {
			if (this.count === this.length) { this.popBack() }
			this.items[this.front] = item
			this.front = modulo(this.front + 1, this.length)
			this.count++
		}
	}

	/** get the item at the back of the deque without removing/popping it. */
	getBack(): T | undefined {
		if (this.count === 0) { return undefined }
		return this.seek(0)
	}

	/** get the item at the front of the deque without removing/popping it. */
	getFront(): T | undefined {
		if (this.count === 0) { return undefined }
		return this.seek(-1)
	}

	/** removes/pops the item at the back of the deque and returns it. */
	popBack(): T | undefined {
		if (this.count === 0) { return undefined }
		this.back = modulo(this.back + 1, this.length)
		const item = this.items[this.back]
		this.items[this.back] = undefined as T
		this.count--
		return item
	}

	/** removes/pops the item at the front of the deque and returns it. */
	popFront(): T | undefined {
		if (this.count === 0) { return undefined }
		this.front = modulo(this.front - 1, this.length)
		const item = this.items[this.front]
		this.items[this.front] = undefined as T
		this.count--
		return item
	}

	/** rotates the deque `steps` number of positions to the right.
	 * 
	 * if `steps` is negative, then it will rotate in the left direction.
	 * when the deque is not empty, rotating with `step = 1` is equivalent to `this.pushBack(this.popFront())`
	*/
	rotate(steps: number): void {
		const { front, back, length, count, items } = this
		if (count === 0) { return }
		steps = modulo(steps, count)
		if (count < length) {
			// move `steps` number of items from the front to the rear
			for (let i = 0; i < steps; i++) {
				const
					b = modulo(back - i, length),
					f = modulo(front - i - 1, length)
				items[b] = items[f]
				items[f] = undefined as T
			}
		}
		this.front = modulo(front - steps, length)
		this.back = modulo(back - steps, length)
	}

	/** reverses the order of the items in the deque. */
	reverse(): void {
		this.normalize()
		const { count, length, items } = this
		items.reverse()
		this.front = 0
		this.back = modulo(0 - count - 1, length)
	}

	/** normalize the internal `items` array so that it beings with the first element of the deque.
	 * 
	 * this method effectively makes it so that `this.back` becomes `this.length - 1`, and `this.front` becomes `this.count`.
	 * this is useful for when you'd like to carry out a slightly complex re-indexing or mutation task on `this.items`,
	 * but don't want to compute the indexes at every iteration of the subtasks involved.
	*/
	private normalize(): void {
		const { length, count, back, items } = this
		if (length <= 0) { return }
		const
			rear_item_index = modulo(back + 1, length),
			rear_segment = items.slice(rear_item_index, rear_item_index + count),
			remaining_items_count = count - rear_segment.length,
			front_segment = items.slice(0, remaining_items_count),
			empty_segment = Array(length - count).fill(undefined)
		// flush the `items` array completely, and fill it with the new ordered items.
		items.splice(0, length, ...rear_segment, ...front_segment, ...empty_segment)
		this.back = length - 1
		this.front = count
	}

	/** provide an index relative to `this.back + 1`, and get the appropriate resolved index `i` that can be used to retrieve `this.items[i]`.
	 * 
	 * example:
	 * - given that a `deque` has a `length` of `5` and a `count` of `3` (i.e. carrying three elements), then:
	 * - `deque.items[deque.resolveIndex(0)] === "rear-most element of the deque"`
	 * - `deque.items[deque.resolveIndex(-1)] === "fifth element ahead of the rear of the deque"`
	 * - `deque.items[deque.resolveIndex(5)] === "fifth element ahead of the rear of the deque"`
	 * - `deque.items[deque.resolveIndex(6)] === "rear-most element of the deque"`
	*/
	private resolveIndex(index: number): number { return modulo(this.back + index + 1, this.length) }

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
	private resolveSeekIndex(seek_index: number): number {
		const
			{ front, back, count, length } = this,
			base_index = seek_index < 0 ? front : (back + 1),
			normalized_seek_index = seek_index < 0
				? ((seek_index + 1) % count) - 1
				: seek_index % count
		return modulo(base_index + normalized_seek_index, length)
	}

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
	at(index: number): T | undefined { return this.items[this.resolveIndex(index)] }

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
	seek(seek_index: number): T | undefined { return this.items[this.resolveSeekIndex(seek_index)] }

	/** replaces the item at the specified index with a new item, always ensuring the index is bound to the current element {@link count} amount
	 * (as opposed the the full deque {@link length}), so that unoccupied element slots are **not** replaced.
	 * i.e. only existing items can be replaced.
	*/
	replace(seek_index: number, item: T): void {
		// note that replacing does not increment the indexes of `front` and `back`.
		this.items[this.resolveSeekIndex(seek_index)] = item
	}

	/** inserts additional items at the specified seek-index, shifting all items ahead of it to the front.
	 * if the deque is full, it removes the front item before adding the new additional items.
	 * 
	 * ~~TODO: current implementation is incomplete, because it involves too many index computations, and I'm too lazy for that.
	 * plus, president biden is going to drop the "ball" in times square today on new year's eve.
	 * obviously I wouldn't want to miss this historic moment. /s~~
	 * in place of a lackluster "ball drop", we got a much more exciting thunder show from the Almighty Himself!
	*/
	insert(seek_index: number, ...insert_items: T[]): void {
		this.normalize()
		const
			{ count, length, items } = this,
			new_count = min(count + insert_items.length, length),
			insertion_index = this.resolveSeekIndex(seek_index) + (seek_index < 0 ? 1 : 0),
			forward_shifted_items = items.splice(insertion_index)
		// inserting the `insert_items`, and adding back the previously popped items (`forward_shifted_items`) 
		items.push(...insert_items, ...forward_shifted_items)
		// trimming the `items` array to ensure that it stays within its desired `length`
		items.splice(length)
		this.count = new_count
		this.front = new_count
	}

	resize(new_length: number): void {
		this.normalize()
		const
			{ length, count, items } = this,
			length_difference = new_length - length,
			should_trim = length_difference < 0,
			start = should_trim ? new_length : length,
			new_count = min(count, start),
			deletions = should_trim ? (-length_difference) : 0,
			additions = should_trim ? 0 : length_difference
		items.splice(start, deletions, ...Array(additions).fill(undefined))
		// @ts-ignore: the `length` is a readonly property. but I want this method to have an exception to modify it.
		this.length = new_length
		this.back = new_length - 1
		this.front = new_count
		this.count = new_count
	}
}

/** invert a `Map<F, Set<R>>` to `Map<R, Set<F>>`. */
export const invertMap = <F, R>(forward_map: Map<F, Set<R>>): Map<R, Set<F>> => {
	const reverse_map_keys: R[] = []
	forward_map.forEach((rset) => { reverse_map_keys.push(...rset) })
	const
		reverse_map: Map<R, Set<F>> = new Map(
			[...(new Set<R>(reverse_map_keys))].map(
				(rkey) => [rkey, new Set<F>()]
			)
		),
		get_reverse_map = bind_map_get(reverse_map)
	for (const [fkey, rset] of forward_map) {
		rset.forEach(
			(rkey) => get_reverse_map(rkey)!.add(fkey)
		)
	}
	return reverse_map
}

// TODO: from this line onwards, the doc comments, doc tests, and conciseness have yet to be reviewed again.

export type InvertibleMapBase<K, V> = Map<K, Set<V>> & Omit<PrefixProps<Map<V, Set<K>>, "r">, "rclear" | "rset"> & { rset: (key: V, value: Iterable<K>) => InvertibleMapBase<K, V> }

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
export class InvertibleMap<K, V> implements InvertibleMapBase<K, V> {
	/** forward mapping. not intended for direct access, since manually mutating it will ruin the invertibility with the reverse map if you're not careful. */
	declare fmap: Map<K, Set<V>>

	/** reverse mapping. not intended for direct access, since manually mutating it will ruin the invertibility with the forward map if you're not careful. */
	declare rmap: Map<V, Set<K>>

	/** size of the forward map */
	declare size: number

	/** size of the reverse map */
	declare rsize: number

	/** at a specific `key` in the forward map, add the list of `items`,
	 * and then also assign `key` to the list of items in the reverse map to maintain invertibility.
	*/
	declare add: (key: K, ...items: V[]) => void

	/** at a specific `key` in the reverse map, add the list of `items`,
	 * and then also assign `key` to the list of items in the forward map to maintain invertibility.
	*/
	declare radd: (key: V, ...items: K[]) => void

	/** clear out both forward and reverse maps completely of all their entries */
	declare clear: () => void

	/** delete a `key` in the forward map, and also remove its mentions from the reverse map's entries. <br>
	 * if `keep_key` is optionally set to `true`, we will only clear out the set of items held by the forward map at the key,
	 * and keep the key itself intact (along with the original (now mutated and clear) `Set<V>` which the key refers to)
	*/
	declare delete: (key: K, keep_key?: boolean) => boolean

	/** delete a `key` in the reverse map, and also remove its mentions from the forward map's entries. <br>
	 * if `keep_key` is optionally set to `true`, we will only clear out the set of items held by the reverse map at the key,
	 * and keep the key itself intact (along with the original (now mutated and clear) `Set<V>` which the key refers to)
	*/
	declare rdelete: (key: V, keep_key?: boolean) => boolean

	/** at a specific `key` in the forward map, remove/delete the list of `items`,
	 * and then also remove `key` from the list of items in the reverse map to maintain invertibility.
	*/
	declare remove: (key: K, ...items: V[]) => void

	/** at a specific `key` in the reverse map, remove/delete the list of `items`,
	 * and then also remove `key` from the list of items in the forward map to maintain invertibility.
	*/
	declare rremove: (key: V, ...items: K[]) => void

	declare forEach: (callbackfn: (value: Set<V>, key: K, map: Map<K, Set<V>>) => void, thisArg?: any) => void
	declare rforEach: (callbackfn: (value: Set<K>, key: V, map: Map<V, Set<K>>) => void, thisArg?: any) => void
	declare get: (key: K) => Set<V> | undefined
	declare rget: (key: V) => Set<K> | undefined
	declare has: (key: K) => boolean
	declare rhas: (key: V) => boolean
	declare set: (key: K, value: Iterable<V>) => this
	declare rset: (key: V, value: Iterable<K>) => this
	// TODO: in the future, see if you can revert back to `() => IterableIterator<...>`,
	// instead of either resorting to `MapIterator` (which errors during node build-npm), or your current ugly way of `Map<K, V>["..."]`
	declare entries: Map<K, Set<V>>["entries"]
	declare rentries: Map<V, Set<K>>["entries"]
	declare keys: Map<K, V>["keys"]
	declare rkeys: Map<V, K>["keys"]
	declare values: Map<K, Set<V>>["values"]
	declare rvalues: Map<V, Set<K>>["values"]
	declare [Symbol.iterator]: Map<K, Set<V>>["entries"]
	declare [Symbol.toStringTag]: string

	/** create an empty invertible map. <br>
	 * optionally provide an initial `forward_map` to populate the forward mapping, and then automatically deriving the reverse mapping from it. <br>
	 * or provide an initial `reverse_map` to populate the reverse mapping, and then automatically deriving the froward mapping from it. <br>
	 * if both `forward_map` and `reverse_map` are provided, then it will be up to YOU to make sure that they are actual inverses of each other. <br>
	 * @param forward_map initiallize by populating with an optional initial forward map (the reverse map will be automatically computed if `reverse_map === undefined`)
	 * @param reverse_map initiallize by populating with an optional initial reverse map (the forward map will be automatically computed if `forward_map === undefined`)
	 */
	constructor(
		forward_map?: Map<K, Set<V>> | undefined,
		reverse_map?: Map<V, Set<K>> | undefined,
	) {
		const
			// forward mapping
			fmap: Map<K, Set<V>> = forward_map ?? (reverse_map ? invertMap<V, K>(reverse_map) : new Map()),
			// reverse (backward/rear) mapping
			rmap: Map<V, Set<K>> = reverse_map ?? (forward_map ? invertMap<K, V>(forward_map) : new Map()),
			// binding accessor methods for quicker execution
			fmap_set = bind_map_set(fmap),
			rmap_set = bind_map_set(rmap),
			fmap_delete = bind_map_delete(fmap),
			rmap_delete = bind_map_delete(rmap),
			size: this["size"] = fmap.size,
			rsize: this["rsize"] = rmap.size,
			forEach: this["forEach"] = bind_map_forEach(fmap),
			rforEach: this["rforEach"] = bind_map_forEach(rmap),
			get: this["get"] = bind_map_get(fmap),
			rget: this["rget"] = bind_map_get(rmap),
			has: this["has"] = bind_map_has(fmap),
			rhas: this["rhas"] = bind_map_has(rmap),
			entries: this["entries"] = bind_map_entries(fmap),
			rentries: this["rentries"] = bind_map_entries(rmap),
			keys: this["keys"] = bind_map_keys(fmap),
			rkeys: this["rkeys"] = bind_map_keys(rmap),
			values: this["values"] = bind_map_values(fmap),
			rvalues: this["rvalues"] = bind_map_values(rmap)

		const add: this["add"] = (key: K, ...items: V[]) => {
			const
				forward_items = get(key) ?? (fmap_set(key, new Set()) && get(key)!),
				forward_items_has = bind_set_has(forward_items),
				forward_items_add = bind_set_add(forward_items)
			for (const item of items) {
				if (!forward_items_has(item)) {
					forward_items_add(item)
					if (!rget(item)?.add(key)) {
						rmap_set(item, new Set([key]))
					}
				}
			}
		}

		const radd: this["radd"] = (key: V, ...items: K[]) => {
			const
				reverse_items = rget(key) ?? (rmap_set(key, new Set()) && rget(key)!),
				reverse_items_has = bind_set_has(reverse_items),
				reverse_items_add = bind_set_add(reverse_items)
			for (const item of items) {
				if (!reverse_items_has(item)) {
					reverse_items_add(item)
					if (!get(item)?.add(key)) {
						fmap_set(item, new Set([key]))
					}
				}
			}
		}

		const clear: this["clear"] = () => {
			fmap.clear()
			rmap.clear()
		}

		const fdelete: this["delete"] = (key: K, keep_key: boolean = false): boolean => {
			const forward_items = get(key)
			if (forward_items) {
				// first remove all mentions of `key` from the reverse mapping
				for (const item of forward_items) {
					rget(item)!.delete(key)
				}
				if (keep_key) { forward_items.clear() }
				else { keep_key = fmap_delete(key) }
			}
			return keep_key
		}

		const rdelete: this["rdelete"] = (key: V, keep_key: boolean = false): boolean => {
			const reverse_items = rget(key)
			// first remove all mentions of `key` from the forward mapping
			if (reverse_items) {
				// first remove all mentions of `key` from the reverse mapping
				for (const item of reverse_items) {
					get(item)!.delete(key)
				}
				if (keep_key) { reverse_items.clear() }
				else { keep_key = rmap_delete(key) }
			}
			return keep_key
		}

		const remove: this["remove"] = (key: K, ...items: V[]) => {
			const forward_items = get(key)
			if (forward_items) {
				const forward_items_delete = bind_set_delete(forward_items)
				for (const item of items) {
					if (forward_items_delete(item)) {
						rget(item)!.delete(key)
					}
				}
			}
		}

		const rremove: this["rremove"] = (key: V, ...items: K[]) => {
			const reverse_items = rget(key)
			if (reverse_items) {
				const reverse_items_delete = bind_set_delete(reverse_items)
				for (const item of items) {
					if (reverse_items_delete(item)) {
						get(item)!.delete(key)
					}
				}
			}
		}

		const set: this["set"] = (key: K, value: Iterable<V>): this => {
			// first we must delete the `key` if it already exists
			fdelete(key, true)
			add(key, ...value)
			return this
		}

		const rset: this["rset"] = (key: V, value: Iterable<K>): this => {
			// first we must delete the `key` if it already exists
			rdelete(key, true)
			radd(key, ...value)
			return this
		}

		object_assign(this, {
			fmap, rmap, size, rsize, forEach, rforEach, get, rget, has, rhas, entries, rentries, keys, rkeys, values, rvalues,
			add, radd, clear, delete: fdelete, rdelete, remove, rremove, set, rset,
			[symbol_iterator]: entries,
			[symbol_toStringTag]: "InvertibleMap",
		})
	}
}

/*
export class InvertibleMapCloneable<K extends PropertyKey, V extends PropertyKey> extends InvertibleMap<K, V> {
	declare toObject: () => Partial<Record<K, Array<V>>>
	declare rtoObject: () => Partial<Record<V, Array<K>>>

	constructor(
		forward_map?: Map<K, Set<V>> | undefined,
		reverse_map?: Map<V, Set<K>> | undefined,
	) {
		super(forward_map, reverse_map)
		const map_to_object_factory = <MK extends PropertyKey, MV>(map: Map<MK, Iterable<MV>>): (() => Partial<Record<MK, Array<MV>>>) => (() => {
			const obj: Partial<Record<MK, Array<MV>>> = {}
			map.forEach((value, key) => {
				obj[key] = array_from(value)
			})
			return obj
		})
		this.toObject = map_to_object_factory(this.fmap)
		this.rtoObject = map_to_object_factory(this.rmap)
	}
}
*/

/** a directed acyclic graph edges mapping optimized for looking up number of connections going **into** and **out of** a node */
/*
export class DAGSystem<ID, FROM extends ID = ID, TO extends ID = ID> extends InvertibleMap<FROM, TO> {
	constructor(
		forward_map?: Map<FROM, Set<TO>> | undefined,
		reverse_map?: Map<TO, Set<FROM>> | undefined,
	) {
		super(forward_map, reverse_map)
		const {
			fmap, rmap, add, radd, delete: fdelete, rdelete, remove, rremove, set, rset, forEach, rforEach,
		} = this
		const
			count = new Map<FROM, number>(),
			count_get = bind_map_get(count),
			count_set = bind_map_set(count),
			rcount = new Map<TO, number>(),
			rcount_get = bind_map_get(rcount),
			rcount_set = bind_map_set(rcount)

		const
			count_update = (to_ids: Set<TO>, from_id: FROM) => { count_set(from_id, to_ids.size) },
			rcount_update = (from_ids: Set<FROM>, to_id: TO) => { rcount_set(to_id, from_ids.size) },
			count_update_all = () => forEach(count_update),
			rcount_update_all = () => rforEach(rcount_update)
	}

}
*/

export type GraphEdges<ID, FROM extends ID = ID, TO extends ID = ID> = Map<FROM, Set<TO>>

export class TopologicalScheduler<ID, FROM extends ID = ID, TO extends ID = ID> {
	/** the edges depict the directed edge from an id (`key: FROM`) to a set of ids (`value: Set<TO>`) */
	declare readonly edges: GraphEdges<ID, FROM, TO>

	/** after a source id is fired, this stack will get filled up with dependent node ids in topological order. <br>
	 * the top item in the stack will correspond to the first node id that must be processed (least dependency),
	 * while the bottom one will be the last to be resolved (most dependencies). <br>
	 * use the {@link pop} method to pop out the top from this stack, or use the {@link seek} method just to view the top without popping.
	*/
	declare readonly stack: ID[]

	/** declare ids that need to be fired simultaneously.
	 * once the ids are fired, the function will topologically traverse the {@link edges} (via DFS),
	 * and eventually push the order of resoluion into the {@link stack}. <br>
	 * make sure that the source ids are NOT dependent on one another, because that will break the topological ordering of the output stack.
	*/
	declare fire: (...source_ids: FROM[]) => void

	/** while processing topologically ordered {@link stack}, you may block certain ids so that they and
	 * their (pure) dependents down the line are removed from the {@link stack}. <br>
	 * if no id is provided (no arguments), then we will assume that you wish to block the most recently popped id.
	*/
	declare block: (...block_ids: FROM[] | never[]) => void

	/** clear the topologically ordered {@link stack}, perhaps to restart the traversal. */
	declare clear: () => void

	/** pop the top element from the topologically ordered {@link stack}. */
	declare pop: () => ID | undefined

	/** view the top element from the topologically ordered {@link stack} without popping it. */
	declare seek: () => ID | undefined

	/** iterate over the topologically ordered {@link stack} of ids */
	declare [Symbol.iterator]: () => IterableIterator<ID>

	constructor(edges: GraphEdges<ID, FROM, TO>) {
		let prev_id: undefined | ID = undefined
		const
			edges_get = bind_map_get(edges),
			stack: ID[] = [],
			stack_pop = bind_array_pop(stack),
			stack_push = bind_array_push(stack),
			stack_clear = bind_array_clear(stack),
			seek = bind_stack_seek(stack),
			visits = new Map<ID, number>(),
			visits_get = bind_map_get(visits),
			visits_set = bind_map_set(visits)

		const recursive_dfs_visitor = (id: FROM) => {
			for (const to_id of edges_get(id) ?? []) {
				const visits = visits_get(to_id)
				// if the child node has been visited at least once before (`0 || undefined`), do not dfs revisit it again. just increment its counter
				if (visits) { visits_set(to_id, visits + 1) }
				else { recursive_dfs_visitor(to_id as unknown as FROM) }
			}
			visits_set(id, 1)
		}

		const recursive_dfs_unvisiter = (id: FROM) => {
			visits_set(id, 0)
			for (const to_id of edges_get(id) ?? []) {
				const new_visits = (visits_get(to_id) ?? 0) - 1
				if (new_visits > -1) {
					visits_set(to_id, new_visits)
					// if the child node has become unvisitable (`new_visits === 0`), then the grand-children should decrement by a visit too via recursion
					if (new_visits < 1) { recursive_dfs_unvisiter(to_id as unknown as FROM) }
				}
			}
		}

		const compute_stacks_based_on_visits = () => {
			stack_clear()
			for (const [id, number_of_visits] of visits) {
				if (number_of_visits > 0) { stack_push(id) }
			}
		}

		const pop = () => {
			prev_id = stack_pop()
			if (prev_id !== undefined) { visits_set(prev_id, 0) }
			return prev_id
		}

		const fire = (...source_ids: FROM[]) => {
			visits.clear()
			source_ids.forEach(recursive_dfs_visitor)
			compute_stacks_based_on_visits()
		}

		const block = (...block_ids: FROM[] | never[]) => {
			if (array_isEmpty(block_ids) && prev_id !== undefined) {
				block_ids.push(prev_id as never)
			}
			block_ids.forEach(recursive_dfs_unvisiter)
			compute_stacks_based_on_visits()
		}

		const clear = () => {
			visits.clear()
			stack_clear()
		}

		const iterate = function* () {
			prev_id = pop()
			while (prev_id !== undefined) {
				yield prev_id
				prev_id = pop()
			}
		}

		object_assign(this, {
			edges, stack, fire, block, clear, pop, seek,
			[symbol_iterator]: iterate,
		})
	}
}

export type InvertibleGraphEdges<ID extends PropertyKey, FROM extends ID = ID, TO extends ID = ID> = InvertibleMap<FROM, TO>

// TODO ISSUE: the implementation may be incorrect as this was made during the time when I wrote the incorrect topological scheduler for `tsignal_ts@v0.1.x`
// TODO ISSUE: dependencies/dependants added during a firing cycle AND their some of their dependencies have already been resolved, will lead to forever unresolved newly added depenant
// see `/test/collections.topological_scheduler.test.ts`
export class TopologicalAsyncScheduler<ID extends PropertyKey, FROM extends ID = ID, TO extends ID = ID> {
	declare pending: Set<TO>
	declare clear: () => void
	declare fire: (...source_ids: FROM[]) => void
	declare resolve: (...ids: ID[]) => TO[]

	constructor(invertible_edges: InvertibleGraphEdges<ID, FROM, TO>) {
		const
			{ rforEach, get, rget } = invertible_edges,
			// set of node ids that are currently pending to be resolved
			pending = new Set<TO>(),
			pending_add = bind_set_add(pending),
			pending_delete = bind_set_delete(pending)
		// TODO CHORE: instead of using regular Objects for `ins_count: Partial<Record<TO, number>>` and `rejected_ins_count: Partial<Record<TO, number>>`,
		// use const Maps: `ins_count: Map<TO, number>` and `rejected_ins_count: Map<TO, number>`, and clear them on every run
		let
			// count (value) of number of edges going INTO an id (key)
			ins_count: Partial<Record<TO, number>> = {},
			// count (value) of number of rejected edges going INTO an id (key).
			// if the count tops up to the total number of edges going into the `id` (`rejected_ins_count[id] === get(id).size`),
			// then we will also have to reject `id`, and propagate its rejection's effect onto its dependants
			rejected_ins_count: Partial<Record<TO, number>> = {}

		const clear = () => {
			pending.clear()
			ins_count = {}
			rejected_ins_count = {}
			rforEach((from_ids, to_id) => {
				ins_count[to_id] = from_ids.size
			})
		}

		const fire = (...source_ids: FROM[]) => {
			DEBUG.LOG && console_log(source_ids)
			clear();
			(source_ids as unknown[] as TO[]).forEach(pending_add)
		}

		const resolve = (...ids: ID[]): TO[] => {
			const next_ids: TO[] = []
			for (const id of ids as TO[]) {
				if (pending_delete(id)) {
					get(id as unknown as FROM)?.forEach((to_id) => {
						// `ins_count[to_id]` may be undefined due to a dependency that was adder later (after a firing cycle had begun).
						// in that case, we look it up from `rget(to_id).size`, which should contain the updated info.
						// but if that too turns out to be undefined, then we fall back to `1 - 1`
						const ins_count_of_id = (
							ins_count[to_id] ??
							rget(to_id)?.size ??
							1
						) - 1
						if (ins_count_of_id <= 0) {
							// `to_id` now has no unresolved dependencies left. therefore we can push it `next_ids`, and eventually to `pending`
							next_ids.push(to_id)
						}
						ins_count[to_id] = ins_count_of_id
					})
				}
			}
			next_ids.forEach(pending_add)
			DEBUG.LOG && console_log(next_ids)
			return next_ids
		}

		const reject = (...ids: ID[]): TO[] => {
			const next_rejected_ids: TO[] = []
			for (const id of ids as TO[]) {
				pending_delete(id)
				get(id as unknown as FROM)?.forEach((to_id) => {
					if (
						(rejected_ins_count[to_id] = (rejected_ins_count[to_id] ?? 0) + 1) >=
						(rget(to_id)?.size ?? 0)
					) {
						// `to_id` now has had all of its dependencies rejected. therefore we must now push it `next_rejected_ids`, and eventually to reject it on the next recursion
						next_rejected_ids.push(to_id)
					}
				})
			}
			return (ids as TO[]).concat(
				array_isEmpty(next_rejected_ids) ?
					next_rejected_ids :
					reject(...next_rejected_ids)
			)
		}

		object_assign(this, { pending, clear, fire, resolve, reject })
	}
}

/** definition of an object that provides map-like methods */
export interface SimpleMap<K, V> {
	get(key: K): V | undefined
	set(key: K, value: V): this
	has(key: K): boolean
	delete(key: K): boolean
}

/** a map like object, similar to a {@link WeakMap}, that weakly stores keys of Objects and Functions,
 * but can also (strongly) store primitive objects as keys, similar to {@link Map}. hence the name, `HybridWeakMap` <br>
*/
export class HybridWeakMap<K, V> implements SimpleMap<K, V> {
	wmap = new WeakMap<K & WeakKey, V>()
	smap = new Map<K & PropertyKey, V>()

	private pick(key: K & WeakKey): this["wmap"]
	private pick(key: K & PropertyKey): this["smap"]
	private pick(key: K): this["wmap"] | this["smap"]
	private pick(key: K): this["wmap"] | this["smap"] {
		return isComplex(key) ? this.wmap : this.smap
	}

	get(key: K): V | undefined {
		return this.pick(key).get(key as any)
	}

	set(key: K, value: V): this {
		this.pick(key).set(key as any, value)
		return this
	}

	has(key: K): boolean {
		return this.pick(key).has(key as any)
	}

	delete(key: K): boolean {
		return this.pick(key).delete(key as any)
	}
}

/** a tree object (constructed by class returned by {@link treeClass_Factory}) with no initialized value will have this symbol set as its default value */
export const TREE_VALUE_UNSET = /*@__PURE__*/ Symbol(DEBUG.MINIFY || "represents an unset value for a tree")

// TODO: annotate/document this class, and talk about its similarities with the "Walk" method commonly used in filesystem traversal along with its "create intermediate" option
export const treeClass_Factory = /*@__PURE__*/ (base_map_class: new <KT, VT>(...args: any[]) => SimpleMap<KT, VT>) => {
	return class Tree<K, V> extends base_map_class<K, Tree<K, any>> {
		constructor(
			public value: V | typeof TREE_VALUE_UNSET = TREE_VALUE_UNSET
		) { super() }

		getDeep(reverse_keys: K[], create_intermediate?: true): Tree<K, any>
		getDeep(reverse_keys: K[], create_intermediate?: boolean): Tree<K, any> | undefined
		getDeep(reverse_keys: K[], create_intermediate = true): Tree<K, any> | undefined {
			if (array_isEmpty(reverse_keys)) { return this }
			const key = reverse_keys.pop()!
			let child = this.get(key)
			if (!child && create_intermediate) { this.set(key, (child = new Tree())) }
			return child?.getDeep(reverse_keys, create_intermediate)
		}

		setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: true): Tree<K, any>
		setDeep<T>(reverse_keys: K[], value: T, create_intermediate?: boolean): Tree<K, any> | undefined
		setDeep<T>(reverse_keys: K[], value: T, create_intermediate: boolean = true): Tree<K, any> | undefined {
			const deep_child = this.getDeep(reverse_keys, create_intermediate)
			if (deep_child) { deep_child.value = value }
			return deep_child
		}

		/** check if a deep child exists with the provided array of reversed keys. <br>
		 * this is implemented to be slightly quicker than {@link getDeep}
		*/
		hasDeep(reverse_keys: K[]): boolean {
			if (array_isEmpty(reverse_keys)) { return true }
			const
				key = reverse_keys.pop()!,
				child = this.get(key)
			return child?.hasDeep(reverse_keys) ?? false
		}

		delDeep(reverse_keys: K[]): boolean {
			if (array_isEmpty(reverse_keys)) { return false }
			const
				[child_key, ...reverse_keys_to_parent] = reverse_keys,
				deep_parent = this.getDeep(reverse_keys_to_parent, false)
			return deep_parent?.delete(child_key) ?? false
		}
	}
}

export const WeakTree = /*@__PURE__*/ treeClass_Factory(WeakMap)
export const StrongTree = /*@__PURE__*/ treeClass_Factory(Map)
export const HybridTree = /*@__PURE__*/ treeClass_Factory(HybridWeakMap)


export class StackSet<T> extends Array<T> {
	static override[Symbol.species] = Array

	$set = new Set<T>()
	$add = bind_set_add(this.$set)
	$del = bind_set_delete(this.$set)

	/** determines if an item exists in the stack. <br>
	 * this operation is as fast as {@link Set.has}, because that's what's being used internally.
	 * so expect no overhead.
	*/
	override includes = bind_set_has(this.$set)

	/** peek at the top item of the stack without popping */
	top = bind_stack_seek(this)

	/** synchronize the ordering of the stack with the underlying {@link $set} object's insertion order (i.e. iteration ordering). <br>
	 * the "f" in "fsync" stands for "forward"
	*/
	fsync(): number {
		super.splice(0)
		return super.push(...this.$set)
	}

	/** synchronize the insertion ordering of the underlying {@link $set} with `this` stack array's ordering. <br>
	 * this process is more expensive than {@link fsync}, as it has to rebuild the entirety of the underlying set object. <br>
	 * the "r" in "rsync" stands for "reverse"
	*/
	rsync(): number {
		const { $set, $add } = this
		$set.clear()
		super.forEach($add)
		return this.length
	}

	/** reset a `StackSet` with the provided initializing array of unique items */
	reset(initial_items: Array<T> = []): void {
		const { $set, $add } = this
		$set.clear()
		initial_items.forEach($add)
		this.fsync()
	}

	constructor(initial_items?: Array<T>) {
		super()
		this.reset(initial_items)
	}

	/** pop the item at the top of the stack. */
	override pop(): T | undefined {
		const value = super.pop()
		this.$del(value as T)
		return value
	}

	/** push **new** items to stack. doesn't alter the position of already existing items. <br>
	 * @returns the new length of the stack.
	*/
	override push(...items: T[]): number {
		const
			includes = this.includes,
			$add = this.$add,
			new_items: T[] = items.filter(includes)
		new_items.forEach($add)
		return super.push(...new_items)
	}

	/** push items to front of stack, even if they already exist in the middle. <br>
	 * @returns the new length of the stack.
	*/
	pushFront(...items: T[]): number {
		items.forEach(this.$del)
		items.forEach(this.$add)
		return this.fsync()
	}

	/** remove the item at the bottom of the stack. */
	override shift(): T | undefined {
		const value = super.shift()
		this.$del(value as T)
		return value
	}

	/** insert **new** items to the rear of the stack. doesn't alter the position of already existing items. <br>
	 * note that this operation is expensive, because it clears and then rebuild the underlying {@link $set}
	 * @returns the new length of the stack.
	*/
	override unshift(...items: T[]): number {
		const
			includes = this.includes,
			new_items: T[] = items.filter(includes)
		super.unshift(...new_items)
		return this.rsync()
	}

	/** inserts items to the rear of the stack, even if they already exist in the middle. <br>
	 * note that this operation is expensive, because it clears and then rebuild the underlying {@link $set}
	 * @returns the new length of the stack.
	*/
	unshiftRear(...items: T[]): number {
		this.delMany(...items)
		super.unshift(...items)
		return this.rsync()
	}

	/** delete an item from the stack */
	del(item: T): boolean {
		const item_exists = this.$del(item)
		if (item_exists) {
			super.splice(super.indexOf(item), 1)
			return true
		}
		return false
	}

	/** delete multiple items from the stack */
	delMany(...items: T[]): void {
		items.forEach(this.$del)
		this.fsync()
	}
}

/** a stack object with limited capacity. <br>
 * when the capacity hits the maximum length, then it is reduced down to the minimum capacity.
*/
export class LimitedStack<T> extends Array<T> {
	static override[Symbol.species] = Array

	/** minimum capacity of the stack. <br>
	 * when the stack size hits the maximum capacity {@link max}, the oldest items (at the
	 * bottom of the stack) are discarded so that the size goes down to the minimum specified here
	*/
	min: number

	/** maximum capacity of the stack. <br>
	 * when the stack size hits this maximum capacity, the oldest items (at the
	 * bottom of the stack) are discarded so that the size goes down to {@link min}
	*/
	max: number

	/** provide an optional callback function which is called everytime items are discarded by the stack resizing function {@link resize} */
	resize_cb?: (discarded_items: T[]) => void

	constructor(
		min_capacity: number,
		max_capacity: number,
		resize_callback?: (discarded_items: T[]) => void
	) {
		super()
		this.min = min_capacity
		this.max = max_capacity
		this.resize_cb = resize_callback
	}

	/** enforce resizing of stack if necessary. oldest item (at the bottom of the stack) are discarded if the max capacity has been exceeded. <br> */
	resize(arg: any): typeof arg {
		const
			len = this.length,
			discard_quantity = (len - this.max) > 0 ? (len - this.min) : 0
		if (discard_quantity > 0) {
			const discarded_items = super.splice(0, discard_quantity)
			this.resize_cb?.(discarded_items)
		}
		return arg
	}

	override push(...items: T[]): number {
		return this.resize(super.push(...items))
	}
}

/** a stack set object with limited capacity. <br>
 * when the capacity hits the maximum length, then it is reduced down to the minimum capacity.
*/
export class LimitedStackSet<T> extends StackSet<T> {
	/** minimum capacity of the stack. <br>
	 * when the stack size hits the maximum capacity {@link max}, the oldest items (at the
	 * bottom of the stack) are discarded so that the size goes down to the minimum specified here
	*/
	min: number

	/** maximum capacity of the stack. <br>
	 * when the stack size hits this maximum capacity, the oldest items (at the
	 * bottom of the stack) are discarded so that the size goes down to {@link min}
	*/
	max: number

	/** provide an optional callback function which is called everytime items are discarded by the stack resizing function {@link resize} */
	resize_cb?: (discarded_items: T[]) => void

	constructor(
		min_capacity: number,
		max_capacity: number,
		resize_callback?: (discarded_items: T[]) => void
	) {
		super()
		this.min = min_capacity
		this.max = max_capacity
		this.resize_cb = resize_callback
	}

	/** enforce resizing of stack if necessary. oldest item (at the bottom of the stack) are discarded if the max capacity has been exceeded. <br> */
	resize(arg: any): typeof arg {
		const
			len = this.length,
			discard_quantity = (len - this.max) > 0 ? (len - this.min) : 0
		if (discard_quantity > 0) {
			const discarded_items = super.splice(0, discard_quantity)
			discarded_items.forEach(this.$del)
			this.resize_cb?.(discarded_items)
		}
		return arg
	}

	override push(...items: T[]): number {
		return this.resize(super.push(...items))
	}

	override pushFront(...items: T[]): number {
		return this.resize(super.pushFront(...items))
	}
}

export interface ChainedPromiseQueueConfig<T> {
	/** provide a callback whenever the queue of promises goes empty (each promise element is fulfilled) */
	onEmpty?: () => void
	/** specify if {@link onEmpty} should be immediately called when the queue is first created. defaults to `false` */
	isEmpty?: boolean
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
export class ChainedPromiseQueue<T> extends Array<Promise<T>> {
	static override[Symbol.species] = Array

	/** the chain of the "then" functions to run each newly pushed promise through. <br>
	 * you may dynamically modify this sequence so that all newly pushed promises will have to go through a different set of "then" functions. <br>
	 * do note that old (already existing) promises will not be affected by the modified chain of "then" functions.
	 * they'll stick to their original sequence of thens because that gets decided during the moment when a promise is pushed into this collection.
	*/
	chain: [
		then0?: [
			onfulfilled: (value: T) => MaybePromiseLike<any | void>,
			onrejected?: (reason: any) => MaybePromiseLike<any | void>,
		],
		...Array<[
			onfulfilled: (value: any) => MaybePromiseLike<any | void>,
			onrejected?: (reason: any) => MaybePromiseLike<any | void>,
		]>
	] = []

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
	pending: Promise<any>[] = []

	onEmpty?: ChainedPromiseQueueConfig<T>["onEmpty"]

	constructor(then_functions_sequence: ChainedPromiseQueue<T>["chain"] = [], { onEmpty, isEmpty }: ChainedPromiseQueueConfig<T> = {}) {
		super()
		console.log(then_functions_sequence)
		this.chain.push(...then_functions_sequence)
		this.onEmpty = onEmpty
		if (isEmpty) { onEmpty?.() }
	}

	override push(...new_promises: Promise<T>[]): number {
		const
			new_length = super.push(...new_promises),
			chain = this.chain as Array<[
				onfulfilled: (value: any) => MaybePromiseLike<any | void>,
				onrejected?: (reason: any) => MaybePromiseLike<any | void>,
			]>
		this.pending.push(...new_promises.map((promise) => {
			// attach the "then" functions to the promise sequentially
			chain.forEach(([onfulfilled, onrejected]) => {
				promise = promise.then(onfulfilled, onrejected)
			})
			// delete the promise from this array once it is completed (resolved or rejected after the "then" functions of the constructor)
			const completed_promise_deleter = () => this.del(promise)
			promise.then(completed_promise_deleter, completed_promise_deleter)
			return promise
		}))
		return new_length
	}

	/** delete a certain promise that has been chained with the "then" functions.
	 * @param completed_pending_promise the promise to be deleted from {@link pending} and {@link this} collection of promises
	 * @returns `true` if the pending promise was found and deleted, else `false` will be returned
	*/
	private del(completed_pending_promise: Promise<T>): boolean {
		const
			pending = this.pending,
			idx = pending.indexOf(completed_pending_promise)
		if (idx >= 0) {
			pending.splice(idx, 1)
			super.splice(idx, 1)
			if (array_isEmpty(this)) { this.onEmpty?.() }
			return true
		}
		return false
	}

	/** @illegal this method should not be called, as it will break the internal indexing */
	declare shift: never
	/** @illegal this method should not be called, as it will break the internal indexing */
	declare unshift: never
	/** @illegal this method should not be called, as it will break the internal indexing */
	declare pop: never
}
