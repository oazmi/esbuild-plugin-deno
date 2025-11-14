// src/_dnt.shims.ts
var dntGlobals = {};
var dntGlobalThis = createMergeProxy(globalThis, dntGlobals);
function createMergeProxy(baseObj, extObj) {
  return new Proxy(baseObj, {
    get(_target, prop, _receiver) {
      if (prop in extObj) {
        return extObj[prop];
      } else {
        return baseObj[prop];
      }
    },
    set(_target, prop, value) {
      if (prop in extObj) {
        delete extObj[prop];
      }
      baseObj[prop] = value;
      return true;
    },
    deleteProperty(_target, prop) {
      let success = false;
      if (prop in extObj) {
        delete extObj[prop];
        success = true;
      }
      if (prop in baseObj) {
        delete baseObj[prop];
        success = true;
      }
      return success;
    },
    ownKeys(_target) {
      const baseKeys = Reflect.ownKeys(baseObj);
      const extKeys = Reflect.ownKeys(extObj);
      const extKeysSet = new Set(extKeys);
      return [...baseKeys.filter((k) => !extKeysSet.has(k)), ...extKeys];
    },
    defineProperty(_target, prop, desc) {
      if (prop in extObj) {
        delete extObj[prop];
      }
      Reflect.defineProperty(baseObj, prop, desc);
      return true;
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (prop in extObj) {
        return Reflect.getOwnPropertyDescriptor(extObj, prop);
      } else {
        return Reflect.getOwnPropertyDescriptor(baseObj, prop);
      }
    },
    has(_target, prop) {
      return prop in extObj || prop in baseObj;
    }
  });
}

// src/deps/jsr.io/@oazmi/kitchensink/0.9.15/src/alias.ts
var array_constructor = Array;
var json_constructor = JSON;
var number_constructor = Number;
var object_constructor = Object;
var promise_constructor = Promise;
var symbol_constructor = Symbol;
var array_isEmpty = (array) => array.length === 0;
var array_isArray = /* @__PURE__ */ (() => array_constructor.isArray)();
var json_parse = /* @__PURE__ */ (() => json_constructor.parse)();
var json_stringify = /* @__PURE__ */ (() => json_constructor.stringify)();
var number_isFinite = /* @__PURE__ */ (() => number_constructor.isFinite)();
var number_parseInt = /* @__PURE__ */ (() => number_constructor.parseInt)();
var object_assign = /* @__PURE__ */ (() => object_constructor.assign)();
var object_entries = /* @__PURE__ */ (() => object_constructor.entries)();
var object_fromEntries = /* @__PURE__ */ (() => object_constructor.fromEntries)();
var object_getPrototypeOf = /* @__PURE__ */ (() => object_constructor.getPrototypeOf)();
var object_keys = /* @__PURE__ */ (() => object_constructor.keys)();
var promise_outside = () => {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return [promise, resolve, reject];
};
var promise_all = /* @__PURE__ */ promise_constructor.all.bind(promise_constructor);
var promise_resolve = /* @__PURE__ */ promise_constructor.resolve.bind(promise_constructor);
var symbol_iterator = /* @__PURE__ */ (() => symbol_constructor.iterator)();
var symbol_toStringTag = /* @__PURE__ */ (() => symbol_constructor.toStringTag)();
var dom_encodeURI = encodeURI;
var dom_decodeURI = decodeURI;

// src/deps/jsr.io/@oazmi/kitchensink/0.9.15/src/binder.ts
var bindMethodFactoryByName = (instance, method_name, ...args) => {
  return ((thisArg) => {
    return instance[method_name].bind(thisArg, ...args);
  });
};
var bindMethodToSelfByName = (self, method_name, ...args) => self[method_name].bind(self, ...args);
var prototypeOfClass = (cls) => {
  return cls.prototype;
};
var array_proto = /* @__PURE__ */ prototypeOfClass(Array);
var map_proto = /* @__PURE__ */ prototypeOfClass(Map);
var set_proto = /* @__PURE__ */ prototypeOfClass(Set);
var bind_array_pop = /* @__PURE__ */ bindMethodFactoryByName(array_proto, "pop");
var bind_array_push = /* @__PURE__ */ bindMethodFactoryByName(array_proto, "push");
var bind_set_add = /* @__PURE__ */ bindMethodFactoryByName(set_proto, "add");
var bind_set_delete = /* @__PURE__ */ bindMethodFactoryByName(set_proto, "delete");
var bind_set_has = /* @__PURE__ */ bindMethodFactoryByName(set_proto, "has");
var bind_map_delete = /* @__PURE__ */ bindMethodFactoryByName(map_proto, "delete");
var bind_map_entries = /* @__PURE__ */ bindMethodFactoryByName(map_proto, "entries");
var bind_map_forEach = /* @__PURE__ */ bindMethodFactoryByName(map_proto, "forEach");
var bind_map_get = /* @__PURE__ */ bindMethodFactoryByName(map_proto, "get");
var bind_map_has = /* @__PURE__ */ bindMethodFactoryByName(map_proto, "has");
var bind_map_keys = /* @__PURE__ */ bindMethodFactoryByName(map_proto, "keys");
var bind_map_set = /* @__PURE__ */ bindMethodFactoryByName(map_proto, "set");
var bind_map_values = /* @__PURE__ */ bindMethodFactoryByName(map_proto, "values");

// src/deps/jsr.io/@oazmi/kitchensink/0.9.15/src/struct.ts
var constructorOf = (class_instance) => {
  return object_getPrototypeOf(class_instance).constructor;
};
var isComplex = (obj) => {
  const obj_type = typeof obj;
  return obj_type === "object" || obj_type === "function";
};
var isObject = (obj) => {
  return typeof obj === "object";
};
var isArray = array_isArray;
var isString = (obj) => {
  return typeof obj === "string";
};

// src/deps/jsr.io/@oazmi/kitchensink/0.9.15/src/stringman.ts
var escapeLiteralCharsRegex = /[.*+?^${}()|[\]\\]/g;
var escapeLiteralStringForRegex = (str) => str.replaceAll(escapeLiteralCharsRegex, "\\$&");
var replacePrefix = (input, prefix, value = "") => {
  return input.startsWith(prefix) ? value + input.slice(prefix.length) : void 0;
};
var replaceSuffix = (input, suffix, value = "") => {
  return input.endsWith(suffix) ? (suffix === "" ? input : input.slice(0, -suffix.length)) + value : void 0;
};
var windows_new_line = "\r\n";
var jsoncRemoveComments = (jsonc_string) => {
  jsonc_string = " " + jsonc_string.replaceAll(windows_new_line, "\n") + " ";
  const jsonc_string_length = jsonc_string.length - 1, json_chars = [], json_chars_push = bind_array_push(json_chars), json_chars_pop = bind_array_pop(json_chars);
  let state = 0 /* NONE */;
  for (let i = 1; i < jsonc_string_length; i++) {
    const char = jsonc_string[i];
    switch (char) {
      case "/": {
        if (state === 0 /* NONE */) {
          const next_char = jsonc_string[i + 1];
          state = next_char === "/" ? 2 /* INLINE_COMMENT */ : next_char === "*" ? 3 /* MULTILINE_COMMENT */ : 0 /* NONE */;
          if (state !== 0 /* NONE */) {
            i++;
            continue;
          }
        }
        break;
      }
      case "*": {
        if (state === 3 /* MULTILINE_COMMENT */) {
          const next_char = jsonc_string[i + 1];
          state = next_char === "/" ? 0 /* NONE */ : state;
          if (state === 0 /* NONE */) {
            i++;
            continue;
          }
        }
        break;
      }
      case "\n": {
        state = state === 2 /* INLINE_COMMENT */ ? 0 /* NONE */ : state;
      }
      /* falls through */
      case "	":
      case "\v":
      case " ": {
        if (state === 0 /* NONE */) {
          continue;
        }
        break;
      }
      case '"': {
        state = state === 0 /* NONE */ ? 1 /* STRING */ : state === 1 /* STRING */ ? 0 /* NONE */ : state;
        break;
      }
      case "}":
      case "]": {
        if (state === 0 /* NONE */) {
          const prev_char = json_chars_pop();
          if (prev_char !== ",") {
            json_chars_push(prev_char);
          }
        }
        break;
      }
    }
    if (state === 0 /* NONE */ || state === 1 /* STRING */) {
      json_chars_push(
        char === "\\" ? char + jsonc_string[++i] : char
      );
    }
  }
  return json_chars.join("");
};

// src/deps/jsr.io/@oazmi/kitchensink/0.9.15/src/pathman.ts
var uriProtocolSchemeMap = /* @__PURE__ */ object_entries({
  "node:": "node",
  "npm:": "npm",
  "jsr:": "jsr",
  "blob:": "blob",
  "data:": "data",
  "http://": "http",
  "https://": "https",
  "file://": "file",
  "./": "relative",
  "../": "relative"
});
var forbiddenBaseUriSchemes = ["blob", "data", "relative"];
var packageUriSchemes = ["jsr", "npm", "node"];
var packageUriProtocols = ["jsr:", "npm:", "node:"];
var sep = "/";
var dotslash = "./";
var dotdotslash = "../";
var windows_directory_slash_regex = /\\/g;
var windows_absolute_path_regex = /^[a-z]\:[\/\\]/i;
var windows_leading_slash_correction_regex = /^[\/\\]([a-z])\:[\/\\]/i;
var leading_slashes_regex = /^\/+/;
var filename_regex = /\/?[^\/]+$/;
var basename_and_extname_regex = /^(?<basename>.+?)(?<ext>\.[^\.]+)?$/;
var package_regex = /^(?<protocol>jsr:|npm:|node:)(\/*(@(?<scope>[^\/\s]+)\/)?(?<pkg>[^@\/\s]+)(@(?<version>[^\/\r\n\t\f\v]+))?)?(?<pathname>\/.*)?$/;
var string_starts_with = (str, starts_with) => str.startsWith(starts_with);
var string_ends_with = (str, ends_with) => str.endsWith(ends_with);
var isAbsolutePath = (path) => {
  return string_starts_with(path, sep) || string_starts_with(path, "~") || windows_absolute_path_regex.test(path);
};
var getUriScheme = (path) => {
  if (!path || path === "") {
    return void 0;
  }
  for (const [protocol, scheme] of uriProtocolSchemeMap) {
    if (string_starts_with(path, protocol)) {
      return scheme;
    }
  }
  return isAbsolutePath(path) ? "local" : "relative";
};
var parsePackageUrl = (url_href) => {
  url_href = dom_decodeURI(isString(url_href) ? url_href : url_href.href);
  const { protocol, scope: scope_str, pkg, version: version_str, pathname: pathname_str } = package_regex.exec(url_href)?.groups ?? {};
  if (protocol === void 0 || pkg === void 0) {
    throw new Error(1 /* ERROR */ ? "invalid package url format was provided: " + url_href : "");
  }
  const scope = scope_str ? scope_str : void 0, version = version_str ? version_str : void 0, pathname = pathname_str ? pathname_str : sep, host = `${scope ? "@" + scope + sep : ""}${pkg}${version ? "@" + version : ""}`, href = dom_encodeURI(`${protocol}/${host}${pathname}`);
  return {
    protocol,
    scope,
    pkg,
    version,
    pathname,
    host,
    href
  };
};
var resolveAsUrl = (path, base) => {
  if (!isString(path)) {
    return path;
  }
  path = pathToPosixPath(path);
  let base_url = base;
  if (isString(base) && base !== "") {
    const base_scheme = getUriScheme(base);
    if (forbiddenBaseUriSchemes.includes(base_scheme)) {
      throw new Error(1 /* ERROR */ ? "the following base scheme (url-protocol) is not supported: " + base_scheme : "");
    }
    base_url = resolveAsUrl(base);
  }
  const path_scheme = getUriScheme(path), base_protocol = base_url ? base_url.protocol : void 0, path_is_package = packageUriSchemes.includes(path_scheme), base_is_package = packageUriProtocols.includes(base_protocol), path_is_root = string_starts_with(path, "/"), path_is_local = path_scheme === "local", path_is_relative = path_scheme === "relative";
  if (path_is_package) {
    return new URL(parsePackageUrl(path).href);
  }
  if (base_url && base_is_package && (path_is_root || path_is_relative)) {
    const { host, protocol, pathname } = parsePackageUrl(base_url);
    if (path_is_root) {
      return new URL(`${protocol}/${dom_encodeURI(host)}${dom_encodeURI(path)}`);
    }
    if (path_is_relative) {
      const full_pathname = new URL(path, "x:" + pathname).pathname;
      return new URL(`${protocol}/${dom_encodeURI(host)}${full_pathname}`);
    }
  }
  if (base_url && (path_is_root || path_is_relative)) {
    return new URL(path, base_url);
  }
  if (path_is_local) {
    return new URL("file://" + dom_encodeURI(path));
  }
  return new URL(path);
};
var trimStartSlashes = (str) => {
  return str.replace(leading_slashes_regex, "");
};
var ensureStartDotSlash = (str) => {
  return string_starts_with(str, dotslash) ? str : string_starts_with(str, sep) ? "." + str : dotslash + str;
};
var ensureEndSlash = (str) => {
  return string_ends_with(str, sep) ? str : str + sep;
};
var normalizePosixPath = (path, config = {}) => {
  const { keepRelative = true } = isObject(config) ? config : {}, segments = path.split(sep), last_segment = segments.at(-1), output_segments = [".."], prepend_relative_dotslash_to_output_segments = keepRelative && segments[0] === ".", ends_with_dir_navigator_without_a_trailing_slash = segments.length >= 2 && (last_segment === "." || last_segment === "..");
  if (ends_with_dir_navigator_without_a_trailing_slash) {
    segments.push("");
  }
  for (const segment of segments) {
    if (segment === "..") {
      if (output_segments.at(-1) !== "..") {
        output_segments.pop();
      } else {
        output_segments.push(segment);
      }
    } else if (segment !== ".") {
      output_segments.push(segment);
    }
  }
  output_segments.shift();
  if (prepend_relative_dotslash_to_output_segments && output_segments[0] !== "..") {
    output_segments.unshift(".");
  }
  return output_segments.join(sep);
};
var normalizePath = (path, config) => {
  return normalizePosixPath(pathToPosixPath(path), config);
};
var pathToPosixPath = (path) => path.replaceAll(windows_directory_slash_regex, sep);
var parseNormalizedPosixFilename = (file_path) => {
  return trimStartSlashes(filename_regex.exec(file_path)?.[0] ?? "");
};
var parseBasenameAndExtname_FromFilename = (filename) => {
  const { basename = "", ext = "" } = basename_and_extname_regex.exec(filename)?.groups ?? {};
  return [basename, ext];
};
var parseFilepathInfo = (file_path) => {
  const path = normalizePath(file_path), filename = parseNormalizedPosixFilename(path), filename_length = filename.length, dirpath = filename_length > 0 ? path.slice(0, -filename_length) : path, dirname = parseNormalizedPosixFilename(dirpath.slice(0, -1)), [basename, extname] = parseBasenameAndExtname_FromFilename(filename);
  return { path, dirpath, dirname, filename, basename, extname };
};
var fileUrlToLocalPath = (file_url) => {
  if (isString(file_url)) {
    if (getUriScheme(file_url) !== "file") {
      return;
    }
    file_url = new URL(file_url);
  }
  if (!string_starts_with(file_url.protocol, "file:")) {
    return;
  }
  const local_path_with_leading_slash = pathToPosixPath(dom_decodeURI(file_url.pathname)), corrected_local_path = local_path_with_leading_slash.replace(windows_leading_slash_correction_regex, "$1:/");
  return corrected_local_path;
};
var ensureFileUrlIsLocalPath = (path) => {
  const path_is_string = isString(path), file_uri_to_local_path_conversion = fileUrlToLocalPath(path);
  return file_uri_to_local_path_conversion ?? (path_is_string ? pathToPosixPath(path) : path.href);
};
var joinPosixPaths_reduce_fn = (concatenatible_full_path, segment) => {
  const prev_segment = concatenatible_full_path.pop(), prev_segment_is_dir = string_ends_with(prev_segment, sep), prev_segment_as_dir = prev_segment_is_dir ? prev_segment : prev_segment + sep;
  if (!prev_segment_is_dir) {
    const segment_is_rel_to_dir = string_starts_with(segment, dotslash), segment_is_rel_to_parent_dir = string_starts_with(segment, dotdotslash);
    if (segment_is_rel_to_dir) {
      segment = "." + segment;
    } else if (segment_is_rel_to_parent_dir) {
      segment = dotdotslash + segment;
    }
  }
  concatenatible_full_path.push(prev_segment_as_dir, segment);
  return concatenatible_full_path;
};
var joinPosixPaths = (...segments) => {
  segments = segments.map((segment) => {
    return segment === "." ? dotslash : segment === ".." ? dotdotslash : segment;
  });
  const concatenatible_segments = segments.reduce(joinPosixPaths_reduce_fn, [sep]);
  concatenatible_segments.shift();
  return normalizePosixPath(concatenatible_segments.join(""));
};
var joinPaths = (...segments) => {
  return joinPosixPaths(...segments.map(pathToPosixPath));
};
var resolvePosixPathFactory = (absolute_current_dir, absolute_segment_test_fn = isAbsolutePath) => {
  const getCwdPath = isString(absolute_current_dir) ? (() => absolute_current_dir) : absolute_current_dir;
  return (...segments) => {
    const last_abs_segment_idx = segments.findLastIndex(absolute_segment_test_fn);
    if (last_abs_segment_idx >= 0) {
      segments = segments.slice(last_abs_segment_idx);
    } else {
      segments.unshift(ensureEndSlash(getCwdPath()));
    }
    return joinPosixPaths(...segments);
  };
};
var resolvePathFactory = (absolute_current_dir, absolute_segment_test_fn = isAbsolutePath) => {
  if (isString(absolute_current_dir)) {
    absolute_current_dir = pathToPosixPath(absolute_current_dir);
  }
  const getCwdPath = isString(absolute_current_dir) ? (() => absolute_current_dir) : (() => pathToPosixPath(absolute_current_dir())), posix_path_resolver = resolvePosixPathFactory(getCwdPath, absolute_segment_test_fn);
  return (...segments) => posix_path_resolver(...segments.map(pathToPosixPath));
};

// src/deps/jsr.io/@oazmi/kitchensink/0.9.15/src/crossenv.ts
var global_this_object = dntGlobalThis;
var currentRuntimeValidationFnMap = {
  [0 /* DENO */]: () => global_this_object.Deno?.version ? true : false,
  [1 /* BUN */]: () => global_this_object.Bun?.version ? true : false,
  [2 /* NODE */]: () => global_this_object.process?.versions ? true : false,
  [3 /* CHROMIUM */]: () => global_this_object.chrome?.runtime ? true : false,
  [4 /* EXTENSION */]: () => global_this_object.browser?.runtime ? true : false,
  [5 /* WEB */]: () => global_this_object.window?.document ? true : false,
  [6 /* WORKER */]: () => isObject(global_this_object.self) && isComplex(global_this_object.WorkerGlobalScope) && global_this_object.self instanceof global_this_object.WorkerGlobalScope ? true : false
};
var ordered_runtime_checklist = [
  0 /* DENO */,
  1 /* BUN */,
  2 /* NODE */,
  3 /* CHROMIUM */,
  4 /* EXTENSION */,
  5 /* WEB */,
  6 /* WORKER */
];
var identifyCurrentRuntime = () => {
  for (const runtime of ordered_runtime_checklist) {
    if (currentRuntimeValidationFnMap[runtime]()) {
      return runtime;
    }
  }
  throw new Error(1 /* ERROR */ ? `failed to detect current javascript runtime!
please report this issue to "https://github.com/omar-azmi/kitchensink_ts/issues", along with information on your runtime environment.` : "");
};
var getRuntime = (runtime_enum) => {
  switch (runtime_enum) {
    case 0 /* DENO */:
      return global_this_object.Deno;
    case 1 /* BUN */:
      return global_this_object.Bun;
    case 2 /* NODE */:
      return global_this_object.process;
    case 3 /* CHROMIUM */:
      return global_this_object.chrome;
    case 4 /* EXTENSION */:
      return global_this_object.browser;
    case 5 /* WEB */:
      return global_this_object.window;
    case 6 /* WORKER */:
      return global_this_object.self;
    default:
      throw new Error(1 /* ERROR */ ? `an invalid runtime enum was provided: "${runtime_enum}".` : "");
  }
};
var getRuntimeCwd = (runtime_enum, current_path = true) => {
  const runtime = getRuntime(runtime_enum);
  if (!runtime) {
    throw new Error(1 /* ERROR */ ? `the requested runtime associated with the enum "${runtime_enum}" is undefined (i.e. you're running on a different runtime from the provided enum).` : "");
  }
  switch (runtime_enum) {
    case 0 /* DENO */:
    case 1 /* BUN */:
    case 2 /* NODE */:
      return pathToPosixPath(runtime.cwd());
    case 3 /* CHROMIUM */:
    case 4 /* EXTENSION */:
      return runtime.runtime.getURL("");
    case 5 /* WEB */:
    case 6 /* WORKER */:
      return new URL("./", current_path ? runtime.location.href : runtime.location.origin).href;
  }
};
var defaultExecShellCommandConfig = {
  args: []
};
var execShellCommand = async (runtime_enum, command, config = {}) => {
  const { args, cwd, signal } = { ...defaultExecShellCommandConfig, ...config }, args_are_empty = array_isEmpty(args), runtime = getRuntime(runtime_enum);
  if (!runtime) {
    throw new Error(1 /* ERROR */ ? `the requested runtime associated with the enum "${runtime_enum}" is undefined (i.e. you're running on a different runtime from the provided enum).` : "");
  }
  if (!command && args_are_empty) {
    return { stdout: "", stderr: "" };
  }
  switch (runtime_enum) {
    case 0 /* DENO */:
    case 1 /* BUN */:
    case 2 /* NODE */: {
      const { exec } = await get_node_child_process(), full_command = args_are_empty ? command : `${command} ${args.join(" ")}`, [promise, resolve, reject] = promise_outside();
      exec(full_command, { cwd: cwd ? ensureFileUrlIsLocalPath(cwd) : void 0, signal }, (error, stdout, stderr) => {
        if (error) {
          reject(error.message);
        }
        resolve({ stdout, stderr });
      });
      return promise;
    }
    default:
      throw new Error(1 /* ERROR */ ? `your non-system runtime environment enum ("${runtime_enum}") does not support shell commands` : "");
  }
};
var node_child_process;
var import_node_child_process = async () => {
  return import("node:child_process");
};
var get_node_child_process = async () => {
  return node_child_process ??= await import_node_child_process();
};
var fs_entry_info_fields = ["size", "mtime", "atime", "birthtime", "ctime", "dev", "mode"];
var fs_entry_info_all_fields = ["isFile", "isDirectory", "isSymlink", ...fs_entry_info_fields];

// src/deps/jsr.io/@oazmi/kitchensink/0.9.15/src/collections.ts
var invertMap = (forward_map) => {
  const reverse_map_keys = [];
  forward_map.forEach((rset) => {
    reverse_map_keys.push(...rset);
  });
  const reverse_map = new Map(
    [...new Set(reverse_map_keys)].map(
      (rkey) => [rkey, /* @__PURE__ */ new Set()]
    )
  ), get_reverse_map = bind_map_get(reverse_map);
  for (const [fkey, rset] of forward_map) {
    rset.forEach(
      (rkey) => get_reverse_map(rkey).add(fkey)
    );
  }
  return reverse_map;
};
var InvertibleMap = class {
  /** create an empty invertible map. <br>
   * optionally provide an initial `forward_map` to populate the forward mapping, and then automatically deriving the reverse mapping from it. <br>
   * or provide an initial `reverse_map` to populate the reverse mapping, and then automatically deriving the froward mapping from it. <br>
   * if both `forward_map` and `reverse_map` are provided, then it will be up to YOU to make sure that they are actual inverses of each other. <br>
   * @param forward_map initiallize by populating with an optional initial forward map (the reverse map will be automatically computed if `reverse_map === undefined`)
   * @param reverse_map initiallize by populating with an optional initial reverse map (the forward map will be automatically computed if `forward_map === undefined`)
   */
  constructor(forward_map, reverse_map) {
    const fmap = forward_map ?? (reverse_map ? invertMap(reverse_map) : /* @__PURE__ */ new Map()), rmap = reverse_map ?? (forward_map ? invertMap(forward_map) : /* @__PURE__ */ new Map()), fmap_set = bind_map_set(fmap), rmap_set = bind_map_set(rmap), fmap_delete = bind_map_delete(fmap), rmap_delete = bind_map_delete(rmap), size = fmap.size, rsize = rmap.size, forEach = bind_map_forEach(fmap), rforEach = bind_map_forEach(rmap), get = bind_map_get(fmap), rget = bind_map_get(rmap), has = bind_map_has(fmap), rhas = bind_map_has(rmap), entries = bind_map_entries(fmap), rentries = bind_map_entries(rmap), keys = bind_map_keys(fmap), rkeys = bind_map_keys(rmap), values = bind_map_values(fmap), rvalues = bind_map_values(rmap);
    const add = (key, ...items) => {
      const forward_items = get(key) ?? (fmap_set(key, /* @__PURE__ */ new Set()) && get(key)), forward_items_has = bind_set_has(forward_items), forward_items_add = bind_set_add(forward_items);
      for (const item of items) {
        if (!forward_items_has(item)) {
          forward_items_add(item);
          if (!rget(item)?.add(key)) {
            rmap_set(item, /* @__PURE__ */ new Set([key]));
          }
        }
      }
    };
    const radd = (key, ...items) => {
      const reverse_items = rget(key) ?? (rmap_set(key, /* @__PURE__ */ new Set()) && rget(key)), reverse_items_has = bind_set_has(reverse_items), reverse_items_add = bind_set_add(reverse_items);
      for (const item of items) {
        if (!reverse_items_has(item)) {
          reverse_items_add(item);
          if (!get(item)?.add(key)) {
            fmap_set(item, /* @__PURE__ */ new Set([key]));
          }
        }
      }
    };
    const clear = () => {
      fmap.clear();
      rmap.clear();
    };
    const fdelete = (key, keep_key = false) => {
      const forward_items = get(key);
      if (forward_items) {
        for (const item of forward_items) {
          rget(item).delete(key);
        }
        if (keep_key) {
          forward_items.clear();
        } else {
          keep_key = fmap_delete(key);
        }
      }
      return keep_key;
    };
    const rdelete = (key, keep_key = false) => {
      const reverse_items = rget(key);
      if (reverse_items) {
        for (const item of reverse_items) {
          get(item).delete(key);
        }
        if (keep_key) {
          reverse_items.clear();
        } else {
          keep_key = rmap_delete(key);
        }
      }
      return keep_key;
    };
    const remove = (key, ...items) => {
      const forward_items = get(key);
      if (forward_items) {
        const forward_items_delete = bind_set_delete(forward_items);
        for (const item of items) {
          if (forward_items_delete(item)) {
            rget(item).delete(key);
          }
        }
      }
    };
    const rremove = (key, ...items) => {
      const reverse_items = rget(key);
      if (reverse_items) {
        const reverse_items_delete = bind_set_delete(reverse_items);
        for (const item of items) {
          if (reverse_items_delete(item)) {
            get(item).delete(key);
          }
        }
      }
    };
    const set = (key, value) => {
      fdelete(key, true);
      add(key, ...value);
      return this;
    };
    const rset = (key, value) => {
      rdelete(key, true);
      radd(key, ...value);
      return this;
    };
    object_assign(this, {
      fmap,
      rmap,
      size,
      rsize,
      forEach,
      rforEach,
      get,
      rget,
      has,
      rhas,
      entries,
      rentries,
      keys,
      rkeys,
      values,
      rvalues,
      add,
      radd,
      clear,
      delete: fdelete,
      rdelete,
      remove,
      rremove,
      set,
      rset,
      [symbol_iterator]: entries,
      [symbol_toStringTag]: "InvertibleMap"
    });
  }
};
var HybridWeakMap = class {
  wmap = /* @__PURE__ */ new WeakMap();
  smap = /* @__PURE__ */ new Map();
  pick(key) {
    return isComplex(key) ? this.wmap : this.smap;
  }
  get(key) {
    return this.pick(key).get(key);
  }
  set(key, value) {
    this.pick(key).set(key, value);
    return this;
  }
  has(key) {
    return this.pick(key).has(key);
  }
  delete(key) {
    return this.pick(key).delete(key);
  }
};
var TREE_VALUE_UNSET = /* @__PURE__ */ Symbol(1 /* MINIFY */ || "represents an unset value for a tree");

// src/deps/jsr.io/@oazmi/kitchensink/0.9.15/src/lambda.ts
var THROTTLE_REJECT = /* @__PURE__ */ Symbol(1 /* MINIFY */ || "a rejection by a throttled function");
var TIMEOUT = /* @__PURE__ */ Symbol(1 /* MINIFY */ || "a timeout by an awaited promiseTimeout function");
var memorizeCore = (fn, weak_ref = false) => {
  const memory = weak_ref ? new HybridWeakMap() : /* @__PURE__ */ new Map(), get = bindMethodToSelfByName(memory, "get"), set = bindMethodToSelfByName(memory, "set"), has = bindMethodToSelfByName(memory, "has"), memorized_fn = (arg) => {
    const arg_exists = has(arg), value = arg_exists ? get(arg) : fn(arg);
    if (!arg_exists) {
      set(arg, value);
    }
    return value;
  };
  return { fn: memorized_fn, memory };
};
var memorize = (fn) => {
  return memorizeCore(fn).fn;
};

// src/deps/jsr.io/@oazmi/kitchensink/0.9.15/src/semver.ts
var digits_regex_str = "x|0|[1-9]\\d*";
var semver_core_regex_str = `(?<major>${digits_regex_str})\\.(?<minor>${digits_regex_str})\\.(?<patch>${digits_regex_str})`;
var semver_prerelease_str = `(?<prerelease>[^\\+\\s]*)`;
var semver_build_str = `(?<build>[^\\s]*)`;
var semver_regex = new RegExp(`${semver_core_regex_str}(?:\\-${semver_prerelease_str})?(?:\\+${semver_build_str})?`);
var semver_unclean_prefix = /^\=*v*\s*/i;
var semver_wildcard_regex = /^[xX\\*]$/;
var semver_prerelease_or_build_sep = /\-|\+/;
var digits_regex = new RegExp(`^${digits_regex_str}$`);
var semver_operator_regex_str = "<=|>=|!=|<|>|=|\\^|\\~";
var semver_operator_regex = new RegExp(`^(?<operator>${semver_operator_regex_str})?\\s*(?<semver>.*)$`);
var number_compare = (n1, n2) => {
  return n1 > n2 ? 1 : n1 === n2 ? 0 : -1;
};
var clean_parse = (version) => {
  const match = semver_regex.exec(version);
  if (!match) {
    return void 0;
  }
  const { major = "0", minor = "0", patch = "0", prerelease = "", build = "" } = match.groups, major_num = number_parseInt(major), minor_num = number_parseInt(minor), patch_num = number_parseInt(patch);
  return number_isFinite(major_num) && number_isFinite(minor_num) && number_isFinite(patch_num) ? {
    major: major_num,
    minor: minor_num,
    patch: patch_num,
    prerelease,
    build
  } : void 0;
};
var clean = (version) => version.trim().replace(semver_unclean_prefix, "");
var parse = (version) => {
  return clean_parse(clean(version));
};
var stringify = (version) => {
  const { major = "x", minor = "x", patch = "x", build = "", prerelease = "" } = version;
  return `${major}.${minor}.${patch}` + (prerelease ? "-" + prerelease : "") + (build ? "+" + build : "");
};
var compare = (v1, v2) => {
  v1 = isString(v1) ? parse(v1) : v1;
  v2 = isString(v2) ? parse(v2) : v2;
  const { major: v1_major, minor: v1_minor, patch: v1_patch } = v1, { major: v2_major, minor: v2_minor, patch: v2_patch } = v2;
  if (v1_major !== v2_major) {
    return number_compare(v1_major, v2_major);
  }
  if (v1_minor !== v2_minor) {
    return number_compare(v1_minor, v2_minor);
  }
  return number_compare(v1_patch, v2_patch);
};
var sort = (versions) => {
  const semvers = versions.map((v) => isString(v) ? parse(v) : v);
  return semvers.toSorted(compare);
};
var normalize = (version) => {
  const wildcard_char = "x", release_and_build_info_idx = version.search(semver_prerelease_or_build_sep), release_and_build_info_sep = release_and_build_info_idx >= 0 ? version[release_and_build_info_idx] : "-", [core_version = "", release_and_build_info = ""] = version.split(release_and_build_info_sep, 2), segments = core_version.split(".").toReversed(), normalized_segments = [];
  let segment_is_illegible = array_isEmpty(segments);
  for (let i = 0; i < 3; i++) {
    const segment = segments.pop() || wildcard_char, segment_normalized = semver_wildcard_regex.test(segment) ? wildcard_char : segment;
    segment_is_illegible ||= !digits_regex.test(segment_normalized);
    normalized_segments.push(segment_is_illegible ? wildcard_char : segment_normalized);
  }
  return normalized_segments.join(".") + (release_and_build_info ? release_and_build_info_sep + release_and_build_info : "");
};
var parseOperator = (comp) => {
  const match = semver_operator_regex.exec(comp), wildcard_char = "x";
  if (!match) {
    throw new Error(`[semver]: invalid comparator: "${comp}"`);
  }
  const { operator: _operator = "", semver: _semver = "" } = match.groups, operator = _operator || "=", semver_match = semver_regex.exec(normalize(clean(_semver)));
  if (!semver_match) {
    throw new Error(`[semver]: error parsing semver: "${_semver}"`);
  }
  const { major = wildcard_char, minor = wildcard_char, patch = wildcard_char, prerelease = "", build = "" } = semver_match.groups, major_num = major === wildcard_char ? void 0 : number_parseInt(major), minor_num = minor === wildcard_char ? void 0 : number_parseInt(minor), patch_num = patch === wildcard_char ? void 0 : number_parseInt(patch);
  return {
    operator,
    major: major_num,
    minor: minor_num,
    patch: patch_num,
    prerelease,
    build
  };
};
var _1_OrLexer = {
  tokenExp: "[OR]",
  parseExp: /\s*\|\|\s*/g,
  lexer(substr) {
    return substr.split(this.tokenExp);
  }
};
var _2_HyphenLexer = {
  tokenExp: "[HYPHEN]",
  parseExp: /\s+\-\s+/g,
  lexer(substr) {
    const hyphen_match = substr.match(hyphen_range_regex);
    if (!hyphen_match) {
      return void 0;
    }
    const low_ver = clean(hyphen_match[1]), high_ver = clean(hyphen_match[2]);
    return [low_ver, high_ver];
  }
};
var hyphen_range_regex = new RegExp(`^(.+?)${escapeLiteralStringForRegex(_2_HyphenLexer.tokenExp)}(.+?)$`);
var _3_AndLexer = {
  tokenExp: "[AND]",
  parseExp: /\s+/g,
  lexer(substr) {
    return substr.split(this.tokenExp);
  }
};
var all_operators = ["=", "!=", ">=", "<=", ">", "<", "~", "^"];
var all_impossible_major_xrange_operators = [">", "<", "!="];
var clean_range = (range) => {
  for (const op of all_operators) {
    range = range.replaceAll(new RegExp(`${escapeLiteralStringForRegex(op)}\\s*`, "g"), op);
  }
  return range;
};
var desugar_operator = (operator_expression) => {
  if (isString(operator_expression)) {
    const hyphen_match = _2_HyphenLexer.lexer(operator_expression);
    if (hyphen_match) {
      const [lower, upper] = hyphen_match;
      return [...desugar_operator(`>=${lower}`), ...desugar_operator(`<=${upper}`)];
    }
    operator_expression = parseOperator(operator_expression);
  }
  const { operator = "=", major, minor, patch, prerelease, build } = operator_expression;
  if (major === void 0) {
    return all_impossible_major_xrange_operators.includes(operator) ? [{ operator: "=", major: -1, minor: -1, patch: -1 }] : [{ operator: ">=", major: 0, minor: 0, patch: 0 }];
  }
  if (minor === void 0) {
    switch (operator) {
      case "!=":
        return [
          { operator: "<", major, minor: 0, patch: 0 },
          { operator: ">=", major: major + 1, minor: 0, patch: 0 }
        ];
      case "<":
        return [{ operator: "<", major, minor: 0, patch: 0 }];
      case "<=":
        return [{ operator: "<", major: major + 1, minor: 0, patch: 0 }];
      case ">":
        return [{ operator: ">=", major: major + 1, minor: 0, patch: 0 }];
      case ">=":
        return [{ operator: ">=", major, minor: 0, patch: 0 }];
      default:
        return desugar_operator({ operator: "^", major, minor: 0, patch: 0 });
    }
  }
  if (patch === void 0) {
    switch (operator) {
      case "!=":
        return [
          { operator: "<", major, minor, patch: 0 },
          { operator: ">=", major, minor: minor + 1, patch: 0 }
        ];
      case "<":
        return [{ operator: "<", major, minor, patch: 0 }];
      case "<=":
        return [{ operator: "<", major, minor: minor + 1, patch: 0 }];
      case ">":
        return [{ operator: ">=", major, minor: minor + 1, patch: 0 }];
      case ">=":
        return [{ operator: ">=", major, minor, patch: 0 }];
      case "^":
        if (major > 0 || minor > 0) {
          return desugar_operator({ operator: "^", major, minor, patch: 0 });
        }
      /* falls through */
      default:
        return desugar_operator({ operator: "~", major, minor, patch: 0 });
    }
  }
  switch (operator) {
    // a caret allows increments that do not change the first non-zero core-version number.
    case "^": {
      let lower, upper;
      if (major > 0) {
        lower = { operator: ">=", major, minor, patch, prerelease, build };
        upper = { operator: "<", major: major + 1, minor: 0, patch: 0 };
      } else if (minor > 0) {
        lower = { operator: ">=", major: 0, minor, patch, prerelease, build };
        upper = { operator: "<", major: 0, minor: minor + 1, patch: 0 };
      } else {
        lower = { operator: "=", major: 0, minor: 0, patch, prerelease, build };
        upper = lower;
      }
      return [lower, upper];
    }
    case "~": {
      const lower = { operator: ">=", major, minor, patch, prerelease, build }, upper = { operator: "<", major, minor: minor + 1, patch: 0 };
      return [lower, upper];
    }
    default: {
      return [{ operator, major, minor, patch, prerelease, build }];
    }
  }
};
var parseRange = (range) => {
  const tokenized_range = clean_range(range).replaceAll(_1_OrLexer.parseExp, _1_OrLexer.tokenExp).replaceAll(_2_HyphenLexer.parseExp, _2_HyphenLexer.tokenExp).replaceAll(_3_AndLexer.parseExp, _3_AndLexer.tokenExp);
  const or_comparisons = [];
  for (const part of _1_OrLexer.lexer(tokenized_range)) {
    const and_comparators = [];
    or_comparisons.push(and_comparators);
    const and_parts = _3_AndLexer.lexer(part).map(desugar_operator).flat(1);
    and_comparators.push(...and_parts);
  }
  return or_comparisons;
};
var comparison_result_satisfies_operator = [
  ["=", "<=", ">="],
  // accepted operators when `compare(version, range_segment) === 0`
  ["!=", ">", ">="],
  // accepted operators when `compare(version, range_segment) === 1`
  ["!=", "<", "<="]
  // accepted operators when `compare(version, range_segment) === -1`
];
var isSatisfying = (version, range) => {
  version = isString(version) ? parse(version) : version;
  range = isString(range) ? parseRange(range) : range;
  for (const and_parts of range) {
    let does_satisfy_OR_segment = true;
    for (const comp of and_parts) {
      const operator = comp.operator, comparison_result = compare(version, comp), does_satisfy_AND_segment = comparison_result_satisfies_operator.at(comparison_result).includes(operator);
      if (does_satisfy_AND_segment === false || comp.major < 0) {
        does_satisfy_OR_segment = false;
        break;
      }
    }
    if (does_satisfy_OR_segment) {
      return true;
    }
  }
  return false;
};
var maxSatisfying = (versions, range) => {
  range = isString(range) ? parseRange(range) : range;
  const sorted_versions = sort(versions).toReversed();
  for (const version of sorted_versions) {
    if (isSatisfying(version, range)) {
      return stringify(version);
    }
  }
  return;
};

// src/deps.ts
var isAbsolutePath2 = (segment) => {
  const scheme = getUriScheme(segment) ?? "relative";
  return scheme !== "relative";
};
var isCertainlyRelativePath = (segment) => {
  return segment.startsWith("./") || segment.startsWith("../");
};
var resolveResourcePathFactory = (absolute_current_dir, absolute_segment_test_fn = isAbsolutePath2) => {
  const path_resolver = resolvePathFactory(absolute_current_dir, absolute_segment_test_fn);
  return (path, importer) => {
    if (!path) {
      return path_resolver();
    }
    if (path.startsWith("/") && importer) {
      return ensureFileUrlIsLocalPath(resolveAsUrl(path, importer));
    }
    if (isAbsolutePath2(path)) {
      return pathToPosixPath(path);
    }
    const relative_path = ensureStartDotSlash(path);
    if (importer) {
      return path_resolver(importer, relative_path);
    }
    return path_resolver(relative_path);
  };
};
var defaultFetchConfig = { redirect: "follow", cache: "force-cache" };
var defaultGetCwd = /* @__PURE__ */ ensureEndSlash(pathToPosixPath(getRuntimeCwd(identifyCurrentRuntime(), true)));
var defaultResolvePath = /* @__PURE__ */ resolveResourcePathFactory(defaultGetCwd, isAbsolutePath2);
var noop2 = (() => void 0);
var fetchScan = async (urls, init) => {
  for (const url of urls) {
    const response = await fetch(url, { ...defaultFetchConfig, ...init }).catch(noop2);
    if (response?.ok) {
      return response;
    }
    await response?.body?.cancel();
  }
};
var fetchScanUrls = async (urls, init) => {
  const valid_response = await fetchScan(urls, init);
  if (valid_response) {
    const url = valid_response.url;
    valid_response.body?.cancel();
    return url;
  }
};

// src/importmap/mod.ts
var resolvePathFromImportMap = (path_alias, import_map) => {
  path_alias = normalizePath(path_alias);
  const exact_match = import_map[path_alias];
  if (exact_match) {
    return exact_match;
  }
  const sorted_import_map_keys = object_keys(import_map).filter((key) => key.endsWith("/")).toSorted((a, b) => b.length - a.length);
  for (const key of sorted_import_map_keys) {
    if (path_alias.startsWith(key)) {
      const value = import_map[key];
      if (!value.endsWith("/")) {
        throw new Error(`the value ("${value}") of the matched import-map key ("${key}") for the path alias "${path_alias}" MUST end with a trailing slash ("/") to be specification compliant.`);
      }
      return path_alias.replace(key, value);
    }
  }
  return void 0;
};
var compareImportMapEntriesByLength = ([alias_a, path_a], [alias_b, path_b]) => {
  return alias_b.length - alias_a.length;
};
var defaultResolvePathFromImportMapEntriesConfig = {
  baseAliasDir: "",
  basePathDir: "",
  sort: true,
  errorCheck: true
};
var resolvePathFromImportMapEntries = (path_alias, import_map_entries, config) => {
  let { baseAliasDir, basePathDir, errorCheck, sort: sort2 } = { ...defaultResolvePathFromImportMapEntriesConfig, ...config };
  baseAliasDir = replaceSuffix(baseAliasDir, "/") ?? baseAliasDir;
  basePathDir = replaceSuffix(basePathDir, "/") ?? basePathDir;
  const unprefixed_path_alias = replacePrefix(normalizePath(path_alias), baseAliasDir), relative_path_alias = unprefixed_path_alias === "" || baseAliasDir !== "" && unprefixed_path_alias?.startsWith("/") ? "." + unprefixed_path_alias : unprefixed_path_alias;
  if (relative_path_alias === void 0) {
    return resolvePathFromImportMapEntries(path_alias, import_map_entries, { baseAliasDir: "", basePathDir, errorCheck, sort: sort2 });
  }
  if (sort2) {
    import_map_entries = import_map_entries.toSorted(compareImportMapEntriesByLength);
  }
  for (const [alias, path] of import_map_entries) {
    const residual_subpath = replacePrefix(relative_path_alias, alias);
    if (residual_subpath !== void 0) {
      if (errorCheck && alias.endsWith("/") && !path.endsWith("/")) {
        throw new Error(`the value ("${path}") of the matched import-map key ("${alias}") for the path alias "${path_alias}" MUST end with a trailing slash ("/") to be specification compliant.`);
      }
      const base_path = basePathDir === "" || isAbsolutePath2(path) ? path : joinPaths(ensureEndSlash(basePathDir), path);
      if (residual_subpath === "") {
        return base_path;
      }
      if (alias.endsWith("/")) {
        return joinPaths(base_path, ensureStartDotSlash(residual_subpath));
      }
    }
  }
};

// src/packageman/base.ts
var cachedRuntimePackage = /* @__PURE__ */ new Map();
var RuntimePackage = class {
  /** the path or url of the package json(c) file.
   * 
   * the {@link RuntimePackage | base class} does nothing with this information;
   * it is just there so that subclasses can make uses of this information (usually for resolving relative paths).
  */
  packagePath;
  /** the fetched/parsed package metadata file's raw contents. */
  packageInfo;
  /** @param package_object the parsed package metadata as an object.
   *   - in the case of node, this would be your json-parsed "package.json" file.
   *   - in the case of deno, this would be your json-parsed "deno.json" file.
  */
  constructor(package_object, package_path) {
    this.packageInfo = package_object;
    this.packagePath = package_path;
  }
  /** get the path/url to the package's json(c) file.
   * 
   * the {@link RuntimePackage | base class} does nothing with this information;
   * it is just there so that subclasses can make uses of this information (usually for resolving relative paths).
  */
  getPath() {
    return this.packagePath;
  }
  /** this method tries to resolve the provided export `path_alias` of this package,
   * to an absolutely referenced path to the resource (using the internal {@link exportMapSortedEntries}).
   * if no exported resources match the given `path_alias`, then `undefined` will be returned.
   * 
   * > [!tip]
   * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
  */
  resolveExport(path_alias, config) {
    if (config?.workspaceExportsVisited?.has(this.getPath())) {
      return;
    }
    return resolvePathFromImportMapEntries(path_alias, this.exportMapSortedEntries, { sort: false, ...config });
  }
  /** this method tries to resolve the provided import `path_alias` done by some resource within this package,
   * using the internal {@link importMapSortedEntries} list of import-aliases that this package uses.
   * if no import resources match the given `path_alias`, then `undefined` will be returned
   * (which would probably mean that the given `path_alias` is already either an absolute or relative path, or perhaps incorrect altogether.
   * 
   * > [!tip]
   * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
  */
  resolveImport(path_alias, config) {
    if (config?.workspaceImportsVisited?.has(this.getPath())) {
      return;
    }
    return resolvePathFromImportMapEntries(path_alias, this.importMapSortedEntries, { sort: false, ...config });
  }
  /** create an instance of this class by loading a package's json(c) file from a url or local file-system path.
   * 
   * > [!important]
   * > the resulting new instance is cached (memorized), so that it can be reused if another query with the same normalized path is provided.
   * > 
   * > _why are we forcing a cache mechanism on the base class?_
   * > 
   * > because the workspace children/parents, in the {@link WorkspacePackage} subclass, are referenced by their absolute path,
   * > and resolving an import through a workspace package would involve the creation of that child/parent runtime package via this method,
   * > thus leading to an exponential number of redundant re-creation of identical package manager objects.
   * 
   * > [!tip]
   * > the constructor uses a "JSONC" parser (from [@oazmi/kitchensink/stringman](https://jsr.io/@oazmi/kitchensink/0.9.10/src/stringman.ts)) for the fetched files.
   * > therefore, you may provide links to ".jsonc" files, instead of parsing them yourself before calling the super constructor.
  */
  static async fromUrl(package_jsonc_path) {
    package_jsonc_path = resolveAsUrl(package_jsonc_path, defaultResolvePath());
    const package_jsonc_path_str = package_jsonc_path.href, cached_result = cachedRuntimePackage.get(package_jsonc_path_str);
    if (cached_result) {
      return cached_result;
    }
    const [promise, resolve, reject] = promise_outside();
    cachedRuntimePackage.set(package_jsonc_path_str, promise);
    const package_object = json_parse(jsoncRemoveComments(await (await fetch(package_jsonc_path, defaultFetchConfig)).text())), new_instance = new this(package_object, package_jsonc_path_str);
    resolve(new_instance);
    return new_instance;
  }
};
var WorkspacePackage = class extends RuntimePackage {
  /** specify all child workspaces of this package.
   * 
   * - the exports of every child-workspace package are inherited by _this_ runtime package.
   *   > example: if `packageB` is child-workspace of `packageA`, then `packageA.exports` would be a superset of `packageB.exports`.
   * - similarly, the imports of _this_ runtime package will be implicitly available for all child-workspace packages.
   *   > example: if `packageB` is child-workspace of `packageA`, then `packageA.imports` would be a subset of `packageB.imports`.
   *   
   *   > [!note]
   *   > since child-workspaces are also considered to be dependencies of the parent package (the monorepo),
   *   > each child-workspace would be available to for importation by all child-workspaces.
   *   > in other words, sibling packages of the workspace would be able to import one another.
   * 
   * > [!important]
   * > the constructor of the subclasses do **not** typically parse the workspace paths from the provided schema,
   * > nor do they load the {@link WorkspacePackage} associated with those workspaces,
   * > since it would require asynchronous operations (such as `fetch`) which cannot be performed inside the constructor.
   * > this is why you would either need to manually add/push your child/parent-workspace {@link WorkspacePackage} object,
   * > or use the asynchronous {@link fromUrl} static method in the subclasses to take care of auto-loading and auto-injecting parent and child workspaces.
  */
  workspaceChildren;
  /** specify all parent workspaces of this package.
   * 
   * - the imports of _this_ runtime package will be implicitly available for all child-workspace packages.
   *   > example: if `packageB` is child-workspace of `packageA`, then `packageA.imports` would be a subset of `packageB.imports`.
   * - the exports of every child-workspace package are inherited by _this_ runtime package.
   *   > example: if `packageB` is child-workspace of `packageA`, then `packageA.exports` would be a superset of `packageB.exports`.
   * 
   * > [!important]
   * > the constructor of the subclasses do **not** typically parse the workspace paths from the provided schema,
   * > nor do they load the {@link WorkspacePackage} associated with those workspaces,
   * > since it would require asynchronous operations (such as `fetch`) which cannot be performed inside the constructor.
   * > this is why you would either need to manually add/push your child/parent-workspace {@link WorkspacePackage} object,
   * > or use the asynchronous {@link fromUrl} static method in the subclasses to take care of auto-loading and auto-injecting parent and child workspaces.
  */
  workspaceParents;
  constructor(package_object, package_path) {
    super(package_object, package_path);
    this.workspaceChildren = [];
    this.workspaceParents = [];
  }
  async addWorkspaceChild(package_or_path) {
    const this_constructor = constructorOf(this), this_package_path = this.getPath(), package_is_path = isString(package_or_path) || package_or_path instanceof URL, package_url = package_is_path ? resolveAsUrl(package_or_path, this_package_path) : void 0, child_package = package_is_path ? await this_constructor.fromUrl(package_url) : package_or_path;
    this.workspaceChildren.push(child_package);
    child_package.workspaceParents.push(this);
  }
  async addWorkspaceParent(package_or_path) {
    const this_constructor = constructorOf(this), this_package_path = this.getPath(), package_is_path = isString(package_or_path) || package_or_path instanceof URL, package_url = package_is_path ? resolveAsUrl(package_or_path, this_package_path) : void 0, parent_package = package_is_path ? await this_constructor.fromUrl(package_url) : package_or_path;
    this.workspaceParents.push(parent_package);
    parent_package.workspaceChildren.push(this);
  }
  /** this method tries to resolve the provided export `path_alias` to an absolute resource path,
   * using this package's child workspaces (i.e. not including _this_ package's _own_ exports).
   * 
   * - if the action is successful, then a 2-tuple is returned,
   *   consisting of the `resolved_path` and the {@link WorkspacePackage | `child_workspace_package`} that managed to resolve the provided `path_alias`.
   * - if there are no child-workspaces, or if the child-workspaces fail to resolve the exported `path_alias`, then `undefined` will be returned.
   * - this method does not inspect this package's own exports. you should use {@link resolveExport} for that.
  */
  resolveWorkspaceExport(path_alias, config) {
    const { workspaceExportsVisited = /* @__PURE__ */ new Set(), ...import_map_config } = config ?? {}, workspace_children = this.workspaceChildren, current_workspaces_path = this.getPath();
    if (workspaceExportsVisited.has(current_workspaces_path)) {
      return;
    }
    workspaceExportsVisited.add(current_workspaces_path);
    for (const runtime_package of workspace_children) {
      const child_export_result = runtime_package.resolveExport(path_alias, {
        workspaceExportsVisited,
        ...import_map_config
      }) ?? runtime_package.resolveWorkspaceExport(path_alias, {
        workspaceExportsVisited,
        ...import_map_config
      });
      if (child_export_result !== void 0) {
        return isString(child_export_result) ? [child_export_result, runtime_package] : child_export_result;
      }
    }
    return;
  }
  /** this method tries to resolve the provided import `path_alias` done by some resource within this package,
   * using the internal {@link importMapSortedEntries} list of import-aliases that this package uses.
   * 
   * - if the action is successful, then a 2-tuple is returned,
   *   consisting of the `resolved_path` and the {@link WorkspacePackage | `child_workspace_package`} that managed to resolve the provided `path_alias`.
   * - if no import resources match the given `path_alias` within this package, then this package's {@link workspaceParents} will be traversed.
   * - if there are no parent-workspaces, or if the parent-workspaces fail to resolve this `path_alias`, then `undefined` will be returned.
   *   (which would probably imply that the given `path_alias` is already either an absolute or relative path, or perhaps incorrect altogether)
   * 
   * > [!tip]
   * > for test case examples and configuration options, see the documentation comments of {@link resolvePathFromImportMapEntries}
  */
  resolveWorkspaceImport(path_alias, config) {
    const { workspaceImportsVisited = /* @__PURE__ */ new Set(), ...import_map_config } = config ?? {}, workspace_parents = this.workspaceParents, current_workspaces_path = this.getPath();
    if (workspaceImportsVisited.has(current_workspaces_path)) {
      return;
    }
    workspaceImportsVisited.add(current_workspaces_path);
    for (const runtime_package of workspace_parents) {
      const child_import_result = runtime_package.resolveImport(path_alias, {
        workspaceImportsVisited,
        ...import_map_config
      }) ?? runtime_package.resolveWorkspaceImport(path_alias, {
        workspaceImportsVisited,
        ...import_map_config
      });
      if (child_import_result !== void 0) {
        return isString(child_import_result) ? [child_import_result, runtime_package] : child_import_result;
      }
    }
    return;
  }
};

// src/packageman/deno.ts
var existingDenoPackageConstructionStatus = /* @__PURE__ */ new Map();
var DenoPackage = class extends WorkspacePackage {
  importMapSortedEntries;
  exportMapSortedEntries;
  getName() {
    return this.packageInfo.name ?? "@no-name/package";
  }
  getVersion() {
    return this.packageInfo.version ?? "0.0.0";
  }
  getPath() {
    const package_path = this.packagePath;
    return package_path ? package_path : `${jsr_base_url}/${this.getName()}/${this.getVersion()}/deno.json`;
  }
  constructor(package_object, package_path) {
    super(package_object, package_path);
    const { exports = {}, imports = {} } = package_object, exports_object = isString(exports) ? exports.endsWith("/") ? { "./": exports } : { ".": exports } : exports, imports_object = { ...imports };
    for (const [alias, path] of object_entries(imports_object)) {
      const alias_dir_variant = ensureEndSlash(alias);
      if (alias !== alias_dir_variant && !(alias_dir_variant in imports_object)) {
        imports_object[alias_dir_variant] = ensureEndSlash(path);
      }
    }
    this.exportMapSortedEntries = object_entries(exports_object).toSorted(compareImportMapEntriesByLength);
    this.importMapSortedEntries = object_entries(imports_object).toSorted(compareImportMapEntriesByLength);
  }
  resolveExport(path_alias, config) {
    const package_json_path = this.getPath();
    if (config?.workspaceExportsVisited?.has(package_json_path)) {
      return;
    }
    const name = this.getName(), version = this.getVersion(), {
      baseAliasDir: _baseAliasDir,
      basePathDir = parseFilepathInfo(package_json_path).dirpath,
      ...rest_config
    } = config ?? {}, baseAliasDirs = _baseAliasDir === void 0 ? [`jsr:${name}@${version}`, `jsr:${name}`, `${name}`] : [_baseAliasDir];
    for (const baseAliasDir of baseAliasDirs) {
      const residual_path_alias = replacePrefix(path_alias, baseAliasDir)?.replace(/^\/+/, "/");
      if (residual_path_alias !== void 0) {
        path_alias = baseAliasDir + (residual_path_alias === "/" ? "" : residual_path_alias);
      }
      const resolved_path = super.resolveExport(path_alias, { baseAliasDir, basePathDir, ...rest_config });
      if (resolved_path) {
        return resolved_path;
      }
    }
  }
  resolveImport(path_alias, config) {
    const package_json_path = this.getPath();
    if (config?.workspaceImportsVisited?.has(package_json_path)) {
      return;
    }
    const basePathDir = parseFilepathInfo(package_json_path).dirpath, path_alias_is_relative = isCertainlyRelativePath(path_alias), self_reference_base_alias = path_alias_is_relative ? "" : void 0;
    const locally_resolved_export = this.resolveExport(path_alias, { ...config, baseAliasDir: self_reference_base_alias });
    return locally_resolved_export ?? super.resolveImport(path_alias, { ...config, basePathDir });
  }
  resolveWorkspaceImport(path_alias, config) {
    return this.resolveWorkspaceExport(path_alias, config) ?? super.resolveWorkspaceImport(path_alias, config);
  }
  static async fromUrl(jsr_package) {
    const package_path_url = resolveAsUrl(jsr_package, defaultResolvePath()), package_path_str = package_path_url.href, url_is_jsr_protocol = package_path_str.startsWith("jsr:"), url_is_directory = package_path_str.endsWith("/");
    if (url_is_jsr_protocol) {
      const { host } = parsePackageUrl(jsr_package);
      jsr_package = await memorized_jsrPackageToMetadataUrl(`jsr:${host}`);
    } else if (url_is_directory) {
      const package_json_urls = denoPackageJsonFilenames.map((json_filename) => new URL(json_filename, package_path_url)), valid_url = await fetchScanUrls(package_json_urls);
      if (!valid_url) {
        throw new Error(`Scan Error! failed to find a "./deno.json(c)" or "./jsr.json(c)" package file in your supplied directory: "${package_path_url}".`);
      }
      jsr_package = valid_url;
    }
    const new_instance = await super.fromUrl(jsr_package), new_instance_path = new_instance.getPath(), existing_package_status = existingDenoPackageConstructionStatus.get(new_instance_path);
    if (existing_package_status) {
      await existing_package_status;
      return new_instance;
    }
    const [promise, resolve, reject] = promise_outside();
    existingDenoPackageConstructionStatus.set(new_instance_path, promise);
    await promise_all(
      (new_instance.packageInfo.workspace ?? []).map(async (path) => {
        const child_path = ensureEndSlash(defaultResolvePath(path, new_instance_path));
        await new_instance.addWorkspaceChild(child_path);
      })
    );
    resolve();
    return new_instance;
  }
};
var jsr_base_url = "https://jsr.io";
var denoPackageJsonFilenames = [
  "./deno.json",
  "./deno.jsonc",
  "./jsr.json",
  "./jsr.jsonc"
  // TODO: the use of "package.json" is not supported for now, since it will complicate the parsing of the import/export-maps (due to having a different structure).
  //   in the future, I might write a `npmPackageToDenoJson` function to transform the imports (dependencies) and exports.
  // "./package.json",
  // "./package.jsonc", // as if such a thing will ever exist, lol
];
var jsrPackageToMetadataUrl = async (jsr_package) => {
  const { protocol, scope, pkg, pathname, version: desired_semver } = parsePackageUrl(jsr_package);
  if (protocol !== "jsr:") {
    throw new Error(`expected path protocol to be "jsr:", found "${protocol}" instead, for package: "${jsr_package}"`);
  }
  if (!scope) {
    throw new Error(`expected jsr package to contain a scope, but found "${scope}" instead, for package: "${jsr_package}"`);
  }
  const meta_json_url = new URL(`@${scope}/${pkg}/meta.json`, jsr_base_url), meta_json = await (await fetch(meta_json_url, defaultFetchConfig)).json(), unyanked_versions = object_entries(meta_json.versions).filter(([version_str, { yanked }]) => !yanked).map(([version_str]) => version_str);
  const resolved_semver = maxSatisfying(unyanked_versions, desired_semver ?? meta_json.latest);
  if (!resolved_semver) {
    throw new Error(`failed to find the desired version "${desired_semver}" of the jsr package "${jsr_package}", with available versions "${json_stringify(meta_json.versions)}"`);
  }
  const base_host = new URL(`@${scope}/${pkg}/${resolved_semver}/`, jsr_base_url), deno_json_urls = denoPackageJsonFilenames.map((json_filename) => new URL(json_filename, base_host));
  const valid_url = await fetchScanUrls(deno_json_urls, { method: "HEAD" });
  if (valid_url) {
    return new URL(valid_url);
  }
  throw new Error(`Network Error: couldn't locate "${jsr_package}"'s package json file. searched in the following locations:
${json_stringify(deno_json_urls)}`);
};
var memorized_jsrPackageToMetadataUrl = memorize(jsrPackageToMetadataUrl);

// src/plugins/funcdefs.ts
var logLogger = console.log;
var arrayLoggerFactory = (history) => {
  const history_push = bind_array_push(history);
  return (...data) => {
    history_push(data);
  };
};
var arrayLoggerHistory = [];
var arrayLogger = /* @__PURE__ */ arrayLoggerFactory(arrayLoggerHistory);
var syncTaskQueueFactory = () => {
  let latest_promise = promise_resolve();
  const task_queuer = (task_fn, ...args) => {
    const original_latest_promise = latest_promise, [promise_current_task_value, resolve_current_task_value] = promise_outside();
    latest_promise = promise_current_task_value;
    original_latest_promise.finally(() => {
      resolve_current_task_value(task_fn(...args));
    });
    return promise_current_task_value;
  };
  return task_queuer;
};
var entryPointsToImportMapEntries = (entry_points) => {
  if (!isArray(entry_points)) {
    entry_points = object_entries(entry_points);
  }
  return entry_points.map((entry) => {
    return isString(entry) ? [entry, entry] : !isArray(entry) ? [entry.in, entry.out] : entry;
  });
};

// src/plugins/typedefs.ts
var defaultEsbuildNamespaces = [void 0, "", "file"];
var allEsbuildLoaders = [
  "base64",
  "binary",
  "copy",
  "css",
  "dataurl",
  "default",
  "empty",
  "file",
  "js",
  "json",
  "jsx",
  "local-css",
  "text",
  "ts",
  "tsx"
];
var DIRECTORY = /* @__PURE__ */ ((DIRECTORY2) => {
  DIRECTORY2[DIRECTORY2["CWD"] = 0] = "CWD";
  DIRECTORY2[DIRECTORY2["ABS_WORKING_DIR"] = 1] = "ABS_WORKING_DIR";
  return DIRECTORY2;
})(DIRECTORY || {});

// src/plugins/filters/entry.ts
var defaultEntryPluginSetup = {
  filters: [/.*/],
  initialPluginData: void 0,
  forceInitialPluginData: false,
  enableInheritPluginData: true,
  scanAncestralWorkspaces: false,
  acceptNamespaces: defaultEsbuildNamespaces
};
var defaultStdinPath = "<stdin>";
var entryPluginSetup = (config) => {
  const { filters, initialPluginData: _initialPluginData, forceInitialPluginData, enableInheritPluginData, scanAncestralWorkspaces, acceptNamespaces: _acceptNamespaces } = { ...defaultEntryPluginSetup, ...config }, acceptNamespaces = /* @__PURE__ */ new Set([..._acceptNamespaces, "oazmi-loader-http" /* LOADER_HTTP */]), importerPluginDataRecord = /* @__PURE__ */ new Map(), importerPluginDataRecord_get = bind_map_get(importerPluginDataRecord), importerPluginDataRecord_set = bind_map_set(importerPluginDataRecord), importerPluginDataRecord_has = bind_map_has(importerPluginDataRecord), ALREADY_CAPTURED_BY_INITIAL = Symbol(0 /* MINIFY */ ? "" : "[oazmi-entry]: already captured by initial-data-injector"), ALREADY_CAPTURED_BY_INHERITOR = Symbol(0 /* MINIFY */ ? "" : "[oazmi-entry]: already captured by inherit-data-injector"), ALREADY_CAPTURED_BY_RESOLVER = Symbol(0 /* MINIFY */ ? "" : "[oazmi-entry]: already captured by absolute-path-resolver");
  return async (build) => {
    const { runtimePackage: initialRuntimePackage, ...rest_initialPluginData } = _initialPluginData ?? {}, initialPluginData = rest_initialPluginData, initialPluginDataExists = _initialPluginData !== void 0;
    build.onStart(async () => {
      initialPluginData.runtimePackage = await resolveRuntimePackage(build, initialRuntimePackage, scanAncestralWorkspaces);
      const stdin = build.initialOptions.stdin;
      if (stdin) {
        const { sourcefile = defaultStdinPath, resolveDir = "" } = stdin, path = sourcefile === defaultStdinPath ? sourcefile : resolveDir ? joinPaths(resolveDir, sourcefile) : pathToPosixPath(sourcefile);
        importerPluginDataRecord_set(path, initialPluginData);
      }
    });
    const initialPluginDataInjector = async (args) => {
      const { path, pluginData, ...rest_args } = args, { kind, namespace } = rest_args;
      if (kind !== "entry-point") {
        return;
      }
      if ((pluginData ?? {})[ALREADY_CAPTURED_BY_INITIAL]) {
        return;
      }
      if (!acceptNamespaces.has(namespace)) {
        return;
      }
      if (pluginData !== void 0 && !forceInitialPluginData) {
        return;
      }
      const merged_pluginData = forceInitialPluginData === "merge" ? { ...initialPluginData, ...pluginData, [ALREADY_CAPTURED_BY_INITIAL]: true } : { ...initialPluginData, [ALREADY_CAPTURED_BY_INITIAL]: true };
      const resolved_result = await build.resolve(path, { ...rest_args, pluginData: merged_pluginData });
      resolved_result.pluginData ??= merged_pluginData;
      return resolved_result;
    };
    const inheritPluginDataInjector = async (args) => {
      const { path, pluginData, ...rest_args } = args, { importer = "", namespace } = rest_args;
      if ((pluginData ?? {})[ALREADY_CAPTURED_BY_INHERITOR]) {
        return;
      }
      if (!acceptNamespaces.has(namespace)) {
        return;
      }
      if ((pluginData === void 0 || pluginData === null) && importer !== "") {
        const parentPluginData = importerPluginDataRecord_get(pathToPosixPath(importer));
        return parentPluginData ? inheritPluginDataInjector({ ...rest_args, path, pluginData: parentPluginData }) : void 0;
      }
      const prior_pluginData = { ...pluginData, [ALREADY_CAPTURED_BY_INHERITOR]: true }, resolved_result = await build.resolve(path, { ...rest_args, pluginData: prior_pluginData }), resolved_pluginData = {
        // if esbuild's native resolver had resolved the `path`, then the `prior_pluginData` WILL be lost, and we will need to re-insert it.
        ...resolved_result.pluginData ?? prior_pluginData,
        // we must also disable the `ALREADY_CAPTURED_BY_INHERITOR` marker, since the `resolved_result` is ready to go to the loader,
        // however, we don't want the dependencies (which will inherit the `pluginData`) to have their capture marker set to `true`,
        // since they haven't actually been captured by this resolver yet.
        [ALREADY_CAPTURED_BY_INHERITOR]: false
      };
      if (resolved_pluginData.resolverConfig?.useInheritPluginData !== false) {
        const resolved_path = pathToPosixPath(resolved_result.path);
        if (!importerPluginDataRecord_has(resolved_path)) {
          importerPluginDataRecord_set(pathToPosixPath(resolved_result.path), resolved_pluginData);
        }
      }
      resolved_result.pluginData = resolved_pluginData;
      return resolved_result;
    };
    const absolutePathResolver = async (args) => {
      if ((args.pluginData ?? {})[ALREADY_CAPTURED_BY_RESOLVER]) {
        return;
      }
      if (!acceptNamespaces.has(args.namespace)) {
        return;
      }
      const { path, namespace: original_ns, ...rest_args } = args, abs_result = await build.resolve(path, { ...rest_args, namespace: "oazmi-resolver-pipeline" /* RESOLVER_PIPELINE */ });
      const { path: abs_path, pluginData: abs_pluginData = {}, namespace: _0 } = abs_result, next_pluginData = { ...abs_pluginData, [ALREADY_CAPTURED_BY_RESOLVER]: true }, resolved_result = await build.resolve(abs_path, { ...rest_args, namespace: original_ns, pluginData: next_pluginData });
      resolved_result.pluginData = {
        // if esbuild's native resolver had resolved the `path`, then the `next_pluginData` WILL be lost, and we will need to re-insert it.
        ...resolved_result.pluginData ?? next_pluginData,
        // we must also disable the `ALREADY_CAPTURED_BY_RESOLVER` marker, since the `resolved_result` is ready to go to the loader,
        // however, we don't want the dependencies (which will inherit the `pluginData`) to have their capture marker set to `true`,
        // since they haven't actually been captured by this resolver yet.
        [ALREADY_CAPTURED_BY_RESOLVER]: false
      };
      return resolved_result;
    };
    for (const filter of filters) {
      if (initialPluginDataExists) {
        build.onResolve({ filter }, initialPluginDataInjector);
      }
      if (enableInheritPluginData) {
        build.onResolve({ filter }, inheritPluginDataInjector);
      }
      build.onResolve({ filter }, absolutePathResolver);
    }
  };
};
var entryPlugin = (config) => {
  return {
    name: "oazmi-entry",
    setup: entryPluginSetup(config)
  };
};
var resolveRuntimePackage = async (build, initialRuntimePackage, scanAncestralWorkspaces = true) => {
  let deno_package, deno_json_path;
  if (!initialRuntimePackage) {
    return;
  }
  if (initialRuntimePackage instanceof RuntimePackage) {
    deno_package = initialRuntimePackage;
  } else {
    const is_relative_path = isString(initialRuntimePackage) && getUriScheme(initialRuntimePackage) === "relative";
    deno_json_path = is_relative_path ? (await build.resolve(initialRuntimePackage, {
      kind: "entry-point",
      namespace: "oazmi-resolver-pipeline" /* RESOLVER_PIPELINE */,
      pluginData: { resolverConfig: { useNodeModules: false } }
    })).path : initialRuntimePackage;
    deno_package = await DenoPackage.fromUrl(deno_json_path).catch((reason) => {
      logLogger(`[resolveRuntimePackage]    : ${reason?.message ?? reason}`);
    });
  }
  if (scanAncestralWorkspaces && (deno_package ?? deno_json_path)) {
    await traverseAncestralWorkspaces(deno_package?.getPath() ?? deno_json_path);
  }
  return deno_package;
};
var traverseAncestralWorkspaces = async (starting_path) => {
  const dir_url = resolveAsUrl("./", starting_path), parent_dir_url = resolveAsUrl("../", dir_url);
  if (parent_dir_url.href === dir_url.href) {
    return;
  }
  const deno_package_json_urls = denoPackageJsonFilenames.map((json_filename) => new URL(json_filename, dir_url)), valid_url = await fetchScanUrls(deno_package_json_urls);
  if (valid_url) {
    const deno_package = await DenoPackage.fromUrl(valid_url).catch((reason) => {
      logLogger(`[resolveRuntimePackage]    : workspace file at "${valid_url}" was found, but we failed to load it as a deno package. reason:  ${reason?.message ?? reason}`);
    });
  }
  return traverseAncestralWorkspaces(parent_dir_url);
};

// src/loadermap/extensions.js
var extensions_default = {
  "base64": [],
  "binary": [".bin", ".dat"],
  "copy": [],
  "css": [".css"],
  "dataurl": [],
  "default": [],
  "empty": [],
  "file": [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".webp",
    ".bmp",
    ".tiff",
    ".ico",
    ".mp4",
    ".webm",
    ".ogg",
    ".avi",
    ".mp3",
    ".wav",
    ".aac"
  ],
  "js": [".js", ".mjs", ".cjs"],
  "json": [".json"],
  "jsx": [".jsx"],
  "local-css": [".module.css"],
  "text": [".txt", ".html", ".md", ".xml", ".csv"],
  "ts": [".ts", ".mts", ".cts"],
  "tsx": [".tsx"]
};

// src/loadermap/mimes.js
var mimes_default = {
  "base64": ["application/octet-stream", "application/base64"],
  "binary": [
    "application/octet-stream",
    "application/binary",
    "application/x-binary",
    "image/vnd.microsoft.icon"
  ],
  "copy": ["application/octet-stream", "application/x-copy"],
  "css": ["text/css"],
  "dataurl": ["application/data-url", "text/data-url"],
  "default": [],
  "empty": [],
  "file": [
    "application/octet-stream",
    "application/x-file",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/vnd.microsoft.icon",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/x-msvideo",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/x-aac",
    "audio/webm"
  ],
  "js": [
    "application/javascript",
    "text/javascript",
    "application/x-javascript",
    "application/ecmascript",
    "text/ecmascript"
  ],
  "json": ["application/json", "text/json"],
  "jsx": ["application/javascript", "text/javascript", "application/jsx"],
  "local-css": ["text/css", "text/x-css"],
  "text": ["text/plain", "text/html", "text/markdown", "text/xml", "text/csv"],
  "ts": ["application/typescript", "text/typescript"],
  "tsx": ["application/typescript", "text/typescript", "application/tsx"]
};

// src/loadermap/mod.ts
var mime_map_entries = object_entries(mimes_default).map(([loader_name, mime_types]) => {
  return [loader_name, new Set(mime_types)];
});
var extension_map_entries = object_entries(extensions_default).map(([loader_name, extension_types]) => {
  return [loader_name, new Set(extension_types)];
});
var mimeTypeLoaderMap = new InvertibleMap(new Map(mime_map_entries));
var extensionTypeLoaderMap = new InvertibleMap(new Map(extension_map_entries));
var guessMimeLoaders = (content_type) => {
  const [mime_type, ...rest] = content_type.split(";"), normalized_mime_type = mime_type.trim().toLowerCase();
  return mimeTypeLoaderMap.rget(normalized_mime_type);
};
var guessExtensionLoaders = (file_path) => {
  const file_extension = file_path.endsWith(".module.css") ? ".module.css" : parseFilepathInfo(file_path).extname;
  return extensionTypeLoaderMap.rget(file_extension);
};
var guessHttpResponseLoaders = (response) => {
  const { headers, url } = response, content_type = headers.get("content-type") ?? "", mime_loaders = guessMimeLoaders(content_type) ?? /* @__PURE__ */ new Set(), extension_loaders = guessExtensionLoaders(url) ?? /* @__PURE__ */ new Set();
  let common_loaders = mime_loaders.intersection(extension_loaders);
  if (common_loaders.size <= 0) {
    common_loaders = extension_loaders;
  }
  if (common_loaders.size <= 0) {
    common_loaders = mime_loaders;
  }
  return common_loaders;
};

// src/plugins/filters/http.ts
var urlLoaderFactory = (config) => {
  const { defaultLoader, acceptLoaders = allEsbuildLoaders, log = false } = config, accept_loaders_set = new Set(acceptLoaders), logFn = log ? log === true ? logLogger : log : void 0;
  return async (args) => {
    const { path, pluginData } = args, path_url = resolveAsUrl(path), response = await fetch(path_url, defaultFetchConfig);
    if (!response.ok) {
      throw new Error(`[urlLoaderFactory]: ERROR: network fetch response for url "${path_url.href}" was not ok (${response.status}). response header:
${json_stringify(response.headers)}`);
    }
    const guessed_loaders = guessHttpResponseLoaders(response), available_loaders = accept_loaders_set.intersection(guessed_loaders), preferred_loader = [...available_loaders].at(0) ?? defaultLoader, contents = await response.bytes();
    if (1 /* LOG */ && logFn) {
      logFn(`[urlLoaderFactory]:`, { path, path_url: path_url.href, guessed_loaders, preferred_loader, args });
    }
    return {
      contents,
      loader: preferred_loader,
      // unfortunately, if we set the `resolveDir` to anything but an empty string, then it will be appended to the
      // previous `resolveDir` of the resolver. even if provide an absolute path value to it, it still joins it up.
      // I think the intention behind `resolveDir` is to set the OUTPUT relative directory,
      // and not that we're trying to specify the current working/loading directory.
      // but it still doesn't work (i.e. I am unable to manipulate the output dir via this option).
      // resolveDir: resolveAsUrl("./", path).href,
      pluginData
    };
  };
};
var defaultConvertFileUriToLocalPath = { enabled: true, resolveAgain: true };
var defaultHttpPluginSetupConfig = {
  filters: [/^https?\:\/\//, /^file\:\/\//],
  namespace: "oazmi-loader-http" /* LOADER_HTTP */,
  acceptNamespaces: defaultEsbuildNamespaces,
  defaultLoader: "copy",
  acceptLoaders: void 0,
  convertFileUriToLocalPath: defaultConvertFileUriToLocalPath,
  log: false
};
var httpPluginSetup = (config = {}) => {
  const { acceptLoaders, defaultLoader, filters, namespace: plugin_ns, acceptNamespaces: _acceptNamespaces, log, convertFileUriToLocalPath: _convertFileUriToLocalPath } = { ...defaultHttpPluginSetupConfig, ...config }, acceptNamespaces = /* @__PURE__ */ new Set([..._acceptNamespaces, plugin_ns]), pluginLoaderConfig = { acceptLoaders, defaultLoader, log }, convertFileUriToLocalPath = { ...defaultConvertFileUriToLocalPath, ..._convertFileUriToLocalPath };
  return async (build) => {
    const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions;
    const httpResolver = async (args) => {
      const { path, pluginData, namespace, ...rest_args } = args, original_ns = namespace === plugin_ns ? "" : namespace;
      if (!acceptNamespaces.has(namespace)) {
        return;
      }
      return convertFileUriToLocalPath.enabled && getUriScheme(path) === "file" ? convertFileUriToLocalPath.resolveAgain ? build.resolve(fileUrlToLocalPath(path), { ...rest_args, pluginData, namespace: original_ns }) : { path: fileUrlToLocalPath(path), pluginData, namespace: original_ns } : { path, pluginData, namespace: plugin_ns };
    };
    filters.forEach((filter) => {
      build.onResolve({ filter }, httpResolver);
    });
    build.onLoad({ filter: /.*/, namespace: plugin_ns }, urlLoaderFactory(pluginLoaderConfig));
  };
};
var httpPlugin = (config) => {
  return {
    name: "oazmi-http-plugin",
    setup: httpPluginSetup(config)
  };
};

// src/plugins/filters/jsr.ts
var defaultJsrPluginSetupConfig = {
  filters: [/^jsr\:/],
  acceptNamespaces: defaultEsbuildNamespaces
};
var jsrPluginSetup = (config = {}) => {
  const { filters, acceptNamespaces: _acceptNamespaces } = { ...defaultJsrPluginSetupConfig, ...config }, acceptNamespaces = /* @__PURE__ */ new Set([..._acceptNamespaces, "oazmi-loader-http" /* LOADER_HTTP */]);
  return async (build) => {
    const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions;
    const jsrSpecifierResolver = async (args) => {
      if (!acceptNamespaces.has(args.namespace)) {
        return;
      }
      const { path, pluginData = {}, ...rest_args } = args, { importMap: _0, runtimePackage: _1, resolverConfig = {}, ...restPluginData } = pluginData, runtimePackage = await DenoPackage.fromUrl(path), relative_alias_pathname = parsePackageUrl(path).pathname, relative_alias = relative_alias_pathname === "/" ? "." : ensureStartDotSlash(relative_alias_pathname), import_config = { baseAliasDir: "" }, path_url = runtimePackage.resolveExport(relative_alias, import_config);
      if (!path_url) {
        throw new Error(`failed to resolve the path "${path}" from the deno package: "jsr:${runtimePackage.getName()}@${runtimePackage.getVersion()}"`);
      }
      return build.resolve(path_url, {
        ...rest_args,
        pluginData: {
          ...restPluginData,
          runtimePackage,
          // we don't want node-resolution occurring inside of the jsr-package.
          // however, any dependency in the jsr-package that uses the "npm:" specifier will be resolved correctly via the npm-plugin,
          // and inside of that npm-package, the node-resolution will be re-enabled.
          resolverConfig: { ...resolverConfig, useNodeModules: false }
        }
      });
    };
    filters.forEach((filter) => {
      build.onResolve({ filter }, jsrSpecifierResolver);
    });
  };
};
var jsrPlugin = (config) => {
  return {
    name: "oazmi-jsr-plugin",
    setup: jsrPluginSetup(config)
  };
};

// src/plugins/resolvers.ts
var defaultRuntimePackageResolverConfig = {
  enabled: true
};
var defaultImportMapResolverConfig = {
  enabled: true,
  globalImportMap: {}
};
var defaultNodeModulesResolverConfig = {
  enabled: true
};
var defaultRelativePathResolverConfig = {
  enabled: true,
  resolvePath: defaultResolvePath,
  isAbsolutePath: isAbsolutePath2
};
var defaultResolverPluginSetupConfig = {
  runtimePackage: defaultRuntimePackageResolverConfig,
  importMap: defaultImportMapResolverConfig,
  nodeModules: defaultNodeModulesResolverConfig,
  relativePath: defaultRelativePathResolverConfig,
  namespace: "oazmi-resolver-pipeline" /* RESOLVER_PIPELINE */,
  log: false
};
var resolverPluginSetup = (config) => {
  const {
    runtimePackage: _runtimePackageResolverConfig,
    importMap: _importMapResolverConfig,
    nodeModules: _nodeModulesResolverConfig,
    relativePath: _relativePathResolverConfig,
    namespace: plugin_ns,
    log
  } = { ...defaultResolverPluginSetupConfig, ...config };
  const runtimePackageResolverConfig = { ...defaultRuntimePackageResolverConfig, ..._runtimePackageResolverConfig }, importMapResolverConfig = { ...defaultImportMapResolverConfig, ..._importMapResolverConfig }, nodeModulesResolverConfig = { ...defaultNodeModulesResolverConfig, ..._nodeModulesResolverConfig }, relativePathResolverConfig = { ...defaultRelativePathResolverConfig, ..._relativePathResolverConfig }, logFn = log ? log === true ? logLogger : log : void 0, output_ns = "discard-this-namespace", plugin_filter = /.*/;
  return async (build) => {
    const absWorkingDir = pathToPosixPath(build.initialOptions.absWorkingDir ?? "./");
    const externalResourceSet = new Set(build.initialOptions.external);
    const externalPathResolver = externalResourceSet.size <= 0 ? noop2 : async (args) => {
      const { path, pluginData = {} } = args, is_external = externalResourceSet.has(path);
      if (1 /* LOG */ && logFn) {
        logFn(`[external-path]    checking: ${path}` + (!is_external ? "" : `
>> successfully verified the path to be external`));
      }
      return is_external ? {
        path,
        external: true,
        namespace: output_ns,
        pluginData: { ...pluginData }
      } : void 0;
    };
    const runtimePackageResolver = runtimePackageResolverConfig.enabled === false ? noop2 : async (args) => {
      if (args.pluginData?.resolverConfig?.useRuntimePackage === false) {
        return;
      }
      const { path, pluginData = {} } = args, runtimePackage = pluginData.runtimePackage, resolved_result = runtimePackage && !isCertainlyRelativePath(path) ? runtimePackage.resolveImport(path) ?? runtimePackage.resolveWorkspaceImport(path) : void 0, [resolved_path, resolved_package] = array_isArray(resolved_result) ? resolved_result : [resolved_result, runtimePackage];
      if (1 /* LOG */ && logFn) {
        logFn(`[runtime-package] resolving: ${path}` + (!resolved_path ? "" : `
>> successfully resolved to: ${resolved_path}`));
      }
      return resolved_path ? {
        path: resolved_path,
        namespace: output_ns,
        pluginData: { ...pluginData, runtimePackage: resolved_package }
      } : void 0;
    };
    const { globalImportMap } = importMapResolverConfig;
    const importMapResolver = importMapResolverConfig.enabled === false ? noop2 : async (args) => {
      if (args.pluginData?.resolverConfig?.useImportMap === false) {
        return;
      }
      const { path, pluginData = {} } = args, importMap = { ...globalImportMap, ...pluginData.importMap }, resolved_path = resolvePathFromImportMap(path, importMap);
      if (1 /* LOG */ && logFn) {
        logFn(`[import-map]      resolving: ${path}` + (!resolved_path ? "" : `
>> successfully resolved to: ${resolved_path}`));
      }
      return resolved_path ? {
        path: resolved_path,
        namespace: output_ns,
        pluginData: { ...pluginData }
      } : void 0;
    };
    const { resolvePath, isAbsolutePath: isAbsolutePath3 } = relativePathResolverConfig;
    const node_modules_resolver = nodeModulesResolverFactory({ absWorkingDir: resolvePath(ensureEndSlash(absWorkingDir)) }, build);
    const nodeModulesResolver = nodeModulesResolverConfig.enabled === false ? noop2 : async (args) => {
      const { path, resolveDir, importer, pluginData = {} } = args;
      if (pluginData.resolverConfig?.useNodeModules === false) {
        return;
      }
      if (pluginData.resolverConfig?.useRelativePath !== false && (isCertainlyRelativePath(path) || isAbsolutePath3(path))) {
        return;
      }
      const resolve_dir = resolvePath(ensureEndSlash(resolveDir ? resolveDir : absWorkingDir)), module_path_alias = pathToPosixPath(path), native_results_promise = node_modules_resolver({
        importer,
        path: module_path_alias,
        resolveDir: resolve_dir
      });
      const { path: resolved_path, namespace: _0, pluginData: _1, ...rest_results } = await native_results_promise.catch(() => {
        return {};
      });
      if (1 /* LOG */ && logFn) {
        logFn(`[node-module]     resolving: ${path}` + (!resolved_path ? "" : `
>> successfully resolved to: ${resolved_path}`));
      }
      return resolved_path ? {
        ...rest_results,
        path: resolved_path,
        namespace: output_ns,
        pluginData: { ...pluginData }
      } : void 0;
    };
    const relativePathResolver = relativePathResolverConfig.enabled === false ? noop2 : async (args) => {
      if (args.pluginData?.resolverConfig?.useRelativePath === false) {
        return;
      }
      const { path, importer, resolveDir, pluginData = {} } = args, resolve_dir = resolvePath(ensureEndSlash(resolveDir ? resolveDir : absWorkingDir)), dir = isAbsolutePath3(importer) ? importer : joinPaths(resolve_dir, importer), resolved_path = resolvePath(path, dir ? dir : void 0);
      if (1 /* LOG */ && logFn) {
        logFn(`[absolute-path]   resolving: ${path}` + (!resolved_path ? "" : `
>> successfully resolved to: ${resolved_path}`));
      }
      return {
        path: resolved_path,
        namespace: output_ns,
        pluginData: { ...pluginData }
      };
    };
    build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, externalPathResolver);
    build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, runtimePackageResolver);
    build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, importMapResolver);
    build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, nodeModulesResolver);
    build.onResolve({ filter: plugin_filter, namespace: plugin_ns }, relativePathResolver);
  };
};
var resolverPlugin = (config) => {
  return {
    name: "oazmi-plugindata-resolvers",
    setup: resolverPluginSetup(config)
  };
};
var nodeModulesResolverFactory = (config, build) => {
  const { absWorkingDir } = config;
  const internalPluginSetup = (config2) => {
    return (build2) => {
      const ALREADY_CAPTURED = Symbol(), plugin_ns = "the-void", { resolve, reject, resolveDir, importer = "" } = config2, importer_path_scheme = getUriScheme(importer), importer_dir_as_file_uri = importer_path_scheme === "local" || importer_path_scheme === "file" ? resolveAsUrl("./", importer).href : void 0, resolve_dir = importer_dir_as_file_uri ?? resolveDir;
      if (1 /* ASSERT */ && resolve_dir === "") {
        logLogger(
          `[nodeModulesResolverFactory]: WARNING! received an empty resolve directory ("args.resolveDir").`,
          `
	we will fallback to esbuild's current-working-directory for filling in the "resolveDir" value,`,
          `
	however, you must be using the "nodeModulesResolverFactory" function incorrectly to have encountered this situation.`,
          `
	remember, the purpose of this function is to scan for a node-module, starting from a directory that YOU provide.`
        );
      }
      build2.onResolve({ filter: /.*/ }, async (args) => {
        if (args.pluginData?.[ALREADY_CAPTURED] === true) {
          return;
        }
        const { path, external, namespace, sideEffects, suffix } = await build2.resolve(
          ensureFileUrlIsLocalPath(args.path),
          {
            kind: "entry-point",
            resolveDir: ensureFileUrlIsLocalPath(resolve_dir !== "" ? resolve_dir : args.resolveDir),
            pluginData: { [ALREADY_CAPTURED]: true }
          }
        );
        resolve({ path: pathToPosixPath(path), external, namespace, sideEffects, suffix });
        return { path: "does-not-matter.js", namespace: plugin_ns };
      });
      build2.onLoad({ filter: /.*/, namespace: plugin_ns }, () => ({ contents: "", loader: "empty" }));
    };
  };
  return async (args) => {
    const { path, resolveDir: _resolveDir = "", importer } = args, resolveDir = _resolveDir === "" ? absWorkingDir ?? "" : _resolveDir, [promise, resolve, reject] = promise_outside(), internalPlugin = {
      name: "native-esbuild-resolver-capture",
      setup: internalPluginSetup({ resolve, reject, resolveDir, importer })
    };
    await build.esbuild.build({
      entryPoints: [path],
      absWorkingDir,
      bundle: false,
      minify: false,
      write: false,
      outdir: "./temp/",
      plugins: [internalPlugin]
    }).catch(() => {
      reject("esbuild's native resolver failed to resolve the path");
    });
    return promise;
  };
};

// src/plugins/filters/npm.ts
var defaultNpmAutoInstallCliConfig = {
  dir: 1 /* ABS_WORKING_DIR */,
  command: (package_name_and_version) => `npm install "${package_name_and_version}" --no-save`
};
var sync_task_queuer = syncTaskQueueFactory();
var packageAvailability = /* @__PURE__ */ new Map();
var npm_prefix = "npm:";
var defaultNpmPluginSetupConfig = {
  specifiers: [npm_prefix],
  sideEffects: "auto",
  autoInstall: true,
  peerDependencies: {},
  acceptNamespaces: defaultEsbuildNamespaces,
  nodeModulesDirs: [1 /* ABS_WORKING_DIR */],
  log: false
};
var npmPluginSetup = (config = {}) => {
  const { specifiers, sideEffects, autoInstall: _autoInstall, peerDependencies: _peerDependencies, acceptNamespaces: _acceptNamespaces, nodeModulesDirs, log } = { ...defaultNpmPluginSetupConfig, ...config }, logFn = log ? log === true ? logLogger : log : void 0, acceptNamespaces = /* @__PURE__ */ new Set([..._acceptNamespaces, "oazmi-loader-http" /* LOADER_HTTP */]), forcedSideEffectsMode = isString(sideEffects) ? void 0 : sideEffects, autoInstall = autoInstallOptionToNpmAutoInstallCliConfig(_autoInstall), peerDependenciesImportMap = object_fromEntries(
    entryPointsToImportMapEntries(_peerDependencies).map(([alias, pkg_name]) => {
      const well_formed_alias_with_version_and_path = replacePrefix(alias, npm_prefix, "") ?? alias, { scope: alias_scope, pkg: alias_pkg } = parsePackageUrl(npm_prefix + well_formed_alias_with_version_and_path), well_formed_alias = (alias_scope ? "@" + alias_scope + "/" : "") + alias_pkg, well_formed_pkg_with_version_and_path = replacePrefix(pkg_name, npm_prefix, "") ?? pkg_name, { host: well_formed_pkg_with_version } = parsePackageUrl(npm_prefix + well_formed_pkg_with_version_and_path);
      return [well_formed_alias, npm_prefix + well_formed_pkg_with_version];
    })
  );
  if (isObject(autoInstall)) {
    nodeModulesDirs.unshift(autoInstall.dir);
  }
  return (async (build) => {
    const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions, cwd = ensureEndSlash(defaultGetCwd), abs_working_dir = absWorkingDir ? ensureEndSlash(pathToPosixPath(absWorkingDir)) : defaultGetCwd, dir_path_converter = (dir_path) => {
      switch (dir_path) {
        case 0 /* CWD */:
          return cwd;
        case 1 /* ABS_WORKING_DIR */:
          return abs_working_dir;
        default:
          return pathOrUrlToLocalPathConverter(dir_path);
      }
    }, node_modules_dirs = [...new Set(nodeModulesDirs.map(dir_path_converter))], validResolveDirFinder = findResolveDirOfNpmPackageFactory(build), autoInstallConfig = isObject(autoInstall) ? { dir: dir_path_converter(autoInstall.dir), command: autoInstall.command, log } : autoInstall;
    if (autoInstallConfig) {
      build.onStart(async () => {
        const is_dynamic_installation = autoInstallConfig === "dynamic", well_formed_peer_deps = object_entries(peerDependenciesImportMap);
        if (!array_isEmpty(well_formed_peer_deps) && 1 /* LOG */ && logFn) {
          logFn(`[npmPlugin] peer-dependency: the following peer dependencies were specified:`, peerDependenciesImportMap);
        }
        for (const [alias, pkg_name] of well_formed_peer_deps) {
          const { host: pkg_with_version, version: desired_version } = parsePackageUrl(pkg_name), no_aliasing_is_being_performed = desired_version === void 0 ? alias === pkg_with_version : pkg_with_version.startsWith(alias + "@"), pkg_aliased_installation_string = `${alias}@npm:${pkg_with_version}`, pkg_installation_string = no_aliasing_is_being_performed || is_dynamic_installation ? pkg_with_version : pkg_aliased_installation_string;
          if (!no_aliasing_is_being_performed && is_dynamic_installation) {
            (logFn ?? logLogger)(
              `[npmPlugin]: WARNING! auto peer dependency package installation under an aliased name is not possible with "autoInstall" set to "dynamic".`,
              `
	this will very likely lead to a broken import. please set "autoInstall" to one of the cli options, such as "auto-cli".`,
              `
	warning generated for the peer dependency package: "${pkg_name}", with alias: "${alias}".`
            );
          }
          await sync_task_queuer(installNpmPackage, pkg_installation_string, autoInstallConfig);
        }
      });
    }
    const npmSpecifierResolverFactory = (specifier) => (async (args) => {
      if (!acceptNamespaces.has(args.namespace)) {
        return;
      }
      const { path, pluginData = {}, resolveDir = "", namespace: original_ns, ...rest_args } = args, well_formed_npm_package_alias = replacePrefix(path, specifier, npm_prefix), { scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias), npm_package_name = (scope ? "@" + scope + "/" : "") + pkg, resolved_npm_package_alias = `${npm_package_name}${pathname === "/" ? "" : pathname}`, { importMap: _0, runtimePackage: _1, resolverConfig: originalResolverConfig, ...restPluginData } = pluginData, scan_resolve_dir = resolveDir === "" ? node_modules_dirs : [resolveDir, ...node_modules_dirs];
      let package_availability_promise = packageAvailability.get(npm_package_name), package_availability_promise_resolver = void 0;
      if (!package_availability_promise) {
        const [promise, resolve] = promise_outside();
        packageAvailability.set(npm_package_name, package_availability_promise = promise);
        package_availability_promise_resolver = resolve;
      } else {
        await package_availability_promise;
      }
      let valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir);
      if (!valid_resolve_dir && autoInstallConfig) {
        await sync_task_queuer(installNpmPackage, well_formed_npm_package_alias, autoInstallConfig);
        valid_resolve_dir = await validResolveDirFinder(resolved_npm_package_alias, scan_resolve_dir);
      }
      if (!valid_resolve_dir) {
        (logFn ?? logLogger)(
          `[npmPlugin]: WARNING! no valid "resolveDir" directory was found to contain the npm package named "${resolved_npm_package_alias}"`,
          `
	we will still continue with the path resolution (in case the global-import-map may alter the situation),`,
          `
	but it is almost guaranteed not to work if the current-working-directory was already part of the scanned directories.`
        );
      }
      package_availability_promise_resolver?.();
      const abs_result = await build.resolve(resolved_npm_package_alias, {
        ...rest_args,
        resolveDir: valid_resolve_dir,
        namespace: "oazmi-resolver-pipeline" /* RESOLVER_PIPELINE */,
        pluginData: { ...restPluginData, resolverConfig: { useRuntimePackage: false, useImportMap: false, useNodeModules: true } }
      });
      const resolved_path = abs_result.path;
      if (1 /* LOG */ && logFn) {
        logFn(`[npmPlugin]       resolving: "${path}", with resolveDir: "${valid_resolve_dir}"` + (!resolved_path ? "" : `
>> successfully resolved to: ${resolved_path}`));
      }
      if (forcedSideEffectsMode !== void 0) {
        abs_result.sideEffects = forcedSideEffectsMode;
      }
      abs_result.namespace = "";
      Object.assign(abs_result.pluginData.resolverConfig, { ...originalResolverConfig, useRuntimePackage: false, useNodeModules: true });
      return abs_result;
    });
    specifiers.forEach((specifier) => {
      const filter = new RegExp(`^${escapeLiteralStringForRegex(specifier)}`);
      build.onResolve({ filter }, npmSpecifierResolverFactory(specifier));
    });
  });
};
var npmPlugin = (config) => {
  return {
    name: "oazmi-npm-plugin",
    setup: npmPluginSetup(config)
  };
};
var pathOrUrlToLocalPathConverter = (dir_path_or_url) => {
  const path = isString(dir_path_or_url) ? dir_path_or_url : dir_path_or_url.href, path_schema = getUriScheme(path), dir_path = normalizePath(ensureEndSlash(
    path_schema === "relative" ? joinPaths(ensureEndSlash(defaultGetCwd), path) : path
  ));
  switch (path_schema) {
    case "local":
    case "relative":
    case "file":
      return ensureFileUrlIsLocalPath(dir_path);
    default:
      throw new Error(`expected a filesystem path, or a "file://" url, but received the incompatible uri scheme "${path_schema}".`);
  }
};
var findResolveDirOfNpmPackageFactory = (build) => {
  const node_modules_resolver = nodeModulesResolverFactory({ absWorkingDir: void 0 }, build);
  const validateNodeModuleExists = async (abs_resolve_dir, node_module_package_name) => {
    const result = await node_modules_resolver({
      path: node_module_package_name,
      importer: "",
      resolveDir: abs_resolve_dir
    });
    return (result.path ?? "") !== "" ? true : false;
  };
  return async (node_module_package_name_to_search, node_module_parent_directories_to_scan) => {
    const abs_local_directories = node_module_parent_directories_to_scan.map(pathOrUrlToLocalPathConverter);
    for (const abs_resolve_dir of abs_local_directories) {
      const node_module_was_found = await validateNodeModuleExists(abs_resolve_dir, node_module_package_name_to_search);
      if (node_module_was_found) {
        return abs_resolve_dir;
      }
    }
  };
};
var current_js_runtime = identifyCurrentRuntime();
var package_installation_command_deno = (package_name_and_version) => `deno cache --node-modules-dir="auto" --allow-scripts --no-config "npm:${package_name_and_version}"`;
var package_installation_command_deno_noscript = (package_name_and_version) => `deno cache --node-modules-dir="auto" --no-config "npm:${package_name_and_version}"`;
var package_installation_command_npm = (package_name_and_version) => `npm install "${package_name_and_version}" --no-save`;
var package_installation_command_bun = (package_name_and_version) => `bun install "${package_name_and_version}" --no-save`;
var package_installation_command_pnpm = (package_name_and_version) => `pnpm install "${package_name_and_version}"`;
var autoInstallOptionToNpmAutoInstallCliConfig = (option) => {
  if (!option) {
    return void 0;
  }
  if (isObject(option)) {
    return { ...defaultNpmAutoInstallCliConfig, ...option };
  }
  switch (option) {
    case "auto":
      return current_js_runtime === 0 /* DENO */ || current_js_runtime === 1 /* BUN */ ? "dynamic" : autoInstallOptionToNpmAutoInstallCliConfig("npm");
    case true:
    case "auto-cli":
      switch (current_js_runtime) {
        case 0 /* DENO */:
          return autoInstallOptionToNpmAutoInstallCliConfig("deno");
        case 1 /* BUN */:
          return autoInstallOptionToNpmAutoInstallCliConfig("bun");
        case 2 /* NODE */:
          return autoInstallOptionToNpmAutoInstallCliConfig("npm");
        default:
          throw new Error("ERROR! cli-installation of npm-packages is not possible on web-browser runtimes.");
      }
    case "dynamic":
      return "dynamic";
    case "deno":
      return { dir: 1 /* ABS_WORKING_DIR */, command: package_installation_command_deno };
    case "deno-noscript":
      return { dir: 1 /* ABS_WORKING_DIR */, command: package_installation_command_deno_noscript };
    case "bun":
      return { dir: 1 /* ABS_WORKING_DIR */, command: package_installation_command_bun };
    case "npm":
      return { dir: 1 /* ABS_WORKING_DIR */, command: package_installation_command_npm };
    case "pnpm":
      return { dir: 1 /* ABS_WORKING_DIR */, command: package_installation_command_pnpm };
    default:
      return void 0;
  }
};
var installNpmPackage = async (package_name, config) => {
  switch (current_js_runtime) {
    case 0 /* DENO */:
    case 1 /* BUN */:
    case 2 /* NODE */: {
      return config === "dynamic" ? installNpmPackageDynamic(package_name) : installNpmPackageCli(package_name, config);
    }
    default:
      throw new Error("ERROR! npm-package installation is not possible on web-browser runtimes.");
  }
};
var installNpmPackageCli = async (package_name, config) => {
  const { command, dir, log } = config, logFn = log ? log === true ? logLogger : log : void 0, pkg_pseudo_url = parsePackageUrl(package_name.startsWith(npm_prefix) ? package_name : npm_prefix + package_name), pkg_name_and_version = pkg_pseudo_url.host, is_using_package_aliasing = pkg_name_and_version.includes("@npm:"), cli_command = command(is_using_package_aliasing ? package_name : pkg_name_and_version);
  if (1 /* LOG */ && logFn) {
    logFn(`[npmPlugin]      installing: "${package_name}", in directory "${dir}"
>>    using the cli-command: \`${cli_command}\``);
  }
  await execShellCommand(current_js_runtime, cli_command, { cwd: dir });
};
var installNpmPackageDynamic = async (package_name) => {
  const pkg_pseudo_url = parsePackageUrl(package_name.startsWith(npm_prefix) ? package_name : npm_prefix + package_name), pkg_import_url = pkg_pseudo_url.href.replace(/^npm\:[\/\\]*/, npm_prefix).slice(0, pkg_pseudo_url.pathname === "/" ? -1 : void 0), dynamic_export_script = `export * as myLib from "${dom_decodeURI(pkg_import_url)}"`, dynamic_export_script_blob = new Blob([dynamic_export_script], { type: "text/javascript" }), dynamic_export_script_url = URL.createObjectURL(dynamic_export_script_blob);
  await import(dynamic_export_script_url);
  return;
};

// src/plugins/mod.ts
var defaultDenoPluginsConfig = {
  initialPluginData: void 0,
  scanAncestralWorkspaces: false,
  log: false,
  logFor: ["npm", "resolver"],
  autoInstall: true,
  peerDependencies: {},
  nodeModulesDirs: [1 /* ABS_WORKING_DIR */],
  globalImportMap: {},
  getCwd: defaultGetCwd,
  acceptNamespaces: defaultEsbuildNamespaces
};
var denoPlugins = (config) => {
  const { acceptNamespaces, autoInstall, getCwd, globalImportMap, log, logFor, peerDependencies, nodeModulesDirs, initialPluginData, scanAncestralWorkspaces } = { ...defaultDenoPluginsConfig, ...config }, resolvePath = resolveResourcePathFactory(getCwd, isAbsolutePath2);
  return [
    entryPlugin({ initialPluginData, scanAncestralWorkspaces, acceptNamespaces }),
    httpPlugin({ acceptNamespaces, log: logFor.includes("http") ? log : false }),
    jsrPlugin({ acceptNamespaces }),
    npmPlugin({ acceptNamespaces, autoInstall, peerDependencies, nodeModulesDirs, log: logFor.includes("npm") ? log : false }),
    resolverPlugin({
      log: logFor.includes("resolver") ? log : false,
      importMap: { globalImportMap },
      relativePath: { resolvePath }
    })
  ];
};
export {
  DIRECTORY,
  allEsbuildLoaders,
  arrayLogger,
  arrayLoggerHistory,
  defaultEsbuildNamespaces,
  denoPlugins,
  entryPlugin,
  httpPlugin,
  jsrPlugin,
  logLogger,
  npmPlugin,
  resolverPlugin
};
