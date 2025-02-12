/** utility functions for handling images along with canvas tools.
 *
 * TODO: add test code within documentation. however, I'm uncertain how I would go about testing canvas/offscreencanvas features within Deno.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { type Rect, type SimpleImageData } from "./struct.js";
import type { Optional } from "./typedefs.js";
/** an image source acceptable by a {@link constructImageBitmapSource}, which generates an `ImageBitmapSource` for a `Canvas` or an `OffscreenCanvas`.
 *
 * if the source is a `string`, then it must be URI. i.e. data-uri, or url-links or relative-links are all acceptable,
 * so long as they can be assigned to `HTMLImageElement.src`.
*/
export type AnyImageSource = string | Uint8Array | Uint8ClampedArray | ArrayBuffer | Array<number> | ImageBitmapSource;
/** image source mime-types accepted by most modern web-browsers. */
export type ImageMIMEType = `image/${"gif" | "jpeg" | "jpg" | "png" | "svg+xml" | "webp"}`;
/** a base64-encoded image-data uri's header component. */
export type Base64ImageHeader = `data:${ImageMIMEType};base64,`;
/** an image-data uri (in base64 encoding). */
export type Base64ImageString = `${Base64ImageHeader}${string}`;
/** an blob containing image data. */
export type ImageBlob = Blob & {
    type: ImageMIMEType;
};
/** get the global background `OffscreenCanvas`.
 *
 * if the offscreen-canvas has not been initialized prior, it will be initialized with your provided optional `init_width` and `init_height` dimensions.
 * however, if it _has_ been already initialized, then it **will not** resize to your provided size.
 * thus, if you want a specific size, you should **always** set it manually yourself.
 *
 * the reason why we don't resize here, is because resizing clears the canvas, and thus, you will lose your image if you were planning to read it back.
*/
export declare const getBgCanvas: (init_width?: number | undefined, init_height?: number | undefined) => OffscreenCanvas;
/** get the global background `OffscreenCanvas`'s 2d-rendering context, and make it specialize in frequent reading (i.e. `willReadFrequently` is set to `true`).
 *
 * if the offscreen-canvas has not been initialized prior, it will be initialized with your provided optional `init_width` and `init_height` dimensions.
 * however, if it _has_ been already initialized, then it **will not** resize to your provided size.
 * thus, if you want a specific size, you should **always** set it manually yourself.
 *
 * the reason why we don't resize here, is because resizing clears the canvas, and thus, you will lose your image if you were planning to read it back.
*/
export declare const getBgCtx: (init_width?: number | undefined, init_height?: number | undefined) => OffscreenCanvasRenderingContext2D;
/** check of the provided string is a base64 string, by simply observing if it starts with `"data:image/"`. */
export declare const isBase64Image: (str?: string) => str is Base64ImageString;
/** get the header of a base64 image.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	img_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAD...",
 * 	img_header = getBase64ImageHeader(img_uri)
 *
 * assertEquals(img_header, "data:image/png;base64,")
 * ```
*/
export declare const getBase64ImageHeader: (str: Base64ImageString) => Base64ImageHeader;
/** get the mime type of a base64 image.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	img_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAD...",
 * 	img_mime = getBase64ImageMIMEType(img_uri)
 *
 * assertEquals(img_mime, "image/png")
 * ```
*/
export declare const getBase64ImageMIMEType: (str: Base64ImageString) => ImageMIMEType;
/** get the body data portion of a base64 image.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	img_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAD...",
 * 	img_body = getBase64ImageBody(img_uri)
 *
 * assertEquals(img_body, "iVBORw0KGgoAAAANSUhEUgAAD...")
 * ```
*/
export declare const getBase64ImageBody: (str: Base64ImageString) => string;
/** load an image as a `Blob`, with the chosen optional `type` encoding (default is "image/png").
 *
 * possible image sources are:
 * - data uri for base64 encoded image `string`
 * - http url path `string`
 * - file url path `string`
 * - buffer of RGBA pixel byte data as `Uint8Array`, `Uint8ClampedArray`, `ArrayBuffer`, or `Array<number>`
 * - `ImageBitmapSource`, which includes:
 *   - `Blob`
 *   - `ImageData`
 *   - `HTMLCanvasElement` or `OffscreenCanvas`
 *   - `HTMLImageElement` or `SVGImageElement` or `HTMLVideoElement`
 *   - `ImageBitmap`
 *
 * @param img_src anything image representation that can be constructed into an `ImageBitmap` using {@link constructImageBitmapSource}
 * @param width when using `Uint8Array`, `Uint8ClampedArray`, `ArrayBuffer`, or `Array<number>` as `img_src`, you must necessarily provide the width of the image
 * @param crop_rect specify a cropping rectangle
 * @param bitmap_options these are {@link ImageBitmapOptions} that can be used for optionally cropping the `img_src`, changing its colorSpace, etc...
 * @param blob_options specify `type`: {@link ImageMIMEType} and `quality`: number to encode your output Blob into
 *
 * > [!note]
 * > note that when using `Uint8Array`, `Uint8ClampedArray`, `ArrayBuffer`, or `Array<number>`, you should provide a `width` as the second argument to this function.
 * > you can also provide an optional image element as the third argument to load the given `img_src` onto, otherwise a new one will be made.
*/
export declare const constructImageBlob: (img_src: AnyImageSource, width?: number, crop_rect?: Rect, bitmap_options?: ImageBitmapOptions, blob_options?: Parameters<OffscreenCanvas["convertToBlob"]>[0]) => Promise<ImageBlob>;
/** extract the {@link ImageData} from an image source (of type {@link CanvasImageSource}), with optional cropping.
 *
 * due to the fact that this function utilizes a `Canvas`/`OffscreenCanvas`,
 * it is important to note that the output `ImageData` is sometimes lossy in nature.
 * this is because gpu-accelerated web-browsers _approximate_ the colors (i.e. you don't truly get `256^3` unique colors),
 * and also due to rounding errors from/to internal float-valued colors and output integer-valued colors.
 *
 * but generally speaking, the `ImageData` can be lossless if all of the following are satisfied:
 * - disable gpu-acceleration of your web-browser, through the `flags` page (`"chrome://flags"` or `"about:config"`).
 * - your `img_src` has either no alpha-channel, or 100% visible alpha-channel throughout (i.e. non-transparent image).
 * - you have pre-multiplied alpha disabled (TODO: this part can be achieved/implemented by this library, but I haven't looked into it yet.).
 *   check out this [script](https://github.com/backspaces/agentscript/blob/master/src/RGBADataSet.js#L27)
 *   for using webgl for reading and writing bitmap pixels without losing color accuracy due to alpha premultiplication
 *
 * @param img_src an image source can be an `HTMLImageElement`, `HTMLCanvasElement`, `ImageBitmap`, etc..
 * @param crop_rect dimension of the cropping rectangle. leave as `undefined` if you wish not to crop, or only provide a partial {@link Rect}
*/
export declare const constructImageData: (img_src: AnyImageSource, width?: number, crop_rect?: Rect, bitmap_options?: ImageBitmapOptions, image_data_options?: ImageDataSettings) => Promise<ImageData>;
/** conveniently construct an `ImageBitmapSource` from different image source types.
 *
 * if you use a raw buffer (`number[] | Uint8Array | Uint8ClampedArray | ArrayBuffer`) as the image source,
 * then you are expected to provide the `width` of the image.
*/
export declare const constructImageBitmapSource: (img_src: AnyImageSource, width?: number) => Promise<ImageBitmapSource>;
/** get a grayscale intensity bitmap of multi-channel `pixel_buf` image buffer,
 * using an optional `alpha_channel` number to mask off the resulting intensity wherever the masking channel is zero
 * (or less than the optional `alpha_bias` parameter).
 *
 * @param pixels_buf flattened pixel bytes
 * @param channels number of color channels (ie: bytes per pixel). for instance, you'd use `4` for RGBA, `3` for RGB, `1` for L, `2` for AL, etc...
 * @param alpha_channel specify which channel is the alpha channel, or leave it as `undefined` to dictate lack of thereof. for instance, you'd use `3` for RGB**A**, `0` for **A**L, and `undefined` for RGB
 * @param alpha_bias if alpha is present, you can specify the minimum alpha value required for the pixel to be visible. anything less will make the pixel dull
*/
export declare const intensityBitmap: (pixels_buf: Uint8Array | Uint8ClampedArray, channels: number, alpha_channel?: number | undefined, alpha_bias?: number) => Uint8Array;
type PaddingCondition = {
    1: (v: number) => number;
    2: (l: number, a: number) => number;
    3: (r: number, g: number, b: number) => number;
    4: (r: number, g: number, b: number, a: number) => number;
};
/** get the bounding box {@link Rect} of an image, based on an accumulative `padding_condition` function that should return
 * `0.0` for padding/whitespace/empty pixels, and positive numbers (usually `1.0`) for non-padding/important pixels.
 *
 * - if the summation of `padding_condition` applied onto a particular row, or column of pixels is less than `minimum_non_padding_value`,
 *   then that entire row/column will be counted as an empty padding space.
 * - else, if the summation of `padding_condition` is greater than `minimum_non_padding_value`,
 *   then that specific row/column will be counted as one of the bounding box's sides.
 * - take a look at {@link trimImagePadding} to get an understanding of a potential use case.
 *
 * you do not need to specify the number of channels in your `img_data`,
 * because it will be calculated automatically via `img_data.width`, `img_data.height`, and `img_data.data.length`.
 *
 * ### A note on performance
 *
 * almost all performance depends purely on the complexity of your `padding_condition`.
 * - if the equations in `padding_condition` uses square-roots, exponents, and if-conditions, then expect a major performance drop.
 * - if your equations consist only of only numeric operations `+, -, *, /`, then the performance will be much faster.
 *
 * some unsuccessful benchmarks I've tried to boost the performance (in V8):
 * - defining `rowAt`, `colAt`, and `nonPaddingValue` outside of this function, instead of inlining them, made no difference in the performance.
 * - substituting `padding_condition` in `nonPaddingValue` with the actual arithmetic functions via inlining
 *   (and thereby avoiding repeated function calls) makes no difference, thanks to the JIT doing the inlining on its own in V8.
 * - finally, the `colAt` inline function is surprisingly super fast (almost as fast as `rowAt`).
 *   so, bounding top and bottom is not at all noticeably quicker than bounding left and right.
*/
export declare const getBoundingBox: <Channels extends (1 | 2 | 3 | 4) = 4>(img_data: SimpleImageData, padding_condition: PaddingCondition[Channels], minimum_non_padding_value?: number) => Rect;
/** crop an {@link ImageData} or arbitrary channel {@link SimpleImageData} with the provided `crop_rect`.
 *
 * the original `img_data` is not mutated, and the returned cropped image data contains data that has been copied over.
*/
export declare const cropImageData: <Channels extends (1 | 2 | 3 | 4) = 4>(img_data: SimpleImageData, crop_rect: Partial<Rect>) => SimpleImageData;
/** trim the padding of an image based on sum of pixel conditioning of each border's rows and columns.
 *
 * > [!note]
 * > the output will always consist of at least 1-pixel width or 1-pixel height.
 *
 * @example
 * for example, to trim the whitespace border pixels of an "RGBA" image, irrespective of the alpha,
 * and a minimum requirement of at least three non-near-white pixels in each border row and column,
 * you would design your `padding_condition` as such:
 *
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // we want the distance between a pixel's rgb color and the white color (i.e. `(255, 255, 255,)`)
 * // to be less than `10 * Math.sqrt(3)`, in order for it to be considered near-white.
 * const my_white_padding_condition = (r: number, g: number, b: number, a: number) => {
 * 	const distance_from_white = (3 * 255**2) - (r**2 + g**2 + b**2)
 * 	return distance_from_white < (3 * 5**2)
 * 		? 0.0
 * 		: 1.0
 * }
 *
 * const
 * 	width = 60,
 * 	img_data = new ImageData(new Uint8ClampedArray(4 * width * 30).fill(255), width), // fully white rgba image
 * 	trimmed_img_data = trimImagePadding(img_data, my_white_padding_condition, 3.0) // only a 1x1 white pixel remains
 *
 * assertEquals(trimmed_img_data.width, 1)
 * assertEquals(trimmed_img_data.height, 1)
 * assertEquals(trimmed_img_data.data, new Uint8ClampedArray(4).fill(255))
 * ```
*/
export declare const trimImagePadding: <Channels extends (1 | 2 | 3 | 4)>(img_data: SimpleImageData, padding_condition: PaddingCondition[Channels], minimum_non_padding_value?: number) => SimpleImageData;
/** a utility type used by {@link coordinateTransformer}, for specifying an image's coordinate space (size dimensions + number of channels). */
export interface ImageCoordSpace extends Rect {
    channels: (1 | 2 | 3 | 4);
}
/** get a function that maps index-coordinates of image0-coordinate-space to the index-coordinates of image1-coordinate-space.
 *
 * note that if you're mapping lots of indexes using `Array.map`, it would be nearly 40-times faster to use the {@link lambdacalc.vectorize1} function instead.
 *
 * @param `coords0` object defining the first ImageCoordSpace
 * @param `coords1` object defining the second ImageCoordSpace
 * @returns `(i0: number & coord0) => i1 as number & coord1` a function that takes in an integer index from coordinate space coords0 and converts it so that it's relative to coordinate space coords1
 *
 * @example
 * ```ts
 * // suppose you have an RGBA image data buffer of `width = 100`, `height = 50`, `channels = 4`,
 * // and you have an array of 6 pixel indexes: `idx0 = [1040, 1044, 1048, 1140, 1144, 1148]`,
 * // and now, you want to convert these indexes to that of an "LA" image data buffer of:
 * // `width = 10`, `height = 10`, and `channels = 2`, `x = 5`, `y = 10`
 * // then:
 * const
 * 	coords0 = {x: 0, y: 0, width: 100, height: 50, channels: 4 as const},
 * 	coords1 = {x: 5, y: 10, width: 10, height: 10, channels: 2 as const},
 * 	coords0_to_coords1 = coordinateTransformer(coords0, coords1),
 * 	idx0 = [4040, 4044, 4048, 4440, 4444, 4448],
 * 	idx1 = idx0.map(coords0_to_coords1) // [10, 12, 14, 30, 32, 34]
 * ```
 *
 * ### Derivation
 *
 * the equation for `mask_intervals` can be easily derived as follows:
 * - `p0 = px of data`, `y0 = y-coords of pixel in data`, `x0 = x-coords of pixel in data`, `w0 = width of data`, `c0 = channels of data`
 * - `p1 = px of mask`, `y1 = y-coords of pixel in mask`, `x1 = x-coords of pixel in mask`, `w1 = width of mask`, `c1 = channels of mask`
 * - `y = y-coords of mask's rect`, `x = x-coords of mask's rect`
 *
 * ```ts ignore
 * declare let [w0, w1, c0, c1]: number[]
 * let
 * 	p0 = (x0 + y0 * w0) * c0,
 * 	x0 = (p0 / c0) % w0,
 * 	y0 = trunc(p0 / (c0 * w0)),
 * 	p1 = (x1 + y1 * w1) * c1,
 * 	x1 = (p1 / c1) % w1,
 * 	y1 = trunc(p1 / (c1 * w1)),
 * 	x  = x0 - x1,
 * 	y  = y0 - y1
 *
 * // so, now:
 * p1 = c1 * (x1 + y1 * w1)
 * p1 = c1 * ((x0 - x) + (y0 - y) * w1)
 * p1 = c1 * ((((p0 / c0) % w0) - x) + (((p0 / c0) / w0 | 0) - y) * w1)
 * ```
*/
export declare const coordinateTransformer: (coords0: Optional<ImageCoordSpace, "height" | "x" | "y">, coords1: Optional<ImageCoordSpace, "height" | "x" | "y">) => ((i0: number) => number);
/** TODO: implement the darn thing.
 *
 * EDIT: I don't even recall what this function was meant to do.
 *   was it made to generate random rgba pixel color that can be assigned to the 2d-rendering context?
 *   moreover, did I not want to permutate over a set number of colors instead of generating any random 256**3 color (i.e. less distinguishable)?
*/
export declare const randomRGBA: (alpha?: undefined | number) => void;
export {};
//# sourceMappingURL=image.d.ts.map