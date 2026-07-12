/** submodule for {@link "eightpack"} that adds the ability to encode and decode variable byte-sized integers.
 *
 * this part of the library has been separated from  {@link "eightpack"} because of the unlikeyhood of being used.
 *
 * - `uvar` stands for an unsigned variable-sized integer.
 * - `ivar` stands for a signed variable-sized integer.
 *
 * ## Purpose
 *
 * these variable-sized encodings are especially useful for encoding the length of other variables in their header (i.e. at the beginning of their sequence).
 *
 * ## How the encoding works
 *
 * ### Unsigned integer case
 *
 * - the byte form of a `uvar` occupies a variable number of bytes to accommodate the unsigned integer that it is holding.
 * - for each byte, it uses the first bit of the octet (`0bXYYYYYYY`) to signal whether the integer carries on to the next byte (X == 1) or not (X == 0).
 * - the remaining 7 bits in each byte are used for base-7 big-endian encoding of the numeric value of the integer (`YYYYYYY`).
 * - you can read more about it on [wikipedia](https://en.wikipedia.org/wiki/Variable-length_quantity).
 *
 * the following table lists the first few bounds of this encoding:
 *
 * | decimal          | unsigned big endian binary                  | unsigned variable binary         |
 * |------------------|---------------------------------------------|----------------------------------|
 * | 0                | 0b00000000 0b00000000 0b00000000 0b00000000 | 0b00000000                       |
 * | 127 = 2^7 - 1    | 0b00000000 0b00000000 0b00000000 0b01111111 | 0b01111111                       |
 * | 128 = 2^7        | 0b00000000 0b00000000 0b00000000 0b10000000 | 0b10000001 0b00000000            |
 * | 16383 = 2^14 - 1 | 0b00000000 0b00000000 0b00111111 0b11111111 | 0b11111111 0b01111111            |
 * | 16384 = 2^14     | 0b00000000 0b00000000 0b01000000 0b00000000 | 0b10000001 0b10000000 0b00000000 |
 *
 * ### Signed integer case
 *
 * - the `ivar` encoding is similar to the `uvar` encoding, with the exception that in the first byte,
 *   the second-major bit `Z` of the octet (0b0ZYYYYYY) signals whether the number is positive (Z == 0), or negative (Z == 1).
 *
 * the following table lists the first few bounds of this encoding:
 *
 * | decimal             | signed big endian binary                    | signed variable binary           |
 * |---------------------|---------------------------------------------|----------------------------------|
 * |  0                  | 0b00000000 0b00000000 0b00000000 0b00000000 | 0b00000000 or 0b01000000         |
 * |  63 =   2^6 - 1     | 0b00000000 0b00000000 0b00000000 0b00111111 | 0b00111111                       |
 * | -63 = -(2^6 - 1)    | 0b00000000 0b00000000 0b00000000 0b11000001 | 0b01111111                       |
 * |  8191 =   2^13 - 1  | 0b00000000 0b00000000 0b00011111 0b11111111 | 0b10111111 0b01111111            |
 * | -8191 = -(2^13 - 1) | 0b00000000 0b00000000 0b11100000 0b00000001 | 0b11111111 0b01111111            |
 *
 * @module
*/
import type { DecodeFunc, EncodeFunc } from "./eightpack.js";
import type { VarNumericArrayType, VarNumericType } from "./typedefs.js";
/** encode a `number` as a variable sized integer (signed or unsigned) in binary. */
export declare const encode_varint: EncodeFunc<number, [type: VarNumericType]>;
/** encode an array of `number`s as variable sized integers (signed or unsigned) in binary. */
export declare const encode_varint_array: EncodeFunc<number[], [type: VarNumericArrayType]>;
/** decode an byte buffer as a variable sized integer of the given `type` (signed or unsigned). */
export declare const decode_varint: DecodeFunc<number, [type: VarNumericType]>;
/** decode an byte buffer as an array of variable sized integers of the given `type` (signed or unsigned) and `array_length`. */
export declare const decode_varint_array: DecodeFunc<number[], [type: VarNumericArrayType, array_length?: number]>;
/** byte encoder for an array of unsigned-integers.
 * use {@link decode_uvar_array} for decoding the result.
*/
export declare const encode_uvar_array: EncodeFunc<number[]>;
/** byte buffer decoder for an array of unsigned-integers of the given (optional) `array_length`.
 * use {@link encode_uvar_array} for encoding first.
*/
export declare const decode_uvar_array: DecodeFunc<number[], [array_length?: number]>;
/** byte encoder for an array of signed-integers.
 * use {@link decode_ivar_array} for decoding the result.
*/
export declare const encode_ivar_array: EncodeFunc<number[]>;
/** byte buffer decoder for an array of signed-integers of the given (optional) `array_length`.
 * use {@link encode_ivar_array} for encoding first.
*/
export declare const decode_ivar_array: DecodeFunc<number[], [array_length?: number]>;
/** a single variable-sized unsigned-integer byte encoder.
 * use {@link decode_uvar} for decoding the result.
*/
export declare const encode_uvar: EncodeFunc<number>;
/** a single variable-sized unsigned-integers decoder.
 * use {@link encode_uvar} for encoding first.
*/
export declare const decode_uvar: DecodeFunc<number>;
/** a single variable-sized signed-integer byte encoder.
 * use {@link decode_ivar} for decoding the result.
*/
export declare const encode_ivar: EncodeFunc<number>;
/** a single variable-sized signed-integers decoder.
 * use {@link encode_ivar} for encoding first.
*/
export declare const decode_ivar: DecodeFunc<number>;
//# sourceMappingURL=eightpack_varint.d.ts.map