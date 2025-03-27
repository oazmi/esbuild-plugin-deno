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
var array_constructor = Array;
var json_constructor = JSON;
var object_constructor = Object;
var promise_constructor = Promise;
var symbol_constructor = Symbol;
var array_isEmpty = (array) => array.length === 0;
var array_isArray = /* @__PURE__ */ (() => array_constructor.isArray)();
var json_stringify = /* @__PURE__ */ (() => json_constructor.stringify)();
var object_assign = /* @__PURE__ */ (() => object_constructor.assign)();
var object_entries = /* @__PURE__ */ (() => object_constructor.entries)();
var object_fromEntries = /* @__PURE__ */ (() => object_constructor.fromEntries)();
var object_keys = /* @__PURE__ */ (() => object_constructor.keys)();
var promise_outside = () => {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return [promise, resolve, reject];
};
var promise_resolve = /* @__PURE__ */ promise_constructor.resolve.bind(promise_constructor);
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
var array_proto = /* @__PURE__ */ prototypeOfClass(Array);
var map_proto = /* @__PURE__ */ prototypeOfClass(Map);
var set_proto = /* @__PURE__ */ prototypeOfClass(Set);
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

// node_modules/@oazmi/kitchensink/esm/struct.js
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
var defaultExecShellCommandConfig = {
  args: []
};
var execShellCommand = async (runtime_enum, command, config = {}) => {
  const { args, cwd, signal } = { ...defaultExecShellCommandConfig, ...config }, args_are_empty = array_isEmpty(args), runtime = getRuntime(runtime_enum);
  if (!runtime) {
    throw new Error(DEBUG.ERROR ? `the requested runtime associated with the enum "${runtime_enum}" is undefined (i.e. you're running on a different runtime from the provided enum).` : "");
  }
  if (!command && args_are_empty) {
    return { stdout: "", stderr: "" };
  }
  switch (runtime_enum) {
    case RUNTIME.DENO:
    case RUNTIME.BUN:
    case RUNTIME.NODE: {
      const { exec } = await get_node_child_process(), full_command = args_are_empty ? command : `${command} ${args.join(" ")}`, [promise, resolve, reject] = promise_outside();
      exec(full_command, { cwd, signal }, (error, stdout, stderr) => {
        if (error) {
          reject(error.message);
        }
        resolve({ stdout, stderr });
      });
      return promise;
    }
    default:
      throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support shell commands` : "");
  }
};
var node_child_process;
var import_node_child_process = async () => {
  return import("node:child_process");
};
var get_node_child_process = async () => {
  return node_child_process ??= await import_node_child_process();
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
var defaultGetCwd = /* @__PURE__ */ ensureEndSlash(pathToPosixPath(getRuntimeCwd(identifyCurrentRuntime(), true)));
var defaultResolvePath = /* @__PURE__ */ resolvePathFactory(defaultGetCwd, isAbsolutePath2);
var noop = () => void 0;

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

// src/packageman/deno.ts
var get_dir_path_of_file_path = (file_path) => normalizePath(file_path.endsWith("/") ? file_path : file_path + "/../");
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
      basePathDir = get_dir_path_of_file_path(package_json_path),
      ...rest_config
    } = config ?? {}, residual_path_alias = replacePrefix(path_alias, baseAliasDir)?.replace(/^\/+/, "/");
    if (residual_path_alias !== void 0) {
      path_alias = baseAliasDir + (residual_path_alias === "/" ? "" : residual_path_alias);
    }
    return super.resolveExport(path_alias, { baseAliasDir, basePathDir, ...rest_config });
  }
  resolveImport(path_alias, config) {
    const name = this.getName(), version = this.getVersion(), package_json_path = pathToPosixPath(this.getPath()), basePathDir = get_dir_path_of_file_path(package_json_path), path_alias_is_relative = path_alias.startsWith("./") || path_alias.startsWith("../"), local_package_reference_aliases = path_alias_is_relative ? [""] : [`jsr:${name}@${version}`, `jsr:${name}`, `${name}`];
    let locally_resolved_export = void 0;
    for (const base_alias_dir of local_package_reference_aliases) {
      locally_resolved_export = this.resolveExport(path_alias, { ...config, baseAliasDir: base_alias_dir });
      if (locally_resolved_export) {
        break;
      }
    }
    return locally_resolved_export ?? super.resolveImport(path_alias, { ...config, basePathDir });
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
  const resolved_version = format(resolved_semver), base_host = resolveAsUrl(`@${scope}/${pkg}/${resolved_version}/`, jsr_base_url), deno_json_url = resolveAsUrl("./deno.json", base_host), deno_jsonc_url = resolveAsUrl("./deno.jsonc", base_host), jsr_json_url = resolveAsUrl("./jsr.json", base_host), jsr_jsonc_url = resolveAsUrl("./jsr.jsonc", base_host), package_json_url = resolveAsUrl("./package.json", base_host), package_jsonc_url = resolveAsUrl("./package.jsonc", base_host);
  const urls = [deno_json_url, deno_jsonc_url, jsr_json_url, jsr_jsonc_url];
  for (const url of urls) {
    if ((await fetch(url, { ...defaultFetchConfig, method: "HEAD" })).ok) {
      return url;
    }
  }
  throw new Error(`Network Error: couldn't locate "${jsr_package}"'s package json file. searched in the following locations:
${json_stringify(urls)}`);
};
var memorized_jsrPackageToMetadataUrl = memorize(jsrPackageToMetadataUrl);

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
  acceptNamespaces: defaultEsbuildNamespaces
};
var entryPluginSetup = (config) => {
  const { filters, initialPluginData: _initialPluginData, forceInitialPluginData, enableInheritPluginData, acceptNamespaces: _acceptNamespaces } = { ...defaultEntryPluginSetup, ...config }, acceptNamespaces = /* @__PURE__ */ new Set([..._acceptNamespaces, "oazmi-loader-http" /* LOADER_HTTP */]), importerPluginDataRecord = /* @__PURE__ */ new Map(), importerPluginDataRecord_get = bind_map_get(importerPluginDataRecord), importerPluginDataRecord_set = bind_map_set(importerPluginDataRecord), importerPluginDataRecord_has = bind_map_has(importerPluginDataRecord), ALREADY_CAPTURED_BY_INITIAL = Symbol(0 /* MINIFY */ ? "" : "[oazmi-entry]: already captured by initial-data-injector"), ALREADY_CAPTURED_BY_INHERITOR = Symbol(0 /* MINIFY */ ? "" : "[oazmi-entry]: already captured by inherit-data-injector"), ALREADY_CAPTURED_BY_RESOLVER = Symbol(0 /* MINIFY */ ? "" : "[oazmi-entry]: already captured by absolute-path-resolver");
  return async (build) => {
    const { runtimePackage: initialRuntimePackage, ...rest_initialPluginData } = _initialPluginData ?? {}, initialPluginData = rest_initialPluginData, initialPluginDataExists = _initialPluginData !== void 0;
    build.onStart(async () => {
      initialPluginData.runtimePackage = await resolveRuntimePackage(build, initialRuntimePackage);
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
var resolveRuntimePackage = async (build, initialRuntimePackage) => {
  const denoPackageJson_exists = initialRuntimePackage !== void 0, denoPackageJson_isRuntimePackage = initialRuntimePackage instanceof RuntimePackage, denoPackageJson_url = !denoPackageJson_exists || denoPackageJson_isRuntimePackage ? void 0 : isString(initialRuntimePackage) ? resolveAsUrl((await build.resolve(initialRuntimePackage, {
    kind: "entry-point",
    namespace: "oazmi-resolver-pipeline" /* RESOLVER_PIPELINE */,
    pluginData: { resolverConfig: { useNodeModules: false } }
  })).path) : initialRuntimePackage;
  const denoPackage = !denoPackageJson_exists ? void 0 : denoPackageJson_isRuntimePackage ? initialRuntimePackage : await DenoPackage.fromUrl(denoPackageJson_url);
  return denoPackage;
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
var windows_local_path_correction_regex = /^[\/\\]([a-z])\:[\/\\]/i;
var fileUriToLocalPath = (file_url) => {
  if (isString(file_url)) {
    if (getUriScheme(file_url) !== "file") {
      return;
    }
    file_url = new URL(file_url);
  }
  if (!file_url?.protocol.startsWith("file:")) {
    return;
  }
  const local_path_with_leading_slash = pathToPosixPath(dom_decodeURI(file_url.pathname)), corrected_local_path = local_path_with_leading_slash.replace(windows_local_path_correction_regex, "$1:/");
  return corrected_local_path;
};
var ensureLocalPath = (path) => {
  const path_is_string = isString(path), file_uri_to_local_path_conversion = fileUriToLocalPath(path);
  if (1 /* ASSERT */ && !file_uri_to_local_path_conversion) {
    const scheme = path_is_string ? getUriScheme(path) : "http";
    if (scheme !== "local" && scheme !== "relative") {
      logLogger(`[ensureLocalPath] WARNING! received non-convertible remote path: "${path_is_string ? path : path.href}"`);
    }
  }
  return file_uri_to_local_path_conversion ?? (path_is_string ? pathToPosixPath(path) : path.href);
};
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
      return convertFileUriToLocalPath.enabled && getUriScheme(path) === "file" ? convertFileUriToLocalPath.resolveAgain ? build.resolve(fileUriToLocalPath(path), { ...rest_args, pluginData, namespace: original_ns }) : { path: fileUriToLocalPath(path), pluginData, namespace: original_ns } : { path, pluginData, namespace: plugin_ns };
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
      const { path, pluginData = {}, ...rest_args } = args, { importMap: _0, runtimePackage: _1, resolverConfig = {}, ...restPluginData } = pluginData, runtimePackage = await DenoPackage.fromUrl(path), relative_alias_pathname = parsePackageUrl(path).pathname, relative_alias = relative_alias_pathname === "/" ? "." : ensureStartDotSlash(relative_alias_pathname), path_url = runtimePackage.resolveExport(relative_alias, { baseAliasDir: "" });
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
    const runtimePackageResolver = runtimePackageResolverConfig.enabled === false ? noop : async (args) => {
      if (args.pluginData?.resolverConfig?.useRuntimePackage === false) {
        return;
      }
      const { path, pluginData = {} } = args, runtimePackage = pluginData.runtimePackage, resolved_path = runtimePackage && !path.startsWith("./") && !path.startsWith("../") ? runtimePackage.resolveImport(path) : void 0;
      if (1 /* LOG */ && logFn) {
        logFn(`[runtime-package] resolving: ${path}` + (!resolved_path ? "" : `
>> successfully resolved to: ${resolved_path}`));
      }
      return resolved_path ? {
        path: resolved_path,
        namespace: output_ns,
        pluginData: { ...pluginData }
      } : void 0;
    };
    const { globalImportMap } = importMapResolverConfig;
    const importMapResolver = importMapResolverConfig.enabled === false ? noop : async (args) => {
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
    const nodeModulesResolver = nodeModulesResolverConfig.enabled === false ? noop : async (args) => {
      const { path, resolveDir, importer, pluginData = {} } = args;
      if (pluginData.resolverConfig?.useNodeModules === false) {
        return;
      }
      if (pluginData.resolverConfig?.useRelativePath !== false && (path.startsWith("./") || path.startsWith("../") || isAbsolutePath3(path))) {
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
    const relativePathResolver = relativePathResolverConfig.enabled === false ? noop : async (args) => {
      if (args.pluginData?.resolverConfig?.useRelativePath === false) {
        return;
      }
      const { path, importer, resolveDir, pluginData = {} } = args, resolve_dir = resolvePath(ensureEndSlash(resolveDir ? resolveDir : absWorkingDir)), dir = isAbsolutePath3(importer) ? importer : joinPaths(resolve_dir, importer), resolved_path = isAbsolutePath3(path) ? pathToPosixPath(path) : resolvePath(dir, ensureStartDotSlash(path));
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
          ensureLocalPath(args.path),
          {
            kind: "entry-point",
            resolveDir: ensureLocalPath(resolve_dir !== "" ? resolve_dir : args.resolveDir),
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
  return async (build) => {
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
    const npmSpecifierResolverFactory = (specifier) => async (args) => {
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
    };
    specifiers.forEach((specifier) => {
      const filter = new RegExp(`^${escapeLiteralStringForRegex(specifier)}`);
      build.onResolve({ filter }, npmSpecifierResolverFactory(specifier));
    });
  };
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
      return ensureLocalPath(dir_path);
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
      return current_js_runtime === RUNTIME.DENO || current_js_runtime === RUNTIME.BUN ? "dynamic" : autoInstallOptionToNpmAutoInstallCliConfig("npm");
    case true:
    case "auto-cli":
      switch (current_js_runtime) {
        case RUNTIME.DENO:
          return autoInstallOptionToNpmAutoInstallCliConfig("deno");
        case RUNTIME.BUN:
          return autoInstallOptionToNpmAutoInstallCliConfig("bun");
        case RUNTIME.NODE:
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
    case RUNTIME.DENO:
    case RUNTIME.BUN:
    case RUNTIME.NODE: {
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
  const { acceptNamespaces, autoInstall, getCwd, globalImportMap, log, logFor, peerDependencies, nodeModulesDirs, initialPluginData } = { ...defaultDenoPluginsConfig, ...config }, resolvePath = resolvePathFactory(getCwd, isAbsolutePath2);
  return [
    entryPlugin({ initialPluginData, acceptNamespaces }),
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
