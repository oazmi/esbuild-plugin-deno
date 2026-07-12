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
type PackageUriScheme = "jsr" | "npm" | "node";
type PackageUriProtocol = "jsr:" | "npm:" | "node:";
/** recognized uri schemes (i.e. the url protocol's scheme) that are returned by {@link getUriScheme}.
 * - `local`: "C://absolute/path/to/file.txt"
 * - `relative`: "./path/to/file.txt" or "../path/to/file.txt"
 * - `file`: "file://C://absolute/path/to/file.txt"
 * - `http`: "http://example.com/path/to/file.txt"
 * - `https`: "https://example.com/path/to/file.txt"
 * - `data`: "data:text/plain;base64,SGVsbG9Xb3JsZA==" or "data:text/plain,HelloWorld"
 * - `jsr`: "jsr:@scope/package-name"
 * - `npm`: "npm:@scope/package-name" or "npm:package-name"
 * - `node`: "node:module" or "node:module/submodule"
*/
export type UriScheme = undefined | "local" | "relative" | "file" | "http" | "https" | "data" | "blob" | PackageUriScheme;
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
export declare const uriProtocolSchemeMap: Array<[protocol: string, scheme: UriScheme]>;
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
export declare const forbiddenBaseUriSchemes: UriScheme[];
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
export declare const isAbsolutePath: (path: string) => boolean;
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
export declare const getUriScheme: (path: string) => UriScheme;
/** a description of a parsed jsr/npm package, that somewhat resembles the properties of regular URL. */
export interface PackagePseudoUrl {
    /** the full package string, compatible to use with the `URL` constructor.
     *
     * > [!note]
     * > this string is IS uri-encoded.
     * > however, vs-code doc popup may decode the uri-encoded string,
     * > giving a deceptive representation.
     *
     * examples:
     * - `jsr:/@scope/package@version/pathname`
     * - `jsr:/@scope/package`
     * - `npm:/package@version/pathname`
     * - `npm:/@scope/package@version`
     * - `npm:/@scope/package@1.0%20-%201.2` // the version range is "1.0 - 1.2"
     * - `npm:/@scope/package@%5E29`         // the version range is "^9"
     * - `node:/http`
     * - `node:/fs/promises`
    */
    href: string | `${PackageUriScheme}:/${PackagePseudoUrl["host"]}${PackagePseudoUrl["pathname"]}`;
    protocol: PackageUriProtocol;
    /** optional scope name. */
    scope?: string;
    /** name of the package. the reason why we call it "pkg" instead of "package" is because "package" is a reserved word in javascript. */
    pkg: string;
    /** optional version string of the package. */
    version?: string;
    /** the pathname of the subpath that is being accessed within the package.
     * this will always begin with a leading slash ("/"), even if there is no subpath being accessed.
    */
    pathname: string;
    /** the host contains the full information about the package's string.
     * that is, it has the optional scope information, the package name information, and the optional version information.
     *
     * > [!note]
     * > this string is NOT uri-encoded, unlike {@link href}.
    */
    host: string | `${PackagePseudoUrl["pkg"]}` | `${PackagePseudoUrl["pkg"]}@${PackagePseudoUrl["version"]}` | `@${PackagePseudoUrl["scope"]}/${PackagePseudoUrl["pkg"]}` | `@${PackagePseudoUrl["scope"]}/${PackagePseudoUrl["pkg"]}@${PackagePseudoUrl["version"]}`;
}
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
export declare const parsePackageUrl: (url_href: string | URL) => PackagePseudoUrl;
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
export declare const resolveAsUrl: (path: string | URL, base?: string | URL | undefined) => URL;
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
export declare const trimStartSlashes: (str: string) => string;
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
export declare const trimEndSlashes: (str: string) => string;
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
export declare const trimSlashes: (str: string) => string;
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
export declare const ensureStartSlash: (str: string) => string;
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
export declare const ensureStartDotSlash: (str: string) => string;
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
export declare const ensureEndSlash: (str: string) => string;
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
export declare const trimStartDotSlashes: (str: string) => string;
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
export declare const trimEndDotSlashes: (str: string) => string;
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
export declare const trimDotSlashes: (str: string) => string;
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
export declare const joinSlash: (first_segment?: string, ...segments: string[]) => string;
/** config options for {@link normalizePosixPath} and {@link normalizePath} */
export interface NormalizePathConfig {
    /** specify whether or not to preserve the relative leading dotslash ("./") directory specifier?
     *
     * here is what you would get for each of the following input values, based on how you configure this setting:
     * - `input = "././//../a/./././b.txt"`
     *   - `true`: `".//a/./././b.txt"`
     *   - `false`: `"/a/./././b.txt"`
     * - `input = "./././././"`
     *   - `true`: `"./"`
     *   - `false`: `""`
     * - `input = "a/b.txt/././../././"`
     *   - `true`: `"a"`
     *   - `false`: `"a"`
     * - `input = "/./././/a/b.txt"`
     *   - `true`: `"//a/b.txt"`
     *   - `false`: `"//a/b.txt"`
     *
     * @defaultValue `true`
    */
    keepRelative?: boolean;
}
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
export declare const normalizePosixPath: (path: string, config?: NormalizePathConfig | number) => string;
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
export declare const normalizePath: (path: string, config?: NormalizePathConfig | number) => string;
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
export declare const pathToPosixPath: (path: string) => string;
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
export declare const pathsToCliArg: (separator: ";" | ":", paths: string[]) => string;
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
export declare const commonNormalizedPosixPath: (paths: string[]) => string;
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
export declare const commonPath: (paths: string[]) => string;
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
export declare const commonPathTransform: <T = string, PathInfo extends [common_dir: string, subpath: string] = [common_dir: string, subpath: string]>(paths: string[], map_fn: ((path_info: PathInfo, index: number, path_infos: Array<PathInfo>) => T)) => T[];
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
export declare const commonPathReplace: (paths: string[], new_common_dir: string) => string[];
/** the file path info data parsed by {@link parseFilepath}.
 *
 * example: if we have a file path `"D:/Hello\\World\\temp/.././dist for web/file.tar.gz"`, then the following will be its parsed components:
 * - `path = "D:/Hello/World/dist for web/file.tar.gz"` - the normalized full path.
 * - `dirpath = "D:/Hello/World/dist for web/"` - the normalized full path of the directory in which the file resides in. always has a trailing slash ("/").
 * - `dirname = "dist for web"` - the name of the directory in which the file exists, without any leading or trailing slashes ("/").
 * - `filename = "file.tar.gz"` - the name of the file, without any leading slashes ("/"), and cannot possibly have a trailing slash without being parsed as a directory instead of a file.
 * - `basename = "file.tar"` - the `filename`, but with the final extension portion removed.
 * - `extname = ".gz"` - the final extension portion of the `filename`.
*/
export interface FilepathInfo {
    path: string;
    dirpath: string;
    dirname: string;
    filename: string;
    basename: string;
    extname: string;
}
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
export declare const parseFilepathInfo: (file_path: string) => FilepathInfo;
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
export declare const fileUrlToLocalPath: (file_url: URL | string) => string | undefined;
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
export declare const ensureFileUrlIsLocalPath: (path: string | URL) => string;
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
export declare const relativePath: (from_path: string, to_path: string) => string;
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
export declare const joinPosixPaths: (...segments: string[]) => string;
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
export declare const joinPaths: (...segments: string[]) => string;
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
export declare const resolvePosixPathFactory: (absolute_current_dir: string | (() => string), absolute_segment_test_fn?: (segment: string) => boolean) => ((...segments: string[]) => string);
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
export declare const resolvePathFactory: (absolute_current_dir: string | (() => string), absolute_segment_test_fn?: (segment: string) => boolean) => ((...segments: string[]) => string);
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
export declare const globPatternToRegex: (glob_pattern: string) => RegExp;
export {};
//# sourceMappingURL=pathman.d.ts.map