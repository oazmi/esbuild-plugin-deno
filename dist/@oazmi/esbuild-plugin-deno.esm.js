// node_modules/@oazmi/kitchensink/esm/_dnt.polyfills.js
function findLastIndex(self, callbackfn, that) {
  const boundFunc = that === void 0 ? callbackfn : callbackfn.bind(that);
  let index = self.length - 1;
  while (index >= 0) {
    const result = boundFunc(self[index], index, self);
    if (result) {
      return index;
    }
    index--;
  }
  return -1;
}
function findLast(self, callbackfn, that) {
  const index = self.findLastIndex(callbackfn, that);
  return index === -1 ? void 0 : self[index];
}
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function(callbackfn, that) {
    return findLastIndex(this, callbackfn, that);
  };
}
if (!Array.prototype.findLast) {
  Array.prototype.findLast = function(callbackfn, that) {
    return findLast(this, callbackfn, that);
  };
}
if (!Uint8Array.prototype.findLastIndex) {
  Uint8Array.prototype.findLastIndex = function(callbackfn, that) {
    return findLastIndex(this, callbackfn, that);
  };
}
if (!Uint8Array.prototype.findLast) {
  Uint8Array.prototype.findLast = function(callbackfn, that) {
    return findLast(this, callbackfn, that);
  };
}

// node_modules/@oazmi/kitchensink/esm/_dnt.shims.js
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

// node_modules/@oazmi/kitchensink/esm/alias.js
var json_constructor = JSON;
var object_constructor = Object;
var symbol_constructor = Symbol;
var json_stringify = /* @__PURE__ */ (() => json_constructor.stringify)();
var object_assign = /* @__PURE__ */ (() => object_constructor.assign)();
var object_entries = /* @__PURE__ */ (() => object_constructor.entries)();
var object_keys = /* @__PURE__ */ (() => object_constructor.keys)();
var symbol_iterator = /* @__PURE__ */ (() => symbol_constructor.iterator)();
var symbol_toStringTag = /* @__PURE__ */ (() => symbol_constructor.toStringTag)();
var dom_encodeURI = encodeURI;
var dom_decodeURI = decodeURI;

// node_modules/@oazmi/kitchensink/esm/deps.js
var DEBUG;
(function(DEBUG3) {
  DEBUG3[DEBUG3["LOG"] = 0] = "LOG";
  DEBUG3[DEBUG3["ASSERT"] = 0] = "ASSERT";
  DEBUG3[DEBUG3["ERROR"] = 1] = "ERROR";
  DEBUG3[DEBUG3["PRODUCTION"] = 1] = "PRODUCTION";
  DEBUG3[DEBUG3["MINIFY"] = 1] = "MINIFY";
})(DEBUG || (DEBUG = {}));

// node_modules/@oazmi/kitchensink/esm/binder.js
var bindMethodFactoryByName = (instance, method_name, ...args) => {
  return (thisArg) => {
    return instance[method_name].bind(thisArg, ...args);
  };
};
var bindMethodToSelfByName = (self, method_name, ...args) => self[method_name].bind(self, ...args);
var prototypeOfClass = (cls) => {
  return cls.prototype;
};
var map_proto = /* @__PURE__ */ prototypeOfClass(Map);
var set_proto = /* @__PURE__ */ prototypeOfClass(Set);
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

// node_modules/@oazmi/kitchensink/esm/struct.js
var isComplex = (obj) => {
  const obj_type = typeof obj;
  return obj_type === "object" || obj_type === "function";
};
var isObject = (obj) => {
  return typeof obj === "object";
};
var isString = (obj) => {
  return typeof obj === "string";
};

// node_modules/@oazmi/kitchensink/esm/stringman.js
var escapeLiteralCharsRegex = /[.*+?^${}()|[\]\\]/g;
var escapeLiteralStringForRegex = (str) => str.replaceAll(escapeLiteralCharsRegex, "\\$&");
var replacePrefix = (input, prefix, value = "") => {
  return input.startsWith(prefix) ? value + input.slice(prefix.length) : void 0;
};
var replaceSuffix = (input, suffix, value = "") => {
  return input.endsWith(suffix) ? (suffix === "" ? input : input.slice(0, -suffix.length)) + value : void 0;
};

// node_modules/@oazmi/kitchensink/esm/pathman.js
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
    throw new Error(DEBUG.ERROR ? "invalid package url format was provided: " + url_href : "");
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
  if (isString(base)) {
    const base_scheme = getUriScheme(base);
    if (forbiddenBaseUriSchemes.includes(base_scheme)) {
      throw new Error(DEBUG.ERROR ? "the following base scheme (url-protocol) is not supported: " + base_scheme : "");
    }
    base_url = resolveAsUrl(base);
  }
  const path_scheme = getUriScheme(path), path_is_package = packageUriSchemes.includes(path_scheme);
  if (path_scheme === "local") {
    return new URL("file://" + dom_encodeURI(path));
  } else if (path_is_package) {
    return new URL(parsePackageUrl(path).href);
  } else if (path_scheme === "relative") {
    const base_protocol = base_url ? base_url.protocol : void 0, base_is_package = packageUriProtocols.includes(base_protocol);
    if (!base_is_package) {
      return new URL(dom_encodeURI(path), base_url);
    }
    const { protocol, host, pathname } = parsePackageUrl(base_url), full_pathname = new URL(path, "x:" + pathname).pathname, href = `${protocol}/${host}${full_pathname}`;
    path = href;
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
var joinPosixPaths = (...segments) => {
  segments = segments.map((segment) => {
    return segment === "." ? dotslash : segment === ".." ? dotdotslash : segment;
  });
  const concatenatible_segments = segments.reduce((concatenatible_full_path, segment) => {
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
  }, [sep]);
  concatenatible_segments.shift();
  return normalizePosixPath(concatenatible_segments.join(""));
};
var joinPaths = (...segments) => {
  return joinPosixPaths(...segments.map(pathToPosixPath));
};
var resolvePosixPathFactory = (absolute_current_dir, absolute_segment_test_fn = isAbsolutePath) => {
  const getCwdPath = isString(absolute_current_dir) ? () => absolute_current_dir : absolute_current_dir;
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
  const getCwdPath = isString(absolute_current_dir) ? () => absolute_current_dir : () => pathToPosixPath(absolute_current_dir()), posix_path_resolver = resolvePosixPathFactory(getCwdPath, absolute_segment_test_fn);
  return (...segments) => posix_path_resolver(...segments.map(pathToPosixPath));
};

// node_modules/@oazmi/kitchensink/esm/crossenv.js
var RUNTIME;
(function(RUNTIME2) {
  RUNTIME2[RUNTIME2["DENO"] = 0] = "DENO";
  RUNTIME2[RUNTIME2["BUN"] = 1] = "BUN";
  RUNTIME2[RUNTIME2["NODE"] = 2] = "NODE";
  RUNTIME2[RUNTIME2["CHROMIUM"] = 3] = "CHROMIUM";
  RUNTIME2[RUNTIME2["EXTENSION"] = 4] = "EXTENSION";
  RUNTIME2[RUNTIME2["WEB"] = 5] = "WEB";
  RUNTIME2[RUNTIME2["WORKER"] = 6] = "WORKER";
})(RUNTIME || (RUNTIME = {}));
var global_this_object = dntGlobalThis;
var currentRuntimeValidationFnMap = {
  [RUNTIME.DENO]: () => global_this_object.Deno?.version ? true : false,
  [RUNTIME.BUN]: () => global_this_object.Bun?.version ? true : false,
  [RUNTIME.NODE]: () => global_this_object.process?.versions ? true : false,
  [RUNTIME.CHROMIUM]: () => global_this_object.chrome?.runtime ? true : false,
  [RUNTIME.EXTENSION]: () => global_this_object.browser?.runtime ? true : false,
  [RUNTIME.WEB]: () => global_this_object.window?.document ? true : false,
  [RUNTIME.WORKER]: () => isObject(global_this_object.self) && isComplex(global_this_object.WorkerGlobalScope) && global_this_object.self instanceof global_this_object.WorkerGlobalScope ? true : false
};
var ordered_runtime_checklist = [
  RUNTIME.DENO,
  RUNTIME.BUN,
  RUNTIME.NODE,
  RUNTIME.CHROMIUM,
  RUNTIME.EXTENSION,
  RUNTIME.WEB,
  RUNTIME.WORKER
];
var identifyCurrentRuntime = () => {
  for (const runtime of ordered_runtime_checklist) {
    if (currentRuntimeValidationFnMap[runtime]()) {
      return runtime;
    }
  }
  throw new Error(DEBUG.ERROR ? `failed to detect current javascript runtime!
please report this issue to "https://github.com/omar-azmi/kitchensink_ts/issues", along with information on your runtime environment.` : "");
};
var getRuntime = (runtime_enum) => {
  switch (runtime_enum) {
    case RUNTIME.DENO:
      return global_this_object.Deno;
    case RUNTIME.BUN:
      return global_this_object.Bun;
    case RUNTIME.NODE:
      return global_this_object.process;
    case RUNTIME.CHROMIUM:
      return global_this_object.chrome;
    case RUNTIME.EXTENSION:
      return global_this_object.browser;
    case RUNTIME.WEB:
      return global_this_object.window;
    case RUNTIME.WORKER:
      return global_this_object.self;
    default:
      throw new Error(DEBUG.ERROR ? `an invalid runtime enum was provided: "${runtime_enum}".` : "");
  }
};
var getRuntimeCwd = (runtime_enum, current_path = true) => {
  const runtime = getRuntime(runtime_enum);
  if (!runtime) {
    throw new Error(DEBUG.ERROR ? `the requested runtime associated with the enum "${runtime_enum}" is undefined (i.e. you're running on a different runtime from the provided enum).` : "");
  }
  switch (runtime_enum) {
    case RUNTIME.DENO:
    case RUNTIME.BUN:
    case RUNTIME.NODE:
      return pathToPosixPath(runtime.cwd());
    case RUNTIME.CHROMIUM:
    case RUNTIME.EXTENSION:
      return runtime.runtime.getURL("");
    case RUNTIME.WEB:
    case RUNTIME.WORKER:
      return new URL("./", current_path ? runtime.location.href : runtime.location.origin).href;
  }
};

// node_modules/@oazmi/kitchensink/esm/collections.js
var invertMap = (forward_map) => {
  const reverse_map_keys = [];
  forward_map.forEach((rset) => {
    reverse_map_keys.push(...rset);
  });
  const reverse_map = new Map([...new Set(reverse_map_keys)].map((rkey) => [rkey, /* @__PURE__ */ new Set()])), get_reverse_map = bind_map_get(reverse_map);
  for (const [fkey, rset] of forward_map) {
    rset.forEach((rkey) => get_reverse_map(rkey).add(fkey));
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
var TREE_VALUE_UNSET = /* @__PURE__ */ Symbol(DEBUG.MINIFY || "represents an unset value for a tree");

// node_modules/@std/jsonc/parse.js
function parse(text) {
  if (new.target) {
    throw new TypeError("Cannot create an instance: parse is not a constructor");
  }
  return new JSONCParser(text).parse();
}
var JSONCParser = class {
  #whitespace = new Set(" 	\r\n");
  #numberEndToken = /* @__PURE__ */ new Set([
    ..."[]{}:,/",
    ...this.#whitespace
  ]);
  #text;
  #length;
  #tokenized;
  constructor(text) {
    this.#text = `${text}`;
    this.#length = this.#text.length;
    this.#tokenized = this.#tokenize();
  }
  parse() {
    const token = this.#getNext();
    const res = this.#parseJsonValue(token);
    const { done, value } = this.#tokenized.next();
    if (!done) {
      throw new SyntaxError(buildErrorMessage(value));
    }
    return res;
  }
  /** Read the next token. If the token is read to the end, it throws a SyntaxError. */
  #getNext() {
    const { done, value } = this.#tokenized.next();
    if (done) {
      throw new SyntaxError("Cannot parse JSONC: unexpected end of JSONC input");
    }
    return value;
  }
  /** Split the JSONC string into token units. Whitespace and comments are skipped. */
  *#tokenize() {
    for (let i = 0; i < this.#length; i++) {
      if (this.#whitespace.has(this.#text[i])) {
        continue;
      }
      if (this.#text[i] === "/" && this.#text[i + 1] === "*") {
        i += 2;
        let hasEndOfComment = false;
        for (; i < this.#length; i++) {
          if (this.#text[i] === "*" && this.#text[i + 1] === "/") {
            hasEndOfComment = true;
            break;
          }
        }
        if (!hasEndOfComment) {
          throw new SyntaxError("Cannot parse JSONC: unexpected end of JSONC input");
        }
        i++;
        continue;
      }
      if (this.#text[i] === "/" && this.#text[i + 1] === "/") {
        i += 2;
        for (; i < this.#length; i++) {
          if (this.#text[i] === "\n" || this.#text[i] === "\r") {
            break;
          }
        }
        continue;
      }
      switch (this.#text[i]) {
        case "{":
          yield {
            type: "BeginObject",
            position: i
          };
          break;
        case "}":
          yield {
            type: "EndObject",
            position: i
          };
          break;
        case "[":
          yield {
            type: "BeginArray",
            position: i
          };
          break;
        case "]":
          yield {
            type: "EndArray",
            position: i
          };
          break;
        case ":":
          yield {
            type: "NameSeparator",
            position: i
          };
          break;
        case ",":
          yield {
            type: "ValueSeparator",
            position: i
          };
          break;
        case '"': {
          const startIndex = i;
          let shouldEscapeNext = false;
          i++;
          for (; i < this.#length; i++) {
            if (this.#text[i] === '"' && !shouldEscapeNext) {
              break;
            }
            shouldEscapeNext = this.#text[i] === "\\" && !shouldEscapeNext;
          }
          yield {
            type: "String",
            sourceText: this.#text.substring(startIndex, i + 1),
            position: startIndex
          };
          break;
        }
        default: {
          const startIndex = i;
          for (; i < this.#length; i++) {
            if (this.#numberEndToken.has(this.#text[i])) {
              break;
            }
          }
          i--;
          yield {
            type: "NullOrTrueOrFalseOrNumber",
            sourceText: this.#text.substring(startIndex, i + 1),
            position: startIndex
          };
        }
      }
    }
  }
  #parseJsonValue(value) {
    switch (value.type) {
      case "BeginObject":
        return this.#parseObject();
      case "BeginArray":
        return this.#parseArray();
      case "NullOrTrueOrFalseOrNumber":
        return this.#parseNullOrTrueOrFalseOrNumber(value);
      case "String":
        return this.#parseString(value);
      default:
        throw new SyntaxError(buildErrorMessage(value));
    }
  }
  #parseObject() {
    const target = {};
    while (true) {
      const token1 = this.#getNext();
      if (token1.type === "EndObject") {
        return target;
      }
      if (token1.type !== "String") {
        throw new SyntaxError(buildErrorMessage(token1));
      }
      const key = this.#parseString(token1);
      const token2 = this.#getNext();
      if (token2.type !== "NameSeparator") {
        throw new SyntaxError(buildErrorMessage(token2));
      }
      const token3 = this.#getNext();
      Object.defineProperty(target, key, {
        value: this.#parseJsonValue(token3),
        writable: true,
        enumerable: true,
        configurable: true
      });
      const token4 = this.#getNext();
      if (token4.type === "EndObject") {
        return target;
      }
      if (token4.type !== "ValueSeparator") {
        throw new SyntaxError(buildErrorMessage(token4));
      }
    }
  }
  #parseArray() {
    const target = [];
    while (true) {
      const token1 = this.#getNext();
      if (token1.type === "EndArray") {
        return target;
      }
      target.push(this.#parseJsonValue(token1));
      const token2 = this.#getNext();
      if (token2.type === "EndArray") {
        return target;
      }
      if (token2.type !== "ValueSeparator") {
        throw new SyntaxError(buildErrorMessage(token2));
      }
    }
  }
  #parseString(value) {
    let parsed;
    try {
      parsed = JSON.parse(value.sourceText);
    } catch {
      throw new SyntaxError(buildErrorMessage(value));
    }
    if (typeof parsed !== "string") {
      throw new TypeError(`Parsed value is not a string: ${parsed}`);
    }
    return parsed;
  }
  #parseNullOrTrueOrFalseOrNumber(value) {
    if (value.sourceText === "null") {
      return null;
    }
    if (value.sourceText === "true") {
      return true;
    }
    if (value.sourceText === "false") {
      return false;
    }
    let parsed;
    try {
      parsed = JSON.parse(value.sourceText);
    } catch {
      throw new SyntaxError(buildErrorMessage(value));
    }
    if (typeof parsed !== "number") {
      throw new TypeError(`Parsed value is not a number: ${parsed}`);
    }
    return parsed;
  }
};
function buildErrorMessage({ type, sourceText, position }) {
  let token = "";
  switch (type) {
    case "BeginObject":
      token = "{";
      break;
    case "EndObject":
      token = "}";
      break;
    case "BeginArray":
      token = "[";
      break;
    case "EndArray":
      token = "]";
      break;
    case "NameSeparator":
      token = ":";
      break;
    case "ValueSeparator":
      token = ",";
      break;
    case "NullOrTrueOrFalseOrNumber":
    case "String":
      token = 30 < sourceText.length ? `${sourceText.slice(0, 30)}...` : sourceText;
      break;
  }
  return `Cannot parse JSONC: unexpected token "${token}" in JSONC at position ${position}`;
}

// node_modules/@std/semver/_shared.js
function compareNumber(a, b) {
  if (isNaN(a) || isNaN(b)) {
    throw new Error("Cannot compare against non-numbers");
  }
  return a === b ? 0 : a < b ? -1 : 1;
}
function checkIdentifier(v1 = [], v2 = []) {
  if (v1.length && !v2.length) return -1;
  if (!v1.length && v2.length) return 1;
  return 0;
}
function compareIdentifier(v1 = [], v2 = []) {
  const length = Math.max(v1.length, v2.length);
  for (let i = 0; i < length; i++) {
    const a = v1[i];
    const b = v2[i];
    if (a === void 0 && b === void 0) return 0;
    if (b === void 0) return 1;
    if (a === void 0) return -1;
    if (typeof a === "string" && typeof b === "number") return 1;
    if (typeof a === "number" && typeof b === "string") return -1;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}
var NUMERIC_IDENTIFIER = "0|[1-9]\\d*";
var NON_NUMERIC_IDENTIFIER = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";
var VERSION_CORE = `(?<major>${NUMERIC_IDENTIFIER})\\.(?<minor>${NUMERIC_IDENTIFIER})\\.(?<patch>${NUMERIC_IDENTIFIER})`;
var PRERELEASE_IDENTIFIER = `(?:${NUMERIC_IDENTIFIER}|${NON_NUMERIC_IDENTIFIER})`;
var PRERELEASE = `(?:-(?<prerelease>${PRERELEASE_IDENTIFIER}(?:\\.${PRERELEASE_IDENTIFIER})*))`;
var BUILD_IDENTIFIER = "[0-9A-Za-z-]+";
var BUILD = `(?:\\+(?<buildmetadata>${BUILD_IDENTIFIER}(?:\\.${BUILD_IDENTIFIER})*))`;
var FULL_VERSION = `v?${VERSION_CORE}${PRERELEASE}?${BUILD}?`;
var FULL_REGEXP = new RegExp(`^${FULL_VERSION}$`);
var COMPARATOR = "(?:<|>)?=?";
var WILDCARD_IDENTIFIER = `x|X|\\*`;
var XRANGE_IDENTIFIER = `${NUMERIC_IDENTIFIER}|${WILDCARD_IDENTIFIER}`;
var XRANGE = `[v=\\s]*(?<major>${XRANGE_IDENTIFIER})(?:\\.(?<minor>${XRANGE_IDENTIFIER})(?:\\.(?<patch>${XRANGE_IDENTIFIER})${PRERELEASE}?${BUILD}?)?)?`;
var OPERATOR_XRANGE_REGEXP = new RegExp(`^(?<operator>~>?|\\^|${COMPARATOR})\\s*${XRANGE}$`);
var COMPARATOR_REGEXP = new RegExp(`^(?<operator>${COMPARATOR})\\s*(${FULL_VERSION})$|^$`);
function isValidNumber(value) {
  return typeof value === "number" && !Number.isNaN(value) && (!Number.isFinite(value) || 0 <= value && value <= Number.MAX_SAFE_INTEGER);
}
var MAX_LENGTH = 256;
var NUMERIC_IDENTIFIER_REGEXP = new RegExp(`^${NUMERIC_IDENTIFIER}$`);
function parsePrerelease(prerelease) {
  return prerelease.split(".").filter(Boolean).map((id) => {
    if (NUMERIC_IDENTIFIER_REGEXP.test(id)) {
      const number = Number(id);
      if (isValidNumber(number)) return number;
    }
    return id;
  });
}
function parseBuild(buildmetadata) {
  return buildmetadata.split(".").filter(Boolean);
}
function parseNumber(input, errorMessage) {
  const number = Number(input);
  if (!isValidNumber(number)) throw new TypeError(errorMessage);
  return number;
}
function isWildcardComparator(c) {
  return Number.isNaN(c.major) && Number.isNaN(c.minor) && Number.isNaN(c.patch) && (c.prerelease === void 0 || c.prerelease.length === 0) && (c.build === void 0 || c.build.length === 0);
}

// node_modules/@std/semver/compare.js
function compare(version1, version2) {
  if (version1 === version2) return 0;
  return compareNumber(version1.major, version2.major) || compareNumber(version1.minor, version2.minor) || compareNumber(version1.patch, version2.patch) || checkIdentifier(version1.prerelease, version2.prerelease) || compareIdentifier(version1.prerelease, version2.prerelease);
}

// node_modules/@std/semver/format.js
function formatNumber(value) {
  return value.toFixed(0);
}
function format(version) {
  const major = formatNumber(version.major);
  const minor = formatNumber(version.minor);
  const patch = formatNumber(version.patch);
  const pre = version.prerelease?.join(".") ?? "";
  const build = version.build?.join(".") ?? "";
  const primary = `${major}.${minor}.${patch}`;
  const release = [
    primary,
    pre
  ].filter((v) => v).join("-");
  return [
    release,
    build
  ].filter((v) => v).join("+");
}

// node_modules/@std/semver/_test_comparator_set.js
function testComparator(version, comparator) {
  if (isWildcardComparator(comparator)) {
    return true;
  }
  const cmp = compare(version, comparator);
  switch (comparator.operator) {
    case "=":
    case void 0: {
      return cmp === 0;
    }
    case "!=": {
      return cmp !== 0;
    }
    case ">": {
      return cmp > 0;
    }
    case "<": {
      return cmp < 0;
    }
    case ">=": {
      return cmp >= 0;
    }
    case "<=": {
      return cmp <= 0;
    }
  }
}
function testComparatorSet(version, set) {
  for (const comparator of set) {
    if (!testComparator(version, comparator)) {
      return false;
    }
  }
  if (version.prerelease && version.prerelease.length > 0) {
    for (const comparator of set) {
      if (isWildcardComparator(comparator)) {
        continue;
      }
      const { major, minor, patch, prerelease } = comparator;
      if (prerelease && prerelease.length > 0) {
        if (version.major === major && version.minor === minor && version.patch === patch) {
          return true;
        }
      }
    }
    return false;
  }
  return true;
}

// node_modules/@std/semver/satisfies.js
function satisfies(version, range) {
  return range.some((set) => testComparatorSet(version, set));
}

// node_modules/@std/semver/_constants.js
var ANY = {
  major: Number.NaN,
  minor: Number.NaN,
  patch: Number.NaN,
  prerelease: [],
  build: []
};
var ALL = {
  operator: void 0,
  ...ANY
};

// node_modules/@std/semver/greater_than.js
function greaterThan(version1, version2) {
  return compare(version1, version2) > 0;
}

// node_modules/@std/semver/max_satisfying.js
function maxSatisfying(versions, range) {
  let max2;
  for (const version of versions) {
    if (!satisfies(version, range)) continue;
    max2 = max2 && greaterThan(max2, version) ? max2 : version;
  }
  return max2;
}

// node_modules/@std/semver/parse_range.js
function parseComparator(comparator) {
  const match = comparator.match(COMPARATOR_REGEXP);
  const groups = match?.groups;
  if (!groups) return null;
  const { operator, prerelease, buildmetadata } = groups;
  const semver = groups.major ? {
    major: parseNumber(groups.major, `Cannot parse comparator ${comparator}: invalid major version`),
    minor: parseNumber(groups.minor, `Cannot parse comparator ${comparator}: invalid minor version`),
    patch: parseNumber(groups.patch, `Cannot parse comparator ${comparator}: invalid patch version`),
    prerelease: prerelease ? parsePrerelease(prerelease) : [],
    build: buildmetadata ? parseBuild(buildmetadata) : []
  } : ANY;
  return {
    operator: operator || void 0,
    ...semver
  };
}
function isWildcard(id) {
  return !id || id.toLowerCase() === "x" || id === "*";
}
function handleLeftHyphenRangeGroups(leftGroup) {
  if (isWildcard(leftGroup.major)) return;
  if (isWildcard(leftGroup.minor)) {
    return {
      operator: ">=",
      major: +leftGroup.major,
      minor: 0,
      patch: 0,
      prerelease: [],
      build: []
    };
  }
  if (isWildcard(leftGroup.patch)) {
    return {
      operator: ">=",
      major: +leftGroup.major,
      minor: +leftGroup.minor,
      patch: 0,
      prerelease: [],
      build: []
    };
  }
  return {
    operator: ">=",
    major: +leftGroup.major,
    minor: +leftGroup.minor,
    patch: +leftGroup.patch,
    prerelease: leftGroup.prerelease ? parsePrerelease(leftGroup.prerelease) : [],
    build: []
  };
}
function handleRightHyphenRangeGroups(rightGroups) {
  if (isWildcard(rightGroups.major)) {
    return;
  }
  if (isWildcard(rightGroups.minor)) {
    return {
      operator: "<",
      major: +rightGroups.major + 1,
      minor: 0,
      patch: 0,
      prerelease: [],
      build: []
    };
  }
  if (isWildcard(rightGroups.patch)) {
    return {
      operator: "<",
      major: +rightGroups.major,
      minor: +rightGroups.minor + 1,
      patch: 0,
      prerelease: [],
      build: []
    };
  }
  if (rightGroups.prerelease) {
    return {
      operator: "<=",
      major: +rightGroups.major,
      minor: +rightGroups.minor,
      patch: +rightGroups.patch,
      prerelease: parsePrerelease(rightGroups.prerelease),
      build: []
    };
  }
  return {
    operator: "<=",
    major: +rightGroups.major,
    minor: +rightGroups.minor,
    patch: +rightGroups.patch,
    prerelease: [],
    build: []
  };
}
function parseHyphenRange(range) {
  const leftMatch = range.match(new RegExp(`^${XRANGE}`));
  const leftGroup = leftMatch?.groups;
  if (!leftGroup) return null;
  const leftLength = leftMatch[0].length;
  const hyphenMatch = range.slice(leftLength).match(/^\s+-\s+/);
  if (!hyphenMatch) return null;
  const hyphenLength = hyphenMatch[0].length;
  const rightMatch = range.slice(leftLength + hyphenLength).match(new RegExp(`^${XRANGE}\\s*$`));
  const rightGroups = rightMatch?.groups;
  if (!rightGroups) return null;
  const from = handleLeftHyphenRangeGroups(leftGroup);
  const to = handleRightHyphenRangeGroups(rightGroups);
  return [
    from,
    to
  ].filter(Boolean);
}
function handleCaretOperator(groups) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);
  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;
  if (majorIsWildcard) return [
    ALL
  ];
  if (minorIsWildcard) {
    return [
      {
        operator: ">=",
        major,
        minor: 0,
        patch: 0
      },
      {
        operator: "<",
        major: major + 1,
        minor: 0,
        patch: 0
      }
    ];
  }
  if (patchIsWildcard) {
    if (major === 0) {
      return [
        {
          operator: ">=",
          major,
          minor,
          patch: 0
        },
        {
          operator: "<",
          major,
          minor: minor + 1,
          patch: 0
        }
      ];
    }
    return [
      {
        operator: ">=",
        major,
        minor,
        patch: 0
      },
      {
        operator: "<",
        major: major + 1,
        minor: 0,
        patch: 0
      }
    ];
  }
  const prerelease = parsePrerelease(groups.prerelease ?? "");
  if (major === 0) {
    if (minor === 0) {
      return [
        {
          operator: ">=",
          major,
          minor,
          patch,
          prerelease
        },
        {
          operator: "<",
          major,
          minor,
          patch: patch + 1
        }
      ];
    }
    return [
      {
        operator: ">=",
        major,
        minor,
        patch,
        prerelease
      },
      {
        operator: "<",
        major,
        minor: minor + 1,
        patch: 0
      }
    ];
  }
  return [
    {
      operator: ">=",
      major,
      minor,
      patch,
      prerelease
    },
    {
      operator: "<",
      major: major + 1,
      minor: 0,
      patch: 0
    }
  ];
}
function handleTildeOperator(groups) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);
  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;
  if (majorIsWildcard) return [
    ALL
  ];
  if (minorIsWildcard) {
    return [
      {
        operator: ">=",
        major,
        minor: 0,
        patch: 0
      },
      {
        operator: "<",
        major: major + 1,
        minor: 0,
        patch: 0
      }
    ];
  }
  if (patchIsWildcard) {
    return [
      {
        operator: ">=",
        major,
        minor,
        patch: 0
      },
      {
        operator: "<",
        major,
        minor: minor + 1,
        patch: 0
      }
    ];
  }
  const prerelease = parsePrerelease(groups.prerelease ?? "");
  return [
    {
      operator: ">=",
      major,
      minor,
      patch,
      prerelease
    },
    {
      operator: "<",
      major,
      minor: minor + 1,
      patch: 0
    }
  ];
}
function handleLessThanOperator(groups) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);
  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;
  if (majorIsWildcard) return [
    {
      operator: "<",
      major: 0,
      minor: 0,
      patch: 0
    }
  ];
  if (minorIsWildcard) {
    if (patchIsWildcard) return [
      {
        operator: "<",
        major,
        minor: 0,
        patch: 0
      }
    ];
    return [
      {
        operator: "<",
        major,
        minor: 0,
        patch: 0
      }
    ];
  }
  if (patchIsWildcard) return [
    {
      operator: "<",
      major,
      minor,
      patch: 0
    }
  ];
  const prerelease = parsePrerelease(groups.prerelease ?? "");
  const build = parseBuild(groups.build ?? "");
  return [
    {
      operator: "<",
      major,
      minor,
      patch,
      prerelease,
      build
    }
  ];
}
function handleLessThanOrEqualOperator(groups) {
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);
  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;
  if (minorIsWildcard) {
    if (patchIsWildcard) {
      return [
        {
          operator: "<",
          major: major + 1,
          minor: 0,
          patch: 0
        }
      ];
    }
    return [
      {
        operator: "<",
        major,
        minor: minor + 1,
        patch: 0
      }
    ];
  }
  if (patchIsWildcard) {
    return [
      {
        operator: "<",
        major,
        minor: minor + 1,
        patch: 0
      }
    ];
  }
  const prerelease = parsePrerelease(groups.prerelease ?? "");
  const build = parseBuild(groups.build ?? "");
  return [
    {
      operator: "<=",
      major,
      minor,
      patch,
      prerelease,
      build
    }
  ];
}
function handleGreaterThanOperator(groups) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);
  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;
  if (majorIsWildcard) return [
    {
      operator: "<",
      major: 0,
      minor: 0,
      patch: 0
    }
  ];
  if (minorIsWildcard) {
    return [
      {
        operator: ">=",
        major: major + 1,
        minor: 0,
        patch: 0
      }
    ];
  }
  if (patchIsWildcard) {
    return [
      {
        operator: ">=",
        major,
        minor: minor + 1,
        patch: 0
      }
    ];
  }
  const prerelease = parsePrerelease(groups.prerelease ?? "");
  const build = parseBuild(groups.build ?? "");
  return [
    {
      operator: ">",
      major,
      minor,
      patch,
      prerelease,
      build
    }
  ];
}
function handleGreaterOrEqualOperator(groups) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);
  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;
  if (majorIsWildcard) return [
    ALL
  ];
  if (minorIsWildcard) {
    if (patchIsWildcard) return [
      {
        operator: ">=",
        major,
        minor: 0,
        patch: 0
      }
    ];
    return [
      {
        operator: ">=",
        major,
        minor: 0,
        patch: 0
      }
    ];
  }
  if (patchIsWildcard) return [
    {
      operator: ">=",
      major,
      minor,
      patch: 0
    }
  ];
  const prerelease = parsePrerelease(groups.prerelease ?? "");
  const build = parseBuild(groups.build ?? "");
  return [
    {
      operator: ">=",
      major,
      minor,
      patch,
      prerelease,
      build
    }
  ];
}
function handleEqualOperator(groups) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);
  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;
  if (majorIsWildcard) return [
    ALL
  ];
  if (minorIsWildcard) {
    return [
      {
        operator: ">=",
        major,
        minor: 0,
        patch: 0
      },
      {
        operator: "<",
        major: major + 1,
        minor: 0,
        patch: 0
      }
    ];
  }
  if (patchIsWildcard) {
    return [
      {
        operator: ">=",
        major,
        minor,
        patch: 0
      },
      {
        operator: "<",
        major,
        minor: minor + 1,
        patch: 0
      }
    ];
  }
  const prerelease = parsePrerelease(groups.prerelease ?? "");
  const build = parseBuild(groups.build ?? "");
  return [
    {
      operator: void 0,
      major,
      minor,
      patch,
      prerelease,
      build
    }
  ];
}
function parseOperatorRange(string) {
  const groups = string.match(OPERATOR_XRANGE_REGEXP)?.groups;
  if (!groups) return parseComparator(string);
  switch (groups.operator) {
    case "^":
      return handleCaretOperator(groups);
    case "~":
    case "~>":
      return handleTildeOperator(groups);
    case "<":
      return handleLessThanOperator(groups);
    case "<=":
      return handleLessThanOrEqualOperator(groups);
    case ">":
      return handleGreaterThanOperator(groups);
    case ">=":
      return handleGreaterOrEqualOperator(groups);
    case "=":
    case "":
      return handleEqualOperator(groups);
    default:
      throw new Error(`Cannot parse version range: '${groups.operator}' is not a valid operator`);
  }
}
function parseOperatorRanges(string) {
  return string.split(/\s+/).flatMap(parseOperatorRange);
}
function parseRange(value) {
  const result = value.replaceAll(/(?<=<|>|=|~|\^)(\s+)/g, "").split(/\s*\|\|\s*/).map((string) => parseHyphenRange(string) || parseOperatorRanges(string));
  if (result.some((r) => r.includes(null))) {
    throw new TypeError(`Cannot parse version range: range "${value}" is invalid`);
  }
  return result;
}

// node_modules/@std/semver/parse.js
function parse2(value) {
  if (typeof value !== "string") {
    throw new TypeError(`Cannot parse version as version must be a string: received ${typeof value}`);
  }
  if (value.length > MAX_LENGTH) {
    throw new TypeError(`Cannot parse version as version length is too long: length is ${value.length}, max length is ${MAX_LENGTH}`);
  }
  value = value.trim();
  const groups = value.match(FULL_REGEXP)?.groups;
  if (!groups) throw new TypeError(`Cannot parse version: ${value}`);
  const major = parseNumber(groups.major, `Cannot parse version ${value}: invalid major version`);
  const minor = parseNumber(groups.minor, `Cannot parse version ${value}: invalid minor version`);
  const patch = parseNumber(groups.patch, `Cannot parse version ${value}: invalid patch version`);
  const prerelease = groups.prerelease ? parsePrerelease(groups.prerelease) : [];
  const build = groups.buildmetadata ? parseBuild(groups.buildmetadata) : [];
  return {
    major,
    minor,
    patch,
    prerelease,
    build
  };
}

// src/deps.ts
var isAbsolutePath2 = (segment) => {
  const scheme = getUriScheme(segment) ?? "relative";
  return scheme !== "relative";
};
var defaultFetchConfig = { redirect: "follow", cache: "force-cache" };
var defaultGetCwd = /* @__PURE__ */ getRuntimeCwd(identifyCurrentRuntime(), true);
var defaultResolvePath = /* @__PURE__ */ resolvePathFactory(defaultGetCwd, isAbsolutePath2);

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
  let { baseAliasDir, basePathDir, errorCheck, sort } = { ...defaultResolvePathFromImportMapEntriesConfig, ...config };
  baseAliasDir = replaceSuffix(baseAliasDir, "/") ?? baseAliasDir;
  basePathDir = replaceSuffix(basePathDir, "/") ?? basePathDir;
  const unprefixed_path_alias = replacePrefix(normalizePath(path_alias), baseAliasDir), relative_path_alias = unprefixed_path_alias === "" || baseAliasDir !== "" && unprefixed_path_alias?.startsWith("/") ? "." + unprefixed_path_alias : unprefixed_path_alias;
  if (relative_path_alias === void 0) {
    return resolvePathFromImportMapEntries(path_alias, import_map_entries, { baseAliasDir: "", basePathDir, errorCheck, sort });
  }
  if (sort) {
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
  "ts": [".ts"],
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

// src/plugins/funcdefs.ts
var onResolveFactory = (config) => {
  const { isAbsolutePath: isAbsolutePath3, namespace: plugin_ns, resolvePath, log: log2 = false, globalImportMap = {} } = config;
  return async (args) => {
    const { path, resolveDir, importer, namespace, pluginData = {} } = args, originalNamespace = namespace, importMap = { ...globalImportMap, ...pluginData.importMap }, runtimePackage = pluginData.runtimePackage;
    let resolved_path = void 0;
    if (runtimePackage && !path.startsWith("./") && !path.startsWith("../")) {
      resolved_path = runtimePackage.resolveImport(path);
    }
    if (resolved_path === void 0) {
      resolved_path = resolvePathFromImportMap(path, importMap);
    }
    if (resolved_path === void 0) {
      const dir = isAbsolutePath3(importer) ? importer : joinPaths(ensureEndSlash(resolveDir), importer);
      resolved_path = isAbsolutePath3(path) ? pathToPosixPath(path) : resolvePath(dir, ensureStartDotSlash(path));
    }
    if (1 /* LOG */ && log2) {
      console.log(`[${plugin_ns}] onResolve:`, { path, resolved_path, resolveDir, args, importMap });
    }
    return {
      path: resolved_path,
      namespace: plugin_ns,
      // TODO: should I also embed `importMap` into `pluginData` after `...pluginData`?
      //   doing so would let us propagate our `globalImportMap` to all dependencies,
      //   without them needing to be resolved specifically by _this_ resolver function.
      //   but it may have unintended consequences, so I'll leave it out for now.
      // NOTICE: I am intentionally letting any potential `pluginData.originalNamespace` overwrite the `originalNamespace` variable.
      //   this is because I want the very first namespace to persevere even if the current `path` that is currently being resolved
      //   goes through several recursive calls (i.e. ping-pongs) between `onResolveFactory`s and `unResolveFactory`s.
      pluginData: { originalNamespace, ...pluginData }
    };
  };
};
var unResolveFactory = (config, build) => {
  const { log: log2, namespace: plugin_ns } = config, on_resolve_fn = onResolveFactory({ ...config, log: false, namespace: "oazmi-unresolver-namespace-does-not-matter" });
  return async (args) => {
    const {
      path,
      namespace: _0,
      pluginData: {
        importMap,
        runtimePackage,
        originalNamespace: namespace,
        ...restPluginData
      } = {},
      ...rest_args
    } = args;
    const {
      path: resolved_abs_path,
      namespace: _1,
      pluginData: _2,
      ...rest_resolved_args
    } = await on_resolve_fn({ path, namespace, ...rest_args, pluginData: { importMap, runtimePackage } });
    const naturally_resolved_result = await build.resolve(resolved_abs_path, {
      ...rest_args,
      namespace,
      pluginData: { importMap, runtimePackage, ...restPluginData }
    });
    if (1 /* LOG */ && log2) {
      console.log(`[${plugin_ns}] unResolve:`, { path, resolved_abs_path, naturally_resolved_result, rest_resolved_args });
    }
    return { ...rest_resolved_args, ...naturally_resolved_result };
  };
};
var all_esbuild_loaders = [
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
var urlLoaderFactory = (config) => {
  const { defaultLoader, namespace: plugin_ns, acceptLoaders = all_esbuild_loaders, log: log2 = false } = config, accept_loaders_set = new Set(acceptLoaders);
  return async (args) => {
    const { path, pluginData } = args, path_url = resolveAsUrl(path), response = await fetch(path_url, defaultFetchConfig);
    if (!response.ok) {
      throw new Error(`[${plugin_ns}] onLoadUrl: ERROR: network fetch response for url "${path_url.href}" was not ok (${response.status}). response header:
${json_stringify(response.headers)}`);
    }
    const guessed_loaders = guessHttpResponseLoaders(response), available_loaders = accept_loaders_set.intersection(guessed_loaders), preferred_loader = [...available_loaders].at(0) ?? defaultLoader, contents = await response.bytes();
    if (1 /* LOG */ && log2) {
      console.log(`[${plugin_ns}] onLoadUrl:`, { path, path_url: path_url.href, guessed_loaders, preferred_loader, args });
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

// src/plugins/http.ts
var defaultHttpPluginSetupConfig = {
  acceptLoaders: void 0,
  defaultLoader: "copy",
  filters: [/^https?\:\/\//, /^file\:\/\//],
  globalImportMap: void 0,
  namespace: "oazmi-http",
  resolvePath: defaultResolvePath
};
var httpPluginSetup = (config = {}) => {
  const { acceptLoaders, defaultLoader, filters, globalImportMap, namespace: plugin_ns, resolvePath } = { ...defaultHttpPluginSetupConfig, ...config }, pluginResolverConfig = { isAbsolutePath: isAbsolutePath2, namespace: plugin_ns, globalImportMap, resolvePath }, pluginLoaderConfig = { acceptLoaders, defaultLoader, namespace: plugin_ns };
  return async (build) => {
    const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions;
    filters.forEach((filter) => {
      build.onResolve({ filter }, onResolveFactory(pluginResolverConfig));
    });
    build.onLoad({ filter: /.*/, namespace: plugin_ns }, urlLoaderFactory(pluginLoaderConfig));
    build.onResolve({ filter: /.*/, namespace: plugin_ns }, unResolveFactory(pluginResolverConfig, build));
  };
};
var httpPlugin = (config) => {
  return {
    name: "oazmi-http-plugin",
    setup: httpPluginSetup(config)
  };
};

// src/plugins/importmap.ts
var CAPTURED_ALREADY = Symbol();
var defaultResolveImportMapFactoryConfig = {
  importMap: {},
  pluginDataMarker: CAPTURED_ALREADY,
  namespace: void 0
};
var defaultImportMapPluginSetupConfig = {
  filter: /.*/,
  inputNamespace: void 0,
  importMap: {},
  pluginDataMarker: void 0,
  outputNamespace: void 0
};
var onResolveImportMapFactory = (config, build) => {
  const { importMap, pluginDataMarker, namespace } = { ...defaultResolveImportMapFactoryConfig, ...config };
  return async (args) => {
    const {
      path,
      pluginData = {},
      ...rest_args
    } = args;
    if (pluginData[pluginDataMarker]) {
      return void 0;
    }
    pluginData[pluginDataMarker] = true;
    const resolved_path = resolvePathFromImportMap(path, importMap);
    if (resolved_path === void 0) {
      return void 0;
    }
    const resolved_result = await build.resolve(resolved_path, { pluginData, ...rest_args });
    if (namespace) {
      resolved_result.namespace = namespace;
    }
    return resolved_result;
  };
};
var importMapPluginSetup = (config = {}) => {
  const { filter, importMap, pluginDataMarker, inputNamespace, outputNamespace } = { ...defaultImportMapPluginSetupConfig, ...config }, pluginResolverConfig = { importMap, pluginDataMarker, namespace: outputNamespace };
  return async (build) => {
    const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions;
    build.onResolve({ filter, namespace: inputNamespace }, onResolveImportMapFactory(pluginResolverConfig, build));
  };
};
var importMapPlugin = (config) => {
  return {
    name: "oazmi-importmap-plugin",
    setup: importMapPluginSetup(config)
  };
};

// src/packageman/base.ts
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
    return resolvePathFromImportMapEntries(path_alias, this.importMapSortedEntries, { sort: false, ...config });
  }
  /** create an instance of this class by loading a package's json(c) file from a url or local file-system path.
   * 
   * > [!tip]
   * > the constructor uses a "JSONC" parser (from [@std/jsonc](https://jsr.io/@std/jsonc)) for the fetched files.
   * > therefore, you may provide links to ".jsonc" files, instead of parsing them yourself before calling the super constructor.
  */
  static async fromUrl(package_jsonc_path) {
    package_jsonc_path = resolveAsUrl(package_jsonc_path, defaultResolvePath());
    const package_object = parse(await (await fetch(package_jsonc_path, defaultFetchConfig)).text());
    return new this(package_object, package_jsonc_path.href);
  }
};

// node_modules/@oazmi/kitchensink/esm/lambda.js
var THROTTLE_REJECT = /* @__PURE__ */ Symbol(DEBUG.MINIFY || "a rejection by a throttled function");
var TIMEOUT = /* @__PURE__ */ Symbol(DEBUG.MINIFY || "a timeout by an awaited promiseTimeout function");
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

// src/packageman/deno.ts
var DenoPackage = class extends RuntimePackage {
  importMapSortedEntries;
  exportMapSortedEntries;
  getName() {
    return this.packageInfo.name;
  }
  getVersion() {
    return this.packageInfo.version;
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
    const name = this.getName(), version = this.getVersion(), package_json_path = pathToPosixPath(this.getPath()), {
      baseAliasDir = `jsr:${name}@${version}`,
      basePathDir = normalizePath(package_json_path.endsWith("/") ? package_json_path : package_json_path + "/../"),
      ...rest_config
    } = config ?? {}, residual_path_alias = replacePrefix(path_alias, baseAliasDir)?.replace(/^\/+/, "/");
    if (residual_path_alias !== void 0) {
      path_alias = baseAliasDir + (residual_path_alias === "/" ? "" : residual_path_alias);
    }
    return super.resolveExport(path_alias, { baseAliasDir, basePathDir, ...rest_config });
  }
  resolveImport(path_alias, config) {
    const name = this.getName(), version = this.getVersion(), path_alias_is_relative = path_alias.startsWith("./") || path_alias.startsWith("../"), local_package_reference_aliases = path_alias_is_relative ? [""] : [`jsr:${name}@${version}`, `jsr:${name}`, `${name}`];
    let locally_resolved_export = void 0;
    for (const base_alias_dir of local_package_reference_aliases) {
      locally_resolved_export = this.resolveExport(path_alias, { ...config, baseAliasDir: base_alias_dir });
      if (locally_resolved_export) {
        break;
      }
    }
    return locally_resolved_export ?? super.resolveImport(path_alias, config);
  }
  static async fromUrl(jsr_package) {
    const package_jsonc_path_str = isString(jsr_package) ? jsr_package : jsr_package.href, url_is_jsr_protocol = package_jsonc_path_str.startsWith("jsr:");
    if (url_is_jsr_protocol) {
      const { host } = parsePackageUrl(jsr_package);
      jsr_package = await memorized_jsrPackageToMetadataUrl(`jsr:${host}`);
    }
    return super.fromUrl(jsr_package);
  }
};
var jsr_base_url = "https://jsr.io";
var jsrPackageToMetadataUrl = async (jsr_package) => {
  const { protocol, scope, pkg, pathname, version: desired_semver } = parsePackageUrl(jsr_package);
  if (protocol !== "jsr:") {
    throw new Error(`expected path protocol to be "jsr:", found "${protocol}" instead, for package: "${jsr_package}"`);
  }
  if (!scope) {
    throw new Error(`expected jsr package to contain a scope, but found "${scope}" instead, for package: "${jsr_package}"`);
  }
  const meta_json_url = resolveAsUrl(`@${scope}/${pkg}/meta.json`, jsr_base_url), meta_json = await (await fetch(meta_json_url, defaultFetchConfig)).json(), unyanked_versions = object_entries(meta_json.versions).filter(([version_str, { yanked }]) => !yanked).map(([version_str]) => parse2(version_str));
  const resolved_semver = maxSatisfying(unyanked_versions, parseRange(desired_semver ?? meta_json.latest));
  if (!resolved_semver) {
    throw new Error(`failed to find the desired version "${desired_semver}" of the jsr package "${jsr_package}", with available versions "${json_stringify(meta_json.versions)}"`);
  }
  const resolved_version = format(resolved_semver), base_host = resolveAsUrl(`@${scope}/${pkg}/${resolved_version}/`, jsr_base_url), deno_json_url = resolveAsUrl("./deno.json", base_host), jsr_json_url = resolveAsUrl("./jsr.json", base_host), package_json_url = resolveAsUrl("./package.json", base_host);
  const urls = [deno_json_url, jsr_json_url];
  for (const url of urls) {
    if ((await fetch(url, { ...defaultFetchConfig, method: "HEAD" })).ok) {
      return url;
    }
  }
  throw new Error(`Network Error: couldn't locate "${jsr_package}"'s package json file. searched in the following locations:
${json_stringify(urls)}`);
};
var memorized_jsrPackageToMetadataUrl = memorize(jsrPackageToMetadataUrl);

// src/plugins/initialdata.ts
var CAPTURED_ALREADY2 = Symbol();
var defaultResolveInitialDataFactoryConfig = {
  pluginData: {},
  pluginDataMarker: CAPTURED_ALREADY2,
  captureDependencies: true,
  onResolveArgs: {}
};
var defaultInitialDataPluginSetupConfig = {
  ...defaultResolveInitialDataFactoryConfig,
  filters: [/.*/],
  namespace: void 0
};
var onResolveInitialDataFactory = (config, build) => {
  const { pluginData: initialPluginData, pluginDataMarker, captureDependencies, onResolveArgs } = { ...defaultResolveInitialDataFactoryConfig, ...config }, captured_resolved_paths = /* @__PURE__ */ new Set();
  return async (args) => {
    const { path, pluginData = {}, ...rest_args } = args, merged_plugin_data = { ...initialPluginData, ...pluginData }, { kind, importer } = rest_args;
    if (kind !== "entry-point" && !captured_resolved_paths.has(normalizePath(importer))) {
      return void 0;
    }
    if (merged_plugin_data[pluginDataMarker]) {
      return void 0;
    }
    merged_plugin_data[pluginDataMarker] = true;
    const resolved_result = await build.resolve(path, { ...rest_args, ...onResolveArgs, pluginData: merged_plugin_data });
    if (resolved_result.pluginData === void 0) {
      resolved_result.pluginData = merged_plugin_data;
    }
    if (captureDependencies) {
      captured_resolved_paths.add(normalizePath(resolved_result.path));
    }
    return { ...resolved_result, pluginData: merged_plugin_data };
  };
};
var defaultDenoInitialDataPluginSetupConfig = {
  ...defaultInitialDataPluginSetupConfig,
  resolvePath: defaultResolvePath,
  isAbsolutePath: isAbsolutePath2
};
var denoInitialDataPluginSetup = (config = {}) => {
  const { filters, namespace, ...rest_config_1 } = { ...defaultDenoInitialDataPluginSetupConfig, ...config }, { isAbsolutePath: isAbsolutePath3, resolvePath, log: _0, globalImportMap: _1, ...rest_config_2 } = rest_config_1, { pluginData, ...partialPluginResolverConfig } = rest_config_2, initial_plugin_data_promise = commonPluginResolverConfig_to_denoInitialPluginData({ isAbsolutePath: isAbsolutePath3, resolvePath }, pluginData);
  return async (build) => {
    const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions, initial_plugin_data = await initial_plugin_data_promise, pluginResolverConfig = { ...partialPluginResolverConfig, pluginData: initial_plugin_data };
    filters.forEach((filter) => {
      build.onResolve({ filter, namespace }, onResolveInitialDataFactory(pluginResolverConfig, build));
      build.onResolve({ filter, namespace }, async (args) => {
        const { path, pluginData: pluginData2 = {}, ...rest_args } = args, runtimePackage = pluginData2.runtimePackage;
        if (runtimePackage && !path.startsWith("./") && !path.startsWith("../")) {
          const resolved_path = runtimePackage.resolveImport(path);
          if (resolved_path) {
            return build.resolve(resolved_path, { ...rest_args, pluginData: pluginData2, namespace: "oazmi-temp-namespace-1" });
          }
        }
        return void 0;
      });
      build.onResolve({ filter: /.*/, namespace: "oazmi-temp-namespace-1" }, unResolveFactory({ isAbsolutePath: isAbsolutePath3, resolvePath, namespace: "" }, build));
    });
  };
};
var denoInitialDataPlugin = (config) => {
  return {
    name: "oazmi-deno-initialdata-plugin",
    setup: denoInitialDataPluginSetup(config)
  };
};
var commonPluginResolverConfig_to_denoInitialPluginData = async (config, plugin_data = {}) => {
  const { isAbsolutePath: isAbsolutePath3, resolvePath } = config, { runtimePackage } = plugin_data, denoPackage = runtimePackage === void 0 ? void 0 : runtimePackage instanceof RuntimePackage ? runtimePackage : await DenoPackage.fromUrl(
    isString(runtimePackage) ? resolveAsUrl(
      isAbsolutePath3(runtimePackage) ? runtimePackage : resolvePath(runtimePackage)
    ) : runtimePackage
  );
  return { ...plugin_data, runtimePackage: denoPackage };
};

// src/plugins/jsr.ts
var defaultJsrPluginSetupConfig = {
  filters: [/^jsr\:/],
  globalImportMap: void 0,
  resolvePath: defaultResolvePath
};
var jsrPluginSetup = (config = {}) => {
  const { filters, globalImportMap, resolvePath } = { ...defaultJsrPluginSetupConfig, ...config };
  return async (build) => {
    const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions;
    filters.forEach((filter) => {
      build.onResolve({ filter }, async (args) => {
        const { path, pluginData, ...rest_args } = args, { importMap: _0, runtimePackage: _1, ...restPluginData } = pluginData ?? {}, runtimePackage = await DenoPackage.fromUrl(path), relative_alias_pathname = parsePackageUrl(path).pathname, relative_alias = relative_alias_pathname === "/" ? "." : ensureStartDotSlash(relative_alias_pathname), path_url = runtimePackage.resolveExport(relative_alias, { baseAliasDir: "" });
        if (!path_url) {
          throw new Error(`failed to resolve the path "${path}" from the deno package: "jsr:${runtimePackage.getName()}@${runtimePackage.getVersion()}"`);
        }
        return build.resolve(path_url, {
          ...rest_args,
          pluginData: {
            importMap: globalImportMap,
            runtimePackage,
            ...restPluginData
          }
        });
      });
    });
  };
};
var jsrPlugin = (config) => {
  return {
    name: "oazmi-jsr-plugin",
    setup: jsrPluginSetup(config)
  };
};

// src/plugins/npm.ts
var defaultNpmSpecifierPluginSetupConfig = {
  specifiers: ["npm:"],
  globalImportMap: void 0,
  resolvePath: defaultResolvePath,
  sideEffects: "auto",
  autoInstall: true
};
var log = false;
var npmSpecifierPluginSetup = (config = {}) => {
  const { specifiers, globalImportMap, resolvePath, sideEffects, autoInstall } = { ...defaultNpmSpecifierPluginSetupConfig, ...config }, forcedSideEffectsMode = isString(sideEffects) ? void 0 : sideEffects;
  return async (build) => {
    const { absWorkingDir, outdir, outfile, entryPoints, write, loader } = build.initialOptions, fallbackResolveDir = absWorkingDir ? ensureEndSlash(pathToPosixPath(absWorkingDir)) : resolvePath("./");
    specifiers.forEach((specifier) => {
      const filter = new RegExp(`^${escapeLiteralStringForRegex(specifier)}`);
      build.onResolve({ filter }, async (args) => {
        const { path, pluginData, resolveDir = "", ...rest_args } = args, well_formed_npm_package_alias = replacePrefix(path, specifier, "npm:"), { scope, pkg, pathname, version: desired_version } = parsePackageUrl(well_formed_npm_package_alias), resolved_npm_package_alias = `${scope ? "@" + scope + "/" : ""}${pkg}${pathname === "/" ? "" : pathname}`, resolve_dir = resolveDir === "" ? fallbackResolveDir : resolveDir, { importMap: _0, runtimePackage: _1, originalNamespace: _2, ...restPluginData } = pluginData ?? {}, runtimePackage = void 0;
        if (1 /* LOG */ && log) {
          console.log(`[oazmi-npm-specifier-plugin] onResolve:`, { path, resolve_dir, resolved_npm_package_alias, args });
        }
        const resolved_result = await build.resolve(resolved_npm_package_alias, {
          resolveDir: resolve_dir,
          ...rest_args,
          pluginData: {
            importMap: globalImportMap,
            runtimePackage,
            ...restPluginData
          }
        });
        if (forcedSideEffectsMode !== void 0) {
          resolved_result.sideEffects = forcedSideEffectsMode;
        }
        return resolved_result;
      });
    });
  };
};
var npmSpecifierPlugin = (config) => {
  return {
    name: "oazmi-npm-specifier-plugin",
    setup: npmSpecifierPluginSetup(config)
  };
};

// src/plugins/mod.ts
var defaultDenoPluginsConfig = {
  runtimePackage: void 0,
  importMap: {},
  getCwd: defaultGetCwd
};
var denoPlugins = (config) => {
  const { runtimePackage, importMap, getCwd } = { ...defaultDenoPluginsConfig, ...config }, resolvePath = resolvePathFactory(getCwd, isAbsolutePath2);
  return [
    denoInitialDataPlugin({ pluginData: { runtimePackage } }),
    importMapPlugin({ importMap }),
    httpPlugin({ globalImportMap: importMap, resolvePath }),
    jsrPlugin({ globalImportMap: importMap, resolvePath }),
    npmSpecifierPlugin({ globalImportMap: importMap, resolvePath })
  ];
};
export {
  denoInitialDataPlugin,
  denoPlugins,
  httpPlugin,
  importMapPlugin,
  jsrPlugin,
  npmSpecifierPlugin
};
