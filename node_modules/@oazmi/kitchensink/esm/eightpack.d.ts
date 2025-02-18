/** utility functions for packing and unpacking bytes (8-bits) of primitive javascript objects.
 * > and hence the name of the module (*8(bit)pack*).
 *
 * @module
*/
import "./_dnt.polyfills.js";
import type { NumericArrayType, NumericType, VarNumericArrayType, VarNumericType } from "./typedefs.js";
/** binary primitive types.
 * - {@link NumericType} various binary representations of number
 * - {@link NumericArrayType} various binary representations of array of numbers. requires defining array length (number of items) during decoding as `args[0]`
 * - `"bytes"` a `Uint8Array`, which requires defining a bytesize length during decoding as `args[0]`
 * - `"str"` a string, which requires defining a bytesize length during decoding as `args[0]`
 * - `"cstr"` a null-terminated (`"\u0000"`) string. the null termination byte character is automatically added when encoding
 * - `"bool"` a boolean occupying a single byte
*/
export type PrimitiveType = PrimitiveArrayType | NumericType | VarNumericType | "cstr" | "bool";
/** primitive types that typically require length information to be decoded. */
export type PrimitiveArrayType = NumericArrayType | VarNumericArrayType | "bytes" | "str";
/** all unpack functions return their decoded outputs in a 2-tuple array;
 * the first element being the decoded value `V`, and the second being the number of bytes this data occupied.
*/
export type Decoded<V, ByteSize extends number = number> = [value: V, bytesize: ByteSize];
/** primitive javascript types. */
export type JSPrimitive = string | boolean | number | bigint | number[] | Uint8Array;
/** packing function signature for {@link JSPrimitive} types. */
export type EncodeFunc<T extends JSPrimitive, ARGS extends any[] = []> = (value: T, ...args: ARGS) => Uint8Array;
/** unpacking function signature for {@link JSPrimitive} types. */
export type DecodeFunc<T extends JSPrimitive, ARGS extends any[] = []> = (buffer: Uint8Array, offset: number, ...args: ARGS) => Decoded<T>;
/** read `type` of value from buffer `buf`, starting at position `offset`. */
export declare const readFrom: (buf: Uint8Array, offset: number, type: PrimitiveType, ...args: any[]) => [value: JSPrimitive, new_offset: number];
/** write `type` of `value` to buffer `buf`, starting at position `offset`. */
export declare const writeTo: (buf: Uint8Array, offset: number, type: PrimitiveType, value: JSPrimitive, ...args: any[]) => [buf: Uint8Array, new_offset: number];
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
export declare const packSeq: (...items: Parameters<typeof pack>[]) => Uint8Array;
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
export declare const unpackSeq: (buf: Uint8Array, offset: number, ...items: [type: PrimitiveType, ...args: any[]][]) => Decoded<JSPrimitive[]>;
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
export declare const pack: (type: PrimitiveType, value: JSPrimitive, ...args: any[]) => ReturnType<EncodeFunc<JSPrimitive>>;
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
export declare const unpack: (type: PrimitiveType, buf: Uint8Array, offset: number, ...args: any[]) => ReturnType<DecodeFunc<JSPrimitive>>;
/** pack a `boolean` as 1-byte of data. */
export declare const encode_bool: EncodeFunc<boolean>;
/** unpack a `boolean` from 1-byte of data. */
export declare const decode_bool: DecodeFunc<boolean>;
/** pack a `string` as an array of characters, terminated by the `"\x00"` (or `"\u0000"`) charbyte.
 * this is the traditional c-programming language convention for strings.
*/
export declare const encode_cstr: EncodeFunc<string>;
/** unpack a `string` as an array of characters that's terminated by `"\x00"` (or `"\u0000"`) charbyte.
 * this is the traditional c-programming language convention for strings.
*/
export declare const decode_cstr: DecodeFunc<string>;
/** pack a `string` as an array of characters. */
export declare const encode_str: EncodeFunc<string>;
/** unpack a `string` as an array of characters.
 * you must provide the `bytesize` of the string being decoded,
 * otherwise the decoder will unpack till the end of the buffer.
*/
export declare const decode_str: DecodeFunc<string, [bytesize?: number]>;
/** pack a `Uint8Array` array of bytes as is. (ie: don't perform any operation). */
export declare const encode_bytes: EncodeFunc<Uint8Array>;
/** unpack a `Uint8Array` array of bytes.
 * you must provide the `bytesize` of the bytes being decoded,
 * otherwise the decoder will unpack till the end of the buffer.
*/
export declare const decode_bytes: DecodeFunc<Uint8Array, [bytesize?: number]>;
/** pack a numeric array (`number[]`) in the provided {@link NumericArrayType} byte representation. */
export declare const encode_number_array: EncodeFunc<number[], [type: NumericArrayType]>;
/** unpack a numeric array (`number[]`) that is encoded in one of {@link NumericArrayType} byte representation.
 * you must provide the `array_length` of the array being decoded,
 * otherwise the decoder will unpack till the end of the buffer.
*/
export declare const decode_number_array: DecodeFunc<number[], [type: NumericArrayType, array_length?: number]>;
/** pack a `number` in the provided {@link NumericType} byte representation. */
export declare const encode_number: EncodeFunc<number, [type: NumericType]>;
/** unpack a `number` in the provided {@link NumericType} byte representation. */
export declare const decode_number: DecodeFunc<number, [type: NumericType]>;
//# sourceMappingURL=eightpack.d.ts.map