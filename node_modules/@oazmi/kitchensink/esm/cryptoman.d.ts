/** utility functions for cryptography.
 *
 * @module
*/
/** generate a CRC32 hash table for quick lookups. */
import "./_dnt.polyfills.js";
export declare const createCrc32Table: () => Int32Array;
/** the CRC32 hash is quick to compute and used frequently in compression functions and their derivatives.
 *
 * you do not have to provide the `bytes` array in its entirety all at once,
 * because you can continue off with the previous partial byte array's crc-hash using the second argument.
 *
 * @param bytes an array of bytes to compute the hash for. can be any kind of array, so long as all byte numbers conform to being unsigned integers that do not exceed the maximum value of `255` (8-bit max value)
 * @param crc provide any previous crc hash that you'd like to continue from, or leave it `undefined` to begin from the standard value of `0xFFFFFFFF` by default
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	txtenc = new TextEncoder(),
 * 	crc_a = crc32(txtenc.encode("hello ")),       // == 0xED81F9F6
 * 	crc_b = crc32(txtenc.encode("world"), crc_a), // == 0x0D4A1185
 * 	crc_c = crc32(txtenc.encode("hello world"))   // == 0x0D4A1185
 * assertEquals(crc_b, crc_c)
 * ```
*/
export declare const crc32: (bytes: Uint8Array | Array<number>, crc?: number) => number;
//# sourceMappingURL=cryptoman.d.ts.map