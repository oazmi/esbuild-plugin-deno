/** utility functions for creating and formatting string representations of mostly numeric data.
 *
 * TODO: add documentation, you filthy swine!
 *
 * @module
*/
import { sequenceMap } from "./mapper.js";
import { clamp } from "./numericmethods.js";
import { isArray } from "./struct.js";
/** format atomic-value `v: T` or atomic-elements inside of `v: Array<T>`, using the given `formatter` atomic-value mapping function */
export const formatEach = (formatter, v) => {
    return isArray(v)
        ? v.map(formatter)
        : formatter(v);
};
export const percent_fmt = (v) => ((v ?? 1) * 100).toFixed(0) + "%";
export const percent = (val) => formatEach(percent_fmt, val);
export const ubyte_fmt = (v) => clamp(v ?? 0, 0, 255).toFixed(0);
export const ubyte = (val) => formatEach(ubyte_fmt, val);
export const udegree_fmt = (v) => (v ?? 0).toFixed(1) + "deg";
export const udegree = (val) => formatEach(udegree_fmt, val);
export const hex_fmt = (v) => (v < 0x10 ? "0" : "") + (v | 0).toString(16);
const rgb_hex_fmt_map = [
    hex_fmt,
    hex_fmt,
    hex_fmt,
];
export const rgb_hex_fmt = (v) => "#" + sequenceMap(rgb_hex_fmt_map, v).join("");
const rgba_hex_fmt_map = [
    hex_fmt,
    hex_fmt,
    hex_fmt,
    (a) => hex_fmt(clamp((a ?? 1) * 255, 0, 255))
];
export const rgba_hex_fmt = (v) => "#" + sequenceMap(rgba_hex_fmt_map, v).join("");
export const rgb_fmt = (v) => "rgb(" + sequenceMap([ubyte_fmt, ubyte_fmt, ubyte_fmt], v).join(",") + ")";
export const rgba_fmt = (v) => "rgba(" + sequenceMap([ubyte_fmt, ubyte_fmt, ubyte_fmt, percent_fmt], v).join(",") + ")";
export const hsl_fmt = (v) => "hsl(" + sequenceMap([udegree_fmt, percent_fmt, percent_fmt], v).join(",") + ")";
export const hsla_fmt = (v) => "hsla(" + sequenceMap([udegree_fmt, percent_fmt, percent_fmt, percent_fmt], v).join(",") + ")";
