/** utility functions for cryptography.
 *
 * > [!note]
 * > some functions require the use of the built-in `crypto.subtle` functions, which not available in client-side "http" contexts.
 * > your client will have to connect via "https" for their browser to let them use `crypto.subtle` hashing algorithms.
 *
 * @module
*/
import { textEncoder } from "./eightpack.js";
import { isBigint } from "./struct.js";
/** generate a CRC32 hash table for quick lookups. */
export const createCrc32Table = () => {
    const polynomial = -306674912, crc32_table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
        // initialize the table with `polynomial` being the starting seed
        let r = i;
        for (let bit = 8; bit > 0; --bit) {
            r = ((r & 1) ? ((r >>> 1) ^ polynomial) : (r >>> 1));
        }
        crc32_table[i] = r;
    }
    return crc32_table;
};
let crc32_table;
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
export const crc32 = (bytes, crc) => {
    crc = crc === undefined ? 0xFFFFFFFF : crc ^ -1;
    crc32_table ??= createCrc32Table();
    for (let i = 0; i < bytes.length; ++i) {
        crc = crc32_table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ -1) >>> 0;
};
/** clamps a 32-byte `bigint` private key (scalar), per `x25519`'s requirement, and then returns it back. */
export const clampX25519Scalar = (scalar) => {
    const mask_bits = 32n * 8n, mask = (1n << (mask_bits - 1n)) - 1n;
    // clear the 3 lower bits
    scalar = (scalar >> 3n) << 3n;
    // clear the highest bit on the 32-byte mark
    scalar &= mask;
    // set second-highest bit
    scalar |= 1n << (mask_bits - 2n);
    return scalar;
};
/** decode a little-endian based bytes representation of a number to a `bigint`. */
export const decodeBigintL = (bytes) => {
    // accumulating byte in reverse order, since the last byte in little-endian is the most significant byte.
    let acc = 0n;
    for (let i = bytes.length - 1; i >= 0; i--) {
        acc = ((acc << 8n) + BigInt(bytes[i]));
    }
    return acc;
};
/** encode a `bigint` into an array of little-endian bytes of either a fixed `length`,
 * or a variable length (i.e. whatever suffices to hold the bigint's info).
*/
export const encodeBigintL = (big_value, length) => {
    if (length === undefined) {
        length = 0;
        let remainder = big_value;
        while (remainder > 0n) {
            remainder /= 0xffn;
            length++;
        }
    }
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        // acquire the current least significant numeric byte's value.
        bytes[i] = Number(big_value & 0xffn);
        // right-shift the bigint's value by 1 byte (8 bits).
        big_value >>= 8n;
    }
    return bytes;
};
/** modular exponentiation (`base ** expo mod modulo`) */
const modExp = (base, expo, modulo) => {
    let result = 1n;
    let b = base % modulo;
    let e = expo;
    while (e > 0) {
        if ((e & 1n) === 1n)
            result = (result * b) % modulo;
        b = (b * b) % modulo;
        e >>= 1n;
    }
    return result;
};
const 
// the `curve25519` field modulus is the prime number: `2^255 - 19`. I don't understand its significance.
P = (1n << 255n) - 19n, 
// `a24` is defined as `a24 = (A + 2)/4`, where `A` is a parameter of the underlying montgomery curve - wikipedia.
// what the heck that means is of no concern to me.
// all I know is that `A = 486662` (from [here](https://en.wikipedia.org/wiki/Curve25519)).
a24 = (486662n - 2n) / 4n;
/** `curve25519` scalar multiplication (via montgomery-ladder), implementing [`RFC7748`](https://datatracker.ietf.org/doc/html/rfc7748).
 *
 * the implementation follows the pseudo code presented in
 * [wikipedia](https://en.wikipedia.org/wiki/Elliptic_curve_point_multiplication#Constant_time_Montgomery_ladder).
 *
 * @param scalar your private key (must be clamped beforehand when being used for `x25519` key generation).
 * @param basepoint the basepoint "common secret".
 *   this is typically `9n` for `x25519` key generation, and hence it is also the default value.
 * @returns the "public key" as a bigint.
 *
 * @example
 * an "alice and bob" example but with bob replaced with "bobby", so that both names are 5 characters long.
 *
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // the private keys of both parties
 * const
 * 	alice_private_key = 123n,
 * 	bobby_private_key = 789n
 *
 * // both compute a public key, based on a globally agreed upon basekey (global common secret).
 * // this "globally common secret" is `9n` for the `x25519` key-generation.
 * const
 * 	alice_public_key = curve25519ScalarMult(alice_private_key, 9n),
 * 	bobby_public_key = curve25519ScalarMult(bobby_private_key, 9n)
 *
 * assertEquals(alice_public_key, 36775675751433867979441935675960806006270981998619265997805716105314274742222n)
 * assertEquals(bobby_public_key, 4776225643423455257904064614728753759233983901518081694545578805283024213294n)
 *
 * // now, they both exchange their public keys, and then use it as the "basepoint" (a secret between the two),
 * // to _derive_ a _common shared_ secret key, that is the same for both of them.
 * const
 * 	alice_shared_secret_key = curve25519ScalarMult(alice_private_key, bobby_public_key),
 * 	bobby_shared_secret_key = curve25519ScalarMult(bobby_private_key, alice_public_key)
 *
 * assertEquals(alice_shared_secret_key, bobby_shared_secret_key)
 * assertEquals(alice_shared_secret_key, 26692159771081237073471702917999531026498379047472371972701945697203840355541n)
 *
 * // notice that neither alice nor bobby had to exchange this secret key with one another;
 * // they both just computed the same value due to the symmetric nature of `curve25519`.
 * // if a third person, say cluky, were to intercept both public keys,
 * // they won't be able to derive the same secret value that's between alice and bobby, no matter what they try,
 * // unless they manage to get their hands on either one's private key.
 * //
 * // and so now, both alice and bobby can safely use this secret key to encrypt and decrypt each other's messages.
 * // there are many encryption protocols, but a few common ones are: AES256, ChaCha20, HMAC, and the list goes.
 * ```
*/
export const curve25519ScalarMult = (scalar, basepoint = 9n) => {
    let x1 = basepoint % P, x2 = 1n, z2 = 0n, x3 = x1, z3 = 1n, prevbit = 0n;
    // iterate over bits `254`, down to `0`, as per `RFC7748`.
    for (let i = 254n; i >= 0n; i--) {
        const bit = (scalar >> i) & 1n;
        prevbit ^= bit;
        // conditional swap (x2, x3) and (z2, z3) (i.e. the CSwap portion)
        if (prevbit === 1n) {
            [x2, x3, z2, z3] = [x3, x2, z3, z2];
        }
        prevbit = bit;
        // LadderStep computation. note that we need to add `P` in every subtraction step,
        // because javascript's remainder operator is not the same as the mathematical modulo operator,
        // because it preserve negative values that do not have an absolute value above the mod.
        const T1_0 = (x2 + z2) % P, T2_0 = (x2 - z2 + P) % P, T3_0 = (x3 + z3) % P, T4_0 = (x3 - z3 + P) % P, T5_0 = (T1_0 * T1_0) % P, T6_0 = (T2_0 * T2_0) % P, 
        // I'm short cutting a few steps, since the wikipedia page uses some variables for temporary swap assignments.
        T2_1 = (T1_0 * T4_0) % P, T1_1 = (T2_1 + T2_0 * T3_0) % P, T5_1 = (T5_0 - T6_0 + P) % P, T1_2 = (a24 * T5_1) % P, T2_2 = (T2_1 * 2n - T1_1 + P) % P, 
        // IMPORTANT! I think the wikipedia incorrectly gives the following expression for `T6_1`:
        // `(T6_0 + T1_2) % P`, when it should instead be `(T5_0 + T1_2) % P`
        T6_1 = (T5_0 + T1_2) % P;
        // set the values for the next iteration
        x3 = (T1_1 * T1_1) % P;
        // z3 = (((T2_1 * T2_1) % P) * x1) % P // I don't know how I got this incorrect(?) expression some time ago.
        z3 = (((T2_2 * T2_2) % P) * x1) % P;
        x2 = (T5_0 * T6_0) % P;
        z2 = (T5_1 * T6_1) % P;
    }
    if (prevbit === 1n) {
        [x2, x3, z2, z3] = [x3, x2, z3, z2];
    }
    // compute the `z2` inverse via exponentiation: `z2 ** (p - 2) mod p`
    const z2_inv = modExp(z2, P - 2n, P);
    // result = x2 * z2_inv mod p
    return (x2 * z2_inv) % P;
};
/** generate an `x25519` private and public keypair (in 32-byte array form) using the `curve25519` scalar multiplication algorithm.
 *
 * you can optionally provide an existing `private_key`, either as a `bigint`,
 * or as a 32-byte array (`Uint8Array` of size `32`).
 * if your private key is not pre-clamped based on `x25519`'s requirements,
 * it will be forcefully clampped, and the returned {@link KeyPair.privateKey} will be clampped.
 *
 * if you don't provide a private key, this function will randomly generate one for you,
 * using: `crypto.getRandomValues(new Uint8Array(32))`.
 *
 * > [!note]
 * > to convert the key pairs to base64 strings,
 * > use the freshly added (es2025+) `Uint8Array.toBase64` method on each of the keys.
*/
export const generateX25519Keypair = (private_key) => {
    if (!isBigint(private_key)) {
        // generating random 32-bytes as our private key if it was not already defined.
        private_key = decodeBigintL(private_key ?? crypto.getRandomValues(new Uint8Array(32)));
    }
    private_key = clampX25519Scalar(private_key);
    // the "global common secret" key for generating the public `x25519` key is `9` (now we know why hitler always yelled nein!).
    const public_key = generateX25519SecretKey(private_key, 9n);
    return {
        privateKey: encodeBigintL(private_key, 32),
        publicKey: public_key,
    };
};
/** generate a `x25519` secret key that is common between your private key, and your peer's public key.
 *
 * > [!note]
 * > your private key is NOT clampped here! it should already be clampped if it we generated via some `x25519` keygen.
 *
 * @example
 * an "alice and bob" example but with bob replaced with "bobby", so that both names are 5 characters long.
 *
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // the private keys of both parties (both are incorrectly clampped for `x25519`, but we'll just go with it)
 * const
 * 	alice_private_key = 123n,
 * 	bobby_private_key = 789n
 *
 * // both compute a public key, based on a globally agreed upon basekey (global common secret).
 * // this "globally common secret" is `9n` for the `x25519` key-generation.
 * const
 * 	alice_public_key: Uint8Array = generateX25519SecretKey(alice_private_key, 9n),
 * 	bobby_public_key: Uint8Array = generateX25519SecretKey(bobby_private_key, 9n)
 *
 * // now, they both exchange their public keys, and then use it as the "basepoint" (a secret between the two),
 * // to _derive_ a _common shared_ secret key, that is the same for both of them.
 * const
 * 	alice_shared_secret_key: Uint8Array = generateX25519SecretKey(alice_private_key, bobby_public_key),
 * 	bobby_shared_secret_key: Uint8Array = generateX25519SecretKey(bobby_private_key, alice_public_key)
 *
 * assertEquals(alice_shared_secret_key, bobby_shared_secret_key)
 *
 * // notice that neither alice nor bobby had to exchange this secret key with one another;
 * // they both just computed the same value due to the symmetric nature of `curve25519`.
 * // if a third person, say cluky, were to intercept both public keys,
 * // they won't be able to derive the same secret value that's between alice and bobby, no matter what they try,
 * // unless they manage to get their hands on either one's private key.
 * //
 * // and so now, both alice and bobby can safely use this secret key to encrypt and decrypt each other's messages.
 * // there are many encryption protocols, but a few common ones are: AES256, ChaCha20, HMAC, and the list goes.
 * ```
*/
export const generateX25519SecretKey = (your_private_key, peer_public_key) => {
    your_private_key = isBigint(your_private_key)
        ? your_private_key
        : decodeBigintL(your_private_key);
    peer_public_key = isBigint(peer_public_key)
        ? peer_public_key
        : decodeBigintL(peer_public_key);
    const secret_key = curve25519ScalarMult(your_private_key, peer_public_key);
    return encodeBigintL(secret_key, 32);
};
// TODO: add your AWS Signature V4 Authorization key generator here in the future
/** SHA-256 hash function.
 *
 * > [!important]
 * > requires `crypto.subtle` to be available in your client's browser, which is only available in `https` sites.
*/
export const sha256 = async (message) => {
    const msgBuffer = typeof message === "string" ? textEncoder.encode(message) : message, hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    return hashBuffer;
};
/** HMAC-SHA256 function.
 *
 * > [!important]
 * > requires `crypto.subtle` to be available in your client's browser, which is only available in `https` sites.
*/
export const hmacSha256 = async (encryption_key, message) => {
    const keyBuffer = typeof encryption_key === "string" ? textEncoder.encode(encryption_key) : encryption_key, msgBuffer = typeof message === "string" ? textEncoder.encode(message) : message, cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]), signature = await crypto.subtle.sign("HMAC", cryptoKey, msgBuffer);
    return signature;
};
/** apply the {@link hmacSha256} hashing function recursively on multiple messages/binaries.
 *
 * the first message will be used as the encryption key for the second message,
 * and the resulting encrypted message will be used as the encryption key for the third message,
 * and so on, until the final message is encrypted and returned.
 *
 * note that you should provide at least two messages.
*/
export const hmacSha256Recursive = async (...messages) => {
    let hash = messages.shift();
    while (messages.length > 0) {
        hash = await hmacSha256(hash, messages.shift());
    }
    return hash;
};
