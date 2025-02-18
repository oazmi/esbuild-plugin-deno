/** utility functions for handling images along with canvas tools.
 *
 * TODO: add test code within documentation. however, I'm uncertain how I would go about testing canvas/offscreencanvas features within Deno.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { console_assert, console_error, number_isInteger, promise_resolve } from "./alias.js";
import { DEBUG } from "./deps.js";
import { isString, positiveRect } from "./struct.js";
import { concatTyped, sliceSkipTypedSubarray } from "./typedbuffer.js";
let bg_canvas, bg_ctx;
/** get the global background `OffscreenCanvas`.
 *
 * if the offscreen-canvas has not been initialized prior, it will be initialized with your provided optional `init_width` and `init_height` dimensions.
 * however, if it _has_ been already initialized, then it **will not** resize to your provided size.
 * thus, if you want a specific size, you should **always** set it manually yourself.
 *
 * the reason why we don't resize here, is because resizing clears the canvas, and thus, you will lose your image if you were planning to read it back.
*/
export const getBgCanvas = (init_width, init_height) => {
    bg_canvas ??= new OffscreenCanvas(init_width ?? 10, init_height ?? 10);
    return bg_canvas;
};
/** get the global background `OffscreenCanvas`'s 2d-rendering context, and make it specialize in frequent reading (i.e. `willReadFrequently` is set to `true`).
 *
 * if the offscreen-canvas has not been initialized prior, it will be initialized with your provided optional `init_width` and `init_height` dimensions.
 * however, if it _has_ been already initialized, then it **will not** resize to your provided size.
 * thus, if you want a specific size, you should **always** set it manually yourself.
 *
 * the reason why we don't resize here, is because resizing clears the canvas, and thus, you will lose your image if you were planning to read it back.
*/
export const getBgCtx = (init_width, init_height) => {
    if (bg_ctx === undefined) {
        bg_ctx = getBgCanvas(init_width, init_height).getContext("2d", { willReadFrequently: true });
        bg_ctx.imageSmoothingEnabled = false;
    }
    return bg_ctx;
};
/** check of the provided string is a base64 string, by simply observing if it starts with `"data:image/"`. */
export const isBase64Image = (str) => {
    return str?.startsWith("data:image/") ?? false;
};
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
export const getBase64ImageHeader = (str) => str.slice(0, str.indexOf(";base64,") + 8);
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
export const getBase64ImageMIMEType = (str) => str.slice(5, str.indexOf(";base64,"));
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
export const getBase64ImageBody = (str) => str.substring(str.indexOf(";base64,") + 8);
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
export const constructImageBlob = async (img_src, width, crop_rect, bitmap_options, blob_options) => {
    if (crop_rect) {
        crop_rect = positiveRect(crop_rect);
    }
    const bitmap_src = await constructImageBitmapSource(img_src, width), bitmap = crop_rect ?
        await createImageBitmap(bitmap_src, crop_rect.x, crop_rect.y, crop_rect.width, crop_rect.height, bitmap_options) :
        await createImageBitmap(bitmap_src, bitmap_options), canvas = getBgCanvas(), ctx = getBgCtx();
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.globalCompositeOperation = "copy";
    ctx.resetTransform();
    ctx.drawImage(bitmap, 0, 0);
    return canvas.convertToBlob(blob_options);
};
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
export const constructImageData = async (img_src, width, crop_rect, bitmap_options, image_data_options) => {
    if (crop_rect) {
        crop_rect = positiveRect(crop_rect);
    }
    const bitmap_src = await constructImageBitmapSource(img_src, width), bitmap = crop_rect ?
        await createImageBitmap(bitmap_src, crop_rect.x, crop_rect.y, crop_rect.width, crop_rect.height, bitmap_options) :
        await createImageBitmap(bitmap_src, bitmap_options), canvas = getBgCanvas(), ctx = getBgCtx();
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.globalCompositeOperation = "copy";
    ctx.resetTransform();
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height, image_data_options);
};
/** conveniently construct an `ImageBitmapSource` from different image source types.
 *
 * if you use a raw buffer (`number[] | Uint8Array | Uint8ClampedArray | ArrayBuffer`) as the image source,
 * then you are expected to provide the `width` of the image.
*/
export const constructImageBitmapSource = async (img_src, width) => {
    if (isString(img_src)) {
        const new_img_element = new Image();
        new_img_element.src = img_src;
        return new_img_element
            .decode()
            .then(() => new_img_element);
    }
    else if (img_src instanceof Uint8ClampedArray) {
        return promise_resolve(new ImageData(img_src, width));
    }
    else if (ArrayBuffer.isView(img_src)) {
        return constructImageBitmapSource(new Uint8ClampedArray(img_src.buffer), width);
    }
    else if (img_src instanceof ArrayBuffer) {
        return constructImageBitmapSource(new Uint8ClampedArray(img_src), width);
    }
    else if (img_src instanceof Array) {
        return constructImageBitmapSource(Uint8ClampedArray.from(img_src), width);
    }
    return img_src;
};
/** get a grayscale intensity bitmap of multi-channel `pixel_buf` image buffer,
 * using an optional `alpha_channel` number to mask off the resulting intensity wherever the masking channel is zero
 * (or less than the optional `alpha_bias` parameter).
 *
 * @param pixels_buf flattened pixel bytes
 * @param channels number of color channels (ie: bytes per pixel). for instance, you'd use `4` for RGBA, `3` for RGB, `1` for L, `2` for AL, etc...
 * @param alpha_channel specify which channel is the alpha channel, or leave it as `undefined` to dictate lack of thereof. for instance, you'd use `3` for RGB**A**, `0` for **A**L, and `undefined` for RGB
 * @param alpha_bias if alpha is present, you can specify the minimum alpha value required for the pixel to be visible. anything less will make the pixel dull
*/
export const intensityBitmap = (pixels_buf, channels, alpha_channel, alpha_bias = 1) => {
    const pixel_len = pixels_buf.length / channels, alpha_visibility = new Uint8ClampedArray(pixel_len).fill(1), intensity = new Uint8ClampedArray(pixel_len);
    if (alpha_channel !== undefined) {
        for (let i = 0; i < pixel_len; i++) {
            alpha_visibility[i] = pixels_buf[i * channels + alpha_channel] < alpha_bias ? 0 : 1;
        }
        pixels_buf = pixels_buf.filter((v, i) => (i % channels) === alpha_channel ? false : true); // remove alpha channel bytes from `pixel_buf` and redefine it
        channels--; // because alpha channel has been discarded
    }
    // channel by channel, sum each channel's value to intensity
    for (let ch = 0; ch < channels; ch++) {
        for (let i = 0; i < pixel_len; i++) {
            intensity[i] += pixels_buf[i * channels + ch];
        }
    }
    // finally, if necessary, multiply each `intensity` pixel by its `alpha_visibility`
    if (alpha_channel !== undefined) {
        for (let i = 0; i < pixel_len; i++) {
            intensity[i] *= alpha_visibility[i];
        }
    }
    return new Uint8Array(intensity.buffer);
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
export const getBoundingBox = (img_data, padding_condition, minimum_non_padding_value = 1) => {
    const { width, height, data } = img_data, channels = data.length / (width * height), rowAt = (y) => data.subarray((y * width) * channels, (y * width + width) * channels), colAt = (x) => {
        const col = new Uint8Array(height * channels);
        for (let y = 0; y < height; y++) {
            for (let ch = 0; ch < channels; ch++) {
                col[y * channels + ch] = data[(y * width + x) * channels + ch];
            }
        }
        return col;
    }, nonPaddingValue = (data_row_or_col) => {
        let non_padding_value = 0;
        for (let px = 0, len = data_row_or_col.length; px < len; px += channels) {
            non_padding_value += padding_condition(data_row_or_col[px + 0], data_row_or_col[px + 1], data_row_or_col[px + 2], data_row_or_col[px + 3]);
        }
        return non_padding_value;
    };
    if (DEBUG.ASSERT) {
        console_assert(number_isInteger(channels));
    }
    let [top, left, bottom, right] = [0, 0, height, width];
    // find top bounding row
    for (; top < height; top++) {
        if (nonPaddingValue(rowAt(top)) >= minimum_non_padding_value) {
            break;
        }
    }
    // find bottom bounding row
    for (; bottom >= top; bottom--) {
        if (nonPaddingValue(rowAt(bottom)) >= minimum_non_padding_value) {
            break;
        }
    }
    // find left bounding column
    for (; left < width; left++) {
        if (nonPaddingValue(colAt(left)) >= minimum_non_padding_value) {
            break;
        }
    }
    // find right bounding column
    for (; right >= left; right--) {
        if (nonPaddingValue(colAt(right)) >= minimum_non_padding_value) {
            break;
        }
    }
    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
    };
};
/** crop an {@link ImageData} or arbitrary channel {@link SimpleImageData} with the provided `crop_rect`.
 *
 * the original `img_data` is not mutated, and the returned cropped image data contains data that has been copied over.
*/
export const cropImageData = (img_data, crop_rect) => {
    const { width, height, data } = img_data, channels = data.length / (width * height), crop = positiveRect({ x: 0, y: 0, width, height, ...crop_rect }), [top, left, bottom, right] = [crop.y, crop.x, crop.y + crop.height, crop.x + crop.width];
    if (DEBUG.ASSERT) {
        console_assert(number_isInteger(channels));
    }
    // trim padding from top, left, bottom, and right
    const row_slice_len = crop.width * channels, skip_len = ((width - right) + (left - 0)) * channels, trim_start = (top * width + left) * channels, trim_end = ((bottom - 1) * width + right) * channels, cropped_data_rows = sliceSkipTypedSubarray(data, row_slice_len, skip_len, trim_start, trim_end), cropped_data = concatTyped(...cropped_data_rows), cropped_img_data = channels === 4 ?
        new ImageData(cropped_data, crop.width, crop.height) :
        {
            width: crop.width,
            height: crop.height,
            data: cropped_data,
            colorSpace: img_data.colorSpace ?? "srgb"
        };
    return cropped_img_data;
};
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
export const trimImagePadding = (img_data, padding_condition, minimum_non_padding_value = 1) => (cropImageData(img_data, getBoundingBox(img_data, padding_condition, minimum_non_padding_value)));
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
export const coordinateTransformer = (coords0, coords1) => {
    const { x: x0, y: y0, width: w0, channels: c0 } = coords0, { x: x1, y: y1, width: w1, channels: c1 } = coords1, x = (x1 ?? 0) - (x0 ?? 0), y = (y1 ?? 0) - (y0 ?? 0);
    return (i0) => c1 * ((((i0 / c0) % w0) - x) + (((i0 / c0) / w0 | 0) - y) * w1);
};
/** TODO: implement the darn thing.
 *
 * EDIT: I don't even recall what this function was meant to do.
 *   was it made to generate random rgba pixel color that can be assigned to the 2d-rendering context?
 *   moreover, did I not want to permutate over a set number of colors instead of generating any random 256**3 color (i.e. less distinguishable)?
*/
export const randomRGBA = (alpha) => {
    console_error(DEBUG.ERROR && "not implemented");
};
