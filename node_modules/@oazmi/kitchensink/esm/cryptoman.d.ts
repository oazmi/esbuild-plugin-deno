/** utility functions for cryptography.
 *
 * > [!note]
 * > some functions require the use of the built-in `crypto.subtle` functions, which not available in client-side "http" contexts.
 * > your client will have to connect via "https" for their browser to let them use `crypto.subtle` hashing algorithms.
 *
 * @module
*/
/** generate a CRC32 hash table for quick lookups. */
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
/** clamps a 32-byte `bigint` private key (scalar), per `x25519`'s requirement, and then returns it back. */
export declare const clampX25519Scalar: (scalar: bigint) => bigint;
/** decode a little-endian based bytes representation of a number to a `bigint`. */
export declare const decodeBigintL: (bytes: Uint8Array) => bigint;
/** encode a `bigint` into an array of little-endian bytes of either a fixed `length`,
 * or a variable length (i.e. whatever suffices to hold the bigint's info).
*/
export declare const encodeBigintL: (big_value: bigint, length?: number) => Uint8Array<ArrayBuffer>;
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
export declare const curve25519ScalarMult: (scalar: bigint, basepoint?: bigint) => bigint;
export interface KeyPair {
    privateKey: Uint8Array;
    publicKey: Uint8Array;
}
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
export declare const generateX25519Keypair: (private_key?: bigint | Uint8Array) => KeyPair;
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
export declare const generateX25519SecretKey: (your_private_key: bigint | Uint8Array, peer_public_key: bigint | Uint8Array) => Uint8Array<ArrayBuffer>;
/** SHA-256 hash function.
 *
 * > [!important]
 * > requires `crypto.subtle` to be available in your client's browser, which is only available in `https` sites.
*/
export declare const sha256: (message: string | ArrayBuffer) => Promise<ArrayBuffer>;
/** HMAC-SHA256 function.
 *
 * > [!important]
 * > requires `crypto.subtle` to be available in your client's browser, which is only available in `https` sites.
*/
export declare const hmacSha256: (encryption_key: string | ArrayBuffer, message: string | ArrayBuffer) => Promise<ArrayBuffer>;
/** apply the {@link hmacSha256} hashing function recursively on multiple messages/binaries.
 *
 * the first message will be used as the encryption key for the second message,
 * and the resulting encrypted message will be used as the encryption key for the third message,
 * and so on, until the final message is encrypted and returned.
 *
 * note that you should provide at least two messages.
*/
export declare const hmacSha256Recursive: (message1: string | ArrayBuffer, message2: string | ArrayBuffer, ...rest_of_messages: (string | ArrayBuffer)[]) => Promise<ArrayBuffer>;
//# sourceMappingURL=cryptoman.d.ts.map