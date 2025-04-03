/** utility tools for manipulating paths and obtaining `URL`s.
 *
 * TODO: write document level examples.
 *
 * url terminology:
 * - urls are a subset of uris
 * - a url protocol is defined as: `[scheme]://`
 * - a url is defined as: `[scheme]://[host]/[path]?[queryString]#[fragmentHash]`
 * - or equivalently, a url is: `[protocol][host]/[path]?[queryString]#[fragmentHash]`
 * - a uri is defined as: `[scheme]:[someIdentifier]`
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { array_from, dom_decodeURI, dom_encodeURI, object_entries } from "./alias.js";
import { DEBUG } from "./deps.js";
import { commonPrefix, quote } from "./stringman.js";
import { isObject, isString } from "./struct.js";
// DONE: consider if it would be a good idea to export `uri_protocol_and_scheme_mapping` so that the end user can manually modify it to their needs,
// and then have this whole submodule behave according to their custom uri scheme definitions.
// of course we're going to encounter issues with the `UriScheme` type, and might even have to turn it into a `string` (there by killing off all typing benefits),
// but it's still less painful than having the end user having to redefine all path resolution functions via wrappers.
/** this is global mapping of uri-protocol schemes that are identifiable by {@link getUriScheme} and {@link resolveAsUrl}.
 * you may mutate this 2-tuple array to add or remove custom identifiable uri-schemes.
 *
 * @example
 * adding a new uri protocol scheme named `"inline-scheme"` to our registry:
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, err = assertThrows
 *
 * // initially, our custom "inline" scheme is unidentifiable, and cannot be used in `resolveAsUrl` as a base url
 * eq(getUriScheme("inline://a/b/c.txt"), "relative")
 * err(() => resolveAsUrl("./w.xyz", "inline://a/b/c.txt")) // "inline://a/b/c.txt" is identified as a relative path, and cannot be used as a base path
 *
 * // registering the custom protocol-scheme mapping.
 * // note that you will have to declare `as any`, since the schemes are tightly defined by the type `UriScheme`.
 * uriProtocolSchemeMap.push(["inline://", "inline-scheme" as any])
 *
 * // and now, our custom "inline" scheme becomes identifiable
 * eq(getUriScheme("inline://a/b/c.txt"), "inline-scheme")
 *
 * // it is also now accepted by `resolveAsUrl` as a base uri
 * eq(resolveAsUrl("./w.xyz", "inline://a/b/c.txt"), new URL("inline://a/b/w.xyz"))
 * ```
*/
export const uriProtocolSchemeMap = /*@__PURE__*/ object_entries({
    "node:": "node",
    "npm:": "npm",
    "jsr:": "jsr",
    "blob:": "blob",
    "data:": "data",
    "http://": "http",
    "https://": "https",
    "file://": "file",
    "./": "relative",
    "../": "relative",
});
/** here, you can specify which uri schemes cannot be used as a base url for resolving a url via the {@link resolveAsUrl} function.
 *
 * @example
 * adding a new uri protocol scheme named `"base64-scheme"` to our registry, and then forbidding it from being used as a base url:
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, err = assertThrows
 *
 * // initially, our custom "base64" scheme is unidentifiable, and cannot be used in `resolveAsUrl` as a base url
 * eq(getUriScheme("base64://a/b/c.txt"), "relative")
 * err(() => resolveAsUrl("./w.xyz", "base64://a/b/c.txt")) // "base64://a/b/c.txt" is identified as a relative path, and cannot be used as a base path
 *
 * // registering the custom protocol-scheme mapping.
 * // note that you will have to declare `as any`, since the schemes are tightly defined by the type `UriScheme`.
 * uriProtocolSchemeMap.push(["base64://", "base64-scheme" as any])
 *
 * // and now, our custom "base64" scheme becomes identifiable.
 * eq(getUriScheme("base64://a/b/c.txt"), "base64-scheme")
 *
 * // it is also now accepted by `resolveAsUrl` as a base uri
 * eq(resolveAsUrl("./w.xyz", "base64://a/b/c.txt"), new URL("base64://a/b/w.xyz"))
 *
 * // since we don't want to make it possible to have "base64-scheme" as a base uri, so we'll put it in the forbidden list.
 * // once again `as any` is needed, since the `UriScheme` is tightly defined, and its definition cannot be changed.
 * forbiddenBaseUriSchemes.push("base64-scheme" as any)
 * err(() => resolveAsUrl("./w.xyz", "base64://a/b/c.txt")) // "base64://a/b/c.txt" is now amongst the forbidden schemes that cannot be combined with relative paths.
 * eq(resolveAsUrl("base64://a/b/c.txt"), new URL("base64://a/b/c.txt")) // this is of course not stopping us from building urls with the "base64" scheme, so long as no relative path is attached.
 * ```
*/
export const forbiddenBaseUriSchemes = ["blob", "data", "relative"];
const packageUriSchemes = ["jsr", "npm", "node"], packageUriProtocols = ["jsr:", "npm:", "node:"];
const 
// posix directory path separator
sep = "/", 
// posix relative directory path navigator
dotslash = "./", 
// posix relative parent directory path navigator
dotdotslash = "../", 
// regex for attaining windows directory path separator ("\\")
windows_directory_slash_regex = /\\/g, 
// regex for detecting if a path is an absolute windows path
windows_absolute_path_regex = /^[a-z]\:[\/\\]/i, 
// regex for correcting an invalid single leading slash in a windows path
windows_leading_slash_correction_regex = /^[\/\\]([a-z])\:[\/\\]/i, 
// regex for attaining leading consecutive slashes
leading_slashes_regex = /^\/+/, 
// regex for attaining trailing consecutive slashes, except for those that are preceded by a dotslash ("/./") or a dotdotslash ("/../")
trailing_slashes_regex = /(?<!\/\.\.?)\/+$/, 
// regex for attaining leading consecutive slashes and dot-slashes
leading_slashes_and_dot_slashes_regex = /^(\.?\/)+/, 
// regex for attaining a reversed path string's trailing consecutive slashes and dot-slashes, but not the slashes preceded by a dotdotslash ("/..").
// this regex is a little complex, so you might want to check out the test cases (of reversed path strings) here: "https://regex101.com/r/IV0twv/1"
reversed_trailing_slashes_and_dot_slashes_regex = /^(\/\.?(?![^\/]))*(\/(?!\.\.\/))?/, 
// regex for attaining the file name of a path, including its leading slash (if there is one)
filename_regex = /\/?[^\/]+$/, 
// regex for attaining the base name and extension name of a file, from its filename (no directories)
basename_and_extname_regex = /^(?<basename>.+?)(?<ext>\.[^\.]+)?$/, 
// an npm or jsr package string parsing regex. see the test cases on regex101 link: "https://regex101.com/r/mX3v1z/2"
package_regex = /^(?<protocol>jsr:|npm:|node:)(\/*(@(?<scope>[^\/\s]+)\/)?(?<pkg>[^@\/\s]+)(@(?<version>[^\/\r\n\t\f\v]+))?)?(?<pathname>\/.*)?$/, string_starts_with = (str, starts_with) => str.startsWith(starts_with), string_ends_with = (str, ends_with) => str.endsWith(ends_with);
/** test whether a given path is an absolute path (either windows or posix).
 *
 * > [!note]
 * > currently, we do consider the tilde expansion ("~") as an absolute path, even though it is not an os/fs-level path, but rather a shell feature.
 * > this may result in misclassification on windows, since "~" is a valid starting character for a file or folder name
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = isAbsolutePath
 *
 * eq(fn("/a/b/c.txt"),    true)
 * eq(fn("~/a/b/c.txt"),   true)
 * eq(fn("C:/a/b/c.txt"),  true)
 * eq(fn("/c:/a/b/c.txt"), true)
 *
 * eq(fn("a/b/c.txt"),     false)
 * eq(fn("./a/b/c.txt"),   false)
 * eq(fn("../a/b/c.txt"),  false)
 * ```
*/
export const isAbsolutePath = (path) => {
    return (string_starts_with(path, sep)
        || string_starts_with(path, "~")
        || windows_absolute_path_regex.test(path));
};
/** guesses the scheme of a url string. see {@link UriScheme} for more details.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = getUriScheme
 *
 * eq(fn("C:/Users/me/path/to/file.txt"),                  "local")
 * eq(fn("~/path/to/file.txt"),                            "local")
 * eq(fn("/usr/me/path/to/file.txt"),                      "local")
 * eq(fn("path/to/file.txt"),                              "relative")
 * eq(fn("./path/to/file.txt"),                            "relative")
 * eq(fn("../path/to/file.txt"),                           "relative")
 * eq(fn("file:///c://users/me/path/to/file.txt"),         "file")
 * eq(fn("file:///usr/me/path/to/file.txt"),               "file")
 * eq(fn("jsr:@user/path/to/file"),                        "jsr")
 * eq(fn("jsr:/@user/path/to/file"),                       "jsr")
 * eq(fn("npm:lib/path/to/file"),                          "npm")
 * eq(fn("npm:/lib/path/to/file"),                         "npm")
 * eq(fn("npm:/@scope/lib/path/to/file"),                  "npm")
 * eq(fn("node:http"),                                     "node")
 * eq(fn("node:fs/promises"),                              "node")
 * eq(fn("data:text/plain;charset=utf-8;base64,aGVsbG8="), "data")
 * eq(fn("blob:https://example.com/4800d2d8-a78c-4895"),   "blob")
 * eq(fn("http://google.com/style.css"),                   "http")
 * eq(fn("https://google.com/style.css"),                  "https")
 * eq(fn(""),                                              undefined)
 * ```
*/
export const getUriScheme = (path) => {
    if (!path || path === "") {
        return undefined;
    }
    for (const [protocol, scheme] of uriProtocolSchemeMap) {
        if (string_starts_with(path, protocol)) {
            return scheme;
        }
    }
    return isAbsolutePath(path) ? "local" : "relative";
};
/** this function parses npm and jsr package strings, and returns a pseudo URL-like object.
 *
 * the regex we use for parsing the input `href` string is quoted below:
 * > /^(?<protocol>jsr:|npm:|node:)(\/*(@(?<scope>[^\/\s]+)\/)?(?<pkg>[^@\/\s]+)(@(?<version>[^\/\r\n\t\f\v]+))?)?(?<pathname>\/.*)?$/
 *
 * see the regex in action with the test cases on regex101 link: [regex101.com/r/mX3v1z/2](https://regex101.com/r/mX3v1z/2)
 *
 * @throws `Error` an error will be thrown if either the package name (`pkg`), or the `protocol` cannot be deduced by the regex.
 *
 * @example
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, err = assertThrows, fn = parsePackageUrl
 *
 * // basic breakdown of a package's resource uri
 * eq(fn("jsr:@scope/package@version/pathname/file.ts"), {
 * 	href: "jsr:/@scope/package@version/pathname/file.ts",
 * 	protocol: "jsr:",
 * 	scope: "scope",
 * 	pkg: "package",
 * 	version: "version",
 * 	pathname: "/pathname/file.ts",
 * 	host: "@scope/package@version",
 * })
 *
 * // showing that jsr package uri's without a scope are perfectly permitted.
 * // even though it isn't actually possible to do so on "jsr.io".
 * // thus it is left up to the end-user to make of it what they will.
 * eq(fn("jsr:package@version/pathname/"), {
 * 	href: "jsr:/package@version/pathname/",
 * 	protocol: "jsr:",
 * 	scope: undefined,
 * 	pkg: "package",
 * 	version: "version",
 * 	pathname: "/pathname/",
 * 	host: "package@version",
 * })
 *
 * // testing a case with multiple slashes ("/") after the protocol colon (":"), and no trailing slash after the version
 * eq(fn("npm:///@scope/package@version"), {
 * 	href: "npm:/@scope/package@version/",
 * 	protocol: "npm:",
 * 	scope: "scope",
 * 	pkg: "package",
 * 	version: "version",
 * 	pathname: "/",
 * 	host: "@scope/package@version",
 * })
 *
 * // testing a no-scope and no-version case
 * eq(fn("npm:package"), {
 * 	href: "npm:/package/",
 * 	protocol: "npm:",
 * 	scope: undefined,
 * 	pkg: "package",
 * 	version: undefined,
 * 	pathname: "/",
 * 	host: "package",
 * })
 *
 * // testing the "node:" protocol
 * eq(fn("node:fs"), {
 * 	href: "node:/fs/",
 * 	protocol: "node:",
 * 	scope: undefined,
 * 	pkg: "fs",
 * 	version: undefined,
 * 	pathname: "/",
 * 	host: "fs",
 * })
 *
 * // testing the "node:" protocol with a certain pathname
 * eq(fn("node:fs/promises"), {
 * 	href: "node:/fs/promises",
 * 	protocol: "node:",
 * 	scope: undefined,
 * 	pkg: "fs",
 * 	version: undefined,
 * 	pathname: "/promises",
 * 	host: "fs",
 * })
 *
 * // testing a `version` query string that contains whitespaces and url-encoded characters.
 * // NOTE: the url-encoded characters in vs-code's doc popup appear decoded, so don't be fooled!
 * //   but the `host` is always a url-decoded string.
 * eq(fn("jsr:@scope/package@1.0.0 - 1.2.0/pathname/file.ts"), {
 * 	href: "jsr:/@scope/package@1.0.0%20-%201.2.0/pathname/file.ts",
 * 	protocol: "jsr:",
 * 	scope: "scope",
 * 	pkg: "package",
 * 	version: "1.0.0 - 1.2.0",
 * 	pathname: "/pathname/file.ts",
 * 	host: "@scope/package@1.0.0 - 1.2.0",
 * })
 *
 * // testing a `version` query string that has its some of its characters (such as whitespaces) url-encoded.
 * // NOTE: the url-encoded characters in vs-code's doc popup appear decoded, so don't be fooled!
 * //   but the `host` is always a url-decoded string.
 * eq(fn("jsr:@scope/package@^2%20<2.2%20||%20>%202.3/pathname/file.ts"), {
 * 	href: "jsr:/@scope/package@%5E2%20%3C2.2%20%7C%7C%20%3E%202.3/pathname/file.ts",
 * 	protocol: "jsr:",
 * 	scope: "scope",
 * 	pkg: "package",
 * 	version: "^2 <2.2 || > 2.3",
 * 	pathname: "/pathname/file.ts",
 * 	host: "@scope/package@^2 <2.2 || > 2.3",
 * })
 *
 * // testing cases where an error should be invoked
 * err(() => fn("npm:@scope/"))                 // missing a package name
 * err(() => fn("npm:@scope//package"))         // more than one slash after scope
 * err(() => fn("pnpm:@scope/package@version")) // only "node:", "npm:", and "jsr:" protocols are recognized
 * ```
*/
export const parsePackageUrl = (url_href) => {
    url_href = dom_decodeURI(isString(url_href) ? url_href : url_href.href);
    const { protocol, scope: scope_str, pkg, version: version_str, pathname: pathname_str } = package_regex.exec(url_href)?.groups ?? {};
    if ((protocol === undefined) || (pkg === undefined)) {
        throw new Error(DEBUG.ERROR ? ("invalid package url format was provided: " + url_href) : "");
    }
    const scope = scope_str ? scope_str : undefined, // turn empty strings into `undefined`
    version = version_str ? version_str : undefined, // turn empty strings into `undefined`
    pathname = pathname_str ? pathname_str : sep, // pathname must always begin with a leading slash, even if it was originally empty
    host = `${scope ? "@" + scope + sep : ""}${pkg}${version ? "@" + version : ""}`, href = dom_encodeURI(`${protocol}/${host}${pathname}`);
    return {
        protocol: protocol,
        scope, pkg, version, pathname, host, href,
    };
};
/** convert a url string to an actual `URL` object.
 * your input `path` url can use any scheme supported by the {@link getUriScheme} function.
 * and you may also use paths with windows dir-separators ("\\"), as this function implicitly converts them a posix separator ("/").
 *
 * if you pass a `URL` object, then it will be returned as is.
 *
 * @throws `Error` an error will be thrown if `base` uri is either a relative path, or uses a data uri scheme,
 *   or if the provided `path` is relative, but no absolute `base` path is provided.
 *
 * @example
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, err = assertThrows, fn = resolveAsUrl
 *
 * eq(fn(new URL("some://url:8000/a/b c.txt")),    new URL("some://url:8000/a/b%20c.txt"))
 *
 * eq(fn("/a/b/c d e.txt"),                        new URL("file:///a/b/c%20d%20e.txt"))
 * eq(fn("~/a/b/c.txt"),                           new URL("file://~/a/b/c.txt"))
 * eq(fn("C:/a/b/c/d/e.txt"),                      new URL("file:///C:/a/b/c/d/e.txt"))
 * eq(fn("C:\\a\\b\\c\\d\\e.txt"),                 new URL("file:///C:/a/b/c/d/e.txt"))
 * eq(fn("./e/f g.txt",      "C:/a\\b\\c d/"),     new URL("file:///C:/a/b/c%20d/e/f%20g.txt"))
 * eq(fn("../c d/e/f g.txt", "C:/a/b/c d/"),       new URL("file:///C:/a/b/c%20d/e/f%20g.txt"))
 * eq(fn("d/../.././e.txt",  "C:/a/b/c/"),         new URL("file:///C:/a/b/e.txt"))
 * eq(fn("d/../.././e.txt",  "C:/a/b/c"),          new URL("file:///C:/a/e.txt"))
 * eq(fn("D:/a/b.txt",       "C:/c/d.txt"),        new URL("file:///D:/a/b.txt"))
 * eq(fn("/a/b.txt",         "C:/c/d.txt"),        new URL("file:///C:/a/b.txt"))
 * eq(fn("/a/b.txt",         "/sys/admin/"),       new URL("file:///a/b.txt"))
 * eq(fn("/a/b.txt",         ""),                  new URL("file:///a/b.txt"))
 *
 * eq(fn("http://cdn.esm.sh/a/b/c.txt"),           new URL("http://cdn.esm.sh/a/b/c.txt"))
 * eq(fn("http://cdn.esm.sh/a.txt", "file:///b/"), new URL("http://cdn.esm.sh/a.txt"))
 * eq(fn("http://cdn.esm.sh/a.txt", "/b/"),        new URL("http://cdn.esm.sh/a.txt"))
 * eq(fn("/a/b/c.txt", "http://cdn.esm.sh/"),      new URL("http://cdn.esm.sh/a/b/c.txt"))
 *
 * eq(fn("b/c.txt",    "http://cdn.esm.sh/a/"),    new URL("http://cdn.esm.sh/a/b/c.txt"))
 * eq(fn("b/c.txt",    "http://cdn.esm.sh/a"),     new URL("http://cdn.esm.sh/b/c.txt"))
 * eq(fn("./b/c.txt",  "http://cdn.esm.sh/a/"),    new URL("http://cdn.esm.sh/a/b/c.txt"))
 * eq(fn("./b/c.txt",  "http://cdn.esm.sh/a"),     new URL("http://cdn.esm.sh/b/c.txt"))
 * eq(fn("../b/c.txt", "https://cdn.esm.sh/a/"),   new URL("https://cdn.esm.sh/b/c.txt"))
 * eq(fn("../c/d.txt", "https://cdn.esm.sh/a/b"),  new URL("https://cdn.esm.sh/c/d.txt"))
 * eq(fn("/c/d.txt",   "https://cdn.esm.sh/a/b"),  new URL("https://cdn.esm.sh/c/d.txt"))
 *
 * eq(fn("node:fs"),                               new URL("node:/fs/"))
 * eq(fn("node:fs/promises"),                      new URL("node:/fs/promises"))
 * eq(fn("promises",   "node:fs"),                 new URL("node:/fs/promises"))
 * eq(fn("./promises", "node:fs"),                 new URL("node:/fs/promises"))
 * eq(fn("./promises", "node:fs/"),                new URL("node:/fs/promises"))
 * eq(fn("mkdir",      "node:fs/promises"),        new URL("node:/fs/mkdir"))
 * eq(fn("mkdir",      "node:fs/promises/"),       new URL("node:/fs/promises/mkdir"))
 * eq(fn("./mkdir",    "node:fs/promises"),        new URL("node:/fs/mkdir"))
 * eq(fn("./mkdir",    "node:fs/promises/"),       new URL("node:/fs/promises/mkdir"))
 * eq(fn("/sync",      "node:fs/promises/mkdir"),  new URL("node:/fs/sync"))
 *
 * eq(fn("npm:react"),                             new URL("npm:/react/"))
 * eq(fn("npm:react/file.txt"),                    new URL("npm:/react/file.txt"))
 * eq(fn("npm:@facebook/react"),                   new URL("npm:/@facebook/react/"))
 * eq(fn("./to/file.txt", "npm:react"),            new URL("npm:/react/to/file.txt"))
 * eq(fn("./to/file.txt", "npm:react/"),           new URL("npm:/react/to/file.txt"))
 * eq(fn("/to/file.txt",  "npm:react/native/bin"), new URL("npm:/react/to/file.txt"))
 * eq(fn("npm:react@19/jsx runtime.ts"),           new URL("npm:/react@19/jsx%20runtime.ts"))
 * eq(fn("npm:react@^19 <19.5/jsx.ts"),            new URL("npm:/react@%5E19%20%3C19.5/jsx.ts"))
 *
 * eq(fn("jsr:@scope/my-lib/b.txt"),               new URL("jsr:/@scope/my-lib/b.txt"))
 * eq(fn("a/b.txt",    "jsr:///@scope/my-lib"),    new URL("jsr:/@scope/my-lib/a/b.txt"))
 * eq(fn("./a/b.txt",  "jsr:///@scope/my-lib"),    new URL("jsr:/@scope/my-lib/a/b.txt"))
 * eq(fn("a/b.txt",    "jsr:///@scope/my-lib/c"),  new URL("jsr:/@scope/my-lib/a/b.txt"))
 * eq(fn("./a/b.txt",  "jsr:///@scope/my-lib/c"),  new URL("jsr:/@scope/my-lib/a/b.txt"))
 * eq(fn("./a/b.txt",  "jsr:///@scope/my-lib//c"), new URL("jsr:/@scope/my-lib/a/b.txt"))
 * eq(fn("../a/b.txt", "jsr:/@scope/my-lib///c/"), new URL("jsr:/@scope/my-lib/a/b.txt"))
 * eq(fn("./a/b.txt",  "jsr:///@scope/my-lib/c/"), new URL("jsr:/@scope/my-lib/c/a/b.txt"))
 * eq(fn("/a/b.txt",   "jsr:my-lib/x/y/"),         new URL("jsr:/my-lib/a/b.txt"))
 * eq(fn("/a/b.txt",   "jsr:@scope/my-lib/x/y/z"), new URL("jsr:/@scope/my-lib/a/b.txt"))
 * eq(fn("/a/b.txt",   "jsr:my-lib@1 || 2/x/y/z"), new URL("jsr:/my-lib@1%20%7C%7C%202/a/b.txt"))
 * eq(fn("/a/b.txt",   "jsr:@my/lib@1||2/x/y/z"),  new URL("jsr:/@my/lib@1%7C%7C2/a/b.txt"))
 *
 * eq(fn("C:/a/b.txt",         "jsr:@my/lib/x/y"), new URL("file:///C:/a/b.txt"))
 * eq(fn("jsr:@my/lib/x/y",    "C:/a/b.txt"),      new URL("jsr:/@my/lib/x/y"))
 * eq(fn("http://test.io/abc", "C:/a/b.txt"),      new URL("http://test.io/abc"))
 *
 * eq(fn("blob:https://example.com/480-a78"),      new URL("blob:https://example.com/480-a78"))
 * eq(fn("data:text/plain;utf8,hello"),            new URL("data:text/plain;utf8,hello"))
 * eq(fn("data:text/plain;utf8,hello", "C:/a/b/"), new URL("data:text/plain;utf8,hello"))
 *
 * err(() => fn("./a/b.txt", "data:text/plain;charset=utf-8;base64,aGVsbG8="))
 * err(() => fn("./a/b.txt", "blob:https://example.com/4800d2d8-a78c-4895-b68b-3690b69a0d6a"))
 * err(() => fn("./a/b.txt", "./path/")) // a base path must not be relative
 * err(() => fn("./a/b.txt"))            // a relative path cannot be resolved on its own without a base path
 * err(() => fn("./a/b.txt",   ""))      // an empty base path is as good as a non-existing one
 * err(() => fn("fs/promises", "node:")) // the base protocol ("node:") MUST be accompanied with a package name
 * ```
*/
export const resolveAsUrl = (path, base) => {
    if (!isString(path)) {
        return path;
    }
    path = pathToPosixPath(path);
    let base_url = base;
    if (isString(base) && base !== "") {
        const base_scheme = getUriScheme(base);
        if (forbiddenBaseUriSchemes.includes(base_scheme)) {
            throw new Error(DEBUG.ERROR ? ("the following base scheme (url-protocol) is not supported: " + base_scheme) : "");
        }
        base_url = resolveAsUrl(base);
    }
    const path_scheme = getUriScheme(path), base_protocol = base_url ? base_url.protocol : undefined, path_is_package = packageUriSchemes.includes(path_scheme), base_is_package = packageUriProtocols.includes(base_protocol), path_is_root = string_starts_with(path, "/"), path_is_local = path_scheme === "local", path_is_relative = path_scheme === "relative";
    // handling cases like: `fn("jsr://@hello/world/c/d.txt", "jsr://@scope/lib/a/b.ts") => "jsr://@hello/world/c/d.txt"`
    if (path_is_package) {
        // if the `path`'s protocol scheme is that of a package (i.e. "jsr", "npm", or "node"), then we're going to it handle slightly differently,
        // since it is possible for it to be non-parsable by the `URL` constructor if there is not trailing slash after the "npm:" or "jsr:" protocol.
        // thus we normalize our `path` by passing it to the `parsePackageUrl` function, and acquiring the normalized `URL` compatible `href` representation of the full `path`.
        return new URL(parsePackageUrl(path).href);
    }
    // if the base protocol's scheme is either "jsr" or "npm", then we're going to handle slightly differently, since it is possible for it to be non-parsable by the `URL` constructor if there is not trailing slash after the "npm:" or "jsr:" protocol.
    // the path joining rules of packages is different from an http url, which supports the domain name as the host. such an equivalent construction cannot be made for jsr or npm package strings.
    if (base_url && base_is_package && (path_is_root || path_is_relative)) {
        // to start off, we parse the `protocol`, `host` (= scope + package_name + version), and any existing `pathname` of the `base_url` using the `parsePackageUrl` function.
        // note that `pathname` always starts with a leading "/"
        const { host, protocol, pathname } = parsePackageUrl(base_url);
        // handling cases like: `fn("/c/d.txt", "jsr://@scope/lib/a/b.ts") => "jsr://@scope/lib/c/d.txt"`
        if (path_is_root) {
            return new URL(`${protocol}/${dom_encodeURI(host)}${dom_encodeURI(path)}`);
        }
        // handling cases like: `fn("../c/d.txt", "jsr://@scope/lib/a/b.ts") => "jsr://@scope/lib/a/c/d.txt"`
        if (path_is_relative) {
            // here, we join the pre-existing base url's `pathname` with the relative `paths`, by exploiting the URL constructor to do the joining part for us, by giving it a fake protocol named "x:".
            const full_pathname = (new URL(path, "x:" + pathname)).pathname; // `full_pathname` is now url-encoded
            return new URL(`${protocol}/${dom_encodeURI(host)}${full_pathname}`);
        }
    }
    // handling cases like:
    // - `fn("/c/de.txt", "https://example.com/a/b.txt") => "https://example.com/c/de.txt"`
    // - `fn("./c/d.txt", "https://example.com/a/b.txt") => "https://example.com/a/b/c/d.txt"`
    if (base_url && (path_is_root || path_is_relative)) {
        return new URL(path, base_url);
    }
    // handling cases like:
    // - `fn("/a/b c d.txt") => "file:///a/b%20c%20d.txt"`
    // - `fn("C:/a/b d.txt") => "file:///C:/a/b%20d.txt"`
    // - `fn("~/a/b/cd.txt") => "file://~/a/b%20d.txt"`
    if (path_is_local) {
        return new URL("file://" + dom_encodeURI(path));
    }
    // handling all other situations with absolute `path`, such as `http://`, `file://`, `blob:`, and `data:`
    return new URL(path);
};
/** trim the leading forward-slashes at the beginning of a string.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = trimStartSlashes
 *
 * eq(fn("///a/b.txt//"),      "a/b.txt//")
 * eq(fn("/.//a/b.txt//"),     ".//a/b.txt//")
 * eq(fn(".///../a/b.txt//"),  ".///../a/b.txt//")
 * eq(fn("file:///a/b.txt//"), "file:///a/b.txt//")
 * ```
*/
export const trimStartSlashes = (str) => {
    return str.replace(leading_slashes_regex, "");
};
/** trim the trailing forward-slashes at the end of a string, except for those that are preceded by a dotslash ("/./") or a dotdotslash ("/../")
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = trimEndSlashes
 *
 * eq(fn("///a/b.zip///"),          "///a/b.zip")
 * eq(fn("///a/b.zip/.///"),        "///a/b.zip/./")
 * eq(fn("///a/b.zip/..///"),       "///a/b.zip/../")
 * eq(fn("///a/b.zip/...///"),      "///a/b.zip/...")
 * eq(fn("///a/b.zip/wut.///"),     "///a/b.zip/wut.")
 * eq(fn("///a/b.zip/wut..///"),    "///a/b.zip/wut..")
 * eq(fn("///a/b.zip/wut...///"),   "///a/b.zip/wut...")
 * eq(fn(".///../a/b.zip/"),        ".///../a/b.zip")
 * eq(fn("file:///a/b.zip//c.txt"), "file:///a/b.zip//c.txt")
 * ```
*/
export const trimEndSlashes = (str) => {
    return str.replace(trailing_slashes_regex, "");
};
/** trim leading and trailing forward-slashes, at the beginning and end of a string.
 * this is a combination of {@link trimStartSlashes} and {@link trimEndSlashes}, so see their doc comments for more precise test cases.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = trimSlashes
 *
 * eq(fn("///a/b.zip//"),           "a/b.zip")
 * eq(fn("///a/b.zip/..///"),       "a/b.zip/../")
 * eq(fn("///a/b.zip/...///"),      "a/b.zip/...")
 * eq(fn("///a/b.zip/.//..///"),    "a/b.zip/.//../")
 * eq(fn("///a/b.zip/.//.///"),     "a/b.zip/.//./")
 * eq(fn(".///../a/b.zip//"),       ".///../a/b.zip")
 * eq(fn("file:///a/b.zip//c.txt"), "file:///a/b.zip//c.txt")
 * ```
*/
export const trimSlashes = (str) => {
    return trimEndSlashes(trimStartSlashes(str));
};
/** ensure that there is at least one leading slash at the beginning.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = ensureStartSlash
 *
 * eq(fn("a/b.zip"),                "/a/b.zip")
 * eq(fn(".///../a/b.zip/"),        "/.///../a/b.zip/")
 * eq(fn("///../a/b.zip/"),         "///../a/b.zip/")
 * eq(fn("file:///a/b.zip//c.txt"), "/file:///a/b.zip//c.txt")
 * ```
*/
export const ensureStartSlash = (str) => {
    return string_starts_with(str, sep) ? str : sep + str;
};
/** ensure that there is at least one leading dot-slash at the beginning.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = ensureStartDotSlash
 *
 * eq(fn("a/b.zip"),                "./a/b.zip")
 * eq(fn(".///../a/b.zip/"),        ".///../a/b.zip/")
 * eq(fn("///../a/b.zip/"),         ".///../a/b.zip/")
 * eq(fn("file:///a/b.zip//c.txt"), "./file:///a/b.zip//c.txt")
 * ```
*/
export const ensureStartDotSlash = (str) => {
    return string_starts_with(str, dotslash) ? str
        : string_starts_with(str, sep) ? "." + str
            : dotslash + str;
};
/** ensure that there is at least one trailing slash at the end.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = ensureEndSlash
 *
 * eq(fn("///a/b.zip//"),           "///a/b.zip//")
 * eq(fn(".///../a/b.zip/"),        ".///../a/b.zip/")
 * eq(fn(".///../a/b.zip/."),       ".///../a/b.zip/./")
 * eq(fn(".///../a/b.zip/./"),      ".///../a/b.zip/./")
 * eq(fn(".///../a/b.zip/.."),      ".///../a/b.zip/../")
 * eq(fn(".///../a/b.zip/../"),     ".///../a/b.zip/../")
 * eq(fn("file:///a/b.zip//c.txt"), "file:///a/b.zip//c.txt/")
 * ```
*/
export const ensureEndSlash = (str) => {
    return string_ends_with(str, sep) ? str : str + sep;
};
/** trim leading forward-slashes ("/") and dot-slashes ("./"), at the beginning a string.
 * but exclude non-trivial dotdotslash ("/../") from being wrongfully trimmed.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = trimStartDotSlashes
 *
 * eq(fn("///a/b.zip/c.txt"),              "a/b.zip/c.txt")
 * eq(fn("///a/b.zip//"),                  "a/b.zip//")
 * eq(fn("//..//a/b.zip//"),               "..//a/b.zip//")
 * eq(fn("/./..//a/b.zip//"),              "..//a/b.zip//")
 * eq(fn("/./.././a/b.zip//"),             ".././a/b.zip//")
 * eq(fn("///././///.////a/b.zip//"),      "a/b.zip//")
 * eq(fn(".///././///.////a/b.zip//"),     "a/b.zip//")
 * eq(fn("./././//././///.////a/b.zip//"), "a/b.zip//")
 * eq(fn("file:///a/b.zip//c.txt"),        "file:///a/b.zip//c.txt")
 * ```
*/
export const trimStartDotSlashes = (str) => {
    return str.replace(leading_slashes_and_dot_slashes_regex, "");
};
/** trim all trivial trailing forward-slashes ("/") and dot-slashes ("./"), at the end a string.
 * but exclude non-trivial dotdotslash ("/../") from being wrongfully trimmed.
 *
 * TODO: this operation is somewhat expensive, because:
 * - the implementation uses regex, however it was not possible for me to design a regex that handles the input string as is,
 *   so I resort to reversing the input string, and using a slightly easier-to-design regex that discovers trivial (dot)slashes in reverse order,
 *   and then after the string replacement, I reverse it again and return it as the output.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = trimEndDotSlashes
 *
 * eq(fn("a/b.zip/c.txt"),                "a/b.zip/c.txt")
 * eq(fn("//a/b.zip//"),                  "//a/b.zip")
 * eq(fn("/"),                            "")
 * eq(fn("./"),                           "")
 * eq(fn("//././//./"),                   "")
 * eq(fn(".//././//./"),                  "")
 * eq(fn(".//./..///./"),                 ".//./../")
 * eq(fn("/a/b.zip/./"),                  "/a/b.zip")
 * eq(fn("/a/b.zip/../"),                 "/a/b.zip/../")
 * eq(fn("/a/b.zip/..//"),                "/a/b.zip/../")
 * eq(fn("/a/b.zip/.././"),               "/a/b.zip/../")
 * eq(fn("a/b.zip///././///.////"),       "a/b.zip")
 * eq(fn("/a/b.zip///././///.////"),      "/a/b.zip")
 * eq(fn("/a/b.zip/.././/.././///.////"), "/a/b.zip/.././/../")
 * eq(fn("/a/b.zip/././././///.////"),    "/a/b.zip")
 * eq(fn("/a/b.zip./././././///.////"),   "/a/b.zip.")
 * eq(fn("/a/b.zip../././././///.////"),  "/a/b.zip..")
 * eq(fn("/a/b.zip.../././././///.////"), "/a/b.zip...")
 * eq(fn("file:///a/b.zip//c.txt"),       "file:///a/b.zip//c.txt")
 * ```
*/
export const trimEndDotSlashes = (str) => {
    const reversed_str = [...str].toReversed().join(""), trimmed_reversed_str = reversed_str.replace(reversed_trailing_slashes_and_dot_slashes_regex, "");
    // there is a special case when the entirety of the original `str` is made up of only (dot)slashes and ends with one dotslashes "./" (trailing relative path navigation),
    // in which case, we will be left with one single "." as our `trimmed_reversed_str`, instead of an empty string.
    // so we handle this special case below, otherwise we process all other `trimmed_reversed_str` by reversing it once more.
    return trimmed_reversed_str === "."
        ? ""
        : [...trimmed_reversed_str].toReversed().join("");
};
/** trim leading and trailing forward-slashes ("/") and dot-slashes ("./"), at the beginning and end of a string, but keep trailing non-trivial ones intact.
 * this is a combination of {@link trimStartDotSlashes} and {@link trimEndDotSlashes}, so see their doc comments for more precise test cases.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = trimDotSlashes
 *
 * eq(fn("///a/b.zip//"),                  "a/b.zip")
 * eq(fn(".///../a/b.zip//"),              "../a/b.zip")
 * eq(fn("//./././///././//../a/b.zip//"), "../a/b.zip")
 * eq(fn("file:///a/b.zip//c.txt"),        "file:///a/b.zip//c.txt")
 * ```
*/
export const trimDotSlashes = (str) => {
    return trimEndDotSlashes(trimStartDotSlashes(str));
};
/** TODO: purge this function in the future, if you absolutely do not use it anywhere.
 * @deprecated
 *
 * > [!note]
 * > you'd probably want to use {@link joinPaths} instead of this function, for any realistic set of path segments.
 * > not only is this more expensive to compute, it does not distinguish between a directory and a file path (intentionally).
 *
 * join path segments with forward-slashes in between, and remove redundant slashes ("/") and dotslashes ("./") around each segment (if any).
 * however, the first segment's leading and trailing slashes are left untouched,
 * because that would potentially strip away location information (such as relative path ("./"), or absolute path ("/"), or some uri ("file:///")).
 *
 * if you want to ensure that your first segment is shortened, use either the {@link normalizePath} or {@link normalizePosixPath} function on it before passing it here.
 *
 * > [!warning]
 * > it is recommended that you use segments with posix path dir-separators ("/").
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = joinSlash
 *
 * eq(fn(".///../a", "b", "c.txt"),               ".///../a/b/c.txt")
 * eq(fn("file:///a/", "b.zip//", "./c.txt"),     "file:///a/b.zip/c.txt")
 * eq(fn("file:///", "a/", "b.zip//", "./c.txt"), "file:///a/b.zip/c.txt")
 * eq(fn("///a//", "b.//", "zip..//"),            "///a//b./zip..")
 * eq(fn("a/", "b.zip", "./c.txt", ""),           "a/b.zip/c.txt/")
 * eq(fn("a/", "b.zip", "./c.txt", "."),          "a/b.zip/c.txt/")
 * eq(fn("a/", "b.zip", "./c.txt", "./"),         "a/b.zip/c.txt/")
 * eq(fn("a/", "b.zip", "./c.txt", ".."),         "a/b.zip/c.txt/..")
 * eq(fn("a/", "b.zip", "./c.txt", "..."),        "a/b.zip/c.txt/...")
 * eq(fn("", "", ""),                             "")
 * eq(fn("/", "", ""),                            "/")
 * eq(fn("/", "/", ""),                           "/")
 * eq(fn("/", "", "/"),                           "/")
 * eq(fn("/", "/", "/"),                          "/")
 * eq(fn("./", "", ""),                           "./")
 * eq(fn("./", "./", ""),                         "./")
 * eq(fn("./", "", "./"),                         "./")
 * eq(fn("./", "./", "./"),                       "./")
 * eq(fn(
 * 	"//./././///././//../a/b.zip/.////",
 * 	"///.////././.././c.txt/./../",
 * 	"../../d.xyz//.//",
 * ), "//./././///././//../a/b.zip/.////.././c.txt/./../../../d.xyz")
 * ```
*/
export const joinSlash = (first_segment = "", ...segments) => {
    return segments
        .map(trimDotSlashes)
        .reduce((output, subpath) => ((output === "" ? "" : ensureEndSlash(output)) + subpath), first_segment);
};
/** normalize a path by reducing and removing redundant dot-slash ("./" and "../") path navigators from a path.
 *
 * if you provide the optional `config` with the `keepRelative` set to `false`, then in the output, there will no be leading dot-slashes ("./").
 * read more about the option here: {@link NormalizePathConfig.keepRelative}.
 * but note that irrespective of what you set this option to be, leading leading dotdot-slashes ("../") and leading slashes ("/") will not be trimmed.
 *
 * even though `config` should be of {@link NormalizePathConfig} type, it also accepts `number` so that the function's signature becomes compatible with the `Array.prototype.map` method,
 * however, unless you pass the correct config object type, only the default action will be taken.
 *
 * > [!warning]
 * > you MUST provide a posix path (i.e. use "/" for dir-separator).
 * > there will not be any implicit conversion of windows "\\" dir-separator.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = normalizePosixPath
 * // aliasing the config for disabling the preservation of leading "./"
 * const remove_rel: NormalizePathConfig = { keepRelative: false }
 *
 * eq(fn("../a/./b/../././/c.txt"),                 "../a//c.txt")
 * eq(fn("./././a/b/.././././//c.txt"),             "./a///c.txt")
 * eq(fn("./././a/b/.././././//c.txt", remove_rel), "a///c.txt")
 * eq(fn("/a/b/.././././//c.txt"),                  "/a///c.txt")
 * eq(fn("///a/b/.././././//c.txt"),                "///a///c.txt")
 * eq(fn("///a/b/.././.././//c.txt"),               "/////c.txt")
 * eq(fn("file:///./././a/b/.././././c.txt"),       "file:///a/c.txt")
 * eq(fn("/a/../"),                                 "/")
 * // NOTICE: the test in the next line may seem like a weird behavior.
 * eq(fn("/a/../../"),                              "")
 * eq(fn("/a/../../../"),                           "../")
 * eq(fn("./a/../../"),                             "../")
 * eq(fn("./a/../../../"),                          "../../")
 * eq(fn("/a/b/../.."),                             "/")
 * eq(fn("/a/b/."),                                 "/a/b/")
 * eq(fn("/a/b/./"),                                "/a/b/")
 * eq(fn("/a/b/c/.."),                              "/a/b/")
 * eq(fn("/a/b/c/../."),                            "/a/b/")
 * eq(fn("/a/b/c/d/../.."),                         "/a/b/")
 * eq(fn("/a/b/c/../.nomedia"),                     "/a/b/.nomedia")
 * eq(fn(""),                                       "")
 * eq(fn("."),                                      ".")
 * eq(fn(".."),                                     "..")
 * eq(fn("./"),                                     "./")
 * eq(fn("../"),                                    "../")
 * eq(fn("../."),                                   "../")
 * eq(fn("../.."),                                  "../../")
 * eq(fn("./././././"),                             "./")
 * eq(fn(".././././"),                              "../")
 * eq(fn("./././.././././"),                        "../")
 * eq(fn("./././.././.././"),                       "../../")
 * eq(fn(".",                remove_rel),           "")
 * eq(fn("./",               remove_rel),           "")
 * eq(fn("./././././",       remove_rel),           "")
 * eq(fn("./././.././././",  remove_rel),           "../")
 * eq(fn("./././.././.././", remove_rel),           "../../")
 * ```
*/
export const normalizePosixPath = (path, config = {}) => {
    const { keepRelative = true } = isObject(config) ? config : {}, segments = path.split(sep), last_segment = segments.at(-1), output_segments = [".."], 
    // a flag that specifies whether a "./" should be prepended to final result (assuming that the result does not being with "../")
    prepend_relative_dotslash_to_output_segments = keepRelative && segments[0] === ".", 
    // a flag that specifies whether the input path ends with a "/." or "/..", in which case we will need to append a final "/" to the output.
    // this is because our for-loop will strip away the final dot character, without any upcoming replacements.
    // for instance, an input `path = "/a/b/."` would normalize to `"/a/b/"` with this flag. but without it, it will become `"/a/b"`.
    ends_with_dir_navigator_without_a_trailing_slash = (segments.length >= 2) && (last_segment === "." || last_segment === "..");
    if (ends_with_dir_navigator_without_a_trailing_slash) {
        segments.push("");
    }
    for (const segment of segments) {
        if (segment === "..") {
            if (output_segments.at(-1) !== "..") {
                output_segments.pop();
            }
            else {
                output_segments.push(segment);
            }
        }
        else if (segment !== ".") {
            output_segments.push(segment);
        }
    }
    output_segments.shift();
    if (prepend_relative_dotslash_to_output_segments && output_segments[0] !== "..") {
        output_segments.unshift(".");
    }
    return output_segments.join(sep);
};
/** normalize a path by reducing and removing redundant dot-slash ("./", "../", ".\\", and "..\\") path navigators from a path.
 * the returned output is always a posix-style path.
 *
 * to read about the optional `config` parameter, refer to the docs of {@link normalizePosixPath}, which is the underlying function that takes care most of the normalization.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = normalizePath
 *
 * eq(fn("../a/./b/../././/c.txt"),                "../a//c.txt")
 * eq(fn("./.\\.\\a\\b\\.././.\\.///c.txt"),       "./a///c.txt")
 * eq(fn("/home\\.config/a\\..\\...\\b\\./c.txt"), "/home/.config/.../b/c.txt")
 * eq(fn("file:///./././a\\b/..\\././.\\c.txt"),   "file:///a/c.txt")
 * ```
*/
export const normalizePath = (path, config) => {
    return normalizePosixPath(pathToPosixPath(path), config);
};
/** convert windows directory slash "\\" to posix directory slash "/".
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = pathToPosixPath
 *
 * eq(fn("C:\\Users/my name\\file.txt"), "C:/Users/my name/file.txt")
 * eq(fn("~/path/to/file.txt"),          "~/path/to/file.txt")
 * eq(fn("/path\\to file.txt"),          "/path/to file.txt")
 * ```
*/
export const pathToPosixPath = (path) => path.replaceAll(windows_directory_slash_regex, sep);
/** convert an array of paths to cli compatible list of paths, suitable for setting as an environment variable.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = pathsToCliArg
 *
 * // conversion example with windows separator (";")
 * eq(fn(";", [
 * 	"./a/b/c.txt",
 * 	"C:\\Android Studio\\sdk\\",
 * 	"build\\libs\\"
 * ]), `"./a/b/c.txt;C:/Android Studio/sdk/;build/libs/"`)
 *
 * // conversion example with unix separator (":")
 * eq(fn(":", [
 * 	"./a/b/c.txt",
 * 	"~/Android Studio/sdk/",
 * 	"build/libs/"
 * ]), `"./a/b/c.txt:~/Android Studio/sdk/:build/libs/"`)
 * ```
*/
export const pathsToCliArg = (separator, paths) => {
    return quote(pathToPosixPath(paths.join(separator)));
};
/** find the prefix path directory common to all provided `paths`.
 * > [!warning]
 * > your paths MUST be normalized beforehand, and use posix dir-separators ("/").
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = commonNormalizedPosixPath
 *
 * eq(fn([
 * 	"C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"C:/Hello/World/This/Is/Not/An/Example/",
 * 	"C:/Hello/Earth/Bla/Bla/Bla",
 * ]), "C:/Hello/")
 *
 * eq(fn([
 * 	"C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"C:/Hello/World/This/is/an/example/bla.cs",
 * 	"C:/Hello/World/This/Is/Not/An/Example/",
 * ]), "C:/Hello/World/This/")
 *
 * eq(fn([
 * 	"./../Hello/World/Users/This/Is/An/Example/Bla.cs",
 * 	"./../Hello/World Users/This/Is/An/example/bla.cs",
 * 	"./../Hello/World-Users/This/Is/Not/An/Example/",
 * ]), "./../Hello/")
 *
 * eq(fn([
 * 	"./Hello/World/Users/This/Is/An/Example/Bla.cs",
 * 	"./Hello/World/",
 * 	"./Hello/World", // the "World" here segment is not treated as a directory
 * ]), "./Hello/")
 *
 * eq(fn([
 * 	"C:/Hello/World/",
 * 	"/C:/Hello/World/",
 * 	"C:/Hello/World/",
 * ]), "") // no common prefix was identified
 * ```
*/
export const commonNormalizedPosixPath = (paths) => {
    const common_prefix = commonPrefix(paths), common_prefix_length = common_prefix.length;
    for (const path of paths) {
        const remaining_substring = path.slice(common_prefix_length);
        if (!string_starts_with(remaining_substring, sep)) {
            // it looks like the `path`'s common prefix is not followed by an immediate "/" separator.
            // thus, we must now reduce our `common_prefix` to the last available "/" separator.
            // after we do that, we are guaranteed that this newly created `common_dir_prefix` is indeed common to all `paths`, since its superset, the `common_prefix`, was also common to all `paths`.
            // thus we can immediately return and ignore the remaining tests in the loop.
            const common_dir_prefix_length = common_prefix.lastIndexOf(sep) + 1, common_dir_prefix = common_prefix.slice(0, common_dir_prefix_length);
            return common_dir_prefix;
        }
    }
    // if we have made it to here, it would mean that among all paths, the initial `common_prefix` was indeed also the common directory among all of them.
    return common_prefix;
};
/** find the prefix path directory common to all provided `paths`.
 * your input `paths` do not need to be normalized nor necessarily use posix-style separator "/".
 * under the hood, this function normalizes and converts all paths to posix-style, then applies the {@link commonNormalizedPosixPath} onto them.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = commonPath
 *
 * eq(fn([
 * 	"C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"C:\\Hello\\World\\This\\Is\\Not/An/Example/",
 * 	"C:/Hello/Earth/Bla/Bla/Bla",
 * ]), "C:/Hello/")
 *
 * eq(fn([
 * 	"./Hello/World/This/Used/to-be-an/example/../../../Is/An/Example/Bla.cs",
 * 	".\\Hello/World/This/Is/an/example/bla.cs",
 * 	"./Hello/World/This/Is/Not/An/Example/",
 * ]), "./Hello/World/This/Is/")
 *
 * eq(fn([
 * 	"./../home/Hello/World/Users/This/Is/An/Example/Bla.cs",
 * 	"././../home\\Hello\\World Users\\This\\Is/An\\example/bla.cs",
 * 	"./../home/./.\\.\\././Hello/World-Users/./././././This/Is/Not/An/Example/",
 * ]), "../home/Hello/")
 *
 * eq(fn([
 * 	"\\C:/Hello/World/Users/This/Is/An/Example/Bla.cs",
 * 	"/C:\\Hello\\World Users\\This\\Is/An\\example/bla.cs",
 * 	"/C:/Hello/World", // the "World" here segment is not treated as a directory
 * ]), "/C:/Hello/")
 * ```
*/
export const commonPath = (paths) => {
    return commonNormalizedPosixPath(paths.map(normalizePath));
};
/** replace the common path among all provided `paths` by transforming it with a custom `map_fn` function.
 * all `paths` are initially normalized and converted into posix-style (so that no "\\" windows separator is prevelent).
 *
 * the `map_fn` function's first argument (`path_info`), is a 2-tuple of the form `[common_dir: string, subpath: string]`,
 * where `common_dir` represents the directory common to all of the input `paths`, and the `subpath` represents the remaining relative path that comes after common_dir.
 * - the `common_dir` always ends with a trailing slash ("/"), unless there is absolutely no common directory among the `paths` at all.
 * - the `subpath` never begins with any slash (nor any dot-slashes), unless of course, you had initially provided a path containing two or more consecutive slashes.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = commonPathTransform
 *
 * const subpath_map_fn = ([common_dir, subpath]: [string, string]) => (subpath)
 *
 * eq(fn([
 * 	"C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"C:\\Hello\\World\\This\\Is\\Not/An/Example/",
 * 	"C:/Hello/Earth/Bla/Bla/Bla",
 * ], subpath_map_fn), [
 * 	"World/This/Is/An/Example/Bla.cs",
 * 	"World/This/Is/Not/An/Example/",
 * 	"Earth/Bla/Bla/Bla",
 * ])
 *
 * eq(fn([
 * 	"./../././home/Hello/World/This/Used/to-be-an/example/../../../Is/An/Example/Bla.cs",
 * 	"./././../home/Hello/World/This/Is/an/example/bla.cs",
 * 	"./../home/Hello/World/This/Is/Not/An/Example/",
 * ], subpath_map_fn), [
 * 	"An/Example/Bla.cs",
 * 	"an/example/bla.cs",
 * 	"Not/An/Example/",
 * ])
 *
 * eq(fn([
 * 	"/C:/Hello///World/Users/This/Is/An/Example/Bla.cs",
 * 	"/C:\\Hello\\World Users\\This\\Is/An\\example/bla.cs",
 * 	"/C:/./.\\.\\././Hello/World-Users/./././././This/Is/Not/An/Example/",
 * ], subpath_map_fn), [
 * 	"//World/Users/This/Is/An/Example/Bla.cs",
 * 	"World Users/This/Is/An/example/bla.cs",
 * 	"World-Users/This/Is/Not/An/Example/",
 * ])
 * ```
*/
export const commonPathTransform = (paths, map_fn) => {
    const normal_paths = paths.map(normalizePath), common_dir = commonNormalizedPosixPath(normal_paths), common_dir_length = common_dir.length, path_infos = array_from(normal_paths, (normal_path) => {
        return [common_dir, normal_path.slice(common_dir_length)];
    });
    return path_infos.map(map_fn);
};
/** purge the common path among all provided `paths`, and replace (join) it with a `new_common_dir` path.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = commonPathReplace
 *
 * eq(fn([
 * 	"C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"C:\\Hello\\World\\This\\Is\\Not/An/Example/",
 * 	"C:/Hello/Earth/Bla/Bla/Bla",
 * ], "D:/"), [
 * 	"D:/World/This/Is/An/Example/Bla.cs",
 * 	"D:/World/This/Is/Not/An/Example/",
 * 	"D:/Earth/Bla/Bla/Bla",
 * ])
 *
 * eq(fn([
 * 	"C:/Hello/World/This/Used/to-be-an/example/../../../Is/An/Example/Bla.cs",
 * 	"C:/Hello/World/This/Is/an/example/bla.cs",
 * 	"C:/Hello/World/This/Is/Not/An/Example/",
 * ], "D:/temp"), [ // an implicit  forward slash is added.
 * 	"D:/temp/An/Example/Bla.cs",
 * 	"D:/temp/an/example/bla.cs",
 * 	"D:/temp/Not/An/Example/",
 * ])
 *
 * eq(fn([
 * 	// there is no common ancestor among each of the paths (even "C:/" and "./C:/" are not considered to be equivalent to one another)
 * 	"http:/Hello/World.cs",
 * 	"./C:/Hello/World.cs",
 * 	"C:/Hello/World/file.cs",
 * ], "D:/temp/"), [
 * 	"D:/temp/http:/Hello/World.cs",
 * 	"D:/temp/C:/Hello/World.cs",
 * 	"D:/temp/C:/Hello/World/file.cs",
 * ])
 *
 * eq(fn([
 * 	"/C:/Hello///World/Users/This/Is/An/Example/Bla.cs",
 * 	"/C:\\Hello\\World Users\\This\\Is/An\\example/bla.cs",
 * 	"/C:/./.\\.\\././Hello/World-Users/./././././This/Is/Not/An/Example/",
 * ], "file:///./.\\HELLO.\\./../"), [ // the `new_common_dir` is not normalized by this function
 * 	"file:///./.\\HELLO.\\./..///World/Users/This/Is/An/Example/Bla.cs",
 * 	"file:///./.\\HELLO.\\./../World Users/This/Is/An/example/bla.cs",
 * 	"file:///./.\\HELLO.\\./../World-Users/This/Is/Not/An/Example/",
 * ])
 * ```
*/
export const commonPathReplace = (paths, new_common_dir) => {
    new_common_dir = ensureEndSlash(new_common_dir);
    return commonPathTransform(paths, ([common_dir, subpath]) => {
        // if there is no common dir among the `paths` (i.e. `common_dir = ""`), then it is possible for
        // some `subpath`s to contain a leading dotslash ("./"), in which case we must trim it before concatenation
        subpath = (string_starts_with(subpath, dotslash) ? subpath.slice(2) : subpath);
        return new_common_dir + subpath;
    });
};
/** get the file name from a given normalized posix path.
 * if the provided path ends with a trailing slash ("/"), then an empty string will be returned, emphasizing the lack of a file name.
 *
 * @example
 * ```ts  ignore
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = parseNormalizedPosixFilename
 *
 * eq(fn("/home/user/docs"),     "docs")
 * eq(fn("/home/user/docs.md"),  "docs.md")
 * eq(fn("/home/user/.bashrc"),  ".bashrc")
 * eq(fn("var/log.txt"),         "log.txt")
 * eq(fn("log"),                 "log")
 * eq(fn("C:/a/b/c/etc"),        "etc")
 *
 * eq(fn("/home/user/.config/"), "")
 * eq(fn("var/log/"),            "")
 * eq(fn("C:/a/b/c/etc/"),       "")
 * eq(fn(""),                    "")
 * eq(fn("/"),                   "")
 * eq(fn("///"),                 "")
 * ```
*/
const parseNormalizedPosixFilename = (file_path) => {
    return trimStartSlashes(filename_regex.exec(file_path)?.[0] ?? "");
};
/** get the base name and extension name of a file, from its filename (no directories).
 *
 * @example
 * ```ts ignore
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = parseBasenameAndExtname_FromFilename
 *
 * eq(fn("docs"),           ["docs", ""])
 * eq(fn("docs."),          ["docs.", ""])
 * eq(fn("docs.md"),        ["docs", ".md"])
 * eq(fn(".bashrc"),        [".bashrc", ""])
 * eq(fn("my file.tar.gz"), ["my file.tar", ".gz"])
 * eq(fn(""),               ["", ""])
 * eq(fn("."),              [".", ""])
 * eq(fn(".."),             ["..", ""])
 * eq(fn("...hello"),       ["..", ".hello"])
 * ```
*/
const parseBasenameAndExtname_FromFilename = (filename) => {
    const { basename = "", ext = "" } = basename_and_extname_regex.exec(filename)?.groups ?? {};
    return [basename, ext];
};
/** parses the provided file path and breaks it down into useful bit described by the interface {@link FilepathInfo}.
 * note that a file path must never end in a trailing slash ("/"), and conversely,
 * a folder path must always in a trailing slash ("/"), otherwise it will be parsed as a file.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = parseFilepathInfo
 *
 * eq(fn("/home\\user/docs"), {
 * 	path: "/home/user/docs",
 * 	dirpath:  "/home/user/",
 * 	dirname:  "user",
 * 	filename: "docs",
 * 	basename: "docs",
 * 	extname:  "",
 * })
 *
 * eq(fn("home\\user/docs/"), {
 * 	path: "home/user/docs/",
 * 	dirpath:  "home/user/docs/",
 * 	dirname:  "docs",
 * 	filename: "",
 * 	basename: "",
 * 	extname:  "",
 * })
 *
 * eq(fn("/home/xyz/.././././user/.bashrc."), {
 * 	path: "/home/user/.bashrc.",
 * 	dirpath:  "/home/user/",
 * 	dirname:  "user",
 * 	filename: ".bashrc.",
 * 	basename: ".bashrc.",
 * 	extname:  "",
 * })
 *
 * eq(fn("C:\\home\\user/.file.tar.gz"), {
 * 	path: "C:/home/user/.file.tar.gz",
 * 	dirpath:  "C:/home/user/",
 * 	dirname:  "user",
 * 	filename: ".file.tar.gz",
 * 	basename: ".file.tar",
 * 	extname:  ".gz", // only the last bit of the extension makes it to here
 * })
 *
 * eq(fn("/home/user///file.txt"), {
 * 	path: "/home/user///file.txt",
 * 	dirpath:  "/home/user///",
 * 	dirname:  "", // this is because the there is no name attached between the last two slashes of the `dirpath = "/home/user///"`
 * 	filename: "file.txt",
 * 	basename: "file",
 * 	extname:  ".txt",
 * })
 *
 * eq(fn("file://C:/home\\hello world.txt"), {
 * 	path: "file://C:/home/hello world.txt", // file-urls are not converted, nor is any kind of url
 * 	dirpath:  "file://C:/home/",
 * 	dirname:  "home",
 * 	filename: "hello world.txt",
 * 	basename: "hello world",
 * 	extname:  ".txt",
 * })
 * ```
*/
export const parseFilepathInfo = (file_path) => {
    const path = normalizePath(file_path), filename = parseNormalizedPosixFilename(path), filename_length = filename.length, dirpath = filename_length > 0 ? path.slice(0, -filename_length) : path, 
    // below, I am purposely using `slice` instead of doing `trimEndSlashes(dirpath)`, because it is possible that two or more consecutive slashes "/" were intentionally placed in the directory separator. 
    dirname = parseNormalizedPosixFilename(dirpath.slice(0, -1)), [basename, extname] = parseBasenameAndExtname_FromFilename(filename);
    return { path, dirpath, dirname, filename, basename, extname, };
};
/** convert the input file-url to a filesystem local-path.
 * however, if the input uri is not a file url (for instance `"C:/x/y/z"`, or `"http://hello.com"`),
 * then `undefined` will be returned.
 *
 * if you are looking to convert any _potential_ file-url back to a filesystem local-path,
 * then the {@link ensureFileUrlIsLocalPath} function would be better suited for your need.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = fileUrlToLocalPath,
 * 	eq = assertEquals
 *
 * eq(        fn("file:///C:/Users/me/projects/"),           "C:/Users/me/projects/")
 * eq(        fn("file:///C:\\Users\\me/projects/"),         "C:/Users/me/projects/")
 * eq(        fn("file:///sys/etc/bin/deno.so"),             "/sys/etc/bin/deno.so")
 * eq(        fn("file:///sys\\etc/bin\\deno.so"),           "/sys/etc/bin/deno.so")
 * eq(        fn("file://localhost/C:/Users/me/projects/"),  "C:/Users/me/projects/")
 * eq(        fn("file://localhost/sys/etc/bin/deno.so"),    "/sys/etc/bin/deno.so")
 * eq(fn(new URL("file:///C:/Users/me/projects/")),          "C:/Users/me/projects/")
 * eq(fn(new URL("file:///sys/etc/bin/deno.so")),            "/sys/etc/bin/deno.so")
 * eq(fn(new URL("file://localhost/C:/Users/me/projects/")), "C:/Users/me/projects/")
 * eq(fn(new URL("file://localhost/sys/etc/bin/deno.so")),   "/sys/etc/bin/deno.so")
 *
 * // everything below is not a file-url, and therefore cannot be converted.
 * eq(        fn("http://localhost:8000/hello/world/"),      undefined)
 * eq(        fn("C:/Users/me/projects/"),                   undefined)
 * eq(        fn("/sys/etc/bin/deno.so"),                    undefined)
 * eq(        fn(""),                                        undefined)
 * ```
*/
export const fileUrlToLocalPath = (file_url) => {
    if (isString(file_url)) {
        if (getUriScheme(file_url) !== "file") {
            return;
        }
        file_url = new URL(file_url);
    }
    if (!string_starts_with(file_url.protocol, "file:")) {
        return;
    }
    // the `file_url.pathname` always starts with a leading slash, which is invalid for windows.
    // thus we replace any leading slashes in any windows-looking path that we encounter, without actually consulting what os is being ran.
    const local_path_with_leading_slash = pathToPosixPath(dom_decodeURI(file_url.pathname)), corrected_local_path = local_path_with_leading_slash.replace(windows_leading_slash_correction_regex, "$1:/");
    return corrected_local_path;
};
/** a fault tolerant variant of {@link fileUrlToLocalPath} that assures you that any file-url path will get converted into a filesystem local-path.
 * otherwise, when a non-file-url is provided, its string representation (href) will be returned if it was a `URL`,
 * else the original string will be returned back.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const
 * 	fn = ensureFileUrlIsLocalPath,
 * 	eq = assertEquals
 *
 * eq(        fn("C:/Users/me/projects/"),                  "C:/Users/me/projects/")
 * eq(        fn("C:\\Users\\me/projects/"),                "C:/Users/me/projects/")
 * eq(        fn("/C:/Users\\me/projects/"),                "/C:/Users/me/projects/") // note the erroneous leading slash
 * eq(        fn("/sys\\etc/bin\\deno.so"),                 "/sys/etc/bin/deno.so")
 * eq(        fn("file:///C:/Users/me/projects/"),          "C:/Users/me/projects/")
 * eq(        fn("file://////C:\\Users\\me/projects/"),     "C:/Users/me/projects/")
 * eq(        fn("file:///sys\\etc/bin\\deno.so"),          "/sys/etc/bin/deno.so")
 * eq(        fn("file://localhost/C:/Users/me/projects/"), "C:/Users/me/projects/")
 * eq(fn(new URL("file://localhost/sys/etc/bin/deno.so")),  "/sys/etc/bin/deno.so")
 * eq(        fn("http://localhost:8000/hello/world/"),     "http://localhost:8000/hello/world/")
 * eq(        fn("npm:react-jsx"),                          "npm:react-jsx")
 * eq(        fn("jsr:@std/assert"),                        "jsr:@std/assert")
 * eq(        fn("./src/mod.ts"),                           "./src/mod.ts")
 * eq(        fn(""),                                       "")
 * ```
*/
export const ensureFileUrlIsLocalPath = (path) => {
    const path_is_string = isString(path), file_uri_to_local_path_conversion = fileUrlToLocalPath(path);
    return file_uri_to_local_path_conversion ?? (path_is_string
        ? pathToPosixPath(path)
        : path.href);
};
/** find the path `to_path`, relative to `from_path`.
 *
 * TODO: the claim below is wrong, because `joinSlash` cannot do "./" traversal correctly. for instance `joinSlash("a/b/c.txt", "./") === "a/b/c.txt/"`, but you'd expect it to be `"a/b/"` if we had correctly resolved the path.
 *       which is why the output from this function will not work with `joinSlash`, but it will work with {@link resolveAsUrl} or `URL.parse` (when you provide `from_path` as the base path, and `from_path` is NOT a relative path, otherwise the `URL` constructor will fail).
 *
 * ~~if we call the result `rel_path`, then {@link joinSlash | joining} the `from_path` with `rel_path` and normalizing it should give you back `to_path`.~~
 *
 * note that both `from_path` and `to_path` must have a common root folder in their path strings.
 * for instance, if both paths begin with a relative segment `"./"`, then it will be assumed that both paths are referring to the same common root ancestral directory.
 * however, if for instance, `from_path` begins with a `"C:/"` segment, while `to_path` begins with either `"./"` or `"D:/"` or `http://` segment, then this function will fail,
 * as it will not be possible for it to navigate/transcend from one point of reference to a completely different point of reference.
 *
 * so, to be safe, wherever you are certain that both paths are of a certain common type:
 * before passing them here, you should either apply the {@link ensureStartDotSlash} function for relative paths, or apply the {@link ensureStartSlash} for absolute local paths,
 * or write a custom "ensure" function for your situation. (for example, you could write an "ensureHttp" function that ensures that your path begins with `"http"`).
 *
 * @throws `Error` an error will be thrown if there isn't any common ancestral directory between the two provided paths.
 *
 * @example
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, err = assertThrows, fn = relativePath
 *
 * eq(fn(
 * 	"././hello/world/a/b/c/d/g/../e.txt",
 * 	"././hello/world/a/b/x/y/w/../z/",
 * ), "../../x/y/z/")
 *
 * eq(fn(
 * 	"././hello/world/a/b/c/d/g/../e.txt",
 * 	"././hello/world/a/b/x/y/w/../z/e.md",
 * ), "../../x/y/z/e.md")
 *
 * eq(fn(
 * 	".\\./hello\\world\\a/b\\c/d/g/../",
 * 	"././hello/world/a/b/x/y/w/../z/e.md",
 * ), "../../x/y/z/e.md")
 *
 * eq(fn(
 * 	"././hello/world/a/b/c/d/",
 * 	"././hello/world/a/b/x/y/w/../z/e.md",
 * ), "../../x/y/z/e.md")
 *
 * eq(fn(
 * 	"././hello/world/a/b/c/d/g/../",
 * 	"././hello/world/a/b/x/y/w/../z/e.md",
 * ), "../../x/y/z/e.md")
 *
 * eq(fn(
 * 	"././hello/world/a/b/c/d/",
 * 	"././hello/world/a/b/x/y/w/../z/",
 * ), "../../x/y/z/")
 *
 * eq(fn(
 * 	"./././e.txt",
 * 	"./e.md",
 * ), "./e.md")
 *
 * eq(fn(
 * 	"/e.txt",
 * 	"/e.md",
 * ), "./e.md")
 *
 * eq(fn(
 * 	"C:/e.txt",
 * 	"C:/e.md",
 * ), "./e.md")
 *
 * eq(fn(
 * 	"././hello/world/a/b/c/d/g/../e.txt",
 * 	"././hello/world/a/k/../b/q/../c/d/e.md",
 * ), "./e.md")
 *
 * eq(fn(
 * 	"./",
 * 	"./",
 * ), "./")
 *
 * eq(fn(
 * 	"/",
 * 	"/",
 * ), "./")
 *
 * // there is no common ancestral root between the two paths (since one is absolute, while the other is relative)
 * err(() => fn(
 * 	"/e.txt",
 * 	"./e.md",
 * ))
 *
 * // there is no common ancestral root between the two paths
 * err(() => fn(
 * 	"C:/e.txt",
 * 	"D:/e.md",
 * ))
 *
 * // there is no common ancestral root between the two paths
 * err(() => fn(
 * 	"http://e.txt",
 * 	"./e.md",
 * ))
 *
 * // there is no common ancestral root between the two paths
 * err(() => fn(
 * 	"file:///C:/e.txt",
 * 	"C:/e.md",
 * ))
 * ```
*/
export const relativePath = (from_path, to_path) => {
    const [[common_dir, from_subpath], [, to_subpath],] = commonPathTransform([from_path, to_path], (common_dir_and_subpath) => common_dir_and_subpath);
    if (common_dir === "") {
        throw new Error(DEBUG.ERROR ? (`there is no common directory between the two provided paths:\n\t"${from_path}" and\n\t"to_path"`) : "");
    }
    const upwards_traversal = Array(from_subpath.split(sep).length).fill("..");
    upwards_traversal[0] = "."; // we do this because the relative path should always begin with a dotslash ("./")
    return normalizePosixPath(upwards_traversal.join(sep) + sep + to_subpath);
};
/** joins multiple posix path segments into a single normalized path,
 * correctly handling files and directories differently when the `"./"` and `"../"` navigation commands are encountered.
 *
 * > [!note]
 * > the `joinPosixPaths` function differs from `joinSlash` in that it treats segments without a trailing slash as files by default.
 * > furthermore, `joinPosixPaths` is much more quicker to compute, as opposed to `joinSlash`, which uses some complex regex on each segment.
 * > the only reason you might realistically want to use `joinSlash` is when you desire an non-normalized output.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = joinPosixPaths
 *
 * eq(fn("a", "b", "c.zip"),                      "a/b/c.zip")
 * eq(fn("a", "b", "c/"),                         "a/b/c/")
 * eq(fn("a/", "b/", "c/"),                       "a/b/c/")
 * eq(fn("a", "b", "c.zip", "./"),                "a/b/")
 * eq(fn("a", "b", "c/", "./"),                   "a/b/c/")
 * eq(fn("a", "b", "c", "../"),                   "a/")
 * eq(fn("a", "b", "c/d.txt", "./e.txt"),         "a/b/c/e.txt")
 * eq(fn("a", "b", "c/d.txt", "../e.txt"),        "a/b/e.txt")
 * eq(fn("a/b", "c/d.txt", "..", "e.txt"),        "a/b/e.txt") // notice that you can use "." instead of "./"
 * eq(fn("a/", "b/", "c/", "../", "./","d.txt"),  "a/b/d.txt")
 * eq(fn("a/b", "c/", "..", ".","d.txt"),         "a/b/d.txt") // notice that you can use ".." instead of "../"
 * eq(fn("a/b", "c/", ".d.txt"),                  "a/b/c/.d.txt")
 * eq(fn("a/b", "c/", "..d.txt"),                 "a/b/c/..d.txt")
 * eq(fn("a/b", "c/", ".d"),                      "a/b/c/.d")
 * eq(fn("a/b", "c/", ".d."),                     "a/b/c/.d.")
 * eq(fn("a/b", "c/", "..d"),                     "a/b/c/..d")
 * eq(fn("a/b", "c/", "..d."),                    "a/b/c/..d.")
 * eq(fn("a/b", "c/", "..d.."),                   "a/b/c/..d..")
 * eq(fn("a/b", "c/", "..d.", "e.txt"),           "a/b/c/..d./e.txt")
 * eq(fn("a/b", "c/", "..d..", "e.txt"),          "a/b/c/..d../e.txt")
 * eq(fn("./a", "./b", "./c"),                    "./c")
 * eq(fn("./a", "/b", "/c"),                      "./a//b//c")
 * eq(fn("./a/", "/b/", "/c"),                    "./a//b//c")
 * eq(fn("/a", "b.zip", "./c.zip"),               "/a/c.zip")
 * eq(fn("/a", "b.zip", "./c.zip/", "../d.txt"),  "/a/d.txt")
 * eq(fn("/a", "b.zip/", "./c.txt"),              "/a/b.zip/c.txt")
 * eq(fn("/a", "b.zip/", "./c.txt/", "../d.txt"), "/a/b.zip/d.txt")
 * eq(fn("file:", "//", "a/b/c", "./d"),          "file:///a/b/d")
 * eq(fn("file:///", "a/b/c", "./d"),             "file:///a/b/d")
 * ```
*/
export const joinPosixPaths = (...segments) => {
    // first we ensure that all segments that are purely ill-formed directory commands ("." and ".."), become well-formed ("./" and "../")
    segments = segments.map((segment) => {
        return segment === "." ? dotslash
            : segment === ".." ? dotdotslash
                : segment;
    });
    // below, in the reduce function, we could have used a `string` based reduce function (i.e. initial value could have been the string `"/"`, instead of the array `["/"]`),
    // but we use an `Array` based reduce function, because strings are inherently immutable, so a new string is made during each modification.
    // and that would use up lots of copy operations if you were joining lots of segments.
    // it is better to process them as an array and then join it in one go at the end.
    const concatenatible_segments = segments.reduce((concatenatible_full_path, segment) => {
        const prev_segment = concatenatible_full_path.pop(), prev_segment_is_dir = string_ends_with(prev_segment, sep), prev_segment_as_dir = prev_segment_is_dir ? prev_segment : (prev_segment + sep); // rewriting the previous segment as a dir
        if (!prev_segment_is_dir) {
            const segment_is_rel_to_dir = string_starts_with(segment, dotslash), segment_is_rel_to_parent_dir = string_starts_with(segment, dotdotslash);
            // we now modify the current segment's initial directory navigation commands to give an equivalent navigation supposing that `prev_segment` was a directory instead of a file.
            // for that, we convert the initial `"./"` to `"../"`, or convert the initial `"../"` to `"../../"`, or
            // if there is no directory navigation command at the beginning, then no modification to the current segment is needed.
            if (segment_is_rel_to_dir) {
                segment = "." + segment;
            } // convert `"./a/b/c"` to `"../a/b/c"`
            else if (segment_is_rel_to_parent_dir) {
                segment = dotdotslash + segment;
            } // convert `"../a/b/c"` to `"../../a/b/c"`
        }
        concatenatible_full_path.push(prev_segment_as_dir, segment);
        return concatenatible_full_path;
    }, [sep]);
    concatenatible_segments.shift(); // we must remove the initial `"/"` that was used as the initial value of the reduce function
    return normalizePosixPath(concatenatible_segments.join(""));
};
/** joins multiple path segments into a single normalized posix path,
 * correctly handling files and directories differently when the `"./"` and `"../"` navigation commands are encountered.
 *
 * for lots of other (posix-only) test cases, see the doc comments of {@link joinPosixPaths}.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = joinPaths
 *
 * eq(fn("C:\\", "a", "b", "c.zip"),              "C:/a/b/c.zip")
 * eq(fn("a", "b", "c.zip"),                      "a/b/c.zip")
 * eq(fn("/a\\b\\", "c/"),                        "/a/b/c/")
 * eq(fn("a", "b", "c.zip", "./"),                "a/b/")
 * eq(fn("a", "b", "c.zip", "../"),               "a/")
 * eq(fn("a", "b", "c.zip", "./d.txt"),           "a/b/d.txt")
 * eq(fn("a", "b", "c.zip", "../d.txt"),          "a/d.txt")
 * eq(fn("a/b/c/", "..", "./", "d.txt"),          "a/b/d.txt")
 * eq(fn("a/b/c/", "../", ".", "d.txt"),          "a/b/d.txt")
 * eq(fn("a/b/c", "../", "./", "d.txt"),          "a/d.txt")
 * eq(fn("file:", "\\\\", "a/b/c", "./d"),        "file:///a/b/d")
 * eq(fn("file://\\", "a/b/c", "./d/"),           "file:///a/b/d/")
 * ```
*/
export const joinPaths = (...segments) => {
    return joinPosixPaths(...segments.map(pathToPosixPath));
};
/** this is a factory function for creating customizable posix path-resolving functions.
 * a path-resolving function is one that takes in a list of path-segments, and then computes the absolute normalized path of all the segments combined.
 *
 * since it is not possible for this submodule to know the context under which you are computing/resolving paths,
 * it becomes impossible to give a meaning to a list of path segmensts that begin with a relative path.
 * which is why you would need to feed this factory function with the (static or dynamic) location of your current working path (directory),
 * and it will spit out a path-resolver function that is tailored to your specific working-directory's path.
 *
 * > [!note]
 * > if you want to preserve the starting relative segments, (i.e. you don't want an absolute path),
 * > then you're looking for the {@link joinPosixPaths} (or {@link joinPaths}) function, not this one.
 *
 * an important detail to note is that whenever an absolute path segment is encountered, all segments prior to it are discarded
 * (i.e. not joined with a "/" separator, like the way {@link joinPaths} does).
 * this behavior is enforced to remain consistent with popular implementations of path-resolvers, like:
 * - python's pathlib [`Path.resolve`](https://docs.python.org/3/library/pathlib):
 *   > _If a segment is an absolute path, all previous segments are ignored_
 * - deno-std's path [`resolve`](https://jsr.io/@std/path/doc/~/resolve), from [`jsr:@std/path`](https://jsr.io/@std/path)
 *
 * > [!caution]
 * > this path resolver function works best when only absolute and relative path segments are provided.
 * > when root (but not necessarily absolute) path segments are encountered, such as `/sys/bin`,
 * > our function will typically assume that it is referring to an absolute local-filesystem path `/sys/bin`.
 * >
 * > but as you may be aware, the "correct" interpretation of the root path depends on the context of the preceding absolute path segment.
 * > for example:
 * > - if the preceding absolute path segment was `C:/a/b/c/d.txt`, and the current path segment is `/sys/bin`,
 * >   then our result will be `/sys/bin`, but the result in most implementations (including deno-std's path module) would be `C:/sys/bin`.
 * > - similarly, if the preceding absolute path segment was `http://test.com/a/b/c/d.txt`, and the current path segment is `/sys/bin`,
 * >   then our result will be `/sys/bin`, but the "correct" url path resolution (via `new URL(...)`) should have been `http://test.com/sys.bin`.
 * >
 * > this is why, if you're dealing with ambiguous root paths that are not necessarily tied down to your posix-filesystem's root,
 * > you should use the {@link resolveAsUrl} function instead, as it is aware of most common types of base contexts/domains for path evaluation.
 * > but on the other hand, you will be unable to use your custom {@link absolute_segment_test_fn}, nor be able to resolve multiple segments all at oncce.
 * >
 * > TODO: contemplate if it would be a good idea to add a configuration interface to this factory function,
 * >   where one will be able to set their custom join rule when a root path segment is discovered, in addition to containing the {@link absolute_segment_test_fn}.
 * >   the signature of the root-join function would look like: `(abs_path_evaluated_up_till_now: string, current_root_path_segment: string) => string`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	cwd = "/x/y/z",
 * 	getCwd = () => (cwd),
 * 	// we also define a custom absolute segment path tester function that will identify "file://" and "http://" segments as absolute path,
 * 	// in addition to the standard filesystem local path absoluteness tester `isAbsolutePath`.
 * 	custom_absolute_path_segment_tester = (segment: string) => {
 * 		if (isAbsolutePath(segment)) { return true }
 * 		if (segment.startsWith("file://")) { return true }
 * 		if (segment.startsWith("http://")) { return true }
 * 		return false
 * 	},
 * 	resolvePosixPath = resolvePosixPathFactory(getCwd, custom_absolute_path_segment_tester)
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = resolvePosixPath
 *
 * // relative path resolution
 * eq(fn("a", "b", "c.zip"),                     "/x/y/z/a/b/c.zip")
 * eq(fn("./a", "b", "c/"),                      "/x/y/z/a/b/c/")
 * eq(fn("a/", "b/", "c/"),                      "/x/y/z/a/b/c/")
 * eq(fn("../a", "../b", "c/"),                  "/x/b/c/")
 * eq(fn("../a/", "../b", "c/"),                 "/x/y/b/c/")
 * eq(fn("a", "b", "c.zip", "./"),               "/x/y/z/a/b/")
 * eq(fn("a", "b", "c/", "./"),                  "/x/y/z/a/b/c/")
 * eq(fn("a", "b", "c", "../"),                  "/x/y/z/a/")
 * eq(fn("a", "b", "c/d.txt", "./e.txt"),        "/x/y/z/a/b/c/e.txt")
 * eq(fn("a", "b", "c/d.txt", "../e.txt"),       "/x/y/z/a/b/e.txt")
 * eq(fn("a/b", "c/d.txt", "..", "e.txt"),       "/x/y/z/a/b/e.txt") // notice that you can use "." instead of "./"
 * eq(fn("a/", "b/", "c/", "../", "./","d.txt"), "/x/y/z/a/b/d.txt")
 * eq(fn("a/b", "c/", "..", ".","d.txt"),        "/x/y/z/a/b/d.txt") // notice that you can use ".." instead of "../"
 * eq(fn("a/b", "c/", ".d.txt"),                 "/x/y/z/a/b/c/.d.txt")
 * eq(fn("a/b", "c/", "..d.txt"),                "/x/y/z/a/b/c/..d.txt")
 * eq(fn("a/b", "c/", ".d"),                     "/x/y/z/a/b/c/.d")
 * eq(fn("a/b", "c/", ".d."),                    "/x/y/z/a/b/c/.d.")
 * eq(fn("a/b", "c/", "..d"),                    "/x/y/z/a/b/c/..d")
 * eq(fn("a/b", "c/", "..d."),                   "/x/y/z/a/b/c/..d.")
 * eq(fn("a/b", "c/", "..d.."),                  "/x/y/z/a/b/c/..d..")
 * eq(fn("a/b", "c/", "..d.", "e.txt"),          "/x/y/z/a/b/c/..d./e.txt")
 * eq(fn("a/b", "c/", "..d..", "e.txt"),         "/x/y/z/a/b/c/..d../e.txt")
 * eq(fn("./a", "./b", "./c"),                   "/x/y/z/c")
 *
 * // pre-existing absolute path resolution
 * eq(fn("./a", "/b", "/c"),           "/c")                 // both "/b" and "/c" are absolute paths, and so they purge all segments behind them.
 * eq(fn("./a/", "/b/", "./c"),        "/b/c")               // "/b/" is an absolute path, hence it negates all segments prior to it.
 * eq(fn("file:///", "a/b/c", "./d"),  "file:///a/b/d")      // the first "file:///" segment is an absolute path according to our `custom_absolute_path_segment_tester`
 * eq(fn("file:/", "a/b/c", "./d"),    "/x/y/z/file:/a/b/d") // "file:/" is not considered as an absolute path by `custom_absolute_path_segment_tester`, thus it the cwd will be prepended to the final path
 * eq(fn("file:", "a/b/c", "./d"),     "/x/y/z/file:/a/b/d") // same as before, but we're putting emphasis on the mandatory "/" separator that gets added after the "file:" segment
 * eq(fn("a/b/c", "http://d/e/f.txt"), "http://d/e/f.txt")   // the "http://" segment is identified as an absolute path by our `custom_absolute_path_segment_tester`
 * ```
*/
export const resolvePosixPathFactory = (absolute_current_dir, absolute_segment_test_fn = isAbsolutePath) => {
    const getCwdPath = isString(absolute_current_dir)
        ? (() => absolute_current_dir)
        : absolute_current_dir;
    return (...segments) => {
        // first, we find the index of the last segment that is absolutely defined.
        // if there isn't one, then we use `getCwdPath` as our base path
        const last_abs_segment_idx = segments.findLastIndex(absolute_segment_test_fn);
        if (last_abs_segment_idx >= 0) {
            segments = segments.slice(last_abs_segment_idx);
        }
        else {
            segments.unshift(ensureEndSlash(getCwdPath()));
        }
        return joinPosixPaths(...segments);
    };
};
/** this is a factory function for creating customizable path-resolving functions.
 *
 * {@inheritDoc resolvePosixPathFactory}
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const
 * 	cwd = "x:\\y\\z",
 * 	getCwd = () => (cwd),
 * 	// we also define a custom absolute segment path tester function that will identify "file://" and "http://" segments as absolute path,
 * 	// in addition to the standard filesystem local path absoluteness tester `isAbsolutePath`.
 * 	custom_absolute_path_segment_tester = (segment: string) => {
 * 		if (isAbsolutePath(segment)) { return true }
 * 		if (segment.startsWith("file://")) { return true }
 * 		if (segment.startsWith("http://")) { return true }
 * 		return false
 * 	},
 * 	resolvePosixPath = resolvePathFactory(getCwd, custom_absolute_path_segment_tester)
 *
 * // aliasing our functions for brevity
 * const eq = assertEquals, fn = resolvePosixPath
 *
 * // relative path resolution
 * eq(fn("a", "b", "c.zip"),                     "x:/y/z/a/b/c.zip")
 * eq(fn(".\\a", "b", "c\\"),                    "x:/y/z/a/b/c/")
 * eq(fn("a/", "b/", "c/"),                      "x:/y/z/a/b/c/")
 * eq(fn("../a", "../b", "c\\"),                 "x:/b/c/")
 * eq(fn("../a/", "../b", "c/"),                 "x:/y/b/c/")
 * eq(fn("a", "b", "c.zip", "./"),               "x:/y/z/a/b/")
 *
 * // pre-existing absolute path resolution
 * eq(fn("./a", "/b", "c:/"),          "c:/")                // both "/b" and "c:/" are absolute paths, and so they purge all segments behind them.
 * eq(fn("./a/", "\\b/", "./c"),       "/b/c")               // "\\b/" is an absolute path, hence it negates all segments prior to it.
 * eq(fn("file:///", "a/b/c", "./d"),  "file:///a/b/d")      // the first "file:///" segment is an absolute path according to our `custom_absolute_path_segment_tester`
 * eq(fn("file:/", "a/b/c", "./d"),    "x:/y/z/file:/a/b/d") // "file:/" is not considered as an absolute path by `custom_absolute_path_segment_tester`, thus it the cwd will be prepended to the final path
 * eq(fn("file:", "a/b\\c", ".\\d"),   "x:/y/z/file:/a/b/d") // same as before, but we're putting emphasis on the mandatory "/" separator that gets added after the "file:" segment
 * eq(fn("a/b/c", "http://d/e/f.txt"), "http://d/e/f.txt")   // the "http://" segment is identified as an absolute path by our `custom_absolute_path_segment_tester`
 * ```
 *
 * for lots of other (posix-only) test cases, see the doc comments of {@link resolvePosixPathFactory}.
*/
export const resolvePathFactory = (absolute_current_dir, absolute_segment_test_fn = isAbsolutePath) => {
    if (isString(absolute_current_dir)) {
        absolute_current_dir = pathToPosixPath(absolute_current_dir);
    }
    const getCwdPath = isString(absolute_current_dir)
        ? (() => absolute_current_dir)
        : (() => pathToPosixPath(absolute_current_dir())), posix_path_resolver = resolvePosixPathFactory(getCwdPath, absolute_segment_test_fn);
    return (...segments) => posix_path_resolver(...segments.map(pathToPosixPath));
};
const glob_pattern_to_regex_escape_control_chars = /[\.\+\^\$\{\}\(\)\|\[\]\\]/g, glob_starstar_wildcard_token = "<<<StarStarWildcard>>>";
/** convert a glob string to a regex object.
 *
 * TODO: purge the info below:
 * in this implementation, only the wildcards `"*"`, `"**"`, and the optional `"?"` is given meaning.
 * all else, including parenthesis, brackets, dots, and backslash, are escaped when being converted into a regex.
 *
 * TODO: test it
 * TODO: also implement a `isGlobPattern` function
 * TODO: make it so that the user can configure which features to turn on or off
 *
 * @beta
*/
export const globPatternToRegex = (glob_pattern) => {
    const 
    // first, convert windows path separator to posix path separator
    posix_pattern = pathToPosixPath(glob_pattern), regex_str = posix_pattern
        // escape regex special characters, except for "*", "?", "[", "]", "{", and "}"
        .replace(glob_pattern_to_regex_escape_control_chars, "\\$&")
        // replace "**/" or "**" directory wildcard with a temporary `glob_starstar_wildcard_token`, and later we will convert to ".*"
        .replace(/\*\*\/?/g, glob_starstar_wildcard_token)
        // replace single "*" with "[^/]*" to match anything except directory separators
        .replace(/\*/g, "[^\/]*")
        // replace "?" with "." to match any single character
        .replace(/\?/g, ".")
        // convert negated glob ranges (like "[!abc]") to regex negation ("[^abc]")
        .replace(/\[!(.*)\]/g, "[^$1]")
        // support for character ranges like "[a-z]"
        .replace(/\[(.*)\]/g, "[$1]")
        // support for braces like "{js,ts}"
        .replace(/\{([^,}]+),([^}]+)\}/g, "($1|$2)")
        // put back the ".*" wildcards where they belong
        .replace(glob_starstar_wildcard_token, ".*");
    return new RegExp("^" + regex_str + "$");
};
