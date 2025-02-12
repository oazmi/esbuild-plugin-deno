/** utility functions for development debugging.
 *
 * all development debug functions are assigned to global scope upon any import.
 * this is because it is easier to access it that way, and also makes it accessible through the console.
 *
 * nothing here is re-exported by {@link "mod"}. you will have to import this file directly to use any alias.
 *
 * @module
*/
import "./_dnt.polyfills.js";
/** access your global dump array. dump anything into it using {@link dump} */
export declare const dumps: any[];
/** dump data from anywhere into the globally scoped {@link dumps} array variable */
export declare const dump: (...data: any[]) => number;
export declare const perf_table: {
    testName: string;
    executionTime: number;
}[];
export declare const perf: (testname: string, timeoffset: number, callback: Function, ...args: any[]) => any;
export declare const printPerfTable: () => void;
export interface DebugWindowCanvasControls {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    resize: (width?: number, height?: number) => void;
    redraw: () => void;
    play: (fps?: number) => number;
    pause: () => void;
}
/** preview the offscreen canvas obtainable via {@link getBgCanvas}, on a separate popup debug window.
 *
 * alternatively, you can provide your own canvas source to preview on a separate popup debug window.
 *
 * @param source_canvas a canvas source. defaults to {@link getBgCanvas} from the {@link image} module if none is provided
 * @param fps number of times the popup canvas will be updated in a second
 * @returns a popup window object with the ability to control the canvas through the {@link DebugWindowCanvasControls} interface
*/
export declare const popupCanvas: (source_canvas?: CanvasImageSource, fps?: number) => Window & DebugWindowCanvasControls;
interface SchemaNode<T extends any, TypeName extends string> {
    encode: (value: T) => Uint8Array;
    decode: (buffer: Uint8Array, offset: number, ...args: any[]) => [value: T, bytesize: number];
    value?: T;
}
/** parse files based on a specific schema `S`
 * TODO clean this up. re-purpose it correctly. create interface for the required `encode` and `decode` functions required by the parser
*/
export declare class FileParser<S extends SchemaNode<any, string>> {
    /** the html input element that provides a gateway for user file selection */
    readonly loader_input: HTMLInputElement;
    readonly downloader_link: HTMLAnchorElement;
    readonly file_reader: FileReader;
    /** schema to be used for encoding and decoding */
    readonly schema: S;
    /** a list of decoded files. you can delete the entries here to save up memory */
    loaded_data: NonNullable<S["value"]>[];
    /**
     * @param schema which schema class to base the decoding and encoding on
     * @param attach_to where do you wish to attach the `loader_input` html element? if `undefined`, it will not get attached to the DOM. default = document.body
    */
    constructor(schema: S, attach_to?: HTMLElement | undefined);
    /** parse and decode the provided file */
    parseFile(file: File): Promise<NonNullable<S["value"]>>;
    /** parse and decode the provided buffer */
    parseBuffer(buf: ArrayBuffer): NonNullable<S["value"]>;
    /** clear the loaded data to free memory */
    clearLoadedData(): void;
    /** encode the provided javascript object into a `Uint8Array` bytes array using `this.schema.encode` */
    encodeObject(value: NonNullable<S["value"]>): Uint8Array;
    /** download the provided javascript object as a binary blob, by encoding it based on `this.schema.encode` */
    downloadObject(value: NonNullable<S["value"]>, filename?: string): void;
}
export {};
//# sourceMappingURL=devdebug.d.ts.map