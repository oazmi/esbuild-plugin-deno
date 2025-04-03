/** auto export for all submodules, with the exception of the following:
 * - {@link "alias"}:
 *   it will pollute the global namespace, making it harder for IDEs to give useful suggestions.
 *   in addition, the bundled `kitchensink` library will be inflated with these un-treeshaken exports.
 * - {@link "binder"}:
 *   this submodule will add a lot of un-treeshaken baggage, and it will probably not be used by the end user.
 * - {@link "crossenv"}:
 *   this submodule might accidentally lead you to access a runtime-global which might not be supported in your production/deployment environment.
 *   for instance, you might end up using the `Deno` global object in your development environment with no issues,
 *   but when you bundle your code for production/web-deployment, it will fail catastrophically.
 * - {@link "devdebug"}:
 *   this submodule pollutes the `globalThis` object whenever imported, so it is not exported here.
 * - {@link "semver"}:
 *   I don't want it polluting the namespace, especially since it's a barely used submodule.
 *
 * anyone desiring to import one of these submodules should import them directly using `import {...} from "@oazmi/kitchensink/submodule_name"`.
*/
// export * from "./alias.ts"
import "./_dnt.polyfills.js";
export * from "./array1d.js";
export * from "./array2d.js";
// export * from "./binder.ts"
export * from "./browser.js";
export * from "./collections.js";
// export * from "./crossenv.ts"
export * from "./cryptoman.js";
// export * from "./devdebug.ts"
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
// export * from "./semver.ts"
export * from "./stringman.js";
export * from "./struct.js";
export * from "./timeman.js";
export * from "./typedbuffer.js";
export * from "./typedefs.js";
