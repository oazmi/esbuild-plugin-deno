/** javascript runtime enums. */
export declare const enum RUNTIME {
    /** deno runtime.
     *
     * since deno also supports `process` for node compatibility, you will want to check for deno runtime before checking for node runtime.
    */
    DENO = 0,
    /** bunjs runtime.
     *
     * since bun also supports `process` for node compatibility, you will want to check for bun runtime before checking for node runtime.
    */
    BUN = 1,
    /** nodejs runtime. */
    NODE = 2,
    /** chrome-extension runtime.
     *
     * since the `window` context is also available in chrome extensions, it is better to check for this runtime before checking for client-web-page runtime.
    */
    CHROMIUM = 3,
    /** firefox (or any non-chromium) extension runtime.
     *
     * since the `window` context is also available in chrome extensions, it is better to check for this runtime before checking for client-web-page runtime.
    */
    EXTENSION = 4,
    /** web-browser runtime. */
    WEB = 5,
    /** worker-script runtime. */
    WORKER = 6
}
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
export declare const currentRuntimeValidationFnMap: Record<RUNTIME, (() => boolean)>;
/** identifies the current javascript runtime environment as a {@link RUNTIME} enum.
 *
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 *
 * assertEquals(identifyCurrentRuntime(), RUNTIME.DENO)
 * ```
*/
export declare const identifyCurrentRuntime: () => RUNTIME;
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
export declare const getRuntime: (runtime_enum: RUNTIME) => any;
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
export declare const getRuntimeCwd: (runtime_enum: RUNTIME, current_path?: boolean) => string;
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
export declare const getEnvVariable: (runtime_enum: RUNTIME, env_var: string) => string | undefined;
/** configuration options for the {@link execShellCommand} function. */
export interface ExecShellCommandConfig {
    /** cli-arguments to pass to the process.
     *
     * @defaultValue `[]` (empty array)
    */
    args: string[];
    /** set the working directory of the process.
     *
     * if not specified, the `cwd` of the parent process is inherited.
     *
     * @defaultValue `undefined`
    */
    cwd?: string | URL | undefined;
    /** provide an optional abort signal to force close the process, by sending a "SIGTERM" os-signal to it.
     *
     * @defaultValue `undefined`
    */
    signal?: AbortSignal;
}
export interface ExecShellCommandResult {
    stdout: string;
    stderr: string;
}
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
export declare const execShellCommand: (runtime_enum: RUNTIME, command: string, config?: Partial<ExecShellCommandConfig>) => Promise<ExecShellCommandResult>;
/** configuration options for the {@link writeTextFile} and {@link writeFile} function. */
export interface WriteFileConfig {
    /** when set to `true`, the new text will be appended to the file, instead of overwriting the previous contents.
     *
     * @defaultValue `false`
    */
    append: boolean;
    /** allow the creation of a new file if one does not already exist at the specified path.
     * when set to `false`, and a file does not already exist at the specified path, then an error will be thrown,
     * causing the write operation promise to be rejected.
     *
     * @defaultValue `true`
    */
    create: boolean;
    /** supply an optional unix r/w/x-permission mode to apply to the file.
     *
     * > [!note]
     * > setting file chmod-permissions on windows does nothing!
     * > (is that a limitation of deno? I don't know)
     *
     * - if you're unfamiliar with this, check out this stack-exchange answer: [link](https://unix.stackexchange.com/a/184005).
     * - if you'd like to calculate the permission number, try this online permission calculator: [link](https://chmod-calculator.com/).
     * - REMEMBER: the file permission number is in octal-representation!
     *   so for setting an "allow all" permission, which is denoted as "777", you would pass `0o777`.
     *
     * @defaultValue `0o644` (this is an assumption, since that's the linux default) (but node's docs mentions the default to be `0o666`)
    */
    mode: number | undefined;
    /** provide an optional abort signal to allow the cancellation of the file write operation.
     *
     * if the signal becomes aborted, the write file operation will be stopped and the promise returned will be rejected with an `AbortError`.
     *
     * @defaultValue `undefined`
    */
    signal?: AbortSignal | undefined;
}
/** configuration options for the {@link readTextFile} and {@link readFile} functions. */
export interface ReadFileConfig {
    /** provide an optional abort signal to allow the cancellation of the file reading operation.
     *
     * if the signal becomes aborted, the read file operation will be stopped and the promise returned will be rejected with an `AbortError`.
     *
     * @defaultValue `undefined`
    */
    signal?: AbortSignal;
}
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
export declare const writeTextFile: (runtime_enum: RUNTIME, file_path: string | URL, text: string, config?: Partial<WriteFileConfig>) => Promise<void>;
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
export declare const writeFile: (runtime_enum: RUNTIME, file_path: string | URL, data: ArrayBufferView, config?: Partial<WriteFileConfig>) => Promise<void>;
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
export declare const readTextFile: (runtime_enum: RUNTIME, file_path: string | URL, config?: Partial<ReadFileConfig>) => Promise<string>;
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
export declare const readFile: (runtime_enum: RUNTIME, file_path: string | URL, config?: Partial<ReadFileConfig>) => Promise<Uint8Array>;
/** provides metadata information about a filesystem entry (file, folder, or a symbolic link).
 * this interface is returned by the {@link statEntry} and {@link lstatEntry} functions.
 *
 * > [!note]
 * > only the fields that are common to windows, linux, and mac systems have been kept,
 * > while the stat fields specific to only a subset of the common platforms have been omitted.
*/
export interface FsEntryInfo {
    /** this field is `true` if this info corresponds to a regular file.
     *
     * mutually exclusive with respect to {@link isDirectory} and {@link isSymlink}.
    */
    isFile: boolean;
    /** this field is `true` if this info corresponds to a regular folder.
     *
     * mutually exclusive with respect to {@link isFile} and {@link isSymlink}.
    */
    isDirectory: boolean;
    /** this field is `true` if this info corresponds to a symbolic-link (symlink).
     *
     * mutually exclusive with respect to {@link isFile} and {@link isDirectory}.
    */
    isSymlink: boolean;
    /** the size of the file in bytes. (comes up as `0` for directories) */
    size: number;
    /** the last modification time of the file.
     *
     * this corresponds to the `mtime` field from `stat` on linux and mac, and `ftLastWriteTime` on windows.
     * this may not be available on all platforms.
    */
    mtime: Date;
    /** the last access time of the file.
     *
     * this corresponds to the `atime` field from `stat` on unix, and `ftLastAccessTime` on windows.
     * this may not be available on all platforms.
    */
    atime: Date;
    /** the creation time of the file.
     *
     * this corresponds to the `birthtime` field from `stat` on mac/bsd, and `ftCreationTime` on windows.
     * this may not be available on all platforms.
    */
    birthtime: Date;
    /** the last change time of the file.
     *
     * this corresponds to the `ctime` field from `stat` on mac/bsd, and `ChangeTime` on windows.
     * this may not be available on all platforms.
    */
    ctime: Date;
    /** id of the device containing the file. */
    dev: number;
    /** the underlying raw `st_mode` bits that contain the standard unix permissions for this file/directory. */
    mode: number;
}
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
export declare const statEntry: (runtime_enum: RUNTIME, path: string | URL) => Promise<FsEntryInfo | undefined>;
/** similar to {@link statEntry}, but any symbolic links encountered at the provided `path` will not be followed,
 * and instead you will receive the stats of the symbolic link itself.
 *
 * read the documentation comments of {@link statEntry} for usage details.
 * ```
*/
export declare const lstatEntry: (runtime_enum: RUNTIME, path: string | URL) => Promise<FsEntryInfo | undefined>;
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
export declare const ensureDir: (runtime_enum: RUNTIME, dir_path: string | URL) => Promise<void>;
/** ensures that the file exists on system-bound runtimes (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}).
 *
 * if the file already exists, this function does nothing.
 * if the parent directories for the file do not exist yet, they are created recursively.
 *
 * @throws an error is thrown if something other than a file already existed at the provided path,
 *   or if creating the parent directory had failed.
*/
export declare const ensureFile: (runtime_enum: RUNTIME, file_path: string | URL) => Promise<void>;
/** optional configuration options for deleting a filesystem entry (file, folder or symlink), used by the {@link removeEntry} function.
 *
 * by explicitly specifying one of `isFile`, `isDirectory`, or `isSymlink` fields to be either `true` or `false`,
 * you can control which _type_s of filesystem-entries to delete, and which _type_s to ignore.
 * the type of the entry is first identified via {@link statEntry} (which also tells us if it already exists or not).
 *
 * so, for instance:
 * - if `config.isFile` is set to `true`, but the `path` corresponds to either a symlink or a folder, then they will **not** be deleted.
 * - if `config.isFile` is set to `false`, but the `path` corresponds to a file, then the file will **not** be deleted.
 * - if `config.isFile` is set to `true`, and the `path` corresponds to a file, then the file will **be** deleted.
 * - if `config.isFile` is set to `false`, and the `path` corresponds to either a symlink or a folder, then that entry will **be** deleted.
*/
export interface RemoveEntryConfig extends Pick<FsEntryInfo, "isDirectory" | "isFile" | "isSymlink"> {
    /** specify if a non-empty directory can be deleted recursively.
     * without this option enabled, removing a non-empty folder will throw an error.
     *
     * @defaultValue `false` (removing non-empty directories will not work and throw an error)
    */
    recursive: boolean;
}
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
export declare const removeEntry: (runtime_enum: RUNTIME, path: string | URL, config?: Partial<RemoveEntryConfig>) => Promise<boolean>;
//# sourceMappingURL=crossenv.d.ts.map