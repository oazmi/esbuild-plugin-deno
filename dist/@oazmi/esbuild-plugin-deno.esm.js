var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@deno/shim-deno/dist/deno/stable/variables/errors.js
var require_errors = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WriteZero = exports.UnexpectedEof = exports.TimedOut = exports.PermissionDenied = exports.NotFound = exports.NotConnected = exports.InvalidData = exports.Interrupted = exports.Http = exports.ConnectionReset = exports.ConnectionRefused = exports.ConnectionAborted = exports.Busy = exports.BrokenPipe = exports.BadResource = exports.AlreadyExists = exports.AddrNotAvailable = exports.AddrInUse = void 0;
    var AddrInUse = class extends Error {
    };
    exports.AddrInUse = AddrInUse;
    var AddrNotAvailable = class extends Error {
    };
    exports.AddrNotAvailable = AddrNotAvailable;
    var AlreadyExists = class extends Error {
    };
    exports.AlreadyExists = AlreadyExists;
    var BadResource = class extends Error {
    };
    exports.BadResource = BadResource;
    var BrokenPipe = class extends Error {
    };
    exports.BrokenPipe = BrokenPipe;
    var Busy = class extends Error {
    };
    exports.Busy = Busy;
    var ConnectionAborted = class extends Error {
    };
    exports.ConnectionAborted = ConnectionAborted;
    var ConnectionRefused = class extends Error {
    };
    exports.ConnectionRefused = ConnectionRefused;
    var ConnectionReset = class extends Error {
    };
    exports.ConnectionReset = ConnectionReset;
    var Http = class extends Error {
    };
    exports.Http = Http;
    var Interrupted = class extends Error {
    };
    exports.Interrupted = Interrupted;
    var InvalidData = class extends Error {
    };
    exports.InvalidData = InvalidData;
    var NotConnected = class extends Error {
    };
    exports.NotConnected = NotConnected;
    var NotFound = class extends Error {
      constructor() {
        super(...arguments);
        this.code = "ENOENT";
      }
    };
    exports.NotFound = NotFound;
    var PermissionDenied = class extends Error {
    };
    exports.PermissionDenied = PermissionDenied;
    var TimedOut = class extends Error {
    };
    exports.TimedOut = TimedOut;
    var UnexpectedEof = class extends Error {
    };
    exports.UnexpectedEof = UnexpectedEof;
    var WriteZero = class extends Error {
    };
    exports.WriteZero = WriteZero;
  }
});

// node_modules/@deno/shim-deno/dist/deno/internal/errorMap.js
var require_errorMap = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/internal/errorMap.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var errors = __importStar(require_errors());
    var mapper = (Ctor) => (err) => Object.assign(new Ctor(err.message), {
      stack: err.stack
    });
    var map = {
      EEXIST: mapper(errors.AlreadyExists),
      ENOENT: mapper(errors.NotFound),
      EBADF: mapper(errors.BadResource)
    };
    var isNodeErr = (e) => {
      return e instanceof Error && "code" in e;
    };
    function mapError(e) {
      var _a;
      if (!isNodeErr(e))
        return e;
      return ((_a = map[e.code]) === null || _a === void 0 ? void 0 : _a.call(map, e)) || e;
    }
    exports.default = mapError;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/stat.js
var require_stat = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/stat.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stat = exports.denoifyFileInfo = void 0;
    var promises_1 = __require("node:fs/promises");
    var os = __importStar(__require("node:os"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var isWindows = os.platform() === "win32";
    function denoifyFileInfo(s) {
      return {
        atime: s.atime,
        birthtime: s.birthtime,
        blksize: isWindows ? null : s.blksize,
        blocks: isWindows ? null : s.blocks,
        dev: s.dev,
        gid: isWindows ? null : s.gid,
        ino: isWindows ? null : s.ino,
        isDirectory: s.isDirectory(),
        isFile: s.isFile(),
        isSymlink: s.isSymbolicLink(),
        isBlockDevice: isWindows ? null : s.isBlockDevice(),
        isCharDevice: isWindows ? null : s.isCharacterDevice(),
        isFifo: isWindows ? null : s.isFIFO(),
        isSocket: isWindows ? null : s.isSocket(),
        mode: isWindows ? null : s.mode,
        mtime: s.mtime,
        nlink: isWindows ? null : s.nlink,
        rdev: isWindows ? null : s.rdev,
        size: s.size,
        uid: isWindows ? null : s.uid
      };
    }
    exports.denoifyFileInfo = denoifyFileInfo;
    var stat = async (path) => {
      try {
        return denoifyFileInfo(await (0, promises_1.stat)(path));
      } catch (e) {
        throw (0, errorMap_js_1.default)(e);
      }
    };
    exports.stat = stat;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/fstat.js
var require_fstat = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/fstat.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fstat = void 0;
    var fs = __importStar(__require("fs"));
    var util_1 = __require("util");
    var stat_js_1 = require_stat();
    var errorMap_js_1 = __importDefault(require_errorMap());
    var nodeFstat = (0, util_1.promisify)(fs.fstat);
    var fstat = async function(fd) {
      try {
        return (0, stat_js_1.denoifyFileInfo)(await nodeFstat(fd));
      } catch (err) {
        throw (0, errorMap_js_1.default)(err);
      }
    };
    exports.fstat = fstat;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/fstatSync.js
var require_fstatSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/fstatSync.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fstatSync = void 0;
    var fs_1 = __require("fs");
    var stat_js_1 = require_stat();
    var errorMap_js_1 = __importDefault(require_errorMap());
    var fstatSync = function fstatSync2(fd) {
      try {
        return (0, stat_js_1.denoifyFileInfo)((0, fs_1.fstatSync)(fd));
      } catch (err) {
        throw (0, errorMap_js_1.default)(err);
      }
    };
    exports.fstatSync = fstatSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/ftruncate.js
var require_ftruncate = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/ftruncate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ftruncate = void 0;
    var fs_1 = __require("fs");
    var util_1 = __require("util");
    var _ftruncate = (0, util_1.promisify)(fs_1.ftruncate);
    exports.ftruncate = _ftruncate;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/ftruncateSync.js
var require_ftruncateSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/ftruncateSync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ftruncateSync = void 0;
    var fs_1 = __require("fs");
    exports.ftruncateSync = fs_1.ftruncateSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/fdatasync.js
var require_fdatasync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/fdatasync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fdatasync = void 0;
    var fs_1 = __require("fs");
    var util_1 = __require("util");
    var _fdatasync = (0, util_1.promisify)(fs_1.fdatasync);
    exports.fdatasync = _fdatasync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/fdatasyncSync.js
var require_fdatasyncSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/fdatasyncSync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fdatasyncSync = void 0;
    var fs_1 = __require("fs");
    exports.fdatasyncSync = fs_1.fdatasyncSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/read.js
var require_read = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/read.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.read = void 0;
    var util_1 = __require("util");
    var fs_1 = __require("fs");
    var _read = (0, util_1.promisify)(fs_1.read);
    var read = async function read2(rid, buffer) {
      if (buffer == null) {
        throw new TypeError("Buffer must not be null.");
      }
      if (buffer.length === 0) {
        return 0;
      }
      const { bytesRead } = await _read(rid, buffer, 0, buffer.length, null);
      return bytesRead === 0 ? null : bytesRead;
    };
    exports.read = read;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/readSync.js
var require_readSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/readSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readSync = void 0;
    var fs = __importStar(__require("fs"));
    var readSync = (fd, buffer) => {
      const bytesRead = fs.readSync(fd, buffer);
      return bytesRead === 0 ? null : bytesRead;
    };
    exports.readSync = readSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/write.js
var require_write = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/write.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.write = void 0;
    var fs = __importStar(__require("fs"));
    var util_1 = __require("util");
    var nodeWrite = (0, util_1.promisify)(fs.write);
    var write = async (fd, data) => {
      const { bytesWritten } = await nodeWrite(fd, data);
      return bytesWritten;
    };
    exports.write = write;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/writeSync.js
var require_writeSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/writeSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writeSync = void 0;
    var fs = __importStar(__require("fs"));
    exports.writeSync = fs.writeSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/classes/FsFile.js
var require_FsFile = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/classes/FsFile.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __classPrivateFieldGet = exports && exports.__classPrivateFieldGet || function(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var __classPrivateFieldSet = exports && exports.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    var _a;
    var _b;
    var _c;
    var _d;
    var _FsFile_closed;
    var _FsFile_readableStream;
    var _FsFile_writableStream;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.File = exports.FsFile = void 0;
    var fs = __importStar(__require("node:fs"));
    var stream = __importStar(__require("node:stream"));
    var fstat_js_1 = require_fstat();
    var fstatSync_js_1 = require_fstatSync();
    var ftruncate_js_1 = require_ftruncate();
    var ftruncateSync_js_1 = require_ftruncateSync();
    var fdatasync_js_1 = require_fdatasync();
    var fdatasyncSync_js_1 = require_fdatasyncSync();
    var read_js_1 = require_read();
    var readSync_js_1 = require_readSync();
    var write_js_1 = require_write();
    var writeSync_js_1 = require_writeSync();
    (_a = (_c = Symbol).dispose) !== null && _a !== void 0 ? _a : _c.dispose = Symbol("Symbol.dispose");
    (_b = (_d = Symbol).asyncDispose) !== null && _b !== void 0 ? _b : _d.asyncDispose = Symbol("Symbol.asyncDispose");
    var FsFile = class {
      constructor(rid) {
        this.rid = rid;
        _FsFile_closed.set(this, false);
        _FsFile_readableStream.set(this, void 0);
        _FsFile_writableStream.set(this, void 0);
      }
      [(_FsFile_closed = /* @__PURE__ */ new WeakMap(), _FsFile_readableStream = /* @__PURE__ */ new WeakMap(), _FsFile_writableStream = /* @__PURE__ */ new WeakMap(), Symbol.dispose)]() {
        if (!__classPrivateFieldGet(this, _FsFile_closed, "f")) {
          this.close();
        }
      }
      async write(p) {
        return await (0, write_js_1.write)(this.rid, p);
      }
      writeSync(p) {
        return (0, writeSync_js_1.writeSync)(this.rid, p);
      }
      async truncate(len) {
        await (0, ftruncate_js_1.ftruncate)(this.rid, len);
      }
      truncateSync(len) {
        return (0, ftruncateSync_js_1.ftruncateSync)(this.rid, len);
      }
      read(p) {
        return (0, read_js_1.read)(this.rid, p);
      }
      readSync(p) {
        return (0, readSync_js_1.readSync)(this.rid, p);
      }
      seek(_offset, _whence) {
        throw new Error("Method not implemented.");
      }
      seekSync(_offset, _whence) {
        throw new Error("Method not implemented.");
      }
      async stat() {
        return await (0, fstat_js_1.fstat)(this.rid);
      }
      statSync() {
        return (0, fstatSync_js_1.fstatSync)(this.rid);
      }
      sync() {
        throw new Error("Method not implemented.");
      }
      syncSync() {
        throw new Error("Method not implemented.");
      }
      syncData() {
        return (0, fdatasync_js_1.fdatasync)(this.rid);
      }
      syncDataSync() {
        return (0, fdatasyncSync_js_1.fdatasyncSync)(this.rid);
      }
      utime(_atime, _mtime) {
        throw new Error("Method not implemented.");
      }
      utimeSync(_atime, _mtime) {
        throw new Error("Method not implemented.");
      }
      close() {
        __classPrivateFieldSet(this, _FsFile_closed, true, "f");
        fs.closeSync(this.rid);
      }
      get readable() {
        if (__classPrivateFieldGet(this, _FsFile_readableStream, "f") == null) {
          const nodeStream = fs.createReadStream(null, {
            fd: this.rid,
            autoClose: false
          });
          __classPrivateFieldSet(this, _FsFile_readableStream, stream.Readable.toWeb(nodeStream), "f");
        }
        return __classPrivateFieldGet(this, _FsFile_readableStream, "f");
      }
      get writable() {
        if (__classPrivateFieldGet(this, _FsFile_writableStream, "f") == null) {
          const nodeStream = fs.createWriteStream(null, {
            fd: this.rid,
            autoClose: false
          });
          __classPrivateFieldSet(this, _FsFile_writableStream, stream.Writable.toWeb(nodeStream), "f");
        }
        return __classPrivateFieldGet(this, _FsFile_writableStream, "f");
      }
    };
    exports.FsFile = FsFile;
    var File = FsFile;
    exports.File = File;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/classes/PermissionStatus.js
var require_PermissionStatus = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/classes/PermissionStatus.js"(exports) {
    "use strict";
    var _a;
    var _b;
    var _c;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PermissionStatus = void 0;
    (_a = (_c = globalThis).EventTarget) !== null && _a !== void 0 ? _a : _c.EventTarget = (_b = __require("events").EventTarget) !== null && _b !== void 0 ? _b : null;
    var PermissionStatus = class extends EventTarget {
      /** @internal */
      constructor(state) {
        super();
        this.state = state;
        this.onchange = null;
        this.partial = false;
      }
    };
    exports.PermissionStatus = PermissionStatus;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/classes/Permissions.js
var require_Permissions = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/classes/Permissions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Permissions = void 0;
    var PermissionStatus_js_1 = require_PermissionStatus();
    var Permissions = class {
      query(desc) {
        return Promise.resolve(this.querySync(desc));
      }
      querySync(_desc) {
        return new PermissionStatus_js_1.PermissionStatus("granted");
      }
      revoke(desc) {
        return Promise.resolve(this.revokeSync(desc));
      }
      revokeSync(_desc) {
        return new PermissionStatus_js_1.PermissionStatus("denied");
      }
      request(desc) {
        return this.query(desc);
      }
      requestSync(desc) {
        return this.querySync(desc);
      }
    };
    exports.Permissions = Permissions;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/classes.js
var require_classes = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/classes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PermissionStatus = exports.Permissions = exports.FsFile = exports.File = void 0;
    var FsFile_js_1 = require_FsFile();
    Object.defineProperty(exports, "File", { enumerable: true, get: function() {
      return FsFile_js_1.File;
    } });
    Object.defineProperty(exports, "FsFile", { enumerable: true, get: function() {
      return FsFile_js_1.FsFile;
    } });
    var Permissions_js_1 = require_Permissions();
    Object.defineProperty(exports, "Permissions", { enumerable: true, get: function() {
      return Permissions_js_1.Permissions;
    } });
    var PermissionStatus_js_1 = require_PermissionStatus();
    Object.defineProperty(exports, "PermissionStatus", { enumerable: true, get: function() {
      return PermissionStatus_js_1.PermissionStatus;
    } });
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/enums/SeekMode.js
var require_SeekMode = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/enums/SeekMode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SeekMode = void 0;
    var SeekMode;
    (function(SeekMode2) {
      SeekMode2[SeekMode2["Start"] = 0] = "Start";
      SeekMode2[SeekMode2["Current"] = 1] = "Current";
      SeekMode2[SeekMode2["End"] = 2] = "End";
    })(SeekMode || (exports.SeekMode = SeekMode = {}));
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/enums.js
var require_enums = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/enums.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SeekMode = void 0;
    var SeekMode_js_1 = require_SeekMode();
    Object.defineProperty(exports, "SeekMode", { enumerable: true, get: function() {
      return SeekMode_js_1.SeekMode;
    } });
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/build.js
var require_build = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/build.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.build = void 0;
    var os = __importStar(__require("os"));
    exports.build = {
      arch: "x86_64",
      os: /* @__PURE__ */ ((p) => p === "win32" ? "windows" : p === "darwin" ? "darwin" : "linux")(os.platform()),
      vendor: "pc",
      target: /* @__PURE__ */ ((p) => p === "win32" ? "x86_64-pc-windows-msvc" : p === "darwin" ? "x86_64-apple-darwin" : "x86_64-unknown-linux-gnu")(os.platform())
    };
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/customInspect.js
var require_customInspect = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/customInspect.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.customInspect = void 0;
    exports.customInspect = Symbol.for("nodejs.util.inspect.custom");
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/env.js
var require_env = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/env.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.env = void 0;
    exports.env = {
      get(key) {
        assertValidKey(key);
        return process.env[key];
      },
      set(key, value) {
        assertValidKey(key);
        assertValidValue(value);
        process.env[key] = value;
      },
      has(key) {
        assertValidKey(key);
        return key in process.env;
      },
      delete(key) {
        assertValidKey(key);
        delete process.env[key];
      },
      // @ts-expect-error https://github.com/denoland/deno/issues/10267
      toObject() {
        return { ...process.env };
      }
    };
    var invalidKeyChars = ["=", "\0"].map((c) => c.charCodeAt(0));
    var invalidValueChar = "\0".charCodeAt(0);
    function assertValidKey(key) {
      if (key.length === 0) {
        throw new TypeError("Key is an empty string.");
      }
      for (let i = 0; i < key.length; i++) {
        if (invalidKeyChars.includes(key.charCodeAt(i))) {
          const char = key.charCodeAt(i) === "\0".charCodeAt(0) ? "\\0" : key[i];
          throw new TypeError(`Key contains invalid characters: "${char}"`);
        }
      }
    }
    function assertValidValue(value) {
      for (let i = 0; i < value.length; i++) {
        if (value.charCodeAt(i) === invalidValueChar) {
          throw new TypeError('Value contains invalid characters: "\\0"');
        }
      }
    }
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/mainModule.js
var require_mainModule = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/mainModule.js"(exports) {
    "use strict";
    var _a;
    var _b;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mainModule = void 0;
    var path_1 = __require("path");
    var url_1 = __require("url");
    exports.mainModule = (0, url_1.pathToFileURL)((_b = (_a = __require.main) === null || _a === void 0 ? void 0 : _a.filename) !== null && _b !== void 0 ? _b : (0, path_1.join)(__dirname, "$deno$repl.ts")).href;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/metrics.js
var require_metrics = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/metrics.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.metrics = void 0;
    var metrics = function metrics2() {
      return {
        opsDispatched: 0,
        opsDispatchedSync: 0,
        opsDispatchedAsync: 0,
        opsDispatchedAsyncUnref: 0,
        opsCompleted: 0,
        opsCompletedSync: 0,
        opsCompletedAsync: 0,
        opsCompletedAsyncUnref: 0,
        bytesSentControl: 0,
        bytesSentData: 0,
        bytesReceived: 0,
        ops: {}
      };
    };
    exports.metrics = metrics;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/noColor.js
var require_noColor = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/noColor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.noColor = void 0;
    exports.noColor = process.env.NO_COLOR !== void 0;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/permissions.js
var require_permissions = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/permissions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.permissions = void 0;
    var Permissions_js_1 = require_Permissions();
    exports.permissions = new Permissions_js_1.Permissions();
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/pid.js
var require_pid = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/pid.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pid = void 0;
    exports.pid = process.pid;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/ppid.js
var require_ppid = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/ppid.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ppid = void 0;
    exports.ppid = process.ppid;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/resources.js
var require_resources = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/resources.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resources = void 0;
    var resources = function resources2() {
      console.warn([
        "Deno.resources() shim returns a dummy object that does not update.",
        "If you think this is a mistake, raise an issue at https://github.com/denoland/node_deno_shims/issues"
      ].join("\n"));
      return {};
    };
    exports.resources = resources;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/std.js
var require_std = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/std.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stderr = exports.stdout = exports.stdin = void 0;
    var node_stream_1 = __importDefault(__require("node:stream"));
    var node_tty_1 = __importDefault(__require("node:tty"));
    var readSync_js_1 = require_readSync();
    var writeSync_js_1 = require_writeSync();
    function chain(fn, cleanup) {
      let prev;
      return function _fn(...args) {
        const curr = (prev || Promise.resolve()).then(() => fn(...args)).finally(cleanup || (() => {
        })).then((result) => {
          if (prev === curr)
            prev = void 0;
          return result;
        });
        return prev = curr;
      };
    }
    var stdinReadable;
    exports.stdin = {
      rid: 0,
      isTerminal() {
        return node_tty_1.default.isatty(this.rid);
      },
      read: chain((p) => {
        return new Promise((resolve, reject) => {
          process.stdin.resume();
          process.stdin.on("error", onerror);
          process.stdin.once("readable", () => {
            var _a;
            process.stdin.off("error", onerror);
            const data = (_a = process.stdin.read(p.length)) !== null && _a !== void 0 ? _a : process.stdin.read();
            if (data) {
              p.set(data);
              resolve(data.length > 0 ? data.length : null);
            } else {
              resolve(null);
            }
          });
          function onerror(error) {
            reject(error);
            process.stdin.off("error", onerror);
          }
        });
      }, () => process.stdin.pause()),
      get readable() {
        if (stdinReadable == null) {
          stdinReadable = node_stream_1.default.Readable.toWeb(process.stdin);
        }
        return stdinReadable;
      },
      readSync(buffer) {
        return (0, readSync_js_1.readSync)(this.rid, buffer);
      },
      close() {
        process.stdin.destroy();
      },
      setRaw(mode, options) {
        if (options === null || options === void 0 ? void 0 : options.cbreak) {
          throw new Error("The cbreak option is not implemented.");
        }
        process.stdin.setRawMode(mode);
      }
    };
    var stdoutWritable;
    exports.stdout = {
      rid: 1,
      isTerminal() {
        return node_tty_1.default.isatty(this.rid);
      },
      write: chain((p) => {
        return new Promise((resolve) => {
          const result = process.stdout.write(p);
          if (!result) {
            process.stdout.once("drain", () => resolve(p.length));
          } else {
            resolve(p.length);
          }
        });
      }),
      get writable() {
        if (stdoutWritable == null) {
          stdoutWritable = node_stream_1.default.Writable.toWeb(process.stdout);
        }
        return stdoutWritable;
      },
      writeSync(data) {
        return (0, writeSync_js_1.writeSync)(this.rid, data);
      },
      close() {
        process.stdout.destroy();
      }
    };
    var stderrWritable;
    exports.stderr = {
      rid: 2,
      isTerminal() {
        return node_tty_1.default.isatty(this.rid);
      },
      write: chain((p) => {
        return new Promise((resolve) => {
          const result = process.stderr.write(p);
          if (!result) {
            process.stderr.once("drain", () => resolve(p.length));
          } else {
            resolve(p.length);
          }
        });
      }),
      get writable() {
        if (stderrWritable == null) {
          stderrWritable = node_stream_1.default.Writable.toWeb(process.stderr);
        }
        return stderrWritable;
      },
      writeSync(data) {
        return (0, writeSync_js_1.writeSync)(this.rid, data);
      },
      close() {
        process.stderr.destroy();
      }
    };
  }
});

// node_modules/@deno/shim-deno/dist/deno/internal/version.js
var require_version = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/internal/version.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.typescript = exports.deno = void 0;
    exports.deno = "1.40.3";
    exports.typescript = "5.3.3";
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/version.js
var require_version2 = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/version.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = void 0;
    var version_js_1 = require_version();
    exports.version = {
      deno: version_js_1.deno,
      typescript: version_js_1.typescript,
      v8: process.versions.v8
    };
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables.js
var require_variables = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = exports.resources = exports.ppid = exports.pid = exports.permissions = exports.noColor = exports.metrics = exports.mainModule = exports.errors = exports.env = exports.customInspect = exports.build = void 0;
    var build_js_1 = require_build();
    Object.defineProperty(exports, "build", { enumerable: true, get: function() {
      return build_js_1.build;
    } });
    var customInspect_js_1 = require_customInspect();
    Object.defineProperty(exports, "customInspect", { enumerable: true, get: function() {
      return customInspect_js_1.customInspect;
    } });
    var env_js_1 = require_env();
    Object.defineProperty(exports, "env", { enumerable: true, get: function() {
      return env_js_1.env;
    } });
    exports.errors = __importStar(require_errors());
    var mainModule_js_1 = require_mainModule();
    Object.defineProperty(exports, "mainModule", { enumerable: true, get: function() {
      return mainModule_js_1.mainModule;
    } });
    var metrics_js_1 = require_metrics();
    Object.defineProperty(exports, "metrics", { enumerable: true, get: function() {
      return metrics_js_1.metrics;
    } });
    var noColor_js_1 = require_noColor();
    Object.defineProperty(exports, "noColor", { enumerable: true, get: function() {
      return noColor_js_1.noColor;
    } });
    var permissions_js_1 = require_permissions();
    Object.defineProperty(exports, "permissions", { enumerable: true, get: function() {
      return permissions_js_1.permissions;
    } });
    var pid_js_1 = require_pid();
    Object.defineProperty(exports, "pid", { enumerable: true, get: function() {
      return pid_js_1.pid;
    } });
    var ppid_js_1 = require_ppid();
    Object.defineProperty(exports, "ppid", { enumerable: true, get: function() {
      return ppid_js_1.ppid;
    } });
    var resources_js_1 = require_resources();
    Object.defineProperty(exports, "resources", { enumerable: true, get: function() {
      return resources_js_1.resources;
    } });
    __exportStar(require_std(), exports);
    var version_js_1 = require_version2();
    Object.defineProperty(exports, "version", { enumerable: true, get: function() {
      return version_js_1.version;
    } });
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/addSignalListener.js
var require_addSignalListener = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/addSignalListener.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addSignalListener = void 0;
    var process_1 = __importDefault(__require("process"));
    function denoSignalToNodeJs(signal) {
      if (signal === "SIGEMT") {
        throw new Error("SIGEMT is not supported");
      }
      return signal;
    }
    var addSignalListener = (signal, handler) => {
      process_1.default.addListener(denoSignalToNodeJs(signal), handler);
    };
    exports.addSignalListener = addSignalListener;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/chdir.js
var require_chdir = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/chdir.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.chdir = void 0;
    var url_1 = __require("url");
    var errorMap_js_1 = __importDefault(require_errorMap());
    var variables_js_1 = require_variables();
    var chdir = function(path) {
      try {
        return process.chdir(path instanceof URL ? (0, url_1.fileURLToPath)(path) : path);
      } catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "ENOENT") {
          throw new variables_js_1.errors.NotFound(`No such file or directory (os error 2), chdir '${path}'`);
        }
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.chdir = chdir;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/chmod.js
var require_chmod = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/chmod.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.chmod = void 0;
    var fs = __importStar(__require("fs/promises"));
    exports.chmod = fs.chmod;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/chmodSync.js
var require_chmodSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/chmodSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.chmodSync = void 0;
    var fs = __importStar(__require("fs"));
    exports.chmodSync = fs.chmodSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/chown.js
var require_chown = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/chown.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.chown = void 0;
    var fs = __importStar(__require("fs/promises"));
    var chown = async (path, uid, gid) => await fs.chown(path, uid !== null && uid !== void 0 ? uid : -1, gid !== null && gid !== void 0 ? gid : -1);
    exports.chown = chown;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/chownSync.js
var require_chownSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/chownSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.chownSync = void 0;
    var fs = __importStar(__require("fs"));
    var chownSync = (path, uid, gid) => fs.chownSync(path, uid !== null && uid !== void 0 ? uid : -1, gid !== null && gid !== void 0 ? gid : -1);
    exports.chownSync = chownSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/close.js
var require_close = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/close.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.close = void 0;
    var fs = __importStar(__require("fs"));
    exports.close = fs.closeSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/internal/Conn.js
var require_Conn = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/internal/Conn.js"(exports) {
    "use strict";
    var __classPrivateFieldSet = exports && exports.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    var __classPrivateFieldGet = exports && exports.__classPrivateFieldGet || function(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var _Conn_socket;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TlsConn = exports.Conn = void 0;
    var net_1 = __require("net");
    var FsFile_js_1 = require_FsFile();
    var Conn = class extends FsFile_js_1.FsFile {
      constructor(rid, localAddr, remoteAddr, socket) {
        super(rid);
        this.rid = rid;
        this.localAddr = localAddr;
        this.remoteAddr = remoteAddr;
        _Conn_socket.set(this, void 0);
        __classPrivateFieldSet(this, _Conn_socket, socket || new net_1.Socket({ fd: rid }), "f");
      }
      [(_Conn_socket = /* @__PURE__ */ new WeakMap(), Symbol.dispose)]() {
        this.close();
      }
      async closeWrite() {
        await new Promise((resolve) => __classPrivateFieldGet(this, _Conn_socket, "f").end(resolve));
      }
      setNoDelay(enable) {
        __classPrivateFieldGet(this, _Conn_socket, "f").setNoDelay(enable);
      }
      setKeepAlive(enable) {
        __classPrivateFieldGet(this, _Conn_socket, "f").setKeepAlive(enable);
      }
      ref() {
        __classPrivateFieldGet(this, _Conn_socket, "f").ref();
      }
      unref() {
        __classPrivateFieldGet(this, _Conn_socket, "f").unref();
      }
    };
    exports.Conn = Conn;
    var TlsConn = class extends Conn {
      handshake() {
        console.warn("@deno/shim-deno: Handshake is not supported.");
        return Promise.resolve({
          alpnProtocol: null
        });
      }
    };
    exports.TlsConn = TlsConn;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/connect.js
var require_connect = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/connect.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.connect = void 0;
    var net_1 = __require("net");
    var Conn_js_1 = require_Conn();
    var connect = function connect2(options) {
      if (options.transport === "unix") {
        throw new Error("Unstable UnixConnectOptions is not implemented");
      }
      const { transport = "tcp", hostname = "127.0.0.1", port } = options;
      if (transport !== "tcp") {
        throw new Error("Deno.connect is only implemented for transport: tcp");
      }
      const socket = (0, net_1.createConnection)({ port, host: hostname });
      socket.on("error", (err) => console.error(err));
      return new Promise((resolve) => {
        socket.once("connect", () => {
          const rid = socket._handle.fd;
          const localAddr = {
            // cannot be undefined while socket is connected
            hostname: socket.localAddress,
            port: socket.localPort,
            transport: "tcp"
          };
          const remoteAddr = {
            // cannot be undefined while socket is connected
            hostname: socket.remoteAddress,
            port: socket.remotePort,
            transport: "tcp"
          };
          resolve(new Conn_js_1.Conn(rid, localAddr, remoteAddr, socket));
        });
      });
    };
    exports.connect = connect;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/readTextFile.js
var require_readTextFile = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/readTextFile.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readTextFile = void 0;
    var promises_1 = __require("fs/promises");
    var errorMap_js_1 = __importDefault(require_errorMap());
    var readTextFile = async (path, { signal } = {}) => {
      try {
        return await (0, promises_1.readFile)(path, { encoding: "utf8", signal });
      } catch (e) {
        throw (0, errorMap_js_1.default)(e);
      }
    };
    exports.readTextFile = readTextFile;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/connectTls.js
var require_connectTls = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/connectTls.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.connectTls = void 0;
    var tls_1 = __require("tls");
    var Conn_js_1 = require_Conn();
    var readTextFile_js_1 = require_readTextFile();
    var connectTls = async function connectTls2({ port, hostname = "127.0.0.1", certFile }) {
      const cert = certFile && await (0, readTextFile_js_1.readTextFile)(certFile);
      const socket = (0, tls_1.connect)({ port, host: hostname, cert });
      return new Promise((resolve) => {
        socket.on("connect", () => {
          const rid = socket._handle.fd;
          const localAddr = {
            // cannot be undefined while socket is connected
            hostname: socket.localAddress,
            port: socket.localPort,
            transport: "tcp"
          };
          const remoteAddr = {
            // cannot be undefined while socket is connected
            hostname: socket.remoteAddress,
            port: socket.remotePort,
            transport: "tcp"
          };
          resolve(new Conn_js_1.TlsConn(rid, localAddr, remoteAddr, socket));
        });
      });
    };
    exports.connectTls = connectTls;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/consoleSize.js
var require_consoleSize = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/consoleSize.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.consoleSize = void 0;
    var consoleSize = function consoleSize2() {
      const pipes = [process.stderr, process.stdout];
      for (const pipe of pipes) {
        if (pipe.columns != null) {
          const { columns, rows } = pipe;
          return { columns, rows };
        }
      }
      throw new Error("The handle is invalid.");
    };
    exports.consoleSize = consoleSize;
  }
});

// node_modules/@deno/shim-deno/dist/deno/internal/consts.js
var require_consts = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/internal/consts.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_BUFFER_SIZE = void 0;
    exports.DEFAULT_BUFFER_SIZE = 32 * 1024;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/copy.js
var require_copy = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/copy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.copy = void 0;
    var consts_js_1 = require_consts();
    var copy = async function copy2(src, dst, options) {
      var _a;
      let n = 0;
      const bufSize = (_a = options === null || options === void 0 ? void 0 : options.bufSize) !== null && _a !== void 0 ? _a : consts_js_1.DEFAULT_BUFFER_SIZE;
      const b = new Uint8Array(bufSize);
      let gotEOF = false;
      while (gotEOF === false) {
        const result = await src.read(b);
        if (result === null) {
          gotEOF = true;
        } else {
          let nwritten = 0;
          while (nwritten < result) {
            nwritten += await dst.write(b.subarray(nwritten, result));
          }
          n += nwritten;
        }
      }
      return n;
    };
    exports.copy = copy;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/copyFile.js
var require_copyFile = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/copyFile.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.copyFile = void 0;
    var fs = __importStar(__require("fs/promises"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var errors = __importStar(require_errors());
    var copyFile = async (src, dest) => {
      try {
        await fs.copyFile(src, dest);
      } catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "ENOENT") {
          throw new errors.NotFound(`File not found, copy '${src}' -> '${dest}'`);
        }
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.copyFile = copyFile;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/copyFileSync.js
var require_copyFileSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/copyFileSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.copyFileSync = void 0;
    var fs = __importStar(__require("fs"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var errors = __importStar(require_errors());
    var copyFileSync = (src, dest) => {
      try {
        fs.copyFileSync(src, dest);
      } catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "ENOENT") {
          throw new errors.NotFound(`File not found, copy '${src}' -> '${dest}'`);
        }
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.copyFileSync = copyFileSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/internal/fs_flags.js
var require_fs_flags = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/internal/fs_flags.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFsFlag = exports.getCreationFlag = exports.getAccessFlag = void 0;
    var errors = __importStar(require_errors());
    var fs_1 = __require("fs");
    var os_1 = __importDefault(__require("os"));
    var { O_APPEND, O_CREAT, O_EXCL, O_RDONLY, O_RDWR, O_TRUNC, O_WRONLY } = fs_1.constants;
    function getAccessFlag(opts) {
      if (opts.read && !opts.write && !opts.append)
        return O_RDONLY;
      if (!opts.read && opts.write && !opts.append)
        return O_WRONLY;
      if (opts.read && opts.write && !opts.append)
        return O_RDWR;
      if (!opts.read && opts.append)
        return O_WRONLY | O_APPEND;
      if (opts.read && opts.append)
        return O_RDWR | O_APPEND;
      if (!opts.read && !opts.write && !opts.append) {
        throw new errors.BadResource("EINVAL: One of 'read', 'write', 'append' is required to open file.");
      }
      throw new errors.BadResource("EINVAL: Invalid fs flags.");
    }
    exports.getAccessFlag = getAccessFlag;
    function getCreationFlag(opts) {
      if (!opts.write && !opts.append) {
        if (opts.truncate || opts.create || opts.createNew) {
          throw new errors.BadResource("EINVAL: One of 'write', 'append' is required to 'truncate', 'create' or 'createNew' file.");
        }
      }
      if (opts.append) {
        if (opts.truncate && !opts.createNew) {
          throw new errors.BadResource("EINVAL: unexpected 'truncate': true and 'createNew': false when 'append' is true.");
        }
      }
      if (!opts.create && !opts.truncate && !opts.createNew)
        return 0;
      if (opts.create && !opts.truncate && !opts.createNew)
        return O_CREAT;
      if (!opts.create && opts.truncate && !opts.createNew) {
        if (os_1.default.platform() === "win32") {
          return O_CREAT | O_TRUNC;
        } else {
          return O_TRUNC;
        }
      }
      if (opts.create && opts.truncate && !opts.createNew) {
        return O_CREAT | O_TRUNC;
      }
      if (opts.createNew)
        return O_CREAT | O_EXCL;
      throw new errors.BadResource("EINVAL: Invalid fs flags.");
    }
    exports.getCreationFlag = getCreationFlag;
    function getFsFlag(flags) {
      return getAccessFlag(flags) | getCreationFlag(flags);
    }
    exports.getFsFlag = getFsFlag;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/open.js
var require_open = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/open.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.open = void 0;
    var fs_1 = __require("fs");
    var util_1 = __require("util");
    var FsFile_js_1 = require_FsFile();
    var fs_flags_js_1 = require_fs_flags();
    var errorMap_js_1 = __importDefault(require_errorMap());
    var nodeOpen = (0, util_1.promisify)(fs_1.open);
    var open = async function open2(path, { read, write, append, truncate, create, createNew, mode = 438 } = {
      read: true
    }) {
      const flagMode = (0, fs_flags_js_1.getFsFlag)({
        read,
        write,
        append,
        truncate,
        create,
        createNew
      });
      try {
        const fd = await nodeOpen(path, flagMode, mode);
        return new FsFile_js_1.File(fd);
      } catch (err) {
        throw (0, errorMap_js_1.default)(err);
      }
    };
    exports.open = open;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/create.js
var require_create = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/create.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = void 0;
    var open_js_1 = require_open();
    var create = async function create2(path) {
      return await (0, open_js_1.open)(path, { write: true, create: true, truncate: true });
    };
    exports.create = create;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/openSync.js
var require_openSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/openSync.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.openSync = void 0;
    var fs_1 = __require("fs");
    var FsFile_js_1 = require_FsFile();
    var fs_flags_js_1 = require_fs_flags();
    var errorMap_js_1 = __importDefault(require_errorMap());
    var openSync = function openSync2(path, { read, write, append, truncate, create, createNew, mode = 438 } = {
      read: true
    }) {
      const flagMode = (0, fs_flags_js_1.getFsFlag)({
        read,
        write,
        append,
        truncate,
        create,
        createNew
      });
      try {
        const fd = (0, fs_1.openSync)(path, flagMode, mode);
        return new FsFile_js_1.File(fd);
      } catch (err) {
        throw (0, errorMap_js_1.default)(err);
      }
    };
    exports.openSync = openSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/createSync.js
var require_createSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/createSync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createSync = void 0;
    var openSync_js_1 = require_openSync();
    var createSync = function createSync2(path) {
      return (0, openSync_js_1.openSync)(path, {
        create: true,
        truncate: true,
        read: true,
        write: true
      });
    };
    exports.createSync = createSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/cwd.js
var require_cwd = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/cwd.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cwd = void 0;
    exports.cwd = process.cwd;
  }
});

// node_modules/isexe/dist/cjs/posix.js
var require_posix = __commonJS({
  "node_modules/isexe/dist/cjs/posix.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sync = exports.isexe = void 0;
    var fs_1 = __require("fs");
    var promises_1 = __require("fs/promises");
    var isexe = async (path, options = {}) => {
      const { ignoreErrors = false } = options;
      try {
        return checkStat(await (0, promises_1.stat)(path), options);
      } catch (e) {
        const er = e;
        if (ignoreErrors || er.code === "EACCES")
          return false;
        throw er;
      }
    };
    exports.isexe = isexe;
    var sync = (path, options = {}) => {
      const { ignoreErrors = false } = options;
      try {
        return checkStat((0, fs_1.statSync)(path), options);
      } catch (e) {
        const er = e;
        if (ignoreErrors || er.code === "EACCES")
          return false;
        throw er;
      }
    };
    exports.sync = sync;
    var checkStat = (stat, options) => stat.isFile() && checkMode(stat, options);
    var checkMode = (stat, options) => {
      const myUid = options.uid ?? process.getuid?.();
      const myGroups = options.groups ?? process.getgroups?.() ?? [];
      const myGid = options.gid ?? process.getgid?.() ?? myGroups[0];
      if (myUid === void 0 || myGid === void 0) {
        throw new Error("cannot get uid or gid");
      }
      const groups = /* @__PURE__ */ new Set([myGid, ...myGroups]);
      const mod = stat.mode;
      const uid = stat.uid;
      const gid = stat.gid;
      const u = parseInt("100", 8);
      const g = parseInt("010", 8);
      const o = parseInt("001", 8);
      const ug = u | g;
      return !!(mod & o || mod & g && groups.has(gid) || mod & u && uid === myUid || mod & ug && myUid === 0);
    };
  }
});

// node_modules/isexe/dist/cjs/win32.js
var require_win32 = __commonJS({
  "node_modules/isexe/dist/cjs/win32.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sync = exports.isexe = void 0;
    var fs_1 = __require("fs");
    var promises_1 = __require("fs/promises");
    var isexe = async (path, options = {}) => {
      const { ignoreErrors = false } = options;
      try {
        return checkStat(await (0, promises_1.stat)(path), path, options);
      } catch (e) {
        const er = e;
        if (ignoreErrors || er.code === "EACCES")
          return false;
        throw er;
      }
    };
    exports.isexe = isexe;
    var sync = (path, options = {}) => {
      const { ignoreErrors = false } = options;
      try {
        return checkStat((0, fs_1.statSync)(path), path, options);
      } catch (e) {
        const er = e;
        if (ignoreErrors || er.code === "EACCES")
          return false;
        throw er;
      }
    };
    exports.sync = sync;
    var checkPathExt = (path, options) => {
      const { pathExt = process.env.PATHEXT || "" } = options;
      const peSplit = pathExt.split(";");
      if (peSplit.indexOf("") !== -1) {
        return true;
      }
      for (let i = 0; i < peSplit.length; i++) {
        const p = peSplit[i].toLowerCase();
        const ext = path.substring(path.length - p.length).toLowerCase();
        if (p && ext === p) {
          return true;
        }
      }
      return false;
    };
    var checkStat = (stat, path, options) => stat.isFile() && checkPathExt(path, options);
  }
});

// node_modules/isexe/dist/cjs/options.js
var require_options = __commonJS({
  "node_modules/isexe/dist/cjs/options.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/isexe/dist/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/isexe/dist/cjs/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sync = exports.isexe = exports.posix = exports.win32 = void 0;
    var posix = __importStar(require_posix());
    exports.posix = posix;
    var win32 = __importStar(require_win32());
    exports.win32 = win32;
    __exportStar(require_options(), exports);
    var platform = process.env._ISEXE_TEST_PLATFORM_ || process.platform;
    var impl = platform === "win32" ? win32 : posix;
    exports.isexe = impl.isexe;
    exports.sync = impl.sync;
  }
});

// node_modules/which/lib/index.js
var require_lib = __commonJS({
  "node_modules/which/lib/index.js"(exports, module) {
    var { isexe, sync: isexeSync } = require_cjs();
    var { join, delimiter, sep: sep2, posix } = __require("path");
    var isWindows = process.platform === "win32";
    var rSlash = new RegExp(`[${posix.sep}${sep2 === posix.sep ? "" : sep2}]`.replace(/(\\)/g, "\\$1"));
    var rRel = new RegExp(`^\\.${rSlash.source}`);
    var getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
    var getPathInfo = (cmd, {
      path: optPath = process.env.PATH,
      pathExt: optPathExt = process.env.PATHEXT,
      delimiter: optDelimiter = delimiter
    }) => {
      const pathEnv = cmd.match(rSlash) ? [""] : [
        // windows always checks the cwd first
        ...isWindows ? [process.cwd()] : [],
        ...(optPath || /* istanbul ignore next: very unusual */
        "").split(optDelimiter)
      ];
      if (isWindows) {
        const pathExtExe = optPathExt || [".EXE", ".CMD", ".BAT", ".COM"].join(optDelimiter);
        const pathExt = pathExtExe.split(optDelimiter).flatMap((item) => [item, item.toLowerCase()]);
        if (cmd.includes(".") && pathExt[0] !== "") {
          pathExt.unshift("");
        }
        return { pathEnv, pathExt, pathExtExe };
      }
      return { pathEnv, pathExt: [""] };
    };
    var getPathPart = (raw, cmd) => {
      const pathPart = /^".*"$/.test(raw) ? raw.slice(1, -1) : raw;
      const prefix = !pathPart && rRel.test(cmd) ? cmd.slice(0, 2) : "";
      return prefix + join(pathPart, cmd);
    };
    var which = async (cmd, opt = {}) => {
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      for (const envPart of pathEnv) {
        const p = getPathPart(envPart, cmd);
        for (const ext of pathExt) {
          const withExt = p + ext;
          const is = await isexe(withExt, { pathExt: pathExtExe, ignoreErrors: true });
          if (is) {
            if (!opt.all) {
              return withExt;
            }
            found.push(withExt);
          }
        }
      }
      if (opt.all && found.length) {
        return found;
      }
      if (opt.nothrow) {
        return null;
      }
      throw getNotFoundError(cmd);
    };
    var whichSync = (cmd, opt = {}) => {
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      for (const pathEnvPart of pathEnv) {
        const p = getPathPart(pathEnvPart, cmd);
        for (const ext of pathExt) {
          const withExt = p + ext;
          const is = isexeSync(withExt, { pathExt: pathExtExe, ignoreErrors: true });
          if (is) {
            if (!opt.all) {
              return withExt;
            }
            found.push(withExt);
          }
        }
      }
      if (opt.all && found.length) {
        return found;
      }
      if (opt.nothrow) {
        return null;
      }
      throw getNotFoundError(cmd);
    };
    module.exports = which;
    which.sync = whichSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/execPath.js
var require_execPath = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/execPath.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.execPath = void 0;
    var which_1 = __importDefault(require_lib());
    var execPath = () => which_1.default.sync("deno");
    exports.execPath = execPath;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/exit.js
var require_exit = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/exit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.exit = void 0;
    var exit = function exit2(code) {
      return process.exit(code);
    };
    exports.exit = exit;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/fsync.js
var require_fsync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/fsync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fsync = void 0;
    var fs_1 = __require("fs");
    var util_1 = __require("util");
    var fsync = function fsync2(rid) {
      return (0, util_1.promisify)(fs_1.fsync)(rid);
    };
    exports.fsync = fsync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/fsyncSync.js
var require_fsyncSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/fsyncSync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fsyncSync = void 0;
    var fs_1 = __require("fs");
    var fsyncSync = function fsyncSync2(rid) {
      return (0, fs_1.fsyncSync)(rid);
    };
    exports.fsyncSync = fsyncSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/gid.js
var require_gid = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/gid.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.gid = void 0;
    var process_1 = __importDefault(__require("process"));
    exports.gid = (_a = process_1.default.getgid) !== null && _a !== void 0 ? _a : () => null;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/hostname.js
var require_hostname = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/hostname.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hostname = void 0;
    var os = __importStar(__require("os"));
    var hostname = function hostname2() {
      return os.hostname();
    };
    exports.hostname = hostname;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/inspect.js
var require_inspect = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/inspect.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.inspect = void 0;
    var util = __importStar(__require("util"));
    var inspect = (value, options = {}) => util.inspect(value, options);
    exports.inspect = inspect;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/kill.js
var require_kill = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/kill.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.kill = void 0;
    var os_1 = __importDefault(__require("os"));
    var process_1 = __importDefault(__require("process"));
    var kill = function(pid, signo) {
      if (pid < 0 && os_1.default.platform() === "win32") {
        throw new TypeError("Invalid pid");
      }
      process_1.default.kill(pid, signo);
    };
    exports.kill = kill;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/link.js
var require_link = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/link.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.link = void 0;
    var fs = __importStar(__require("fs/promises"));
    exports.link = fs.link;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/linkSync.js
var require_linkSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/linkSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.linkSync = void 0;
    var fs = __importStar(__require("fs"));
    exports.linkSync = fs.linkSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/internal/Listener.js
var require_Listener = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/internal/Listener.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __classPrivateFieldSet = exports && exports.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    var __classPrivateFieldGet = exports && exports.__classPrivateFieldGet || function(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var _Listener_listener;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Listener = void 0;
    var close_js_1 = require_close();
    var errors = __importStar(require_errors());
    var Listener = class {
      constructor(rid, addr, listener) {
        this.rid = rid;
        this.addr = addr;
        _Listener_listener.set(this, void 0);
        __classPrivateFieldSet(this, _Listener_listener, listener, "f");
      }
      [(_Listener_listener = /* @__PURE__ */ new WeakMap(), Symbol.dispose)]() {
        this.close();
      }
      async accept() {
        if (!__classPrivateFieldGet(this, _Listener_listener, "f")) {
          throw new errors.BadResource("Listener not initialised");
        }
        const result = await __classPrivateFieldGet(this, _Listener_listener, "f").next();
        if (result.done) {
          throw new errors.BadResource("Server not listening");
        }
        return result.value;
      }
      async next() {
        let conn;
        try {
          conn = await this.accept();
        } catch (error) {
          if (error instanceof errors.BadResource) {
            return { value: void 0, done: true };
          }
          throw error;
        }
        return { value: conn, done: false };
      }
      return(value) {
        this.close();
        return Promise.resolve({ value, done: true });
      }
      close() {
        (0, close_js_1.close)(this.rid);
      }
      ref() {
        throw new Error("Not implemented");
      }
      unref() {
        throw new Error("Not implemented");
      }
      [Symbol.asyncIterator]() {
        return this;
      }
    };
    exports.Listener = Listener;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/listen.js
var require_listen = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/listen.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.listen = void 0;
    var net_1 = __require("net");
    var Conn_js_1 = require_Conn();
    var Listener_js_1 = require_Listener();
    async function* _listen(server, waitFor) {
      await waitFor;
      while (server.listening) {
        yield new Promise((resolve) => server.once("connection", (socket) => {
          socket.on("error", (err) => console.error(err));
          const rid = socket._handle.fd;
          const localAddr = {
            // cannot be undefined while socket is connected
            hostname: socket.localAddress,
            port: socket.localPort,
            transport: "tcp"
          };
          const remoteAddr = {
            // cannot be undefined while socket is connected
            hostname: socket.remoteAddress,
            port: socket.remotePort,
            transport: "tcp"
          };
          resolve(new Conn_js_1.Conn(rid, localAddr, remoteAddr));
        }));
      }
    }
    var listen = function listen2(options) {
      if (options.transport === "unix") {
        throw new Error("Unstable UnixListenOptions is not implemented");
      }
      const { port, hostname = "0.0.0.0", transport = "tcp" } = options;
      if (transport !== "tcp") {
        throw new Error("Deno.listen is only implemented for transport: tcp");
      }
      const server = (0, net_1.createServer)();
      const waitFor = new Promise((resolve) => (
        // server._handle.fd is assigned immediately on .listen()
        server.listen(port, hostname, resolve)
      ));
      const listener = new Listener_js_1.Listener(server._handle.fd, {
        hostname,
        port,
        transport: "tcp"
      }, _listen(server, waitFor));
      return listener;
    };
    exports.listen = listen;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/readTextFileSync.js
var require_readTextFileSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/readTextFileSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readTextFileSync = void 0;
    var fs = __importStar(__require("fs"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var readTextFileSync = function(path) {
      try {
        return fs.readFileSync(path, "utf8");
      } catch (e) {
        throw (0, errorMap_js_1.default)(e);
      }
    };
    exports.readTextFileSync = readTextFileSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/listenTls.js
var require_listenTls = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/listenTls.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.listenTls = void 0;
    var tls_1 = __require("tls");
    var Conn_js_1 = require_Conn();
    var Listener_js_1 = require_Listener();
    var readTextFileSync_js_1 = require_readTextFileSync();
    async function* _listen(server, waitFor) {
      await waitFor;
      while (server.listening) {
        yield new Promise((resolve) => server.once("secureConnection", (socket) => {
          socket.on("error", (err) => console.error(err));
          const rid = socket._handle.fd;
          const localAddr = {
            // cannot be undefined while socket is connected
            hostname: socket.localAddress,
            port: socket.localPort,
            transport: "tcp"
          };
          const remoteAddr = {
            // cannot be undefined while socket is connected
            hostname: socket.remoteAddress,
            port: socket.remotePort,
            transport: "tcp"
          };
          resolve(new Conn_js_1.TlsConn(rid, localAddr, remoteAddr));
        }));
      }
    }
    var listenTls = function listen({ port, hostname = "0.0.0.0", transport = "tcp", certFile, keyFile }) {
      if (transport !== "tcp") {
        throw new Error("Deno.listen is only implemented for transport: tcp");
      }
      const [cert, key] = [certFile, keyFile].map((f) => f == null ? void 0 : (0, readTextFileSync_js_1.readTextFileSync)(f));
      const server = (0, tls_1.createServer)({ cert, key });
      const waitFor = new Promise((resolve) => (
        // server._handle.fd is assigned immediately on .listen()
        server.listen(port, hostname, resolve)
      ));
      const listener = new Listener_js_1.Listener(server._handle.fd, {
        hostname,
        port,
        transport: "tcp"
      }, _listen(server, waitFor));
      return listener;
    };
    exports.listenTls = listenTls;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/loadavg.js
var require_loadavg = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/loadavg.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.loadavg = void 0;
    var os = __importStar(__require("os"));
    var loadavg = function loadavg2() {
      return os.loadavg();
    };
    exports.loadavg = loadavg;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/lstat.js
var require_lstat = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/lstat.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lstat = void 0;
    var fs = __importStar(__require("fs/promises"));
    var stat_js_1 = require_stat();
    var errorMap_js_1 = __importDefault(require_errorMap());
    var lstat = async (path) => {
      try {
        return (0, stat_js_1.denoifyFileInfo)(await fs.lstat(path));
      } catch (e) {
        throw (0, errorMap_js_1.default)(e);
      }
    };
    exports.lstat = lstat;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/lstatSync.js
var require_lstatSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/lstatSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lstatSync = void 0;
    var fs = __importStar(__require("fs"));
    var stat_js_1 = require_stat();
    var errorMap_js_1 = __importDefault(require_errorMap());
    var lstatSync = (path) => {
      try {
        return (0, stat_js_1.denoifyFileInfo)(fs.lstatSync(path));
      } catch (err) {
        throw (0, errorMap_js_1.default)(err);
      }
    };
    exports.lstatSync = lstatSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/makeTempDir.js
var require_makeTempDir = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/makeTempDir.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.makeTempDir = void 0;
    var promises_1 = __require("fs/promises");
    var path_1 = __require("path");
    var os_1 = __require("os");
    var makeTempDir = function makeTempDir2({ prefix = "" } = {}) {
      return (0, promises_1.mkdtemp)((0, path_1.join)((0, os_1.tmpdir)(), prefix || "/"));
    };
    exports.makeTempDir = makeTempDir;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/makeTempDirSync.js
var require_makeTempDirSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/makeTempDirSync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.makeTempDirSync = void 0;
    var fs_1 = __require("fs");
    var path_1 = __require("path");
    var os_1 = __require("os");
    var makeTempDirSync = function makeTempDirSync2({ prefix = "" } = {}) {
      return (0, fs_1.mkdtempSync)((0, path_1.join)((0, os_1.tmpdir)(), prefix || "/"));
    };
    exports.makeTempDirSync = makeTempDirSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/internal/random_id.js
var require_random_id = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/internal/random_id.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.randomId = void 0;
    var randomId = () => {
      const n = (Math.random() * 1048575 * 1e6).toString(16);
      return "" + n.slice(0, 6);
    };
    exports.randomId = randomId;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/writeTextFile.js
var require_writeTextFile = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/writeTextFile.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writeTextFile = void 0;
    var fs = __importStar(__require("fs/promises"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var fs_flags_js_1 = require_fs_flags();
    var writeTextFile = async function writeTextFile2(path, data, { append = false, create = true, createNew = false, mode, signal } = {}) {
      const truncate = create && !append;
      const flag = (0, fs_flags_js_1.getFsFlag)({
        append,
        create,
        createNew,
        truncate,
        write: true
      });
      try {
        await fs.writeFile(path, data, { flag, mode, signal });
        if (mode !== void 0)
          await fs.chmod(path, mode);
      } catch (error) {
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.writeTextFile = writeTextFile;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/makeTempFile.js
var require_makeTempFile = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/makeTempFile.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.makeTempFile = void 0;
    var os_1 = __require("os");
    var path_1 = __require("path");
    var random_id_js_1 = require_random_id();
    var writeTextFile_js_1 = require_writeTextFile();
    var makeTempFile = async function makeTempFile2({ prefix = "" } = {}) {
      const name = (0, path_1.join)((0, os_1.tmpdir)(), prefix, (0, random_id_js_1.randomId)());
      await (0, writeTextFile_js_1.writeTextFile)(name, "");
      return name;
    };
    exports.makeTempFile = makeTempFile;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/writeTextFileSync.js
var require_writeTextFileSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/writeTextFileSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writeTextFileSync = void 0;
    var fs = __importStar(__require("fs"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var writeTextFileSync = (path, data, { append = false, create = true, mode } = {}) => {
      const flag = create ? append ? "a" : "w" : "r+";
      try {
        fs.writeFileSync(path, data, { flag, mode });
        if (mode !== void 0)
          fs.chmodSync(path, mode);
      } catch (error) {
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.writeTextFileSync = writeTextFileSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/makeTempFileSync.js
var require_makeTempFileSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/makeTempFileSync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.makeTempFileSync = void 0;
    var os_1 = __require("os");
    var path_1 = __require("path");
    var random_id_js_1 = require_random_id();
    var writeTextFileSync_js_1 = require_writeTextFileSync();
    var makeTempFileSync = function makeTempFileSync2({ prefix = "" } = {}) {
      const name = (0, path_1.join)((0, os_1.tmpdir)(), prefix, (0, random_id_js_1.randomId)());
      (0, writeTextFileSync_js_1.writeTextFileSync)(name, "");
      return name;
    };
    exports.makeTempFileSync = makeTempFileSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/memoryUsage.js
var require_memoryUsage = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/memoryUsage.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.memoryUsage = void 0;
    exports.memoryUsage = process.memoryUsage;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/mkdir.js
var require_mkdir = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/mkdir.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mkdir = void 0;
    var promises_1 = __require("fs/promises");
    var errorMap_js_1 = __importDefault(require_errorMap());
    var variables_js_1 = require_variables();
    var mkdir = async function mkdir2(path, options) {
      try {
        await (0, promises_1.mkdir)(path, options);
      } catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "EEXIST") {
          throw new variables_js_1.errors.AlreadyExists(`File exists (os error 17), mkdir '${path}'`);
        }
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.mkdir = mkdir;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/mkdirSync.js
var require_mkdirSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/mkdirSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mkdirSync = void 0;
    var fs = __importStar(__require("fs"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var variables_js_1 = require_variables();
    var mkdirSync = (path, options) => {
      try {
        fs.mkdirSync(path, options);
      } catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "EEXIST") {
          throw new variables_js_1.errors.AlreadyExists(`File exists (os error 17), mkdir '${path}'`);
        }
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.mkdirSync = mkdirSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/osRelease.js
var require_osRelease = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/osRelease.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.osRelease = void 0;
    var os_1 = __require("os");
    var osRelease = function osRelease2() {
      return (0, os_1.release)();
    };
    exports.osRelease = osRelease;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/osUptime.js
var require_osUptime = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/osUptime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.osUptime = void 0;
    var os_1 = __require("os");
    var osUptime = function osUptime2() {
      return (0, os_1.uptime)();
    };
    exports.osUptime = osUptime;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/readDir.js
var require_readDir = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/readDir.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readDir = void 0;
    var promises_1 = __require("fs/promises");
    var errorMap_js_1 = __importDefault(require_errorMap());
    var readDir = async function* readDir2(path) {
      try {
        for await (const e of await (0, promises_1.opendir)(String(path))) {
          const ent = {
            name: e.name,
            isFile: e.isFile(),
            isDirectory: e.isDirectory(),
            isSymlink: e.isSymbolicLink()
          };
          yield ent;
        }
      } catch (e) {
        throw (0, errorMap_js_1.default)(e);
      }
    };
    exports.readDir = readDir;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/readDirSync.js
var require_readDirSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/readDirSync.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readDirSync = void 0;
    var fs_1 = __require("fs");
    var errorMap_js_1 = __importDefault(require_errorMap());
    var readDirSync = function* readDir(path) {
      try {
        for (const e of (0, fs_1.readdirSync)(String(path), { withFileTypes: true })) {
          const ent = {
            name: e.name,
            isFile: e.isFile(),
            isDirectory: e.isDirectory(),
            isSymlink: e.isSymbolicLink()
          };
          yield ent;
        }
      } catch (e) {
        throw (0, errorMap_js_1.default)(e);
      }
    };
    exports.readDirSync = readDirSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/readFile.js
var require_readFile = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/readFile.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readFile = void 0;
    var promises_1 = __require("fs/promises");
    var errorMap_js_1 = __importDefault(require_errorMap());
    var readFile = async function readFile2(path, { signal } = {}) {
      try {
        const buf = await (0, promises_1.readFile)(path, { signal });
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
      } catch (e) {
        throw (0, errorMap_js_1.default)(e);
      }
    };
    exports.readFile = readFile;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/readFileSync.js
var require_readFileSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/readFileSync.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readFileSync = void 0;
    var fs_1 = __require("fs");
    var errorMap_js_1 = __importDefault(require_errorMap());
    var readFileSync = function readFileSync2(path) {
      try {
        const buf = (0, fs_1.readFileSync)(path);
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
      } catch (e) {
        throw (0, errorMap_js_1.default)(e);
      }
    };
    exports.readFileSync = readFileSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/readLink.js
var require_readLink = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/readLink.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readLink = void 0;
    var fs = __importStar(__require("fs/promises"));
    exports.readLink = fs.readlink;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/readLinkSync.js
var require_readLinkSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/readLinkSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readLinkSync = void 0;
    var fs = __importStar(__require("fs"));
    exports.readLinkSync = fs.readlinkSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/realPath.js
var require_realPath = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/realPath.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.realPath = void 0;
    var fs = __importStar(__require("fs/promises"));
    exports.realPath = fs.realpath;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/realPathSync.js
var require_realPathSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/realPathSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.realPathSync = void 0;
    var fs = __importStar(__require("fs"));
    exports.realPathSync = fs.realpathSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/remove.js
var require_remove = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/remove.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.remove = void 0;
    var promises_1 = __require("fs/promises");
    var remove = async function remove2(path, options = {}) {
      const innerOptions = options.recursive ? { recursive: true, force: true } : {};
      try {
        return await (0, promises_1.rm)(path, innerOptions);
      } catch (err) {
        if (err.code === "ERR_FS_EISDIR") {
          return await (0, promises_1.rmdir)(path, innerOptions);
        } else {
          throw err;
        }
      }
    };
    exports.remove = remove;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/removeSignalListener.js
var require_removeSignalListener = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/removeSignalListener.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.removeSignalListener = void 0;
    var process_1 = __importDefault(__require("process"));
    var removeSignalListener = (signal, handler) => {
      process_1.default.removeListener(signal, handler);
    };
    exports.removeSignalListener = removeSignalListener;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/removeSync.js
var require_removeSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/removeSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.removeSync = void 0;
    var fs = __importStar(__require("fs"));
    var removeSync = (path, options = {}) => {
      const innerOptions = options.recursive ? { recursive: true, force: true } : {};
      try {
        fs.rmSync(path, innerOptions);
      } catch (err) {
        if (err.code === "ERR_FS_EISDIR") {
          fs.rmdirSync(path, innerOptions);
        } else {
          throw err;
        }
      }
    };
    exports.removeSync = removeSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/rename.js
var require_rename = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/rename.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.rename = void 0;
    var promises_1 = __require("fs/promises");
    var rename = function rename2(oldpath, newpath) {
      return (0, promises_1.rename)(oldpath, newpath);
    };
    exports.rename = rename;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/renameSync.js
var require_renameSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/renameSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renameSync = void 0;
    var fs = __importStar(__require("fs"));
    exports.renameSync = fs.renameSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/resolveDns.js
var require_resolveDns = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/resolveDns.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveDns = void 0;
    var dns_1 = __importDefault(__require("dns"));
    var resolveDns = function resolveDns2(query, recordType, options) {
      if (options) {
        throw Error(`resolveDns option not implemnted yet`);
      }
      switch (recordType) {
        case "A":
        /* falls through */
        case "AAAA":
        case "CNAME":
        case "NS":
        case "PTR":
          return new Promise((resolve, reject) => {
            dns_1.default.resolve(query, recordType, (err, addresses) => {
              if (err) {
                reject(err);
              } else {
                resolve(addresses);
              }
            });
          });
        case "ANAME":
        case "CAA":
        case "MX":
        case "NAPTR":
        case "SOA":
        case "SRV":
        case "TXT":
        default:
          throw Error(`resolveDns type ${recordType} not implemnted yet`);
      }
    };
    exports.resolveDns = resolveDns;
  }
});

// node_modules/@deno/shim-deno/dist/deno/internal/streams.js
var require_streams = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/internal/streams.js"(exports) {
    "use strict";
    var __classPrivateFieldSet = exports && exports.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    var __classPrivateFieldGet = exports && exports.__classPrivateFieldGet || function(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var _BufferStreamReader_instances;
    var _BufferStreamReader_stream;
    var _BufferStreamReader_error;
    var _BufferStreamReader_ended;
    var _BufferStreamReader_pendingActions;
    var _BufferStreamReader_runPendingActions;
    var _StreamWriter_stream;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StreamWriter = exports.BufferStreamReader = void 0;
    var BufferStreamReader = class {
      constructor(stream) {
        _BufferStreamReader_instances.add(this);
        _BufferStreamReader_stream.set(this, void 0);
        _BufferStreamReader_error.set(this, void 0);
        _BufferStreamReader_ended.set(this, false);
        _BufferStreamReader_pendingActions.set(this, []);
        __classPrivateFieldSet(this, _BufferStreamReader_stream, stream, "f");
        __classPrivateFieldGet(this, _BufferStreamReader_stream, "f").pause();
        __classPrivateFieldGet(this, _BufferStreamReader_stream, "f").on("error", (error) => {
          __classPrivateFieldSet(this, _BufferStreamReader_error, error, "f");
          __classPrivateFieldGet(this, _BufferStreamReader_instances, "m", _BufferStreamReader_runPendingActions).call(this);
        });
        __classPrivateFieldGet(this, _BufferStreamReader_stream, "f").on("readable", () => {
          __classPrivateFieldGet(this, _BufferStreamReader_instances, "m", _BufferStreamReader_runPendingActions).call(this);
        });
        __classPrivateFieldGet(this, _BufferStreamReader_stream, "f").on("end", () => {
          __classPrivateFieldSet(this, _BufferStreamReader_ended, true, "f");
          __classPrivateFieldGet(this, _BufferStreamReader_instances, "m", _BufferStreamReader_runPendingActions).call(this);
        });
      }
      readAll() {
        return new Promise((resolve, reject) => {
          const chunks = [];
          const action = () => {
            if (__classPrivateFieldGet(this, _BufferStreamReader_error, "f")) {
              reject(__classPrivateFieldGet(this, _BufferStreamReader_error, "f"));
              return;
            }
            const buffer = __classPrivateFieldGet(this, _BufferStreamReader_stream, "f").read();
            if (buffer != null) {
              chunks.push(buffer);
              __classPrivateFieldGet(this, _BufferStreamReader_pendingActions, "f").push(action);
            } else if (__classPrivateFieldGet(this, _BufferStreamReader_ended, "f")) {
              const result = Buffer.concat(chunks);
              resolve(result);
            } else {
              __classPrivateFieldGet(this, _BufferStreamReader_pendingActions, "f").push(action);
            }
          };
          action();
        });
      }
      read(p) {
        return new Promise((resolve, reject) => {
          const action = () => {
            if (__classPrivateFieldGet(this, _BufferStreamReader_error, "f")) {
              reject(__classPrivateFieldGet(this, _BufferStreamReader_error, "f"));
              return;
            }
            const readBuffer = __classPrivateFieldGet(this, _BufferStreamReader_stream, "f").read(p.byteLength);
            if (readBuffer && readBuffer.byteLength > 0) {
              readBuffer.copy(p, 0, 0, readBuffer.byteLength);
              resolve(readBuffer.byteLength);
              return;
            }
            if (__classPrivateFieldGet(this, _BufferStreamReader_ended, "f")) {
              resolve(null);
            } else {
              __classPrivateFieldGet(this, _BufferStreamReader_pendingActions, "f").push(action);
            }
          };
          action();
        });
      }
    };
    exports.BufferStreamReader = BufferStreamReader;
    _BufferStreamReader_stream = /* @__PURE__ */ new WeakMap(), _BufferStreamReader_error = /* @__PURE__ */ new WeakMap(), _BufferStreamReader_ended = /* @__PURE__ */ new WeakMap(), _BufferStreamReader_pendingActions = /* @__PURE__ */ new WeakMap(), _BufferStreamReader_instances = /* @__PURE__ */ new WeakSet(), _BufferStreamReader_runPendingActions = function _BufferStreamReader_runPendingActions2() {
      const errors = [];
      for (const action of __classPrivateFieldGet(this, _BufferStreamReader_pendingActions, "f").splice(0)) {
        try {
          action();
        } catch (err) {
          errors.push(err);
        }
      }
      if (errors.length > 0) {
        throw errors.length > 1 ? new globalThis.AggregateError(errors) : errors[0];
      }
    };
    var StreamWriter = class {
      constructor(stream) {
        _StreamWriter_stream.set(this, void 0);
        __classPrivateFieldSet(this, _StreamWriter_stream, stream, "f");
      }
      write(p) {
        return new Promise((resolve, reject) => {
          __classPrivateFieldGet(this, _StreamWriter_stream, "f").write(p, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(p.byteLength);
            }
          });
        });
      }
    };
    exports.StreamWriter = StreamWriter;
    _StreamWriter_stream = /* @__PURE__ */ new WeakMap();
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/run.js
var require_run = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/run.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __classPrivateFieldSet = exports && exports.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    var __classPrivateFieldGet = exports && exports.__classPrivateFieldGet || function(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var _Process_process;
    var _Process_stderr;
    var _Process_stdout;
    var _Process_stdin;
    var _Process_status;
    var _Process_receivedStatus;
    var _ProcessReadStream_stream;
    var _ProcessReadStream_bufferStreamReader;
    var _ProcessReadStream_closed;
    var _ProcessWriteStream_stream;
    var _ProcessWriteStream_streamWriter;
    var _ProcessWriteStream_closed;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Process = exports.run = void 0;
    var child_process_1 = __importDefault(__require("child_process"));
    var fs_1 = __importDefault(__require("fs"));
    var os_1 = __importDefault(__require("os"));
    var url_1 = __importDefault(__require("url"));
    var events_1 = __require("events");
    var which_1 = __importDefault(require_lib());
    var streams_js_1 = require_streams();
    var errors = __importStar(require_errors());
    var run = function run2(options) {
      const [cmd, ...args] = options.cmd;
      if (options.cwd && !fs_1.default.existsSync(options.cwd)) {
        throw new Error("The directory name is invalid.");
      }
      const commandName = getCmd(cmd);
      if (!which_1.default.sync(commandName, { nothrow: true })) {
        throw new errors.NotFound("The system cannot find the file specified.");
      }
      const process2 = child_process_1.default.spawn(commandName, args, {
        cwd: options.cwd,
        env: getEnv(options),
        uid: options.uid,
        gid: options.gid,
        shell: false,
        stdio: [
          getStdio(options.stdin, "in"),
          getStdio(options.stdout, "out"),
          getStdio(options.stderr, "out")
        ]
      });
      return new Process(process2);
    };
    exports.run = run;
    function getStdio(value, kind) {
      if (value === "inherit" || value == null) {
        return "inherit";
      } else if (value === "piped") {
        return "pipe";
      } else if (value === "null") {
        return "ignore";
      } else if (typeof value === "number") {
        switch (kind) {
          case "in":
            return fs_1.default.createReadStream(null, { fd: value });
          case "out":
            return fs_1.default.createWriteStream(null, { fd: value });
          default: {
            const _assertNever = kind;
            throw new Error("Unreachable.");
          }
        }
      } else {
        const _assertNever = value;
        throw new Error("Unknown value.");
      }
    }
    function getCmd(firstArg) {
      if (firstArg instanceof URL) {
        return url_1.default.fileURLToPath(firstArg);
      } else {
        return firstArg;
      }
    }
    function getEnv(options) {
      var _a;
      const env = (_a = options.env) !== null && _a !== void 0 ? _a : {};
      for (const name in process.env) {
        if (!Object.prototype.hasOwnProperty.call(env, name)) {
          if (options.clearEnv) {
            if (os_1.default.platform() === "win32") {
              env[name] = "";
            } else {
              delete env[name];
            }
          } else {
            env[name] = process.env[name];
          }
        }
      }
      return env;
    }
    var Process = class {
      /** @internal */
      constructor(process2) {
        var _a, _b, _c;
        _Process_process.set(this, void 0);
        _Process_stderr.set(this, void 0);
        _Process_stdout.set(this, void 0);
        _Process_stdin.set(this, void 0);
        _Process_status.set(this, void 0);
        _Process_receivedStatus.set(this, false);
        __classPrivateFieldSet(this, _Process_process, process2, "f");
        __classPrivateFieldSet(this, _Process_stdout, (_a = ProcessReadStream.fromNullable(__classPrivateFieldGet(this, _Process_process, "f").stdout)) !== null && _a !== void 0 ? _a : null, "f");
        __classPrivateFieldSet(this, _Process_stderr, (_b = ProcessReadStream.fromNullable(__classPrivateFieldGet(this, _Process_process, "f").stderr)) !== null && _b !== void 0 ? _b : null, "f");
        __classPrivateFieldSet(this, _Process_stdin, (_c = ProcessWriteStream.fromNullable(__classPrivateFieldGet(this, _Process_process, "f").stdin)) !== null && _c !== void 0 ? _c : null, "f");
        __classPrivateFieldSet(this, _Process_status, (0, events_1.once)(process2, "exit"), "f");
      }
      get rid() {
        return NaN;
      }
      get pid() {
        return __classPrivateFieldGet(this, _Process_process, "f").pid;
      }
      get stdin() {
        return __classPrivateFieldGet(this, _Process_stdin, "f");
      }
      get stdout() {
        return __classPrivateFieldGet(this, _Process_stdout, "f");
      }
      get stderr() {
        return __classPrivateFieldGet(this, _Process_stderr, "f");
      }
      async status() {
        const [receivedCode, signalName] = await __classPrivateFieldGet(this, _Process_status, "f");
        const signal = signalName ? os_1.default.constants.signals[signalName] : receivedCode > 128 ? receivedCode - 128 : void 0;
        const code = receivedCode != null ? receivedCode : signal != null ? 128 + signal : void 0;
        const success = code === 0;
        __classPrivateFieldSet(this, _Process_receivedStatus, true, "f");
        return { code, signal, success };
      }
      async output() {
        if (!__classPrivateFieldGet(this, _Process_stdout, "f")) {
          throw new TypeError("stdout was not piped");
        }
        const result = await __classPrivateFieldGet(this, _Process_stdout, "f").readAll();
        __classPrivateFieldGet(this, _Process_stdout, "f").close();
        return result;
      }
      async stderrOutput() {
        if (!__classPrivateFieldGet(this, _Process_stderr, "f")) {
          throw new TypeError("stderr was not piped");
        }
        const result = await __classPrivateFieldGet(this, _Process_stderr, "f").readAll();
        __classPrivateFieldGet(this, _Process_stderr, "f").close();
        return result;
      }
      close() {
        __classPrivateFieldGet(this, _Process_process, "f").unref();
        __classPrivateFieldGet(this, _Process_process, "f").kill();
      }
      kill(signo = "SIGTERM") {
        if (__classPrivateFieldGet(this, _Process_receivedStatus, "f")) {
          throw new errors.NotFound("entity not found");
        }
        __classPrivateFieldGet(this, _Process_process, "f").kill(signo);
      }
    };
    exports.Process = Process;
    _Process_process = /* @__PURE__ */ new WeakMap(), _Process_stderr = /* @__PURE__ */ new WeakMap(), _Process_stdout = /* @__PURE__ */ new WeakMap(), _Process_stdin = /* @__PURE__ */ new WeakMap(), _Process_status = /* @__PURE__ */ new WeakMap(), _Process_receivedStatus = /* @__PURE__ */ new WeakMap();
    var ProcessReadStream = class _ProcessReadStream {
      constructor(stream) {
        _ProcessReadStream_stream.set(this, void 0);
        _ProcessReadStream_bufferStreamReader.set(this, void 0);
        _ProcessReadStream_closed.set(this, false);
        __classPrivateFieldSet(this, _ProcessReadStream_stream, stream, "f");
        __classPrivateFieldSet(this, _ProcessReadStream_bufferStreamReader, new streams_js_1.BufferStreamReader(stream), "f");
      }
      static fromNullable(stream) {
        return stream ? new _ProcessReadStream(stream) : void 0;
      }
      readAll() {
        if (__classPrivateFieldGet(this, _ProcessReadStream_closed, "f")) {
          return Promise.resolve(new Uint8Array(0));
        } else {
          return __classPrivateFieldGet(this, _ProcessReadStream_bufferStreamReader, "f").readAll();
        }
      }
      read(p) {
        if (__classPrivateFieldGet(this, _ProcessReadStream_closed, "f")) {
          return Promise.resolve(null);
        } else {
          return __classPrivateFieldGet(this, _ProcessReadStream_bufferStreamReader, "f").read(p);
        }
      }
      close() {
        __classPrivateFieldSet(this, _ProcessReadStream_closed, true, "f");
        __classPrivateFieldGet(this, _ProcessReadStream_stream, "f").destroy();
      }
      get readable() {
        throw new Error("Not implemented.");
      }
      get writable() {
        throw new Error("Not implemented.");
      }
    };
    _ProcessReadStream_stream = /* @__PURE__ */ new WeakMap(), _ProcessReadStream_bufferStreamReader = /* @__PURE__ */ new WeakMap(), _ProcessReadStream_closed = /* @__PURE__ */ new WeakMap();
    var ProcessWriteStream = class _ProcessWriteStream {
      constructor(stream) {
        _ProcessWriteStream_stream.set(this, void 0);
        _ProcessWriteStream_streamWriter.set(this, void 0);
        _ProcessWriteStream_closed.set(this, false);
        __classPrivateFieldSet(this, _ProcessWriteStream_stream, stream, "f");
        __classPrivateFieldSet(this, _ProcessWriteStream_streamWriter, new streams_js_1.StreamWriter(stream), "f");
      }
      static fromNullable(stream) {
        return stream ? new _ProcessWriteStream(stream) : void 0;
      }
      write(p) {
        if (__classPrivateFieldGet(this, _ProcessWriteStream_closed, "f")) {
          return Promise.resolve(0);
        } else {
          return __classPrivateFieldGet(this, _ProcessWriteStream_streamWriter, "f").write(p);
        }
      }
      close() {
        __classPrivateFieldSet(this, _ProcessWriteStream_closed, true, "f");
        __classPrivateFieldGet(this, _ProcessWriteStream_stream, "f").end();
      }
    };
    _ProcessWriteStream_stream = /* @__PURE__ */ new WeakMap(), _ProcessWriteStream_streamWriter = /* @__PURE__ */ new WeakMap(), _ProcessWriteStream_closed = /* @__PURE__ */ new WeakMap();
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/shutdown.js
var require_shutdown = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/shutdown.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shutdown = void 0;
    var net_1 = __require("net");
    var shutdown = async function shutdown2(rid) {
      await new Promise((resolve) => new net_1.Socket({ fd: rid }).end(resolve));
    };
    exports.shutdown = shutdown;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/statSync.js
var require_statSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/statSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.statSync = void 0;
    var fs = __importStar(__require("fs"));
    var stat_js_1 = require_stat();
    var errorMap_js_1 = __importDefault(require_errorMap());
    var statSync = (path) => {
      try {
        return (0, stat_js_1.denoifyFileInfo)(fs.statSync(path));
      } catch (err) {
        throw (0, errorMap_js_1.default)(err);
      }
    };
    exports.statSync = statSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/symlink.js
var require_symlink = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/symlink.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.symlink = void 0;
    var fs = __importStar(__require("fs/promises"));
    var symlink = async (oldpath, newpath, options) => await fs.symlink(oldpath, newpath, options === null || options === void 0 ? void 0 : options.type);
    exports.symlink = symlink;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/symlinkSync.js
var require_symlinkSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/symlinkSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.symlinkSync = void 0;
    var fs = __importStar(__require("fs"));
    var symlinkSync = (oldpath, newpath, options) => fs.symlinkSync(oldpath, newpath, options === null || options === void 0 ? void 0 : options.type);
    exports.symlinkSync = symlinkSync;
  }
});

// node_modules/@deno/shim-deno-test/dist/definitions.js
var require_definitions = __commonJS({
  "node_modules/@deno/shim-deno-test/dist/definitions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testDefinitions = void 0;
    exports.testDefinitions = [];
  }
});

// node_modules/@deno/shim-deno-test/dist/test.js
var require_test = __commonJS({
  "node_modules/@deno/shim-deno-test/dist/test.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.test = void 0;
    var definitions_js_1 = require_definitions();
    exports.test = Object.assign(function test() {
      handleDefinition(arguments);
    }, {
      ignore() {
        handleDefinition(arguments, { ignore: true });
      },
      only() {
        handleDefinition(arguments, { only: true });
      }
    });
    function handleDefinition(args, additional) {
      var _a, _b;
      let testDef;
      const firstArg = args[0];
      const secondArg = args[1];
      const thirdArg = args[2];
      if (typeof firstArg === "string") {
        if (typeof secondArg === "object") {
          if (typeof thirdArg === "function") {
            if (secondArg.fn != null) {
              throw new TypeError("Unexpected 'fn' field in options, test function is already provided as the third argument.");
            }
          }
          if (secondArg.name != null) {
            throw new TypeError("Unexpected 'name' field in options, test name is already provided as the first argument.");
          }
          testDef = { name: firstArg, fn: thirdArg, ...secondArg };
        } else {
          testDef = { name: firstArg, fn: secondArg };
        }
      } else if (firstArg instanceof Function) {
        if (firstArg.name.length === 0) {
          throw new TypeError("The test function must have a name");
        }
        testDef = { fn: firstArg, name: firstArg.name };
        if (secondArg != null) {
          throw new TypeError("Unexpected second argument to Deno.test()");
        }
      } else if (typeof firstArg === "object") {
        testDef = { ...firstArg };
        if (typeof secondArg === "function") {
          testDef.fn = secondArg;
          if (firstArg.fn != null) {
            throw new TypeError("Unexpected 'fn' field in options, test function is already provided as the second argument.");
          }
          if (testDef.name == null) {
            if (secondArg.name.length === 0) {
              throw new TypeError("The test function must have a name");
            }
            testDef.name = secondArg.name;
          }
        } else {
          if (typeof firstArg.fn !== "function") {
            throw new TypeError("Expected 'fn' field in the first argument to be a test function.");
          }
        }
      } else {
        throw new TypeError("Unknown test overload");
      }
      if (typeof testDef.fn !== "function") {
        throw new TypeError("Missing test function");
      }
      if (((_b = (_a = testDef.name) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) === 0) {
        throw new TypeError("The test name can't be empty");
      }
      if (additional === null || additional === void 0 ? void 0 : additional.ignore) {
        testDef.ignore = true;
      }
      if (additional === null || additional === void 0 ? void 0 : additional.only) {
        testDef.only = true;
      }
      definitions_js_1.testDefinitions.push(testDef);
    }
  }
});

// node_modules/@deno/shim-deno-test/dist/index.js
var require_dist = __commonJS({
  "node_modules/@deno/shim-deno-test/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testDefinitions = exports.Deno = void 0;
    exports.Deno = require_test();
    __exportStar(require_test(), exports);
    var definitions_js_1 = require_definitions();
    Object.defineProperty(exports, "testDefinitions", { enumerable: true, get: function() {
      return definitions_js_1.testDefinitions;
    } });
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/test.js
var require_test2 = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/test.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.test = void 0;
    var shim_deno_test_1 = require_dist();
    Object.defineProperty(exports, "test", { enumerable: true, get: function() {
      return shim_deno_test_1.test;
    } });
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/truncate.js
var require_truncate = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/truncate.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.truncate = void 0;
    var fs = __importStar(__require("fs/promises"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var variables_js_1 = require_variables();
    var truncate = async (name, len) => {
      try {
        return await fs.truncate(name, len);
      } catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "ENOENT") {
          throw new variables_js_1.errors.NotFound(`No such file or directory (os error 2), truncate '${name}'`);
        }
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.truncate = truncate;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/truncateSync.js
var require_truncateSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/truncateSync.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.truncateSync = void 0;
    var fs = __importStar(__require("fs"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var variables_js_1 = require_variables();
    var truncateSync = (name, len) => {
      try {
        return fs.truncateSync(name, len);
      } catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "ENOENT") {
          throw new variables_js_1.errors.NotFound(`No such file or directory (os error 2), truncate '${name}'`);
        }
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.truncateSync = truncateSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/uid.js
var require_uid = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/uid.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.uid = void 0;
    var process_1 = __importDefault(__require("process"));
    exports.uid = (_a = process_1.default.getuid) !== null && _a !== void 0 ? _a : () => null;
  }
});

// node_modules/@deno/shim-deno/dist/deno/internal/iterutil.js
var require_iterutil = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/internal/iterutil.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = exports.filterAsync = exports.mapAsync = exports.map = void 0;
    function* map(iter, f) {
      for (const i of iter) {
        yield f(i);
      }
    }
    exports.map = map;
    async function* mapAsync(iter, f) {
      for await (const i of iter) {
        yield f(i);
      }
    }
    exports.mapAsync = mapAsync;
    async function* filterAsync(iter, filter) {
      for await (const i of iter) {
        if (filter(i)) {
          yield i;
        }
      }
    }
    exports.filterAsync = filterAsync;
    async function* merge(iterables) {
      const racers = new Map(map(map(iterables, (iter) => iter[Symbol.asyncIterator]()), (iter) => [iter, iter.next()]));
      while (racers.size > 0) {
        const winner = await Promise.race(map(racers.entries(), ([iter, prom]) => prom.then((result) => ({ result, iter }))));
        if (winner.result.done) {
          racers.delete(winner.iter);
        } else {
          yield await winner.result.value;
          racers.set(winner.iter, winner.iter.next());
        }
      }
    }
    exports.merge = merge;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/watchFs.js
var require_watchFs = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/watchFs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.watchFs = void 0;
    var promises_1 = __require("fs/promises");
    var path_1 = __require("path");
    var iterutil_js_1 = require_iterutil();
    var watchFs = function watchFs2(paths, options = { recursive: true }) {
      paths = Array.isArray(paths) ? paths : [paths];
      const ac = new AbortController();
      const { signal } = ac;
      const rid = -1;
      const masterWatcher = (0, iterutil_js_1.merge)(paths.map((path) => (0, iterutil_js_1.mapAsync)((0, iterutil_js_1.filterAsync)((0, promises_1.watch)(path, { recursive: options === null || options === void 0 ? void 0 : options.recursive, signal }), (info) => info.filename != null), (info) => ({
        kind: "modify",
        paths: [(0, path_1.resolve)(path, info.filename)]
      }))));
      function close() {
        ac.abort();
      }
      return Object.assign(masterWatcher, {
        rid,
        close,
        [Symbol.dispose]: close
      });
    };
    exports.watchFs = watchFs;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/writeFile.js
var require_writeFile = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/writeFile.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writeFile = void 0;
    var fs = __importStar(__require("fs/promises"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var fs_flags_js_1 = require_fs_flags();
    var writeFile = async function writeFile2(path, data, { append = false, create = true, createNew = false, mode, signal } = {}) {
      const truncate = create && !append;
      const flag = (0, fs_flags_js_1.getFsFlag)({ append, create, createNew, truncate, write: true });
      try {
        await fs.writeFile(path, data, { flag, signal });
        if (mode != null)
          await fs.chmod(path, mode);
      } catch (error) {
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.writeFile = writeFile;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions/writeFileSync.js
var require_writeFileSync = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions/writeFileSync.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writeFileSync = void 0;
    var os_1 = __require("os");
    var openSync_js_1 = require_openSync();
    var errorMap_js_1 = __importDefault(require_errorMap());
    var statSync_js_1 = require_statSync();
    var chmodSync_js_1 = require_chmodSync();
    var writeFileSync = function writeFileSync2(path, data, options = {}) {
      try {
        if (options.create !== void 0) {
          const create = !!options.create;
          if (!create) {
            (0, statSync_js_1.statSync)(path);
          }
        }
        const openOptions = {
          write: true,
          create: true,
          createNew: options.createNew,
          append: !!options.append,
          truncate: !options.append
        };
        const file = (0, openSync_js_1.openSync)(path, openOptions);
        if (options.mode !== void 0 && options.mode !== null && (0, os_1.platform)() !== "win32") {
          (0, chmodSync_js_1.chmodSync)(path, options.mode);
        }
        let nwritten = 0;
        while (nwritten < data.length) {
          nwritten += file.writeSync(data.subarray(nwritten));
        }
        file.close();
      } catch (e) {
        throw (0, errorMap_js_1.default)(e);
      }
    };
    exports.writeFileSync = writeFileSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/variables/args.js
var require_args = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/variables/args.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.args = void 0;
    exports.args = process.argv.slice(2);
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/functions.js
var require_functions = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/functions.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.read = exports.osUptime = exports.osRelease = exports.openSync = exports.open = exports.mkdirSync = exports.mkdir = exports.memoryUsage = exports.makeTempFileSync = exports.makeTempFile = exports.makeTempDirSync = exports.makeTempDir = exports.lstatSync = exports.lstat = exports.loadavg = exports.listenTls = exports.listen = exports.linkSync = exports.link = exports.kill = exports.inspect = exports.hostname = exports.gid = exports.ftruncateSync = exports.ftruncate = exports.fsyncSync = exports.fsync = exports.fstatSync = exports.fstat = exports.fdatasyncSync = exports.fdatasync = exports.exit = exports.execPath = exports.cwd = exports.createSync = exports.create = exports.copyFileSync = exports.copyFile = exports.copy = exports.consoleSize = exports.connectTls = exports.connect = exports.close = exports.chownSync = exports.chown = exports.chmodSync = exports.chmod = exports.chdir = exports.addSignalListener = exports.isatty = void 0;
    exports.utimeSync = exports.utime = exports.futimeSync = exports.futime = exports.args = exports.writeTextFileSync = exports.writeTextFile = exports.writeSync = exports.writeFileSync = exports.writeFile = exports.write = exports.watchFs = exports.uid = exports.truncateSync = exports.truncate = exports.test = exports.symlinkSync = exports.symlink = exports.statSync = exports.stat = exports.shutdown = exports.run = exports.Process = exports.resolveDns = exports.renameSync = exports.rename = exports.removeSync = exports.removeSignalListener = exports.remove = exports.realPathSync = exports.realPath = exports.readTextFileSync = exports.readTextFile = exports.readSync = exports.readLinkSync = exports.readLink = exports.readFileSync = exports.readFile = exports.readDirSync = exports.readDir = void 0;
    var fs_1 = __importDefault(__require("fs"));
    var errorMap_js_1 = __importDefault(require_errorMap());
    var variables_js_1 = require_variables();
    var tty_1 = __require("tty");
    Object.defineProperty(exports, "isatty", { enumerable: true, get: function() {
      return tty_1.isatty;
    } });
    var addSignalListener_js_1 = require_addSignalListener();
    Object.defineProperty(exports, "addSignalListener", { enumerable: true, get: function() {
      return addSignalListener_js_1.addSignalListener;
    } });
    var chdir_js_1 = require_chdir();
    Object.defineProperty(exports, "chdir", { enumerable: true, get: function() {
      return chdir_js_1.chdir;
    } });
    var chmod_js_1 = require_chmod();
    Object.defineProperty(exports, "chmod", { enumerable: true, get: function() {
      return chmod_js_1.chmod;
    } });
    var chmodSync_js_1 = require_chmodSync();
    Object.defineProperty(exports, "chmodSync", { enumerable: true, get: function() {
      return chmodSync_js_1.chmodSync;
    } });
    var chown_js_1 = require_chown();
    Object.defineProperty(exports, "chown", { enumerable: true, get: function() {
      return chown_js_1.chown;
    } });
    var chownSync_js_1 = require_chownSync();
    Object.defineProperty(exports, "chownSync", { enumerable: true, get: function() {
      return chownSync_js_1.chownSync;
    } });
    var close_js_1 = require_close();
    Object.defineProperty(exports, "close", { enumerable: true, get: function() {
      return close_js_1.close;
    } });
    var connect_js_1 = require_connect();
    Object.defineProperty(exports, "connect", { enumerable: true, get: function() {
      return connect_js_1.connect;
    } });
    var connectTls_js_1 = require_connectTls();
    Object.defineProperty(exports, "connectTls", { enumerable: true, get: function() {
      return connectTls_js_1.connectTls;
    } });
    var consoleSize_js_1 = require_consoleSize();
    Object.defineProperty(exports, "consoleSize", { enumerable: true, get: function() {
      return consoleSize_js_1.consoleSize;
    } });
    var copy_js_1 = require_copy();
    Object.defineProperty(exports, "copy", { enumerable: true, get: function() {
      return copy_js_1.copy;
    } });
    var copyFile_js_1 = require_copyFile();
    Object.defineProperty(exports, "copyFile", { enumerable: true, get: function() {
      return copyFile_js_1.copyFile;
    } });
    var copyFileSync_js_1 = require_copyFileSync();
    Object.defineProperty(exports, "copyFileSync", { enumerable: true, get: function() {
      return copyFileSync_js_1.copyFileSync;
    } });
    var create_js_1 = require_create();
    Object.defineProperty(exports, "create", { enumerable: true, get: function() {
      return create_js_1.create;
    } });
    var createSync_js_1 = require_createSync();
    Object.defineProperty(exports, "createSync", { enumerable: true, get: function() {
      return createSync_js_1.createSync;
    } });
    var cwd_js_1 = require_cwd();
    Object.defineProperty(exports, "cwd", { enumerable: true, get: function() {
      return cwd_js_1.cwd;
    } });
    var execPath_js_1 = require_execPath();
    Object.defineProperty(exports, "execPath", { enumerable: true, get: function() {
      return execPath_js_1.execPath;
    } });
    var exit_js_1 = require_exit();
    Object.defineProperty(exports, "exit", { enumerable: true, get: function() {
      return exit_js_1.exit;
    } });
    var fdatasync_js_1 = require_fdatasync();
    Object.defineProperty(exports, "fdatasync", { enumerable: true, get: function() {
      return fdatasync_js_1.fdatasync;
    } });
    var fdatasyncSync_js_1 = require_fdatasyncSync();
    Object.defineProperty(exports, "fdatasyncSync", { enumerable: true, get: function() {
      return fdatasyncSync_js_1.fdatasyncSync;
    } });
    var fstat_js_1 = require_fstat();
    Object.defineProperty(exports, "fstat", { enumerable: true, get: function() {
      return fstat_js_1.fstat;
    } });
    var fstatSync_js_1 = require_fstatSync();
    Object.defineProperty(exports, "fstatSync", { enumerable: true, get: function() {
      return fstatSync_js_1.fstatSync;
    } });
    var fsync_js_1 = require_fsync();
    Object.defineProperty(exports, "fsync", { enumerable: true, get: function() {
      return fsync_js_1.fsync;
    } });
    var fsyncSync_js_1 = require_fsyncSync();
    Object.defineProperty(exports, "fsyncSync", { enumerable: true, get: function() {
      return fsyncSync_js_1.fsyncSync;
    } });
    var ftruncate_js_1 = require_ftruncate();
    Object.defineProperty(exports, "ftruncate", { enumerable: true, get: function() {
      return ftruncate_js_1.ftruncate;
    } });
    var ftruncateSync_js_1 = require_ftruncateSync();
    Object.defineProperty(exports, "ftruncateSync", { enumerable: true, get: function() {
      return ftruncateSync_js_1.ftruncateSync;
    } });
    var gid_js_1 = require_gid();
    Object.defineProperty(exports, "gid", { enumerable: true, get: function() {
      return gid_js_1.gid;
    } });
    var hostname_js_1 = require_hostname();
    Object.defineProperty(exports, "hostname", { enumerable: true, get: function() {
      return hostname_js_1.hostname;
    } });
    var inspect_js_1 = require_inspect();
    Object.defineProperty(exports, "inspect", { enumerable: true, get: function() {
      return inspect_js_1.inspect;
    } });
    var kill_js_1 = require_kill();
    Object.defineProperty(exports, "kill", { enumerable: true, get: function() {
      return kill_js_1.kill;
    } });
    var link_js_1 = require_link();
    Object.defineProperty(exports, "link", { enumerable: true, get: function() {
      return link_js_1.link;
    } });
    var linkSync_js_1 = require_linkSync();
    Object.defineProperty(exports, "linkSync", { enumerable: true, get: function() {
      return linkSync_js_1.linkSync;
    } });
    var listen_js_1 = require_listen();
    Object.defineProperty(exports, "listen", { enumerable: true, get: function() {
      return listen_js_1.listen;
    } });
    var listenTls_js_1 = require_listenTls();
    Object.defineProperty(exports, "listenTls", { enumerable: true, get: function() {
      return listenTls_js_1.listenTls;
    } });
    var loadavg_js_1 = require_loadavg();
    Object.defineProperty(exports, "loadavg", { enumerable: true, get: function() {
      return loadavg_js_1.loadavg;
    } });
    var lstat_js_1 = require_lstat();
    Object.defineProperty(exports, "lstat", { enumerable: true, get: function() {
      return lstat_js_1.lstat;
    } });
    var lstatSync_js_1 = require_lstatSync();
    Object.defineProperty(exports, "lstatSync", { enumerable: true, get: function() {
      return lstatSync_js_1.lstatSync;
    } });
    var makeTempDir_js_1 = require_makeTempDir();
    Object.defineProperty(exports, "makeTempDir", { enumerable: true, get: function() {
      return makeTempDir_js_1.makeTempDir;
    } });
    var makeTempDirSync_js_1 = require_makeTempDirSync();
    Object.defineProperty(exports, "makeTempDirSync", { enumerable: true, get: function() {
      return makeTempDirSync_js_1.makeTempDirSync;
    } });
    var makeTempFile_js_1 = require_makeTempFile();
    Object.defineProperty(exports, "makeTempFile", { enumerable: true, get: function() {
      return makeTempFile_js_1.makeTempFile;
    } });
    var makeTempFileSync_js_1 = require_makeTempFileSync();
    Object.defineProperty(exports, "makeTempFileSync", { enumerable: true, get: function() {
      return makeTempFileSync_js_1.makeTempFileSync;
    } });
    var memoryUsage_js_1 = require_memoryUsage();
    Object.defineProperty(exports, "memoryUsage", { enumerable: true, get: function() {
      return memoryUsage_js_1.memoryUsage;
    } });
    var mkdir_js_1 = require_mkdir();
    Object.defineProperty(exports, "mkdir", { enumerable: true, get: function() {
      return mkdir_js_1.mkdir;
    } });
    var mkdirSync_js_1 = require_mkdirSync();
    Object.defineProperty(exports, "mkdirSync", { enumerable: true, get: function() {
      return mkdirSync_js_1.mkdirSync;
    } });
    var open_js_1 = require_open();
    Object.defineProperty(exports, "open", { enumerable: true, get: function() {
      return open_js_1.open;
    } });
    var openSync_js_1 = require_openSync();
    Object.defineProperty(exports, "openSync", { enumerable: true, get: function() {
      return openSync_js_1.openSync;
    } });
    var osRelease_js_1 = require_osRelease();
    Object.defineProperty(exports, "osRelease", { enumerable: true, get: function() {
      return osRelease_js_1.osRelease;
    } });
    var osUptime_js_1 = require_osUptime();
    Object.defineProperty(exports, "osUptime", { enumerable: true, get: function() {
      return osUptime_js_1.osUptime;
    } });
    var read_js_1 = require_read();
    Object.defineProperty(exports, "read", { enumerable: true, get: function() {
      return read_js_1.read;
    } });
    var readDir_js_1 = require_readDir();
    Object.defineProperty(exports, "readDir", { enumerable: true, get: function() {
      return readDir_js_1.readDir;
    } });
    var readDirSync_js_1 = require_readDirSync();
    Object.defineProperty(exports, "readDirSync", { enumerable: true, get: function() {
      return readDirSync_js_1.readDirSync;
    } });
    var readFile_js_1 = require_readFile();
    Object.defineProperty(exports, "readFile", { enumerable: true, get: function() {
      return readFile_js_1.readFile;
    } });
    var readFileSync_js_1 = require_readFileSync();
    Object.defineProperty(exports, "readFileSync", { enumerable: true, get: function() {
      return readFileSync_js_1.readFileSync;
    } });
    var readLink_js_1 = require_readLink();
    Object.defineProperty(exports, "readLink", { enumerable: true, get: function() {
      return readLink_js_1.readLink;
    } });
    var readLinkSync_js_1 = require_readLinkSync();
    Object.defineProperty(exports, "readLinkSync", { enumerable: true, get: function() {
      return readLinkSync_js_1.readLinkSync;
    } });
    var readSync_js_1 = require_readSync();
    Object.defineProperty(exports, "readSync", { enumerable: true, get: function() {
      return readSync_js_1.readSync;
    } });
    var readTextFile_js_1 = require_readTextFile();
    Object.defineProperty(exports, "readTextFile", { enumerable: true, get: function() {
      return readTextFile_js_1.readTextFile;
    } });
    var readTextFileSync_js_1 = require_readTextFileSync();
    Object.defineProperty(exports, "readTextFileSync", { enumerable: true, get: function() {
      return readTextFileSync_js_1.readTextFileSync;
    } });
    var realPath_js_1 = require_realPath();
    Object.defineProperty(exports, "realPath", { enumerable: true, get: function() {
      return realPath_js_1.realPath;
    } });
    var realPathSync_js_1 = require_realPathSync();
    Object.defineProperty(exports, "realPathSync", { enumerable: true, get: function() {
      return realPathSync_js_1.realPathSync;
    } });
    var remove_js_1 = require_remove();
    Object.defineProperty(exports, "remove", { enumerable: true, get: function() {
      return remove_js_1.remove;
    } });
    var removeSignalListener_js_1 = require_removeSignalListener();
    Object.defineProperty(exports, "removeSignalListener", { enumerable: true, get: function() {
      return removeSignalListener_js_1.removeSignalListener;
    } });
    var removeSync_js_1 = require_removeSync();
    Object.defineProperty(exports, "removeSync", { enumerable: true, get: function() {
      return removeSync_js_1.removeSync;
    } });
    var rename_js_1 = require_rename();
    Object.defineProperty(exports, "rename", { enumerable: true, get: function() {
      return rename_js_1.rename;
    } });
    var renameSync_js_1 = require_renameSync();
    Object.defineProperty(exports, "renameSync", { enumerable: true, get: function() {
      return renameSync_js_1.renameSync;
    } });
    var resolveDns_js_1 = require_resolveDns();
    Object.defineProperty(exports, "resolveDns", { enumerable: true, get: function() {
      return resolveDns_js_1.resolveDns;
    } });
    var run_js_1 = require_run();
    Object.defineProperty(exports, "Process", { enumerable: true, get: function() {
      return run_js_1.Process;
    } });
    Object.defineProperty(exports, "run", { enumerable: true, get: function() {
      return run_js_1.run;
    } });
    var shutdown_js_1 = require_shutdown();
    Object.defineProperty(exports, "shutdown", { enumerable: true, get: function() {
      return shutdown_js_1.shutdown;
    } });
    var stat_js_1 = require_stat();
    Object.defineProperty(exports, "stat", { enumerable: true, get: function() {
      return stat_js_1.stat;
    } });
    var statSync_js_1 = require_statSync();
    Object.defineProperty(exports, "statSync", { enumerable: true, get: function() {
      return statSync_js_1.statSync;
    } });
    var symlink_js_1 = require_symlink();
    Object.defineProperty(exports, "symlink", { enumerable: true, get: function() {
      return symlink_js_1.symlink;
    } });
    var symlinkSync_js_1 = require_symlinkSync();
    Object.defineProperty(exports, "symlinkSync", { enumerable: true, get: function() {
      return symlinkSync_js_1.symlinkSync;
    } });
    var test_js_1 = require_test2();
    Object.defineProperty(exports, "test", { enumerable: true, get: function() {
      return test_js_1.test;
    } });
    var truncate_js_1 = require_truncate();
    Object.defineProperty(exports, "truncate", { enumerable: true, get: function() {
      return truncate_js_1.truncate;
    } });
    var truncateSync_js_1 = require_truncateSync();
    Object.defineProperty(exports, "truncateSync", { enumerable: true, get: function() {
      return truncateSync_js_1.truncateSync;
    } });
    var uid_js_1 = require_uid();
    Object.defineProperty(exports, "uid", { enumerable: true, get: function() {
      return uid_js_1.uid;
    } });
    var watchFs_js_1 = require_watchFs();
    Object.defineProperty(exports, "watchFs", { enumerable: true, get: function() {
      return watchFs_js_1.watchFs;
    } });
    var write_js_1 = require_write();
    Object.defineProperty(exports, "write", { enumerable: true, get: function() {
      return write_js_1.write;
    } });
    var writeFile_js_1 = require_writeFile();
    Object.defineProperty(exports, "writeFile", { enumerable: true, get: function() {
      return writeFile_js_1.writeFile;
    } });
    var writeFileSync_js_1 = require_writeFileSync();
    Object.defineProperty(exports, "writeFileSync", { enumerable: true, get: function() {
      return writeFileSync_js_1.writeFileSync;
    } });
    var writeSync_js_1 = require_writeSync();
    Object.defineProperty(exports, "writeSync", { enumerable: true, get: function() {
      return writeSync_js_1.writeSync;
    } });
    var writeTextFile_js_1 = require_writeTextFile();
    Object.defineProperty(exports, "writeTextFile", { enumerable: true, get: function() {
      return writeTextFile_js_1.writeTextFile;
    } });
    var writeTextFileSync_js_1 = require_writeTextFileSync();
    Object.defineProperty(exports, "writeTextFileSync", { enumerable: true, get: function() {
      return writeTextFileSync_js_1.writeTextFileSync;
    } });
    var args_js_1 = require_args();
    Object.defineProperty(exports, "args", { enumerable: true, get: function() {
      return args_js_1.args;
    } });
    var futime = async function(rid, atime, mtime) {
      try {
        await new Promise((resolve, reject) => {
          fs_1.default.futimes(rid, atime, mtime, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      } catch (error) {
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.futime = futime;
    var futimeSync = function(rid, atime, mtime) {
      try {
        fs_1.default.futimesSync(rid, atime, mtime);
      } catch (error) {
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.futimeSync = futimeSync;
    var utime = async function(path, atime, mtime) {
      try {
        await fs_1.default.promises.utimes(path, atime, mtime);
      } catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "ENOENT") {
          throw new variables_js_1.errors.NotFound(`No such file or directory (os error 2), utime '${path}'`);
        }
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.utime = utime;
    var utimeSync = function(path, atime, mtime) {
      try {
        fs_1.default.utimesSync(path, atime, mtime);
      } catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "ENOENT") {
          throw new variables_js_1.errors.NotFound(`No such file or directory (os error 2), utime '${path}'`);
        }
        throw (0, errorMap_js_1.default)(error);
      }
    };
    exports.utimeSync = utimeSync;
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/types.js
var require_types = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/@deno/shim-deno/dist/deno/stable/main.js
var require_main = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno/stable/main.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_classes(), exports);
    __exportStar(require_enums(), exports);
    __exportStar(require_functions(), exports);
    __exportStar(require_types(), exports);
    __exportStar(require_variables(), exports);
  }
});

// node_modules/@deno/shim-deno/dist/deno.js
var require_deno = __commonJS({
  "node_modules/@deno/shim-deno/dist/deno.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_main(), exports);
  }
});

// node_modules/@deno/shim-deno/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/@deno/shim-deno/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Deno = void 0;
    exports.Deno = __importStar(require_deno());
  }
});

// src/_dnt.shims.ts
var import_shim_deno = __toESM(require_dist2());
var import_shim_deno2 = __toESM(require_dist2());
var dntGlobals = {
  Deno: import_shim_deno.Deno
};
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
  DEBUG3[DEBUG3["ERROR"] = 0] = "ERROR";
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
    prerelease: rightGroups.prerelease ? parsePrerelease(rightGroups.prerelease) : [],
    build: []
  };
}
function parseHyphenRange(range) {
  const leftMatch = range.match(new RegExp(`^${XRANGE}`));
  const leftGroup = leftMatch?.groups;
  if (!leftGroup) return;
  const leftLength = leftMatch[0].length;
  const hyphenMatch = range.slice(leftLength).match(/^\s+-\s+/);
  if (!hyphenMatch) return;
  const hyphenLength = hyphenMatch[0].length;
  const rightMatch = range.slice(leftLength + hyphenLength).match(new RegExp(`^${XRANGE}\\s*$`));
  const rightGroups = rightMatch?.groups;
  if (!rightGroups) return;
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
        minor,
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
        minor,
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
var getCwd = () => import_shim_deno2.Deno.cwd();
var defaultResolvePath = resolvePathFactory(getCwd, isAbsolutePath2);

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
  const { isAbsolutePath: isAbsolutePath3, namespace: plugin_ns, resolvePath, log = false, globalImportMap = {} } = config;
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
    if (1 /* LOG */ && log) {
      console.log(`[${plugin_ns}] onResolve:`, { path, resolved_path, args, importMap });
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
  const { log, namespace: plugin_ns } = config, on_resolve_fn = onResolveFactory({ ...config, log: false, namespace: "oazmi-unresolver-namespace-does-not-matter" });
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
    if (1 /* LOG */ && log) {
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
  const { defaultLoader, namespace: plugin_ns, acceptLoaders = all_esbuild_loaders, log = false } = config, accept_loaders_set = new Set(acceptLoaders);
  return async (args) => {
    const { path, pluginData } = args, path_url = resolveAsUrl(path), response = await fetch(path_url, defaultFetchConfig);
    if (!response.ok) {
      throw new Error(`[${plugin_ns}] onLoadUrl: ERROR: network fetch response for url "${path_url.href}" was not ok (${response.status}). response header:
${json_stringify(response.headers)}`);
    }
    const guessed_loaders = guessHttpResponseLoaders(response), available_loaders = accept_loaders_set.intersection(guessed_loaders), preferred_loader = [...available_loaders].at(0) ?? defaultLoader, contents = await response.bytes();
    if (1 /* LOG */ && log) {
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

// src/packageman/base.ts
var RuntimePackage = class {
  /** the fetched/parsed package metadata file's raw contents. */
  packageInfo;
  /** @param package_object the parsed package metadata as an object.
   *   - in the case of node, this would be your json-parsed "package.json" file.
   *   - in the case of deno, this would be your json-parsed "deno.json" file.
  */
  constructor(package_object) {
    this.packageInfo = package_object;
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
    return new this(package_object);
  }
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
  constructor(package_object) {
    super(package_object);
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
    const name = this.getName(), version = this.getVersion(), {
      baseAliasDir = `jsr:${name}@${version}`,
      basePathDir = `${jsr_base_url}/${name}/${version}`,
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

// src/plugins/mod.ts
var defaultDenoPluginsConfig = { importMap: {} };
var denoPlugins = (config) => {
  const { importMap } = { ...defaultDenoPluginsConfig, ...config };
  return [
    importMapPlugin({ importMap }),
    httpPlugin({ globalImportMap: importMap }),
    jsrPlugin({ globalImportMap: importMap })
  ];
};
export {
  denoPlugins,
  httpPlugin,
  importMapPlugin,
  jsrPlugin
};
