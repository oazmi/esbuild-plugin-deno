/** utility functions for packing and unpacking bytes (8-bits) of primitive javascript objects.
 * > and hence the name of the module (*8(bit)pack*).
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { array_from, number_parseInt } from "./alias.js";
import { decode_varint, decode_varint_array, encode_varint, encode_varint_array } from "./eightpack_varint.js";
import { concatBytes, env_is_little_endian, swapEndiannessFast, typed_array_constructor_of } from "./typedbuffer.js";
const txt_encoder = /*@__PURE__*/ new TextEncoder(), txt_decoder = /*@__PURE__*/ new TextDecoder();
/** read `type` of value from buffer `buf`, starting at position `offset`. */
export const readFrom = (buf, offset, type, ...args) => {
    const [value, bytesize] = unpack(type, buf, offset, ...args);
    return [value, offset + bytesize];
};
/** write `type` of `value` to buffer `buf`, starting at position `offset`. */
export const writeTo = (buf, offset, type, value, ...args) => {
    const value_buf = pack(type, value, ...args);
    buf.set(value_buf, offset);
    return [buf, offset + value_buf.length];
};
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
export const packSeq = (...items) => {
    const bufs = [];
    for (const item of items) {
        bufs.push(pack(...item));
    }
    return concatBytes(...bufs);
};
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
export const unpackSeq = (buf, offset, ...items) => {
    const values = [];
    let total_bytesize = 0;
    for (const [type, ...args] of items) {
        const [value, bytesize] = unpack(type, buf, offset + total_bytesize, ...args);
        values.push(value);
        total_bytesize += bytesize;
    }
    return [values, total_bytesize];
};
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
export const pack = (type, value, ...args) => {
    switch (type) {
        case "bool": return encode_bool(value);
        case "cstr": return encode_cstr(value);
        case "str": return encode_str(value);
        case "bytes": return encode_bytes(value);
        default: {
            if (type[1] === "v") {
                return type.endsWith("[]") ?
                    encode_varint_array(value, type) :
                    encode_varint(value, type);
            }
            else {
                return type.endsWith("[]") ?
                    encode_number_array(value, type) :
                    encode_number(value, type);
            }
        }
    }
};
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
export const unpack = (type, buf, offset, ...args) => {
    switch (type) {
        case "bool": return decode_bool(buf, offset);
        case "cstr": return decode_cstr(buf, offset);
        case "str": return decode_str(buf, offset, ...args);
        case "bytes": return decode_bytes(buf, offset, ...args);
        default: {
            if (type[1] === "v") {
                return type.endsWith("[]") ?
                    decode_varint_array(buf, offset, type, ...args) :
                    decode_varint(buf, offset, type);
            }
            else {
                return type.endsWith("[]") ?
                    decode_number_array(buf, offset, type, ...args) :
                    decode_number(buf, offset, type);
            }
        }
    }
};
/** pack a `boolean` as 1-byte of data. */
export const encode_bool = (value) => { return Uint8Array.of(value ? 1 : 0); };
/** unpack a `boolean` from 1-byte of data. */
export const decode_bool = (buf, offset = 0) => { return [buf[offset] >= 1 ? true : false, 1]; };
/** pack a `string` as an array of characters, terminated by the `"\x00"` (or `"\u0000"`) charbyte.
 * this is the traditional c-programming language convention for strings.
*/
export const encode_cstr = (value) => { return txt_encoder.encode(value + "\x00"); };
/** unpack a `string` as an array of characters that's terminated by `"\x00"` (or `"\u0000"`) charbyte.
 * this is the traditional c-programming language convention for strings.
*/
export const decode_cstr = (buf, offset = 0) => {
    const offset_end = buf.indexOf(0x00, offset), txt_arr = buf.subarray(offset, offset_end), value = txt_decoder.decode(txt_arr);
    return [value, txt_arr.length + 1];
};
/** pack a `string` as an array of characters. */
export const encode_str = (value) => { return txt_encoder.encode(value); };
/** unpack a `string` as an array of characters.
 * you must provide the `bytesize` of the string being decoded,
 * otherwise the decoder will unpack till the end of the buffer.
*/
export const decode_str = (buf, offset = 0, bytesize) => {
    const offset_end = bytesize === undefined ? undefined : offset + bytesize, txt_arr = buf.subarray(offset, offset_end), value = txt_decoder.decode(txt_arr);
    return [value, txt_arr.length];
};
/** pack a `Uint8Array` array of bytes as is. (ie: don't perform any operation). */
export const encode_bytes = (value) => { return value; };
/** unpack a `Uint8Array` array of bytes.
 * you must provide the `bytesize` of the bytes being decoded,
 * otherwise the decoder will unpack till the end of the buffer.
*/
export const decode_bytes = (buf, offset = 0, bytesize) => {
    const offset_end = bytesize === undefined ? undefined : offset + bytesize, value = buf.slice(offset, offset_end);
    return [value, value.length];
};
/** pack a numeric array (`number[]`) in the provided {@link NumericArrayType} byte representation. */
export const encode_number_array = (value, type) => {
    const [t, s, e] = type, typed_arr_constructor = typed_array_constructor_of(type), bytesize = number_parseInt(s), is_native_endian = (e === "l" && env_is_little_endian) || (e === "b" && !env_is_little_endian) || bytesize === 1 ? true : false, typed_arr = typed_arr_constructor.from(value);
    if (typed_arr instanceof Uint8Array) {
        return typed_arr;
    }
    const buf = new Uint8Array(typed_arr.buffer);
    if (is_native_endian) {
        return buf;
    }
    else
        return swapEndiannessFast(buf, bytesize);
};
/** unpack a numeric array (`number[]`) that is encoded in one of {@link NumericArrayType} byte representation.
 * you must provide the `array_length` of the array being decoded,
 * otherwise the decoder will unpack till the end of the buffer.
*/
export const decode_number_array = (buf, offset = 0, type, array_length) => {
    const [t, s, e] = type, bytesize = number_parseInt(s), is_native_endian = (e === "l" && env_is_little_endian) || (e === "b" && !env_is_little_endian) || bytesize === 1 ? true : false, bytelength = array_length ? bytesize * array_length : undefined, array_buf = buf.slice(offset, bytelength ? offset + bytelength : undefined), array_bytesize = array_buf.length, typed_arr_constructor = typed_array_constructor_of(type), typed_arr = new typed_arr_constructor(is_native_endian ? array_buf.buffer : swapEndiannessFast(array_buf, bytesize).buffer);
    return [array_from(typed_arr), array_bytesize];
};
/** pack a `number` in the provided {@link NumericType} byte representation. */
export const encode_number = (value, type) => { return encode_number_array([value,], type); };
/** unpack a `number` in the provided {@link NumericType} byte representation. */
export const decode_number = (buf, offset = 0, type) => {
    const [value_arr, bytesize] = decode_number_array(buf, offset, type, 1);
    return [value_arr[0], bytesize];
};
