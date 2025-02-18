/** utility functions for web browser interaction.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import type { TypeName } from "./typedefs.js";
/** create a blob out of your `Uint8Array` bytes buffer and queue it for downloading.
 *
 * you can also provide an optional `file_name` and `mime_type`.
 * technically, you can download any kind of data, so long as your `mime_type` and `data` pair match within the capabilities of your the browser's internal blob encoder.
*/
export declare const downloadBuffer: (data: Uint8Array | string | any, file_name?: string, mime_type?: string) => void;
/** convert a blob to base64 string, with the data header included.
 *
 * this function works correctly all the time, unlike `btoa`, which fails for arbitrary bytes.
 *
 * other related functions that you may find useful:
 * - use {@link blobToBase64Split} to get a 2-tuple with the data header split from the data body.
 * - or use {@link blobToBase64Body} to get just the body of the data.
*/
export declare const blobToBase64: (blob: Blob) => Promise<string>;
/** convert a blob to base64 string with the header and body separated as a 2-tuple. */
export declare const blobToBase64Split: (blob: Blob) => Promise<[string, string]>;
/** convert a blob to base64 string with the header omitted. */
export declare const blobToBase64Body: (blob: Blob) => Promise<string>;
/** convert a base64 encoded string (no header) into a `Uint8Array` bytes containing the binary data
 * see {@link bytesToBase64Body} for the reverse
*/
export declare const base64BodyToBytes: (data_base64: string) => Uint8Array;
/** encode data bytes into a base64 string (no header)
 * see {@link base64BodyToBytes} for the reverse
*/
export declare const bytesToBase64Body: (data_buf: Uint8Array) => string;
export type ReadableStreamKind<T> = T extends ArrayBuffer ? (T extends Uint8Array ? "uint8array" : "arraybuffer") : TypeName<T>;
/** detects the type of a `ReadableStream`.
 *
 * > [!note]
 * > note that the original stream is partially consumed, and you will not be able to use it any longer.
 * > instead, you will have to use the new stream returned by this function for consumption.
 *
 * > [!note]
 * > note that it is possible for a stream to contain all sorts of different types in each of its chunk,
 * > but we make our prediction based on only the first chunk's type.
 *
 * the implementation works as follows:
 * - create 2 clones of the original-stream via the `tee` method
 * - read the first-stream-clone's first chunk, and guess the type based on it
 * - cancel the original-stream and the first-stream-clone
 * - return the untouched second-stream-clone and the guessed type in an `Object` wrapper
*/
export declare const detectReadableStreamType: <T, K extends ReadableStreamKind<T>>(stream: ReadableStream<T>) => Promise<{
    kind: K;
    stream: typeof stream;
}>;
//# sourceMappingURL=browser.d.ts.map