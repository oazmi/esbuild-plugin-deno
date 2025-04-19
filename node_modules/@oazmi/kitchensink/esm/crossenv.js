/** a submodule for cross-runtime environment utility functions.
 *
 * the functions in this submodule do not place a "hard" dependency on the runtime environments.
 * instead, the various runtime-globals are defined as "soft" objects/symbols which may or may not exist.
 * as a result, some of the functions (such as {@link getRuntime}) are very weakly/generically typed,
 * and their results are not narrowed based on your input arguments.
 * the advantage of such is that this submodule will not choke your LSP.
 * not to mention that you'll probably be aware of what runtime you're working with anyway,
 * so you can always use the `as` assertions to confine the return value to a certain runtime's feature.
 *
 * for most functions in here, you will need to provide the {@link RUNTIME} enum that you are querying for.
 *
 * to identify your script's current {@link RUNTIME} environment, you'd want to use the {@link identifyCurrentRuntime} function.
 *
 * > [!important]
 * > when using a bundler like `esbuild`, if you place a dependency on this submodule,
 * > you **will** have to declare `"node:child_process"` and `"node:fs/promises"` in your array of `external` dependencies.
 * > because otherwise, your bundler will complain about not being able to find these imports.
 * > alternatively, you can also set the `platform` to `"node"`, so that the bundler will treat imports with the `"node:"` prefix as external.
 *
 * TODO: additional features to add in the future:
 * - [x] filesystem read/writing on system runtimes (deno, bun, and node).
 * - [ ] filesystem read/writing on web/extension runtimes will use the browser's FileAccess API (and prompt the user to select the folder)
 * - [ ] filesystem read/writing on web/extension runtimes will use `window.navigator.storage.getDirectory()`.
 *       and for web workers, we may use `self.navigator.storage.getDirectory()` instead.
 * - [ ] persistent key-value storage: such as `localStorage` or `sessionStorage` or `chrome.storage.sync` or kv-storage of `window.navigator.storage.persist()`.
 *       copy these from your github-aid browser extension project.
 * - [x] system environment variables.
 * - [x] shell/commandline/terminal command execution.
 * - [ ] (breaking change) consider using a class based approach to calling these functions as methods,
 *       where the currently selected runtime will be known by the class instance,
 *       so that the user will not have to pass down which runtime they are querying for all the time.
 * - [ ] (RISKY) add a `setEnvVariable` function.
 *       but it may corrupt the user's variables if they're not careful, so I don't want to implement it unless I find myself needing it.
 * - [ ] (EASY) add `copyEntry` and `moveEntry` for copying and moving filesystem entries on system-bound runtimes.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import * as dntShim from "./_dnt.shims.js";
import { array_isEmpty, noop, object_entries, promise_outside, string_toUpperCase } from "./alias.js";
import { DEBUG } from "./deps.js";
import { ensureEndSlash, ensureFileUrlIsLocalPath, parseFilepathInfo, pathToPosixPath } from "./pathman.js";
import { isComplex, isObject } from "./struct.js";
/** javascript runtime enums. */
export var RUNTIME;
(function (RUNTIME) {
    /** deno runtime.
     *
     * since deno also supports `process` for node compatibility, you will want to check for deno runtime before checking for node runtime.
    */
    RUNTIME[RUNTIME["DENO"] = 0] = "DENO";
    /** bunjs runtime.
     *
     * since bun also supports `process` for node compatibility, you will want to check for bun runtime before checking for node runtime.
    */
    RUNTIME[RUNTIME["BUN"] = 1] = "BUN";
    /** nodejs runtime. */
    RUNTIME[RUNTIME["NODE"] = 2] = "NODE";
    /** chrome-extension runtime.
     *
     * since the `window` context is also available in chrome extensions, it is better to check for this runtime before checking for client-web-page runtime.
    */
    RUNTIME[RUNTIME["CHROMIUM"] = 3] = "CHROMIUM";
    /** firefox (or any non-chromium) extension runtime.
     *
     * since the `window` context is also available in chrome extensions, it is better to check for this runtime before checking for client-web-page runtime.
    */
    RUNTIME[RUNTIME["EXTENSION"] = 4] = "EXTENSION";
    /** web-browser runtime. */
    RUNTIME[RUNTIME["WEB"] = 5] = "WEB";
    /** worker-script runtime. */
    RUNTIME[RUNTIME["WORKER"] = 6] = "WORKER";
})(RUNTIME || (RUNTIME = {}));
const global_this_object = dntShim.dntGlobalThis;
/** a map/record of runtime validation functions that determine if the current javascript environment matches a specific runtime.
 *
 * each key represents a runtime type defined by the {@link RUNTIME} enum,
 * and each value is a function that returns a boolean indicating whether your current environment
 * satisfies the global-object requirements of the given {@link RUNTIME}.
 *
 * @example
 * ```ts ignore
 * if (currentRuntimeValidationFnMap[RUNTIME.NODE]()) {
 * 	// execute nodejs-specific logic
 * 	console.log("current nodejs working directory is:", process.cwd())
 * }
 * if (currentRuntimeValidationFnMap[RUNTIME.DENO]()) {
 * 	// execute deno-specific logic
 * 	console.log("current deno working directory is:", Deno.cwd())
 * }
 * if (currentRuntimeValidationFnMap[RUNTIME.WEB]()) {
 * 	// execute web-specific logic
 * 	console.log("current webpage's url is:", globalThis.location?.href)
 * }
 * ```
*/
export const currentRuntimeValidationFnMap = {
    [RUNTIME.DENO]: () => ((global_this_object.Deno?.version) ? true : false),
    [RUNTIME.BUN]: () => ((global_this_object.Bun?.version) ? true : false),
    [RUNTIME.NODE]: () => ((global_this_object.process?.versions) ? true : false),
    [RUNTIME.CHROMIUM]: () => ((global_this_object.chrome?.runtime) ? true : false),
    [RUNTIME.EXTENSION]: () => ((global_this_object.browser?.runtime) ? true : false),
    [RUNTIME.WEB]: () => ((global_this_object.window?.document) ? true : false),
    [RUNTIME.WORKER]: () => ((isObject(global_this_object.self)
        && isComplex(global_this_object.WorkerGlobalScope)
        && global_this_object.self instanceof global_this_object.WorkerGlobalScope) ? true : false),
};
const ordered_runtime_checklist = [
    RUNTIME.DENO, RUNTIME.BUN, RUNTIME.NODE, RUNTIME.CHROMIUM,
    RUNTIME.EXTENSION, RUNTIME.WEB, RUNTIME.WORKER,
];
/** identifies the current javascript runtime environment as a {@link RUNTIME} enum.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * assertEquals(identifyCurrentRuntime(), RUNTIME.DENO)
 * ```
*/
export const identifyCurrentRuntime = () => {
    for (const runtime of ordered_runtime_checklist) {
        if (currentRuntimeValidationFnMap[runtime]()) {
            return runtime;
        }
    }
    throw new Error(DEBUG.ERROR ? `failed to detect current javascript runtime!\nplease report this issue to "https://github.com/omar-azmi/kitchensink_ts/issues", along with information on your runtime environment.` : "");
};
/** get the global-runtime-object of the given javascript environment {@link RUNTIME} enum.
 *
 * > [!note]
 * > if you acquire the global-runtime-object of an environment that is not supported by your actual current environment,
 * > then the returned value will be `undefined`.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * import process from "node:process" // this works in deno 2.0
 *
 * assertEquals(getRuntime(RUNTIME.DENO), Deno)
 * assertEquals(getRuntime(RUNTIME.NODE), process)
 * assertEquals(getRuntime(identifyCurrentRuntime()), Deno)
 * ```
*/
export const getRuntime = (runtime_enum) => {
    switch (runtime_enum) {
        case RUNTIME.DENO: return global_this_object.Deno;
        case RUNTIME.BUN: return global_this_object.Bun;
        case RUNTIME.NODE: return global_this_object.process;
        case RUNTIME.CHROMIUM: return global_this_object.chrome;
        case RUNTIME.EXTENSION: return global_this_object.browser;
        case RUNTIME.WEB: return global_this_object.window;
        case RUNTIME.WORKER: return global_this_object.self;
        default: throw new Error(DEBUG.ERROR ? `an invalid runtime enum was provided: "${runtime_enum}".` : "");
    }
};
/** retrieves the current working directory or URL based on the specified {@link RUNTIME} enum.
 *
 * > [!note]
 * > - the returned directory path may or may not end in a trailing slash.
 * >   this is intentional, as it is possible for the path to actually point towards a file.
 * >   (such as in the case of `chrome.runtime.getURL("")`)
 * > - however, the returned path will always use posix separators (only forward slashes, no windows backslashes).
 * > - if you try to query the working directory of a runtime enum that your current environment does not support,
 * >   then an error will be thrown, because you'll be accessing an `undefined` object.
 *
 * depending on the provided `runtime_enum`, the current working directory is defined as the following:
 * - for `DENO`, `BUN`, and `NODE`: the result will be that of the runtime's `cwd()` method.
 * - for `CHROMIUM` and `EXTENSION`: the result will be the url string obtained from `runtime.getURL("")`.
 * - for `WEB` and `WORKER`: a url string will be returned that will vary based on the `current_path` flag (`true` by default):
 *   - if `current_path == false`: `location.origin` will be returned (i.e. the root of your webpage, which is your domain-name + subdomain-name).
 *   - if `current_path == true`: the directory path of `location.href` will be returned.
 *
 * @param runtime_enum the runtime enum indicating which runtime's working-directory/url-path to retrieve.
 * @param current_path a boolean flag that, when true, returns the full `href` url of the runtime, rather than the root `origin`. defaults to `true`.
 * @returns a posix string path of the working-directory/url-path of the specified runtime.
 * @throws an error is thrown if the runtime associated with the provided enum is undefined, or if an invalid enum is provided.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * import process from "node:process" // this works in deno 2.0
 *
 * assertEquals(getRuntimeCwd(RUNTIME.DENO), getRuntimeCwd(RUNTIME.NODE))
 * assertEquals(getRuntimeCwd(RUNTIME.DENO), Deno.cwd().replaceAll(/\\\\?/g, "/"))
 * assertEquals(getRuntimeCwd(RUNTIME.NODE), process.cwd().replaceAll(/\\\\?/g, "/"))
 * ```
*/
export const getRuntimeCwd = (runtime_enum, current_path = true) => {
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
        // the code below is unreachable, because `runtime` woudn'wouldn't be defined unless a valid `runtime_enum` was passed to `getRuntime` anyway.
        // default:
        // throw new Error(DEBUG.ERROR ? `an invalid runtime enum was provided: "${runtime_enum}".` : "")
    }
};
/** retrieves the value of an environment variable on system runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 * otherwise an error gets thrown on all other environments, since they do not support environment variables.
 *
 * > [!tip]
 * > - environment variables are case-insensitive.
 * > - you will probably want to normalize path variables to posix path via {@link pathToPosixPath}.
 * > - if `env_var = ""` (an empty string) then `undefined` will always be returned on system-runtime environments.
 *
 * @param runtime_enum the runtime enum indicating which runtime should be used for querying the environment variable.
 * @param env_var the name of the environment variable to fetch.
 * @returns the environment variable's value.
 * @throws for js-workers, extensions, and web environments, an error gets thrown, as environment variables are not available.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * const my_path_env_var = getEnvVariable(identifyCurrentRuntime(), "path")!
 *
 * assertEquals(typeof my_path_env_var, "string")
 * assertEquals(my_path_env_var.length > 0, true)
 * ```
*/
export const getEnvVariable = (runtime_enum, env_var) => {
    const runtime = getRuntime(runtime_enum);
    if (!runtime) {
        throw new Error(DEBUG.ERROR ? `the requested runtime associated with the enum "${runtime_enum}" is undefined (i.e. you're running on a different runtime from the provided enum).` : "");
    }
    if (!env_var) {
        return;
    }
    switch (runtime_enum) {
        case RUNTIME.DENO:
            return runtime.env.get(env_var);
        case RUNTIME.BUN:
        case RUNTIME.NODE:
            return runtime.env[env_var];
        default:
            throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support environment variables` : "");
    }
};
const defaultExecShellCommandConfig = {
    args: []
};
/** execute a shell/terminal command on system runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 * otherwise an error gets thrown on all other environments, since they do not support shell command execution.
 *
 * > [!note]
 * > we don't use `Deno.Command` for deno here, because it does not default to your os's native preferred terminal,
 * > and instead you will need to provide one yourself (such as "bash", "cmd", "shell", etc...).
 * > which is why we use `node:child_process` for all three runtimes.
 *
 * @param runtime_enum the runtime enum indicating which runtime should be used for querying the environment variable.
 * @param command the shell command to execute.
 * @param config optional configuration to apply onto the shell child-process.
 * @returns a promise that is resolved when the child process that executed the command has closed.
 *
 * @example
 * ```ts
 * import { assertEquals, assertStringIncludes } from "jsr:@std/assert"
 *
 * {
 * 	const { stdout, stderr } = await execShellCommand(identifyCurrentRuntime(), "echo Hello World!")
 * 	assertStringIncludes(stdout, "Hello World!")
 * 	assertEquals(stderr, "")
 * }
 *
 * {
 * 	const { stdout, stderr } = await execShellCommand(identifyCurrentRuntime(), "echo", { args: ["Hello", "World!"] })
 * 	assertStringIncludes(stdout, "Hello World!")
 * 	assertEquals(stderr, "")
 * }
 * ```
*/
export const execShellCommand = async (runtime_enum, command, config = {}) => {
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
            exec(full_command, { cwd: cwd ? ensureFileUrlIsLocalPath(cwd) : undefined, signal }, (error, stdout, stderr) => {
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
const defaultWriteFileConfig = {
    append: false,
    create: true,
    mode: undefined,
};
const defaultReadFileConfig = {};
/** writes text data to a file on supported runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 * for unsupported runtimes, an error is thrown.
 *
 * TODO: in the future, I would like to create a unified cross-runtime filesystem class under `./crossfs.ts`,
 *   which would support read and write operations, along with memory (internal state) of the current working directory,
 *   in addition to a path resolver method that will rely on `./pathman.ts`'s `resolvePathFactory` function.
 *
 * @param runtime_enum the runtime enum indicating which runtime should be used for writing onto the filesystem.
 * @param file_path the destination file path.
 * @param text the string content to write.
 * @param config provide optional configuration on how the writing should be performed.
 * @throws an error is thrown if an unsupported runtime uses this function,
 *   or if `config.create` is `false`, and no pre-existing file resides at the specified `file_path`.
*/
export const writeTextFile = async (runtime_enum, file_path, text, config = {}) => {
    // even though both node and deno accept file URL objects, if you pass a file-url string, they will fail to read/write to the provided path.
    // this is why we're forced to convert all file_paths to local-fs-paths during all read/write operations for all system-bound js-runtimes.
    file_path = ensureFileUrlIsLocalPath(file_path);
    const { append, create, mode, signal } = { ...defaultWriteFileConfig, ...config }, node_config = { encoding: "utf8", append, create, mode, signal }, deno_config = { append, create, mode, signal }, runtime = getRuntime(runtime_enum);
    switch (runtime_enum) {
        case RUNTIME.DENO:
            return runtime.writeTextFile(file_path, text, deno_config);
        case RUNTIME.BUN:
        case RUNTIME.NODE:
            return node_writeFile(file_path, text, node_config);
        default:
            throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem writing operations` : "");
    }
};
/** writes binary/buffer data to a file on supported runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 * for unsupported runtimes, an error is thrown.
 *
 * @param runtime_enum the runtime enum indicating which runtime should be used for writing onto the filesystem.
 * @param file_path the destination file path.
 * @param data the byte/buffer data to write to the file.
 * @param config provide optional configuration on how the writing should be performed.
 * @throws an error is thrown if an unsupported runtime uses this function,
 *   or if `config.create` is `false`, and no pre-existing file resides at the specified `file_path`.
*/
export const writeFile = async (runtime_enum, file_path, data, config = {}) => {
    file_path = ensureFileUrlIsLocalPath(file_path);
    const { append, create, mode, signal } = { ...defaultWriteFileConfig, ...config }, { buffer, byteLength, byteOffset } = data, bytes = data instanceof Uint8Array ? data : new Uint8Array(buffer, byteOffset, byteLength), node_config = { encoding: "binary", append, create, mode, signal }, deno_config = { append, create, mode, signal }, runtime = getRuntime(runtime_enum);
    switch (runtime_enum) {
        case RUNTIME.DENO:
            return runtime.writeFile(file_path, bytes, deno_config);
        case RUNTIME.BUN:
        case RUNTIME.NODE:
            return node_writeFile(file_path, bytes, node_config);
        default:
            throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem writing operations` : "");
    }
};
let node_fs, node_child_process;
const import_node_fs = async () => { return import("node:fs/promises"); }, get_node_fs = async () => { return (node_fs ??= await import_node_fs()); }, import_node_child_process = async () => { return import("node:child_process"); }, get_node_child_process = async () => { return (node_child_process ??= await import_node_child_process()); };
const node_writeFile = async (file_path, data, config = {}) => {
    const fs = await get_node_fs(), { append, create, mode, signal, encoding } = { ...defaultWriteFileConfig, ...config }, fs_config = { encoding: encoding, mode, signal };
    // if we are permitted to write on top of existing files, then only a single call to `fs.writeFile` suffices.
    if (create) {
        return fs.writeFile(file_path, data, { ...fs_config, flag: (append ? "a" : "w") });
    }
    // if we must assert the pre-existence of the file, then the process is a little more involved.
    const file = await fs.open(file_path, "r+", mode);
    if (!append) {
        await file.truncate(0);
    }
    await file.appendFile(data, fs_config);
    return file.close();
};
/** reads and returns text data from a file on supported runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 * for unsupported runtimes, an error is thrown.
 *
 * @param runtime_enum the runtime enum indicating which runtime should be used for reading the filesystem.
 * @param file_path the source file path to read from.
 * @param config provide optional configuration on how the reading should be performed.
 * @throws an error is thrown if an unsupported runtime uses this function.
 *
 * @example
 * ```ts
 * import { assertStringIncludes } from "jsr:@std/assert"
 *
 * const my_deno_json = await readTextFile(identifyCurrentRuntime(), new URL(import.meta.resolve("../deno.json")))
 * assertStringIncludes(my_deno_json, `"name": "@oazmi/kitchensink"`)
 * ```
*/
export const readTextFile = async (runtime_enum, file_path, config = {}) => {
    file_path = ensureFileUrlIsLocalPath(file_path);
    const { signal } = { ...defaultReadFileConfig, ...config }, node_config = { encoding: "utf8", signal }, deno_config = { signal }, runtime = getRuntime(runtime_enum);
    switch (runtime_enum) {
        case RUNTIME.DENO:
            return runtime.readTextFile(file_path, deno_config);
        case RUNTIME.BUN:
        case RUNTIME.NODE:
            return (await get_node_fs()).readFile(file_path, node_config);
        default:
            throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem reading operations` : "");
    }
};
/** reads and returns binary data from a file on supported runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 * for unsupported runtimes, an error is thrown.
 *
 * @param runtime_enum the runtime enum indicating which runtime should be used for reading the filesystem.
 * @param file_path the source file path to read from.
 * @param config provide optional configuration on how the reading should be performed.
 * @throws an error is thrown if an unsupported runtime uses this function.
 *
 * @example
 * ```ts
 * import { assertInstanceOf, assertStringIncludes } from "jsr:@std/assert"
 *
 * const my_deno_json_bytes = await readFile(identifyCurrentRuntime(), new URL(import.meta.resolve("../deno.json")))
 * assertInstanceOf(my_deno_json_bytes, Uint8Array)
 *
 * const my_deno_json = (new TextDecoder()).decode(my_deno_json_bytes)
 * assertStringIncludes(my_deno_json, `"name": "@oazmi/kitchensink"`)
 * ```
*/
export const readFile = async (runtime_enum, file_path, config = {}) => {
    file_path = ensureFileUrlIsLocalPath(file_path);
    const { signal } = { ...defaultReadFileConfig, ...config }, node_and_deno_config = { signal }, runtime = getRuntime(runtime_enum);
    switch (runtime_enum) {
        case RUNTIME.DENO:
            return runtime.readFile(file_path, node_and_deno_config);
        case RUNTIME.BUN:
        case RUNTIME.NODE:
            return new Uint8Array((await (await get_node_fs()).readFile(file_path, node_and_deno_config)).buffer);
        default:
            throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem reading operations` : "");
    }
};
const fs_entry_info_fields = ["size", "mtime", "atime", "birthtime", "ctime", "dev", "mode"], fs_entry_info_all_fields = ["isFile", "isDirectory", "isSymlink", ...fs_entry_info_fields], object_assign_fields = (target, source, fields) => {
    fields.forEach((prop) => { target[prop] = source[prop]; });
    return target;
}, capture_nonexistent_fs_entry = (error) => {
    // capture the case where the syscall declares that the file or directory does not exist.
    if (string_toUpperCase(error.code) === "ENOENT") {
        return undefined;
    }
    // otherwise, propagate the error.
    throw error;
};
const node_statEntry = async (path) => {
    const fs = await get_node_fs(), stat = await fs
        .stat(ensureFileUrlIsLocalPath(path))
        .catch(capture_nonexistent_fs_entry);
    if (!stat) {
        return undefined;
    }
    const result = object_assign_fields({
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        isSymlink: stat.isSymbolicLink(),
    }, stat, fs_entry_info_fields);
    return result;
};
const node_lstatEntry = async (path) => {
    const fs = await get_node_fs(), stat = await fs
        .lstat(ensureFileUrlIsLocalPath(path))
        .catch(capture_nonexistent_fs_entry);
    if (!stat) {
        return undefined;
    }
    const result = object_assign_fields({
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        isSymlink: stat.isSymbolicLink(),
    }, stat, fs_entry_info_fields);
    return result;
};
/** provides metadata information about a filesystem entry (file, folder) on supported runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 * any symbolic links encountered at the provided `path` will be followed, and the referenced path will instead be examined.
 *
 * if the provided `path` does not exist on the filesystem, then `undefined` will be returned.
 *
 * > [!note]
 * > only the fields that are common to windows, linux, and mac systems have been kept,
 * > while the stat fields specific to only a subset of the common platforms have been omitted.
 *
 * @example
 * ```ts
 * import { assertEquals, assertInstanceOf, assertObjectMatch } from "jsr:@std/assert"
 *
 * const
 * 	time_fields: (keyof FsEntryInfo)[] = ["mtime", "atime", "birthtime", "ctime"],
 * 	numeric_fields: (keyof FsEntryInfo)[] = ["size", "dev", "mode"]
 *
 * const my_deno_json_stats = (await statEntry(identifyCurrentRuntime(), new URL(import.meta.resolve("../deno.json"))))!
 *
 * assertObjectMatch(my_deno_json_stats, {
 * 	isFile: true,
 * 	isDirectory: false,
 * 	isSymlink: false,
 * })
 *
 * time_fields.forEach((prop) => {
 * 	assertInstanceOf(my_deno_json_stats[prop], Date)
 * })
 *
 * numeric_fields.forEach((prop: keyof FsEntryInfo) => {
 * 	assertEquals(typeof my_deno_json_stats[prop], "number")
 * })
 *
 * // unlike node and deno, non-existing paths do not error, and instead `undefined` is returned.
 * const non_existing_path_stat = await statEntry(identifyCurrentRuntime(), new URL(import.meta.resolve("../hello/world/file.txt")))
 * assertEquals(non_existing_path_stat, undefined)
 * ```
*/
export const statEntry = async (runtime_enum, path) => {
    switch (runtime_enum) {
        case RUNTIME.DENO: {
            const stat = await getRuntime(runtime_enum).stat(path).catch(capture_nonexistent_fs_entry);
            if (!stat) {
                return undefined;
            }
            const result = object_assign_fields({}, stat, fs_entry_info_all_fields);
            return result;
        }
        case RUNTIME.BUN:
        case RUNTIME.NODE:
            return node_statEntry(path);
        default:
            throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem stat-query operations` : "");
    }
};
/** similar to {@link statEntry}, but any symbolic links encountered at the provided `path` will not be followed,
 * and instead you will receive the stats of the symbolic link itself.
 *
 * read the documentation comments of {@link statEntry} for usage details.
 * ```
*/
export const lstatEntry = async (runtime_enum, path) => {
    switch (runtime_enum) {
        case RUNTIME.DENO: {
            const stat = await getRuntime(runtime_enum).lstat(path).catch(capture_nonexistent_fs_entry);
            if (!stat) {
                return undefined;
            }
            const result = object_assign_fields({}, stat, fs_entry_info_all_fields);
            return result;
        }
        case RUNTIME.BUN:
        case RUNTIME.NODE:
            return node_lstatEntry(path);
        default:
            throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem lstat-query operations` : "");
    }
};
/** creates a nested directory if it does not already exist.
 * only supported on system runtime (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 *
 * @throws an error is thrown if something other than a folder already existed at the provided path.
 *
 * @example
 * ```ts
 * import { assertEquals, assertObjectMatch } from "jsr:@std/assert"
 *
 * const
 * 	runtime_id = identifyCurrentRuntime(),
 * 	my_dir  = new URL(import.meta.resolve("../temp/a/b/c/")),
 * 	my_dir2 = new URL(import.meta.resolve("../temp/a/"))
 *
 * await ensureDir(runtime_id, my_dir)
 *
 * // the directory now exists
 * assertObjectMatch((await statEntry(runtime_id, my_dir))!, {
 * 	isFile: false,
 * 	isDirectory: true,
 * 	isSymlink: false,
 * })
 *
 * // deleting the base directory (recursively)
 * assertEquals(await removeEntry(runtime_id, my_dir2, { recursive: true }), true)
 *
 * // the directory no longer exists
 * assertEquals(await statEntry(runtime_id, my_dir),  undefined)
 * assertEquals(await statEntry(runtime_id, my_dir2), undefined)
 * ```
*/
export const ensureDir = async (runtime_enum, dir_path) => {
    dir_path = ensureEndSlash(ensureFileUrlIsLocalPath(dir_path));
    const existing_entry_stats = await statEntry(runtime_enum, dir_path);
    if (existing_entry_stats?.isDirectory) {
        return;
    }
    switch (runtime_enum) {
        case RUNTIME.DENO:
            return getRuntime(runtime_enum).mkdir(dir_path, { recursive: true });
        case RUNTIME.BUN:
        case RUNTIME.NODE:
            return get_node_fs()
                .then((fs) => fs.mkdir(dir_path, { recursive: true }))
                .then(noop);
        default:
            throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem writing operations` : "");
    }
};
/** ensures that the file exists on system-bound runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 *
 * if the file already exists, this function does nothing.
 * if the parent directories for the file do not exist yet, they are created recursively.
 *
 * @throws an error is thrown if something other than a file already existed at the provided path,
 *   or if creating the parent directory had failed.
*/
export const ensureFile = async (runtime_enum, file_path) => {
    file_path = ensureFileUrlIsLocalPath(file_path);
    const existing_entry_stats = await statEntry(runtime_enum, file_path);
    if (existing_entry_stats?.isFile) {
        return;
    }
    // if the file does not already exist, then ensure that its path's parent directory exists, and then create the file.
    const parent_dir = parseFilepathInfo(file_path).dirpath;
    await ensureDir(runtime_enum, parent_dir);
    return writeFile(runtime_enum, file_path, new Uint8Array(0));
};
/** deletes a filesystem-entry (file, folder, symlink) at the provided `path`,
 * on system-bound runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 * the return value dictates if anything was deleted.
 *
 * > [!note]
 * > trying to remove a non-existing entry will not throw an error.
 *
 * @param runtime_enum the runtime enum indicating which runtime should be used for reading the filesystem.
 * @param path the path to the filesystem entity that is to be deleted.
 * @param config provide optional configuration on what _type_s of filesystem-entries should be deleted,
 *   and if folder type entries should be deleted `recursive`ly (i.e. delete child entries as well).
 *   see the {@link RemoveEntryConfig} interface for more details.
 * @returns `true` if an entry (or a folder tree's entries) was deleted, otherwise `false` is returned when nothing is deleted.
*/
export const removeEntry = async (runtime_enum, path, config = {}) => {
    const { recursive = false, ...is_types } = config, existing_entry_stats = await statEntry(runtime_enum, path);
    // if the `path` does not exist, then there is nothing to delete
    if (!existing_entry_stats) {
        return false;
    }
    // if there is a mismatch between the existing fs-entry's type and the permitted/forbidden list of fs-types (`is_types`), then delete nothing and return.
    for (const [entry_type, is_permitted] of object_entries(is_types)) {
        if (existing_entry_stats[entry_type] !== is_permitted) {
            return false;
        }
    }
    // now, if there's no mismatch, then it is time for the deletion to take place.
    switch (runtime_enum) {
        case RUNTIME.DENO:
            return getRuntime(runtime_enum).remove(path, { recursive }).then(() => true);
        case RUNTIME.BUN:
        case RUNTIME.NODE:
            return get_node_fs()
                .then((fs) => fs.rm(ensureFileUrlIsLocalPath(path), { recursive }))
                .then(() => true);
        default:
            throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem writing operations` : "");
    }
};
