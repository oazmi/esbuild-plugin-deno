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
/** encode a `number` as a variable sized integer (signed or unsigned) in binary. */
export const encode_varint = (value, type) => { return encode_varint_array([value,], type); };
/** encode an array of `number`s as variable sized integers (signed or unsigned) in binary. */
export const encode_varint_array = (value, type) => {
    return type[0] === "u"
        ? encode_uvar_array(value)
        : encode_ivar_array(value);
};
/** decode an byte buffer as a variable sized integer of the given `type` (signed or unsigned). */
export const decode_varint = (buf, offset, type) => {
    const [value, bytesize] = decode_varint_array(buf, offset, type, 1);
    return [value[0], bytesize];
};
/** decode an byte buffer as an array of variable sized integers of the given `type` (signed or unsigned) and `array_length`. */
export const decode_varint_array = (buf, offset, type, array_length) => {
    return type[0] === "u"
        ? decode_uvar_array(buf, offset, array_length)
        : decode_ivar_array(buf, offset, array_length);
};
/** byte encoder for an array of unsigned-integers.
 * use {@link decode_uvar_array} for decoding the result.
*/
export const encode_uvar_array = (value) => {
    const len = value.length, bytes = [];
    for (let i = 0; i < len; i++) {
        let v = value[i];
        v = v * (v >= 0 ? 1 : -1); // converting to absolute value
        const lsb_to_msb = [];
        do {
            lsb_to_msb.push((v & 0b01111111) + 0b10000000);
            v >>= 7;
        } while (v > 0);
        lsb_to_msb[0] &= 0b01111111;
        bytes.push(...lsb_to_msb.reverse());
    }
    return Uint8Array.from(bytes);
};
/** byte buffer decoder for an array of unsigned-integers of the given (optional) `array_length`.
 * use {@link encode_uvar_array} for encoding first.
*/
export const decode_uvar_array = (buf, offset = 0, array_length) => {
    if (array_length === undefined) {
        array_length = Infinity;
    }
    const array = [], offset_start = offset, buf_length = buf.length;
    // this is a condensed version of {@link decode_uvar}
    let value = 0;
    for (let byte = buf[offset++]; array_length > 0 && offset < buf_length + 1; byte = buf[offset++]) {
        value <<= 7;
        value += byte & 0b01111111;
        if (byte >> 7 === 0) {
            array.push(value);
            array_length--;
            value = 0;
        }
    }
    offset--;
    return [array, offset - offset_start];
};
/** byte encoder for an array of signed-integers.
 * use {@link decode_ivar_array} for decoding the result.
*/
export const encode_ivar_array = (value) => {
    const len = value.length, bytes = [];
    for (let i = 0; i < len; i++) {
        let v = value[i];
        const sign = v >= 0 ? 1 : -1, lsb_to_msb = [];
        v = v * sign; // `v` is now positive
        while (v > 0b00111111) {
            lsb_to_msb.push((v & 0b01111111) + 0b10000000);
            v >>= 7;
        }
        lsb_to_msb.push((v & 0b00111111) | (sign == -1 ? 0b11000000 : 0b10000000));
        lsb_to_msb[0] &= 0b01111111;
        bytes.push(...lsb_to_msb.reverse());
    }
    return Uint8Array.from(bytes);
};
/** byte buffer decoder for an array of signed-integers of the given (optional) `array_length`.
 * use {@link encode_ivar_array} for encoding first.
*/
export const decode_ivar_array = (buf, offset = 0, array_length) => {
    if (array_length === undefined) {
        array_length = Infinity;
    }
    const array = [], offset_start = offset, buf_length = buf.length;
    // this is a condensed version of {@link decode_ivar}
    let sign = 0, value = 0;
    for (let byte = buf[offset++]; array_length > 0 && offset < buf_length + 1; byte = buf[offset++]) {
        if (sign === 0) {
            sign = (byte & 0b01000000) > 0 ? -1 : 1;
            value = (byte & 0b00111111);
        }
        else {
            value <<= 7;
            value += byte & 0b01111111;
        }
        if (byte >> 7 === 0) {
            array.push(value * sign);
            array_length--;
            sign = 0;
            value = 0;
        }
    }
    offset--;
    return [array, offset - offset_start];
};
/** a single variable-sized unsigned-integer byte encoder.
 * use {@link decode_uvar} for decoding the result.
*/
export const encode_uvar = (value) => { return encode_uvar_array([value,]); };
/// the old implementation, which was designed for a single `number` and was easier to read, has been kept here for reference.
/*
const encode_uvar: EncodeFunc<number | bigint> = (value) => {
    value = BigInt(value) * (value >= 0 ? 1n : -1n) // converting to absolute value
    const lsb_to_msb: number[] = []
    do {
        lsb_to_msb.push(Number((value & 0b01111111n) + 0b10000000n))
        value >>= 7n
    } while (value > 0n)
    lsb_to_msb[0] &= 0b01111111
    return Uint8Array.from(lsb_to_msb.reverse())
}
*/
/** a single variable-sized unsigned-integers decoder.
 * use {@link encode_uvar} for encoding first.
*/
export const decode_uvar = (buf, offset = 0) => {
    const [value_arr, bytesize] = decode_uvar_array(buf, offset, 1);
    return [value_arr[0], bytesize];
};
/// the old implementation, which was designed for a single `number` and was easier to read, has been kept here for reference.
/*
const decode_uvar: DecodeFunc<number> = (buf, offset = 0) => {
    const offset_start = offset
    let
        byte: number,
        value: bigint = 0n
    do {
        byte = buf[offset++]
        value <<= 7n
        value += BigInt(byte & 0b01111111)
    } while (byte >> 7 === 1)
    return [Number(value), offset - offset_start]
}
*/
/** a single variable-sized signed-integer byte encoder.
 * use {@link decode_ivar} for decoding the result.
*/
export const encode_ivar = (value) => { return encode_ivar_array([value,]); };
/// the old implementation, which was designed for a single `number` and was easier to read, has been kept here for reference.
/*
const encode_ivar: EncodeFunc<number | bigint> = (value) => {
    const
        sign = value >= 0 ? 1n : -1n,
        lsb_to_msb: number[] = []
    value = BigInt(value) * sign // `val` is now positive
    while (value > 0b00111111n) {
        lsb_to_msb.push(Number((value & 0b01111111n) + 0b10000000n))
        value >>= 7n
    }
    lsb_to_msb.push(Number((value & 0b00111111n) | (sign == -1n ? 0b11000000n : 0b10000000n)))
    lsb_to_msb[0] &= 0b01111111
    return Uint8Array.from(lsb_to_msb.reverse())
}
*/
/** a single variable-sized signed-integers decoder.
 * use {@link encode_ivar} for encoding first.
*/
export const decode_ivar = (buf, offset = 0) => {
    const [value_arr, bytesize] = decode_ivar_array(buf, offset, 1);
    return [value_arr[0], bytesize];
};
/// the old implementation, which was designed for a single `number` and was easier to read, has been kept here for reference.
/*
const decode_ivar: DecodeFunc<number> = (buf, offset = 0) => {
    const offset_start = offset
    let
        byte: number = buf[offset++],
        sign: bigint = (byte & 0b01000000) > 0n ? -1n : 1n,
        value: bigint = BigInt(byte & 0b00111111)
    while (byte >> 7 === 1) {
        byte = buf[offset++]
        value <<= 7n
        value += BigInt(byte & 0b01111111)
    }
    value *= sign
    return [Number(value), offset - offset_start]
}
*/
