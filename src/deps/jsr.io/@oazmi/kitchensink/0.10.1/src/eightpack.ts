/** utility functions for packing and unpacking bytes (8-bits) of primitive javascript objects.
 * > and hence the name of the module (*8(bit)pack*).
 * 
 * @module
*/

import { array_from, number_parseInt } from "./alias.js"
import { decode_varint, decode_varint_array, encode_varint, encode_varint_array } from "./eightpack_varint.js"
import { concatBytes, env_is_little_endian, swapEndiannessFast, typed_array_constructor_of } from "./typedbuffer.js"
import type { NumericArrayType, NumericType, TypedArray, VarNumericArrayType, VarNumericType } from "./typedefs.js"


/** binary primitive types.
 * - {@link NumericType} various binary representations of number
 * - {@link NumericArrayType} various binary representations of array of numbers. requires defining array length (number of items) during decoding as `args[0]`
 * - `"bytes"` a `Uint8Array`, which requires defining a bytesize length during decoding as `args[0]`
 * - `"str"` a string, which requires defining a bytesize length during decoding as `args[0]`
 * - `"cstr"` a null-terminated (`"\u0000"`) string. the null termination byte character is automatically added when encoding
 * - `"bool"` a boolean occupying a single byte
*/
export type PrimitiveType =
	| PrimitiveArrayType
	| NumericType
	| VarNumericType
	| "cstr"
	| "bool"

/** primitive types that typically require length information to be decoded. */
export type PrimitiveArrayType =
	| NumericArrayType
	| VarNumericArrayType
	| "bytes"
	| "str"

/** all unpack functions return their decoded outputs in a 2-tuple array;
 * the first element being the decoded value `V`, and the second being the number of bytes this data occupied.
*/
export type Decoded<V, ByteSize extends number = number> = [value: V, bytesize: ByteSize]

/** primitive javascript types. */
export type JSPrimitive = string | boolean | number | bigint | number[] | Uint8Array

/** packing function signature for {@link JSPrimitive} types. */
export type EncodeFunc<T extends JSPrimitive, ARGS extends any[] = []> = (value: T, ...args: ARGS) => Uint8Array

/** unpacking function signature for {@link JSPrimitive} types. */
export type DecodeFunc<T extends JSPrimitive, ARGS extends any[] = []> = (buffer: Uint8Array, offset: number, ...args: ARGS) => Decoded<T>

/** an instance of `TextEncoder`. (i.e. `new TextEncoder()`, that uses `utf8` encoding). */
export const textEncoder = /*@__PURE__*/ new TextEncoder()

/** an instance of `TextDecoder`. (i.e. `new TextDecoder()`, that uses `utf8` encoding). */
export const textDecoder = /*@__PURE__*/ new TextDecoder()

/** read `type` of value from buffer `buf`, starting at position `offset`. */
export const readFrom = (buf: Uint8Array, offset: number, type: PrimitiveType, ...args: any[]): [value: JSPrimitive, new_offset: number] => {
	const [value, bytesize] = unpack(type, buf, offset, ...args)
	return [value, offset + bytesize]
}

/** write `type` of `value` to buffer `buf`, starting at position `offset`. */
export const writeTo = (buf: Uint8Array, offset: number, type: PrimitiveType, value: JSPrimitive, ...args: any[]): [buf: typeof buf, new_offset: number] => {
	const value_buf = pack(type, value, ...args)
	buf.set(value_buf, offset)
	return [buf, offset + value_buf.length]
}

/** encode a sequential array of primitive items.
 * to invert/decode the transformation, use {@link unpackSeq}.
 * 
 * under the hood, this function uses {@link pack} for encoding each item.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(
 * 	packSeq(["u4b", 0x12AB98], ["str", "hello"], ["bool", false]),
 * 	Uint8Array.of(0x00, 0x12, 0xAB, 0x98, 104, 101, 108, 108, 111, 0),
 * )
 * ```
*/
export const packSeq = (...items: Parameters<typeof pack>[]) => {
	const bufs: Uint8Array[] = []
	for (const item of items) { bufs.push(pack(...item)) }
	return concatBytes(...bufs)
}

/** decodes as a sequential array of items, provided that you pair the values with their `PrimitiveType`s.
 * this is the inverse of {@link packSeq}.
 * 
 * under the hood, this function uses {@link unpack} for decoding each item.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(
 * 	unpackSeq(
 * 		Uint8Array.of(0x00, 0x12, 0xAB, 0x98, 104, 101, 108, 108, 111, 0), // byte buffer
 * 		0,          // starting index
 * 		["u4b"],    // first decoded item should be a 4-byte unsigned integer in big-endian byte-order.
 * 		["str", 5], // the second item should be a string consisting of 5 bytes (5 characters in this case).
 * 		["bool"],   // the last item should be a 1-byte boolean.
 * 	), [
 * 		[0x12AB98, "hello", false], // decoded items
 * 		10,                         // bytes decoded
 * 	],
 * )
 * ```
*/
export const unpackSeq = (buf: Uint8Array, offset: number, ...items: [type: PrimitiveType, ...args: any[]][]): Decoded<JSPrimitive[]> => {
	const values: JSPrimitive[] = []
	let total_bytesize = 0
	for (const [type, ...args] of items) {
		const [value, bytesize] = unpack(type, buf, offset + total_bytesize, ...args)
		values.push(value)
		total_bytesize += bytesize
	}
	return [values, total_bytesize]
}

/** a primitive value encoder/packer for a given `type` (see {@link PrimitiveType}).
 * to invert/decode the transformation, use {@link unpack}.
 * 
 * under the hood, this function calls one of the following primitive value encoders, based on the `type` that you provide:
 * - {@link encode_bool}, {@link encode_cstr}, {@link encode_str}, {@link encode_bytes},
 *   {@link encode_number}, {@link encode_number_array}, {@link encode_varint}, {@link encode_varint_array}
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * // aliasing for brevity
 * const u8 = Uint8Array, eq = assertEquals
 * 
 * eq(pack("bool" , true),           u8.of(1))
 * eq(pack("cstr" , "hello"),        u8.of(104, 101, 108, 108, 111, 0))
 * eq(pack("str"  , "hello"),        u8.of(104, 101, 108, 108, 111))
 * eq(pack("bytes", u8.of(1, 2, 3)), u8.of(1, 2, 3))
 * // NOTE: if your device's native endian is not little-endian, then the test below will fail.
 * eq(pack("f8l[]", [1.1, 2.2, 3**45.67]), new u8(Float64Array.of(1.1, 2.2, 3**45.67).buffer))
 * ```
*/
export const pack = (type: PrimitiveType, value: JSPrimitive, ...args: any[]): ReturnType<EncodeFunc<JSPrimitive>> => {
	switch (type) {
		case "bool": return encode_bool(value as boolean)
		case "cstr": return encode_cstr(value as string)
		case "str": return encode_str(value as string)
		case "bytes": return encode_bytes(value as Uint8Array)
		default: {
			if (type[1] === "v") {
				return type.endsWith("[]") ?
					encode_varint_array(value as number[], type as VarNumericArrayType) :
					encode_varint(value as number, type as VarNumericType)
			} else {
				return type.endsWith("[]") ?
					encode_number_array(value as number[], type as NumericArrayType) :
					encode_number(value as number, type as NumericType)
			}
		}
	}
}

/** a buffer decoder/unpacker for a primitive value of a certain `type` (see {@link PrimitiveType}).
 * this is the inverse of {@link pack}.
 * 
 * under the hood, this function calls one of the following primitive value decoders, based on the `type` that you provide:
 * - {@link decode_bool}, {@link decode_cstr}, {@link decode_str}, {@link decode_bytes},
 *   {@link decode_number}, {@link decode_number_array}, {@link decode_varint}, {@link decode_varint_array}
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * // aliasing for brevity
 * const u8 = Uint8Array, eq = assertEquals
 * 
 * eq(unpack(
 * 	"bool",         // type of value to decode
 * 	u8.of(1, 0, 1), // buffer to decode from
 * 	1,              // the index to begin decoding from
 * ), [
 * 	false, // returned decoded value
 * 	1,     // number of bytes traversed while decoding (i.e. byte size of the decoded object)
 * ])
 * 
 * eq(unpack("cstr" , u8.of(97, 98, 99, 0, 100, 101), 0),    ["abc"      , 4])
 * eq(unpack("str"  , u8.of(97, 98, 99, 0, 100, 101), 0),    ["abc\x00de", 6])
 * eq(unpack("str"  , u8.of(97, 98, 99, 0, 100, 101), 0, 4), ["abc\x00"  , 4])
 * eq(unpack("bytes", u8.of(0, 1, 2, 3, 4, 5, 6), 2, 4),     [u8.of(2, 3, 4, 5), 4])
 * eq(unpack("i2b[]", u8.of(0, 1, 2, 3, 4, 5), 2),           [[0x0203, 0x0405] , 4])
 * eq(unpack("i2b[]", u8.of(0, 1, 2, 3, 4, 5), 0, 2),        [[0x0001, 0x0203] , 4])
 * ```
*/
export const unpack = (type: PrimitiveType, buf: Uint8Array, offset: number, ...args: any[]): ReturnType<DecodeFunc<JSPrimitive>> => {
	switch (type) {
		case "bool": return decode_bool(buf, offset)
		case "cstr": return decode_cstr(buf, offset)
		case "str": return decode_str(buf, offset, ...args)
		case "bytes": return decode_bytes(buf, offset, ...args)
		default: {
			if (type[1] === "v") {
				return type.endsWith("[]") ?
					decode_varint_array(buf, offset, type as VarNumericArrayType, ...args) :
					decode_varint(buf, offset, type as VarNumericType)
			} else {
				return type.endsWith("[]") ?
					decode_number_array(buf, offset, type as NumericArrayType, ...args) :
					decode_number(buf, offset, type as NumericType)
			}
		}
	}
}

/** pack a `boolean` as 1-byte of data. */
export const encode_bool: EncodeFunc<boolean> = (value) => { return Uint8Array.of(value ? 1 : 0) }

/** unpack a `boolean` from 1-byte of data. */
export const decode_bool: DecodeFunc<boolean> = (buf, offset = 0) => { return [buf[offset] >= 1 ? true : false, 1] }

/** pack a `string` as an array of characters, terminated by the `"\x00"` (or `"\u0000"`) charbyte.
 * this is the traditional c-programming language convention for strings.
*/
export const encode_cstr: EncodeFunc<string> = (value) => { return textEncoder.encode(value + "\x00") }

/** unpack a `string` as an array of characters that's terminated by `"\x00"` (or `"\u0000"`) charbyte.
 * this is the traditional c-programming language convention for strings.
*/
export const decode_cstr: DecodeFunc<string> = (buf, offset = 0) => {
	const
		offset_end = buf.indexOf(0x00, offset),
		txt_arr = buf.subarray(offset, offset_end),
		value = textDecoder.decode(txt_arr)
	return [value, txt_arr.length + 1]
}

/** pack a `string` as an array of characters. */
export const encode_str: EncodeFunc<string> = (value) => { return textEncoder.encode(value) }

/** unpack a `string` as an array of characters.
 * you must provide the `bytesize` of the string being decoded,
 * otherwise the decoder will unpack till the end of the buffer.
*/
export const decode_str: DecodeFunc<string, [bytesize?: number]> = (buf, offset = 0, bytesize?) => {
	const
		offset_end = bytesize === undefined ? undefined : offset + bytesize,
		txt_arr = buf.subarray(offset, offset_end),
		value = textDecoder.decode(txt_arr)
	return [value, txt_arr.length]
}

/** pack a `Uint8Array` array of bytes as is. (ie: don't perform any operation). */
export const encode_bytes: EncodeFunc<Uint8Array> = (value) => { return value }

/** unpack a `Uint8Array` array of bytes.
 * you must provide the `bytesize` of the bytes being decoded,
 * otherwise the decoder will unpack till the end of the buffer.
*/
export const decode_bytes: DecodeFunc<Uint8Array, [bytesize?: number]> = (buf, offset = 0, bytesize?) => {
	const
		offset_end = bytesize === undefined ? undefined : offset + bytesize,
		value = buf.slice(offset, offset_end)
	return [value, value.length]
}

/** pack a numeric array (`number[]`) in the provided {@link NumericArrayType} byte representation. */
export const encode_number_array: EncodeFunc<number[], [type: NumericArrayType]> = (value, type) => {
	const
		[t, s, e] = type,
		typed_arr_constructor = typed_array_constructor_of(type),
		bytesize = number_parseInt(s) as (1 | 2 | 4 | 8),
		is_native_endian = (e === "l" && env_is_little_endian) || (e === "b" && !env_is_little_endian) || bytesize === 1 ? true : false,
		typed_arr: TypedArray = typed_arr_constructor.from(value)
	if (typed_arr instanceof Uint8Array) { return typed_arr }
	const buf = new Uint8Array(typed_arr.buffer)
	if (is_native_endian) { return buf }
	else return swapEndiannessFast(buf, bytesize)
}

/** unpack a numeric array (`number[]`) that is encoded in one of {@link NumericArrayType} byte representation.
 * you must provide the `array_length` of the array being decoded,
 * otherwise the decoder will unpack till the end of the buffer.
*/
export const decode_number_array: DecodeFunc<number[], [type: NumericArrayType, array_length?: number]> = (buf, offset = 0, type, array_length?) => {
	const
		[t, s, e] = type,
		bytesize = number_parseInt(s) as (1 | 2 | 4 | 8),
		is_native_endian = (e === "l" && env_is_little_endian) || (e === "b" && !env_is_little_endian) || bytesize === 1 ? true : false,
		bytelength = array_length ? bytesize * array_length : undefined,
		array_buf = buf.subarray(offset, bytelength ? offset + bytelength : undefined),
		array_bytesize = array_buf.byteLength,
		typed_arr_constructor = typed_array_constructor_of(type),
		array_buf_endian_corrected = is_native_endian ? array_buf : swapEndiannessFast(array_buf, bytesize),
		// ANNOYANCE: below, we have to do `as ArrayBuffer` due to the introduction of `SharedArrayBuffer`.
		typed_arr: TypedArray = new typed_arr_constructor(
			array_buf_endian_corrected.buffer as ArrayBuffer,
			array_buf_endian_corrected.byteOffset,
			(array_bytesize / bytesize) | 0,
		)
	return [array_from(typed_arr), array_bytesize]
}

/** pack a `number` in the provided {@link NumericType} byte representation. */
export const encode_number: EncodeFunc<number, [type: NumericType]> = (value, type) => { return encode_number_array([value,], type as `${typeof type}[]`) }

/** unpack a `number` in the provided {@link NumericType} byte representation. */
export const decode_number: DecodeFunc<number, [type: NumericType]> = (buf, offset = 0, type) => {
	const [value_arr, bytesize] = decode_number_array(buf, offset, type as `${typeof type}[]`, 1)
	return [value_arr[0], bytesize]
}
