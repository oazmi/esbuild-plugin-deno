/** auto export for all submodules, with the exception of the following:
 * - {@link "alias"}:
 *   it will pollute the global namespace, making it harder for IDEs to give useful suggestions.
 *   in addition, the bundled `kitchensink` library will be inflated with these un-treeshaken exports.
 * - {@link "binder"}:
 *   this submodule will add a lot of un-treeshaken baggage, and it will probably not be used by the end user.
 * - {@link "devdebug"}:
 *   this submodule pollutes the `globalThis` object whenever imported, so it is not exported here.
 *
 * anyone desiring to import one of these submodules should import them directly using `import {...} from "@oazmi/kitchensink/submodule_name"`.
*/
import "./_dnt.polyfills.js";
export * from "./array1d.js";
export * from "./array2d.js";
export * from "./browser.js";
export * from "./collections.js";
export * from "./cryptoman.js";
export * from "./dotkeypath.js";
export * from "./eightpack.js";
export * from "./eightpack_varint.js";
export * from "./formattable.js";
export * from "./image.js";
export * from "./lambda.js";
export * from "./lambdacalc.js";
export * from "./mapper.js";
export * from "./numericarray.js";
export * from "./numericmethods.js";
export * from "./pathman.js";
export * from "./stringman.js";
export * from "./struct.js";
export * from "./timeman.js";
export * from "./typedbuffer.js";
export * from "./typedefs.js";
//# sourceMappingURL=mod.d.ts.map