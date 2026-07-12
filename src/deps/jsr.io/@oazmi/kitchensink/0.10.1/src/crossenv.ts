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
 * - [x] subprocess command execution.
 * - [x] add a function for querying the operating system's platform and architecture.
 * - [ ] (breaking change) consider using a class based approach to calling these functions as methods,
 *       where the currently selected runtime will be known by the class instance,
 *       so that the user will not have to pass down which runtime they are querying for all the time.
 * - [ ] (RISKY) add a `setEnvVariable` function.
 *       but it may corrupt the user's variables if they're not careful, so I don't want to implement it unless I find myself needing it.
 * - [ ] (EASY) add `copyEntry` and `moveEntry` for copying and moving filesystem entries on system-bound runtimes.
 * 
 * @module
*/
import * as dntShim from "../../../../../../_dnt.shims.js";


import { array_isEmpty, noop, object_entries, object_fromEntries, promise_all, promise_outside, promise_race, string_toLowerCase, string_toUpperCase } from "./alias.js"
import { DEBUG } from "./deps.js"
import { textDecoder, textEncoder } from "./eightpack.js"
import { ensureEndSlash, ensureFileUrlIsLocalPath, parseFilepathInfo, pathToPosixPath } from "./pathman.js"
import { isComplex, isObject, isString } from "./struct.js"
import { concatBytes } from "./typedbuffer.js"


/** javascript runtime enums. */
export const enum RUNTIME {
	/** deno runtime.
	 * 
	 * since deno also supports `process` for node compatibility, you will want to check for deno runtime before checking for node runtime.
	*/
	DENO,

	/** bunjs runtime.
	 * 
	 * since bun also supports `process` for node compatibility, you will want to check for bun runtime before checking for node runtime.
	*/
	BUN,

	/** nodejs runtime. */
	NODE,

	/** chrome-extension runtime.
	 * 
	 * since the `window` context is also available in chrome extensions, it is better to check for this runtime before checking for client-web-page runtime.
	*/
	CHROMIUM,

	/** firefox (or any non-chromium) extension runtime.
	 * 
	 * since the `window` context is also available in chrome extensions, it is better to check for this runtime before checking for client-web-page runtime.
	*/
	EXTENSION,

	/** web-browser runtime. */
	WEB,

	/** worker-script runtime. */
	WORKER,

	/** the [txiki.js](https://github.com/saghul/txiki.js/) runtime, that's based on quickjs. */
	TXIKI,
}

const global_this_object = dntShim.dntGlobalThis as any

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
export const currentRuntimeValidationFnMap: Record<RUNTIME, (() => boolean)> = {
	[RUNTIME.DENO]: () => ((global_this_object.Deno?.version) ? true : false),
	[RUNTIME.BUN]: () => ((global_this_object.Bun?.version) ? true : false),
	[RUNTIME.NODE]: () => ((global_this_object.process?.versions) ? true : false),
	[RUNTIME.CHROMIUM]: () => ((global_this_object.chrome?.runtime) ? true : false),
	[RUNTIME.EXTENSION]: () => ((global_this_object.browser?.runtime) ? true : false),
	[RUNTIME.WEB]: () => ((global_this_object.window?.document) ? true : false),
	[RUNTIME.TXIKI]: () => ((global_this_object.tjs?.version) ? true : false),
	[RUNTIME.WORKER]: () => ((
		isObject(global_this_object.self)
		&& isComplex(global_this_object.WorkerGlobalScope)
		&& global_this_object.self instanceof global_this_object.WorkerGlobalScope
	) ? true : false),
}

/** this array declares the ordering in which your runtime environment is tested against,
 * to {@link identifyCurrentRuntime | automatically identify} the current runtime.
 * 
 * modifying this array (or re-ordering it) is useful in situations where you would like to expand support to a new runtime.
 * do note that modifying this array will only affect the output of {@link identifyCurrentRuntime}, and nothing else.
*/
export const currentRuntimeIdentificationOrdering: Array<RUNTIME> = [
	RUNTIME.DENO, RUNTIME.BUN, RUNTIME.TXIKI, RUNTIME.NODE,
	RUNTIME.CHROMIUM, RUNTIME.EXTENSION, RUNTIME.WEB, RUNTIME.WORKER,
]

/** identifies the current javascript runtime environment as a {@link RUNTIME} enum.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * assertEquals(identifyCurrentRuntime(), RUNTIME.DENO)
 * ```
*/
export const identifyCurrentRuntime = (): RUNTIME => {
	for (const runtime of currentRuntimeIdentificationOrdering) {
		if (currentRuntimeValidationFnMap[runtime]()) { return runtime }
	}
	throw new Error(DEBUG.ERROR ? `failed to detect current javascript runtime!\nplease report this issue to "https://github.com/omar-azmi/kitchensink_ts/issues", along with information on your runtime environment.` : "")
}

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
export const getRuntime = (runtime_enum: RUNTIME): any => {
	switch (runtime_enum) {
		case RUNTIME.DENO: return global_this_object.Deno
		case RUNTIME.BUN: return global_this_object.Bun
		case RUNTIME.NODE: return global_this_object.process
		case RUNTIME.CHROMIUM: return global_this_object.chrome
		case RUNTIME.EXTENSION: return global_this_object.browser
		case RUNTIME.WEB: return global_this_object.window
		case RUNTIME.WORKER: return global_this_object.self
		case RUNTIME.TXIKI: return global_this_object.tjs
		default: throw new Error(DEBUG.ERROR ? `an invalid runtime enum was provided: "${runtime_enum}".` : "")
	}
}

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
export const getRuntimeCwd = (runtime_enum: RUNTIME, current_path: boolean = true): string => {
	const runtime = getRuntime(runtime_enum)
	if (!runtime) { throw new Error(DEBUG.ERROR ? `the requested runtime associated with the enum "${runtime_enum}" is undefined (i.e. you're running on a different runtime from the provided enum).` : "") }
	switch (runtime_enum) {
		case RUNTIME.DENO:
		case RUNTIME.BUN:
		case RUNTIME.NODE:
			return pathToPosixPath(runtime.cwd())
		case RUNTIME.TXIKI:
			return pathToPosixPath(runtime.cwd)
		case RUNTIME.CHROMIUM:
		case RUNTIME.EXTENSION:
			return runtime.runtime.getURL("")
		case RUNTIME.WEB:
		case RUNTIME.WORKER:
			return new URL("./", current_path ? runtime.location.href : runtime.location.origin).href
		// the default case is unreachable, because `runtime` wouldn't be defined unless a valid `runtime_enum` was passed to `getRuntime` anyway.
		// default:
		// throw new Error(DEBUG.ERROR ? `an invalid runtime enum was provided: "${runtime_enum}".` : "")
	}
}

/** retrieves the value of an environment variable on system runtimes
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
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
export const getEnvVariable = (runtime_enum: RUNTIME, env_var: string): string | undefined => {
	const runtime = getRuntime(runtime_enum)
	if (!runtime) { throw new Error(DEBUG.ERROR ? `the requested runtime associated with the enum "${runtime_enum}" is undefined (i.e. you're running on a different runtime from the provided enum).` : "") }
	if (!env_var) { return }
	switch (runtime_enum) {
		case RUNTIME.DENO:
			return runtime.env.get(env_var)
		case RUNTIME.BUN:
		case RUNTIME.NODE:
		case RUNTIME.TXIKI:
			return runtime.env[env_var]
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support environment variables` : "")
	}
}

/** configuration options for the {@link execShellCommand} function. */
export interface ExecShellCommandConfig {
	/** cli-arguments to pass to the process.
	 * 
	 * @defaultValue `[]` (empty array)
	*/
	args: string[]

	/** set the working directory of the process.
	 * 
	 * if not specified, the `cwd` of the parent process is inherited.
	 * 
	 * @defaultValue `undefined`
	*/
	cwd?: string | URL | undefined

	/** set the environment variables of the process.
	 * 
	 * I don't know whether these get appended, or completely clear out the existing environment variables,
	 * so that the new process only gets a new slate of environment variables that are specified here.
	 * 
	 * @defaultValue `undefined` (i.e. inherit environment variables from the current js-runtime)
	*/
	env?: Record<string, string | undefined>

	/** provide an optional abort signal to force close the process, by sending a "SIGTERM" os-signal to it.
	 * 
	 * @defaultValue `undefined`
	*/
	signal?: AbortSignal
}

/** the output of the executed shell command. */
export interface ExecShellCommandResult {
	/** stdout contains the regular things logged into your terminal. */
	stdout: string

	/** stderr contains the errors logged into your terminal.
	 * if this string is non-empty, it may indicate that some error occurred when your shell command/process was executed.
	*/
	stderr: string
}

const defaultExecShellCommandConfig: ExecShellCommandConfig = {
	args: []
}

/** execute a shell/terminal command on system runtimes
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
 * otherwise an error gets thrown on all other environments, since they do not support shell command execution.
 * 
 * > [!note]
 * > we don't use `Deno.Command` for deno here, because it does not default to your os's native preferred terminal,
 * > and instead you will need to provide one yourself (such as "bash", "cmd", "shell", etc...).
 * > which is why we use `node:child_process` for all three runtimes.
 * 
 * TODO: add support for txiki.js. this is non-trivial, because, just like `Deno.command`,
 * the `tjs.spawn` function only spawns processes, and not your default terminal.
 * but that's not the only issue; spawning a terminal on txiki.js also hasn't quite worked consistiently for me.
 * the problem lies in sending `stdin`, while also capturing `stdout` without the echoed `stdin`.
 * 
 * TODO: add support for adding custom env-variables to the child shell process.
 * 
 * @param runtime_enum the runtime enum indicating which runtime should be used for executing the shell command.
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
export const execShellCommand = async (runtime_enum: RUNTIME, command: string, config: Partial<ExecShellCommandConfig> = {}): Promise<ExecShellCommandResult> => {
	const
		{ args, cwd: _cwd, env, signal } = { ...defaultExecShellCommandConfig, ...config },
		args_are_empty = array_isEmpty(args),
		cwd = _cwd ? ensureFileUrlIsLocalPath(_cwd) : undefined,
		runtime = getRuntime(runtime_enum)
	if (!runtime) { throw new Error(DEBUG.ERROR ? `the requested runtime associated with the enum "${runtime_enum}" is undefined (i.e. you're running on a different runtime from the provided enum).` : "") }
	if (!command && args_are_empty) { return { stdout: "", stderr: "" } }
	switch (runtime_enum) {
		case RUNTIME.TXIKI:
			throw new Error(DEBUG.ERROR ? `shell commands for txiki.js is currently not supported.` : "")
		case RUNTIME.DENO:
		case RUNTIME.BUN:
		case RUNTIME.NODE: {
			const
				{ exec } = await get_node_child_process(),
				full_command = args_are_empty ? command : `${command} ${args.join(" ")}`,
				[promise, resolve, reject] = promise_outside<ExecShellCommandResult>()
			exec(full_command, { cwd, env, signal }, (error, stdout, stderr) => {
				if (error) { reject(error.message) }
				resolve({ stdout, stderr })
			})
			return promise
		}
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support shell commands` : "")
	}
}

/** configuration options for the {@link spawnCommand} function. */
export interface SpawnCommandConfig extends ExecShellCommandConfig {
	/** specify if the newly spawned process should be a child of the current js-runtime process.
	 * 
	 * in theory, this would allow the spawned process to exist after the current process has exited.
	 * however, since we listen to the `stdout` and `stderr`s (i.e. pipe them), the current js-runtime will not exit,
	 * unless you provide an abort {@link signal} and trigger it once you're done with your js shenanigans.
	 * 
	 * moreove, this option is not available for the `txiki.js` runtime.
	 * 
	 * TODO: actually, I'm feeling too lazy to implement the logic for allowing the js-runtime to abort when {@link signal} is triggered,
	 * while allowing the spawned process to outlive (i.e. we shouldn't be closing it ourselves when the abort signal is fired).
	*/
	detached?: boolean
}

type SpawnCommandConfig_Format1 = SpawnCommandConfig & { cwd?: string, env?: Record<string, string> }

type SpawnCommandConfig_Format2 = SpawnCommandConfig & { cwd?: string, env?: Record<string, string | undefined> }

/** the `stdout` and `stderr` outputs of the executed process, in binary format. */
export interface SpawnCommandResult {
	/** stdout contains the regular things logged into your terminal. */
	stdout: Uint8Array<ArrayBuffer>

	/** stderr contains the errors logged into your terminal.
	 * if this string is non-empty, it may indicate that some error occurred when your shell command/process was executed.
	*/
	stderr: Uint8Array<ArrayBuffer>
}

/** execute an executable process (such as `deno`, `node`, `winget`, `apt`, `curl`, `cmd`, `./bin/main.exe`, etc...,
 * but not including shell commands, such as `echo`, `ls`, `cp`, etc...), and then exit it.
 * 
 * TODO: in the future, add a `spawnProcess` function which will keep the process alive after executing it,
 * in addition to also permitting it to accept a user's `stdin`.
 * 
 * @param runtime_enum the runtime enum indicating which runtime should be used for executing/spawning the subprocess.
 * @param process_name the name of the process to spawn.
 *   this could be either something in your environment's PATH variable,
 *   or an executable in your current directory (which will require you to prepend a leading `"./"` or `"../"` in its path).
 * @param config optional configuration to apply onto the child-process.
 * @returns a promise that is resolved when the spawned child process exits that executed the command has closed.
 * 
 * @example
 * ```ts
 * import { assertEquals, assertStringIncludes } from "jsr:@std/assert"
 * 
 * const toText = (bytes: Uint8Array) => (new TextDecoder().decode(bytes))
 * 
 * const runTestWithRuntime = async (runtime_enum: RUNTIME) => {
 * 	{
 * 		const { stdout, stderr } = await spawnCommand(runtime_enum, "deno", {
 * 			args: ["eval", `console.log("child-process says hello!")`],
 * 		})
 * 		assertStringIncludes(toText(stdout), "child-process says hello!")
 * 		assertEquals(toText(stderr), "")
 * 	}
 * 	
 * 	if (Deno.build.os === "windows") {
 * 		const { stdout, stderr } = await spawnCommand(runtime_enum, "ipconfig")
 * 		assertStringIncludes(toText(stdout).toLowerCase(), "windows ip configuration")
 * 		assertEquals(toText(stderr), "")
 * 	}
 * 	
 * 	if (Deno.build.os === "linux" || Deno.build.os === "darwin") {
 * 		// `echo` is apparently a process, and not a shell utility. (insert surprised pikachu face)
 * 		const { stdout, stderr } = await spawnCommand(runtime_enum, "echo", { args: ["Hello", "World!"] })
 * 		assertStringIncludes(toText(stdout), "Hello World!")
 * 		assertEquals(toText(stderr), "")
 * 	}
 * }
 * 
 * await runTestWithRuntime(identifyCurrentRuntime()) // deno runtime test
 * await runTestWithRuntime(RUNTIME.NODE) // deno with node-compatibility runtime test
 * ```
*/
export const spawnCommand = async (runtime_enum: RUNTIME, process_name: string, config: Partial<SpawnCommandConfig> = {}): Promise<SpawnCommandResult> => {
	const
		{ cwd: _cwd, env: _env, ...rest_config } = { ...defaultExecShellCommandConfig, ...config },
		cwd = _cwd ? ensureFileUrlIsLocalPath(_cwd) : undefined,
		runtime = getRuntime(runtime_enum),
		env: Record<string, string> = _env && (runtime_enum === RUNTIME.DENO || runtime_enum === RUNTIME.TXIKI)
			? object_fromEntries(object_entries(_env).map(([key, value]) => ([key, value ?? ""])))
			: _env as any,
		full_config: SpawnCommandConfig_Format1 = { ...rest_config, cwd, env }
	if (!runtime) { throw new Error(DEBUG.ERROR ? `the requested runtime associated with the enum "${runtime_enum}" is undefined (i.e. you're running on a different runtime from the provided enum).` : "") }
	if (!process_name) { return { stdout: new Uint8Array(0), stderr: new Uint8Array(0) } }
	switch (runtime_enum) {
		case RUNTIME.DENO: { return deno_spawnCommand(runtime, process_name, full_config) }
		case RUNTIME.BUN: { return bun_spawnCommand(runtime, process_name, full_config) }
		case RUNTIME.TXIKI: { return txiki_spawnCommand(runtime, process_name, full_config) }
		case RUNTIME.NODE: { return node_spawnCommand(runtime, process_name, full_config) }
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support shell commands` : "")
	}
}

const deno_spawnCommand = async (
	runtime: typeof Deno,
	process_name: string,
	config: SpawnCommandConfig_Format1,
): Promise<SpawnCommandResult> => {
	const
		{ args, cwd, env: _env = {}, detached, signal } = config,
		env = object_fromEntries(object_entries(_env).map(([key, value]) => ([key, value ?? ""]))),
		command = new runtime.Command(process_name, { args, cwd, env, detached, signal, stdin: "null", stdout: "piped", stderr: "piped" }),
		{ success, code, stdout, stderr } = await command.output()
	if (!success) { throw new Error(DEBUG.ERROR ? `[deno_spawnCommand]: failed while executing command/process: "${process_name}", with error code: "${code}". cli arguments used:\n\t${args.join(" ")}` : "") }
	return { stdout, stderr }
}


const bun_spawnCommand = async (
	runtime: typeof Bun,
	process_name: string,
	config: SpawnCommandConfig_Format2,
): Promise<SpawnCommandResult> => {
	const
		{ args, cwd, env, detached, signal } = config,
		cmd = [process_name, ...args],
		[promise, resolve, reject] = promise_outside<SpawnCommandResult>()
	runtime.spawn(cmd, {
		cwd, env, detached, signal, stdout: "pipe", stderr: "pipe",
		onExit(subprocess, exit_code, signal_code, error) {
			if (error) { reject(error) }
			const
				stdout_promise = new Response(subprocess.stdout).bytes(),
				stderr_promise = new Response(subprocess.stderr).bytes()
			promise_all([stdout_promise, stderr_promise]).then(
				([stdout, stderr]) => { resolve({ stdout, stderr }) },
				(err) => { reject(err) },
			)
		}
	})
	return promise
}

const txiki_spawnCommand = async (
	runtime: typeof tjs,
	process_name: string,
	config: SpawnCommandConfig_Format1,
): Promise<SpawnCommandResult> => {
	let
		subprocess: tjs.Process,
		subprocess_ended = false
	const
		{ args, cwd, detached, env, signal } = config,
		cmd = [process_name, ...args],
		// TODO: EXTERNAL-ISSUE: because of [issue#471](https://github.com/saghul/txiki.js/issues/471), below is the only pattern that works without garbage-collection.
		// otherwise, I always get the error: "tjs_process_wait: Assertion `!p->closed' failed." when I call `subprocess.wait()` afterwards (possibly because the process ends early).
		exit_status_promise = (subprocess = runtime.spawn(cmd, { cwd, env, stdout: "pipe", stderr: "pipe" })).wait(),
		subprocess_discarded = exit_status_promise.then((status) => { subprocess_ended = true })
	signal?.addEventListener("abort", () => {
		// txiki.js will throw an error if the process was already aborted,
		// so we must make sure that we only terminate under the condition that it hasn't exited already.
		// this is done by performing a race promise, which will ignore the next function if the first one has already resolved.
		const kill_subprocess = async () => { if (!subprocess_ended) { await subprocess.kill("SIGTERM") } } // fake awaiting here to prevent optimization and potential discarding of the promise.
		Promise.race([subprocess_discarded, kill_subprocess()])
	})
	const collect_reader = async (reader: tjs.Reader): Promise<Uint8Array<ArrayBuffer>> => {
		const
			buf = new Uint8Array(4096),
			bufs: Array<Uint8Array<ArrayBuffer>> = []
		let bytes_read = 0
		while ((bytes_read = (await reader.read(buf) ?? -1)) >= 0) {
			bufs.push(buf.slice(0, bytes_read))
		}
		return concatBytes(...bufs)
	}
	await subprocess_discarded
	const
		stdout = await collect_reader(subprocess.stdout!),
		stderr = await collect_reader(subprocess.stderr!)
	return { stdout, stderr }
}

const node_spawnCommand = async (
	runtime: typeof process,
	process_name: string,
	config: SpawnCommandConfig_Format2,
): Promise<SpawnCommandResult> => {
	const
		{ spawn } = await get_node_child_process(),
		{ args, cwd, env, detached, signal } = config,
		stdouts: Array<Uint8Array> = [],
		stderrs: Array<Uint8Array> = [],
		[promise, resolve, reject] = promise_outside<SpawnCommandResult>(),
		subprocess = spawn(process_name, args, { shell: false, cwd, env, detached, signal, stdio: ["ignore", "pipe", "pipe"] })
	// believe it or not, `subprocess.stdout` and `subprocess.stderr` are socket :/ ... a big facepalm.
	subprocess.once("close", (exit_code, term_signal) => {
		const
			stdout = concatBytes(...stdouts),
			stderr = concatBytes(...stderrs)
		resolve({ stdout, stderr })
	})
	subprocess.stdout.on("data", (chunk: ArrayBufferView) => { stdouts.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)) })
	subprocess.stderr.on("data", (chunk: ArrayBufferView) => { stderrs.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)) })
	subprocess.once("error", (err) => { reject(err) })
	return promise
}

/** the system's operating system. */
export type SystemInfoPlatforms =
	| "windows" | "darwin" | "linux" | "android"
	| "freebsd" | "netbsd" | "openbsd" | "haiku"
	| "aix" | "illumos" | "sunos" | "solaris"

/** the system's architecture (i.e. amd64, x86, arm, etc...). */
export type SystemInfoArch =
	| "x86" | "x64" | "arm" | "arm64" | "mips" | "mips64"
	| "riscv32" | "riscv64" | "wasm32" | "wasm64"
	| "loong64" | "ppc64" | "s390x"

/** get information about the current system. */
export interface SystemInfo {
	/** the system's operating system. */
	platform: SystemInfoPlatforms

	/** the version string of the operating system. for instance `"10.0.19045"` for windows 10. */
	// release: string

	/** the system's architecture (i.e. amd64, x86, arm, etc...). */
	arch: SystemInfoArch

	/** the `globalThis.navigator.userAgent` string.
	 * 
	 * for js-runtimes, it usually looks like: `${runtime_name}/${runtime_version}`. below are some examples:
	 * - js-runtimes: `"Node.js/23"`, `"Deno/2.5.6"`, `"Bun/1.3.3"`, `"txiki.js/24.12.0"`
	 * - chrome:  `"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"`
	 * - firefox: `"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0"`
	*/
	userAgent: string
}

const platform_aliases: Record<string, SystemInfoPlatforms> = {
	"win32": "windows",
	"win64": "windows",
	"wow64": "windows",
	"cygwin": "windows",
	"sun": "sunos",
	"mac": "darwin",
	"macos": "darwin",
	"macintosh": "darwin",
}

const arch_aliases: Record<string, SystemInfoArch> = {
	"x86_64": "x64",
	"x86-64": "x64",
	"amd64": "x64",
	"x86_32": "x86",
	"x86-32": "x86",
	"ia32": "x86",
	"i386": "x86",
	"i686": "x86",
	"aarch64": "arm64",
	"armv7l": "arm",
	"armv6l": "arm",
	"mipsel": "mips",
	"ppc64le": "ppc64",
	"loongarch64": "loong64",
}

const getSystemInfo_resolve_aliases = (
	sys_info: { platform: string, arch: string }
): SystemInfo => {
	const
		platform = sys_info.platform,
		arch = sys_info.arch,
		// release = sys_info.release,
		userAgent: string = get_user_agent_string()
	return {
		platform: platform_aliases[platform] ?? platform as SystemInfoPlatforms,
		arch: arch_aliases[arch] ?? arch as SystemInfoArch,
		userAgent,
	}
}

const
	string_includes = (str: string, ...substrings: string[]): boolean => {
		return substrings.some((substring): boolean => (str.includes(substring)))
	},
	get_user_agent_string = () => { return global_this_object.navigator.userAgent }

const getSystemInfo_parseUserAgentString = (user_agent: string): { platform: string, arch: string } => {
	user_agent = string_toLowerCase(user_agent)
	let
		platform: string = "unknown",
		arch: string = "unknown"
	// matching the platform
	if (string_includes(user_agent, "windows")) { platform = "windows" }
	else if (string_includes(user_agent, "linux", "x11", "ubuntu", "raspberry")) { platform = "linux" }
	else if (string_includes(user_agent, "macintosh", "macos", "mac os", "iphone", "ipad")) { platform = "darwin" }
	else if (string_includes(user_agent, "android", "mobile", "sm-g")) { platform = "android" }
	else if (string_includes(user_agent, "freebsd")) { platform = "freebsd" }
	else if (string_includes(user_agent, "netbsd")) { platform = "netbsd" }
	else if (string_includes(user_agent, "openbsd")) { platform = "openbsd" }
	else if (string_includes(user_agent, "haiku")) { platform = "haiku" }
	else if (string_includes(user_agent, "illumos")) { platform = "illumos" }
	else if (string_includes(user_agent, "sunos")) { platform = "sunos" }
	else if (string_includes(user_agent, "solaris")) { platform = "solaris" }
	else if (string_includes(user_agent, "aix")) { platform = "aix" }
	// matching the architecture
	if (string_includes(user_agent, "x64", "win64", "wow64", "x86_64", "x86-64", "amd64")) { arch = "x64" }
	else if (string_includes(user_agent, "x86", "i386", "i686", "x86_32", "x86-32")) { arch = "x86" }
	else if (string_includes(user_agent, "aarch64", "arm64")) { arch = "arm64" }
	else if (string_includes(user_agent, "arm", "armv7l", "armv6l")) { arch = "arm" }
	else if (string_includes(user_agent, "mips64")) { arch = "mips64" }
	else if (string_includes(user_agent, "mips", "mipsel")) { arch = "mips" }
	else if (string_includes(user_agent, "riscv64")) { arch = "riscv64" }
	else if (string_includes(user_agent, "riscv32")) { arch = "riscv32" }
	else if (string_includes(user_agent, "ppc64", "ppc64le")) { arch = "ppc64" }
	return { platform, arch }
}

/** get information about host system, such as its platform (os), architecture, and user-agent string.
 * 
 * @example
 * ```ts
 * import { assertEquals } from "jsr:@std/assert"
 * 
 * const actual_system_info: SystemInfo = {
 * 	platform: Deno.build.os.toLowerCase() as any,
 * 	// deno writes the amd64 architecture as "x86_64", so we convert it to "x64" below.
 * 	arch: Deno.build.arch.toLowerCase().replace("x86_", "x") as any,
 * 	userAgent: navigator.userAgent,
 * }
 * 
 * assertEquals(getSystemInfo(RUNTIME.DENO), actual_system_info)
 * assertEquals(getSystemInfo(RUNTIME.NODE), actual_system_info)
 * ```
*/
export const getSystemInfo = (runtime_enum: RUNTIME): SystemInfo => {
	const runtime = getRuntime(runtime_enum)
	let platform: string, arch: string
	switch (runtime_enum) {
		case RUNTIME.DENO: {
			platform = runtime.build.os
			arch = runtime.build.arch
			break
		}
		case RUNTIME.NODE:
		case RUNTIME.BUN: {
			platform = runtime.platform
			arch = runtime.arch
			break
		}
		case RUNTIME.TXIKI: {
			platform = runtime.system.platform
			arch = runtime.system.arch
			break
		}
		case RUNTIME.WEB:
		case RUNTIME.CHROMIUM:
		case RUNTIME.EXTENSION:
		case RUNTIME.WORKER: {
			// TODO: what about workers _inside_ a standalone js-runtime?
			// parsing the user agent string for these workers will result in less useful info beinig extracted.
			({ platform, arch } = getSystemInfo_parseUserAgentString(get_user_agent_string()))
			break
		}
		// the default case is unreachable, because `runtime` wouldn't be defined unless a valid `runtime_enum` was passed to `getRuntime` anyway.
		// default:
		// throw new Error(DEBUG.ERROR ? `an invalid runtime enum was provided: "${runtime_enum}".` : "")
	}

	return getSystemInfo_resolve_aliases({ platform, arch })
}

/** configuration options for the {@link writeTextFile} and {@link writeFile} function. */
export interface WriteFileConfig {
	/** when set to `true`, the new text will be appended to the file, instead of overwriting the previous contents.
	 * 
	 * @defaultValue `false`
	*/
	append: boolean

	/** allow the creation of a new file if one does not already exist at the specified path.
	 * when set to `false`, and a file does not already exist at the specified path, then an error will be thrown,
	 * causing the write operation promise to be rejected.
	 * 
	 * @defaultValue `true`
	*/
	create: boolean

	/** supply an optional unix r/w/x-permission mode to apply to the file **if** it is a new file.
	 * existing files won't have their permission mode changed, and this config option will be ignored.
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
	mode: number | undefined

	/** provide an optional abort signal to allow the cancellation of the file write operation.
	 * 
	 * if the signal becomes aborted, the write file operation will be stopped and the promise returned will be rejected with an `AbortError`.
	 * 
	 * @defaultValue `undefined`
	*/
	signal?: AbortSignal | undefined
}

/** configuration options for the {@link readTextFile} and {@link readFile} functions. */
export interface ReadFileConfig {
	/** provide an optional abort signal to allow the cancellation of the file reading operation.
	 * 
	 * if the signal becomes aborted, the read file operation will be stopped and the promise returned will be rejected with an `AbortError`.
	 * 
	 * @defaultValue `undefined`
	*/
	signal?: AbortSignal
}

const defaultWriteFileConfig: WriteFileConfig = {
	append: false,
	create: true,
	mode: undefined,
}

const defaultReadFileConfig: ReadFileConfig = {}

/** writes text data to a file on supported runtimes
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
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
export const writeTextFile = async (runtime_enum: RUNTIME, file_path: string | URL, text: string, config: Partial<WriteFileConfig> = {}): Promise<void> => {
	// even though both node and deno accept file URL objects, if you pass a file-url string, they will fail to read/write to the provided path.
	// this is why we're forced to convert all file_paths to local-fs-paths during all read/write operations for all system-bound js-runtimes.
	file_path = ensureFileUrlIsLocalPath(file_path)
	const
		{ append, create, mode, signal } = { ...defaultWriteFileConfig, ...config },
		node_config = { encoding: "utf8" as const, append, create, mode, signal },
		deno_config = { append, create, mode, signal },
		runtime = getRuntime(runtime_enum)
	switch (runtime_enum) {
		case RUNTIME.DENO:
			return runtime.writeTextFile(file_path, text, deno_config)
		case RUNTIME.BUN:
		case RUNTIME.NODE:
			return node_writeFile(file_path, text, node_config)
		case RUNTIME.TXIKI:
			return txiki_writeFile(file_path, text, deno_config)
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem writing operations` : "")
	}
}

/** writes binary/buffer data to a file on supported runtimes
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
 * for unsupported runtimes, an error is thrown.
 * 
 * @param runtime_enum the runtime enum indicating which runtime should be used for writing onto the filesystem.
 * @param file_path the destination file path.
 * @param data the byte/buffer data to write to the file.
 * @param config provide optional configuration on how the writing should be performed.
 * @throws an error is thrown if an unsupported runtime uses this function,
 *   or if `config.create` is `false`, and no pre-existing file resides at the specified `file_path`.
*/
export const writeFile = async (runtime_enum: RUNTIME, file_path: string | URL, data: ArrayBufferView, config: Partial<WriteFileConfig> = {}): Promise<void> => {
	file_path = ensureFileUrlIsLocalPath(file_path)
	const
		{ append, create, mode, signal } = { ...defaultWriteFileConfig, ...config },
		{ buffer, byteLength, byteOffset } = data,
		bytes = data instanceof Uint8Array ? data : new Uint8Array(buffer, byteOffset, byteLength),
		node_config = { encoding: "binary" as const, append, create, mode, signal },
		deno_config = { append, create, mode, signal },
		runtime = getRuntime(runtime_enum)
	switch (runtime_enum) {
		case RUNTIME.DENO:
			return runtime.writeFile(file_path, bytes, deno_config)
		case RUNTIME.BUN:
		case RUNTIME.NODE:
			return node_writeFile(file_path, bytes, node_config)
		case RUNTIME.TXIKI:
			return txiki_writeFile(file_path, bytes, deno_config)
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem writing operations` : "")
	}
}

let
	node_fs: Awaited<ReturnType<typeof import_node_fs>>,
	node_child_process: Awaited<ReturnType<typeof import_node_child_process>>

const
	import_node_fs = async () => { return import("node:fs/promises") },
	get_node_fs = async () => { return (node_fs ??= await import_node_fs()) },
	import_node_child_process = async () => { return import("node:child_process") },
	get_node_child_process = async () => { return (node_child_process ??= await import_node_child_process()) }

const node_writeFile = async (file_path: string, data: string | ArrayBufferView, config: Partial<WriteFileConfig> & { encoding?: string } = {}): Promise<void> => {
	const
		fs = await get_node_fs(),
		{ append, create, mode, signal, encoding } = { ...defaultWriteFileConfig, ...config },
		fs_config = { encoding: encoding as any, mode, signal }
	// if we are permitted to write on top of existing files, then only a single call to `fs.writeFile` suffices.
	if (create) { return fs.writeFile(file_path, data as any, { ...fs_config, flag: (append ? "a" : "w") }) }
	// if we must assert the pre-existence of the file, then the process is a little more involved.
	const file = await fs.open(file_path, "r+", mode)
	if (!append) { await file.truncate(0) }
	await file.appendFile(data as any, fs_config)
	return file.close()
}

const txiki_writeFile = async (file_path: string, data: string | ArrayBufferView, config: Partial<WriteFileConfig>): Promise<void> => {
	const
		runtime: typeof tjs = getRuntime(RUNTIME.TXIKI),
		{ append, create, mode, signal } = config,
		// if we are permitted to write on top of existing files, then the "a" or "w" flags will simplify things.
		// otherwise, we will have to open the file in "update-mode" (i.e. "r+"), then discard all of the file manually (i.e. truncate at `0`).
		flag = create
			? (append ? "a" : "w")
			: (append ? "a+" : "r+"),
		file = await runtime.open(file_path, flag, mode)
	let aborted = false
	signal?.addEventListener("abort", () => {
		aborted = true
		file.close()
	})
	if (!create && !append) { await file.truncate(0) }
	const bytes: Uint8Array = data instanceof Uint8Array ? data
		: isString(data) ? textEncoder.encode(data)
			: new Uint8Array(data.buffer, data.byteOffset)
	await file.write(bytes)
	await file.close()
	if (aborted) { throw new Error("AbortError") }
}

/** reads and returns text data from a file on supported runtimes
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
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
export const readTextFile = async (runtime_enum: RUNTIME, file_path: string | URL, config: Partial<ReadFileConfig> = {}): Promise<string> => {
	file_path = ensureFileUrlIsLocalPath(file_path)
	const
		{ signal } = { ...defaultReadFileConfig, ...config },
		node_config = { encoding: "utf8" as const, signal },
		deno_config = { signal },
		runtime = getRuntime(runtime_enum)
	switch (runtime_enum) {
		case RUNTIME.DENO:
			return runtime.readTextFile(file_path, deno_config)
		case RUNTIME.BUN:
		case RUNTIME.NODE:
			return (await get_node_fs()).readFile(file_path, node_config)
		case RUNTIME.TXIKI:
			return textDecoder.decode(await readFile(runtime_enum, file_path, config))
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem reading operations` : "")
	}
}

/** reads and returns binary data from a file on supported runtimes
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
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
export const readFile = async (runtime_enum: RUNTIME, file_path: string | URL, config: Partial<ReadFileConfig> = {}): Promise<Uint8Array> => {
	file_path = ensureFileUrlIsLocalPath(file_path)
	const
		{ signal } = { ...defaultReadFileConfig, ...config },
		node_and_deno_config = { signal },
		runtime = getRuntime(runtime_enum)
	switch (runtime_enum) {
		case RUNTIME.DENO:
			return runtime.readFile(file_path, node_and_deno_config)
		case RUNTIME.BUN:
		case RUNTIME.NODE:
			return new Uint8Array((await (await get_node_fs()).readFile(file_path, node_and_deno_config)).buffer)
		case RUNTIME.TXIKI: {
			const promise = (runtime as typeof tjs).readFile(file_path)
			if (!signal) { return promise }
			const [abort_promise, abort_resolver, abort_rejector] = promise_outside<Uint8Array>()
			signal.addEventListener("abort", () => { abort_rejector("AbortError") })
			return promise_race([abort_promise, promise])
		}
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem reading operations` : "")
	}
}

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
	isFile: boolean

	/** this field is `true` if this info corresponds to a regular folder.
	 * 
	 * mutually exclusive with respect to {@link isFile} and {@link isSymlink}.
	*/
	isDirectory: boolean

	/** this field is `true` if this info corresponds to a symbolic-link (symlink).
	 * 
	 * mutually exclusive with respect to {@link isFile} and {@link isDirectory}.
	*/
	isSymlink: boolean

	/** the size of the file in bytes. (comes up as `0` for directories) */
	size: number

	/** the last modification time of the file.
	 * 
	 * this corresponds to the `mtime` field from `stat` on linux and mac, and `ftLastWriteTime` on windows.
	 * this may not be available on all platforms.
	*/
	mtime: Date

	/** the last access time of the file.
	 * 
	 * this corresponds to the `atime` field from `stat` on unix, and `ftLastAccessTime` on windows.
	 * this may not be available on all platforms.
	*/
	atime: Date

	/** the creation time of the file.
	 * 
	 * this corresponds to the `birthtime` field from `stat` on mac/bsd, and `ftCreationTime` on windows.
	 * this may not be available on all platforms.
	*/
	birthtime: Date

	/** the last change time of the file.
	 * 
	 * this corresponds to the `ctime` field from `stat` on mac/bsd, and `ChangeTime` on windows.
	 * this may not be available on all platforms.
	*/
	ctime: Date

	/** id of the device containing the file. */
	dev: number

	/** the underlying raw `st_mode` bits that contain the standard unix permissions for this file/directory. */
	mode: number
}

const
	fs_entry_info_fields = ["size", "mtime", "atime", "birthtime", "ctime", "dev", "mode"] as const satisfies Array<keyof FsEntryInfo>,
	fs_entry_info_all_fields: Array<keyof FsEntryInfo> = ["isFile", "isDirectory", "isSymlink", ...fs_entry_info_fields],
	object_assign_fields = (target: Record<PropertyKey, any>, source: Record<PropertyKey, any>, fields: PropertyKey[]): typeof target => {
		fields.forEach((prop) => { target[prop] = source[prop] })
		return target
	},
	capture_nonexistent_fs_entry = (error: any): undefined => {
		// capture the case where the syscall declares that the file or directory does not exist.
		if (string_toUpperCase(error.code as string) === "ENOENT") { return undefined }
		// otherwise, propagate the error.
		throw error
	}

const node_statEntry = async (path: string): Promise<FsEntryInfo | undefined> => {
	const
		fs = await get_node_fs(),
		stat = await fs
			.stat(path)
			.catch(capture_nonexistent_fs_entry)
	if (!stat) { return undefined }
	const result = object_assign_fields({
		isFile: stat.isFile(),
		isDirectory: stat.isDirectory(),
		isSymlink: stat.isSymbolicLink(),
	} satisfies Partial<FsEntryInfo>, stat, fs_entry_info_fields) as FsEntryInfo
	return result
}

const node_lstatEntry = async (path: string): Promise<FsEntryInfo | undefined> => {
	const
		fs = await get_node_fs(),
		stat = await fs
			.lstat(path)
			.catch(capture_nonexistent_fs_entry)
	if (!stat) { return undefined }
	const result = object_assign_fields({
		isFile: stat.isFile(),
		isDirectory: stat.isDirectory(),
		isSymlink: stat.isSymbolicLink(),
	} satisfies Partial<FsEntryInfo>, stat, fs_entry_info_fields) as FsEntryInfo
	return result
}

const tjs_statEntry = async (path: string): Promise<FsEntryInfo | undefined> => {
	const
		runtime: typeof tjs = getRuntime(RUNTIME.TXIKI),
		stat = await runtime
			.stat(path)
			.catch(capture_nonexistent_fs_entry)
	if (!stat) { return undefined }
	const { atim: atime, birthtim: birthtime, ctim: ctime, dev, isDirectory, isFile, isSymbolicLink: isSymlink, mode, mtim: mtime, size } = stat
	return { atime, birthtime, ctime, dev, isDirectory, isFile, isSymlink, mode, mtime, size }
}

const tjs_lstatEntry = async (path: string): Promise<FsEntryInfo | undefined> => {
	const
		runtime: typeof tjs = getRuntime(RUNTIME.TXIKI),
		stat = await runtime
			.lstat(path)
			.catch(capture_nonexistent_fs_entry)
	if (!stat) { return undefined }
	const { atim: atime, birthtim: birthtime, ctim: ctime, dev, isDirectory, isFile, isSymbolicLink: isSymlink, mode, mtim: mtime, size } = stat
	return { atime, birthtime, ctime, dev, isDirectory, isFile, isSymlink, mode, mtime, size }
}

/** provides metadata information about a filesystem entry (file, folder) on supported runtimes
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
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
export const statEntry = async (runtime_enum: RUNTIME, path: string | URL): Promise<FsEntryInfo | undefined> => {
	switch (runtime_enum) {
		case RUNTIME.DENO: {
			const stat = await getRuntime(runtime_enum).stat(path).catch(capture_nonexistent_fs_entry)
			if (!stat) { return undefined }
			const result = object_assign_fields({}, stat, fs_entry_info_all_fields) as FsEntryInfo
			return result
		}
		case RUNTIME.BUN:
		case RUNTIME.NODE:
			return node_statEntry(ensureFileUrlIsLocalPath(path))
		case RUNTIME.TXIKI:
			return tjs_statEntry(ensureFileUrlIsLocalPath(path))
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem stat-query operations` : "")
	}
}

/** similar to {@link statEntry}, but any symbolic links encountered at the provided `path` will not be followed,
 * and instead you will receive the stats of the symbolic link itself.
 * 
 * read the documentation comments of {@link statEntry} for usage details.
 * ```
*/
export const lstatEntry = async (runtime_enum: RUNTIME, path: string | URL): Promise<FsEntryInfo | undefined> => {
	switch (runtime_enum) {
		case RUNTIME.DENO: {
			const stat = await getRuntime(runtime_enum).lstat(path).catch(capture_nonexistent_fs_entry)
			if (!stat) { return undefined }
			const result = object_assign_fields({}, stat, fs_entry_info_all_fields) as FsEntryInfo
			return result
		}
		case RUNTIME.BUN:
		case RUNTIME.NODE:
			return node_lstatEntry(ensureFileUrlIsLocalPath(path))
		case RUNTIME.TXIKI:
			return tjs_lstatEntry(ensureFileUrlIsLocalPath(path))
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem lstat-query operations` : "")
	}
}

/** creates a nested directory if it does not already exist. only supported on system runtime
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
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
export const ensureDir = async (runtime_enum: RUNTIME, dir_path: string | URL): Promise<void> => {
	dir_path = ensureEndSlash(ensureFileUrlIsLocalPath(dir_path))
	const existing_entry_stats = await statEntry(runtime_enum, dir_path)
	if (existing_entry_stats?.isDirectory) { return }
	const runtime = getRuntime(runtime_enum)
	switch (runtime_enum) {
		case RUNTIME.DENO:
			return (runtime as typeof Deno).mkdir(dir_path, { recursive: true })
		case RUNTIME.BUN:
		case RUNTIME.NODE:
			return get_node_fs()
				.then((fs) => fs.mkdir(dir_path, { recursive: true }))
				.then(noop)
		case RUNTIME.TXIKI:
			return (runtime as typeof tjs).makeDir(dir_path, { recursive: true })
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem writing operations` : "")
	}
}

/** ensures that the file exists on system-bound runtimes
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
 * 
 * if the file already exists, this function does nothing.
 * if the parent directories for the file do not exist yet, they are created recursively.
 * 
 * @throws an error is thrown if something other than a file already existed at the provided path,
 *   or if creating the parent directory had failed.
*/
export const ensureFile = async (runtime_enum: RUNTIME, file_path: string | URL): Promise<void> => {
	file_path = ensureFileUrlIsLocalPath(file_path)
	const existing_entry_stats = await statEntry(runtime_enum, file_path)
	if (existing_entry_stats?.isFile) { return }
	// if the file does not already exist, then ensure that its path's parent directory exists, and then create the file.
	const parent_dir = parseFilepathInfo(file_path).dirpath
	await ensureDir(runtime_enum, parent_dir)
	return writeFile(runtime_enum, file_path, new Uint8Array(0))
}

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
	 * > [!warning]
	 * > the `recursive` option is always enabled for {@link RUNTIME.TXIKI | `txiki.js`}.
	 * > (at least until I implement some way of scanning for child files)
	 * 
	 * @defaultValue `false` (removing non-empty directories will not work and throw an error)
	*/
	recursive: boolean
}

/** deletes a filesystem-entry (file, folder, symlink) at the provided `path`, on system-bound runtimes
 * (i.e. {@link RUNTIME.DENO}, {@link RUNTIME.BUN}, or {@link RUNTIME.NODE}, {@link RUNTIME.TXIKI}).
 * the return value dictates if anything was deleted.
 * 
 * > [!note]
 * > trying to remove a non-existing entry will not throw an error.
 * 
 * > [!warning]
 * > the `recursive` option is always enabled for {@link RUNTIME.TXIKI | `txiki.js`}.
 * 
 * @param runtime_enum the runtime enum indicating which runtime should be used for reading the filesystem.
 * @param path the path to the filesystem entity that is to be deleted.
 * @param config provide optional configuration on what _type_s of filesystem-entries should be deleted,
 *   and if folder type entries should be deleted `recursive`ly (i.e. delete child entries as well).
 *   see the {@link RemoveEntryConfig} interface for more details.
 * @returns `true` if an entry (or a folder tree's entries) was deleted, otherwise `false` is returned when nothing is deleted.
*/
export const removeEntry = async (runtime_enum: RUNTIME, path: string | URL, config: Partial<RemoveEntryConfig> = {}): Promise<boolean> => {
	const
		{ recursive = false, ...is_types } = config,
		existing_entry_stats = await statEntry(runtime_enum, path)
	// if the `path` does not exist, then there is nothing to delete
	if (!existing_entry_stats) { return false }
	// if there is a mismatch between the existing fs-entry's type and the permitted/forbidden list of fs-types (`is_types`), then delete nothing and return.
	for (const [entry_type, is_permitted] of object_entries(is_types) as Array<[keyof typeof is_types, boolean]>) {
		if (existing_entry_stats[entry_type] !== is_permitted) { return false }
	}
	const runtime = getRuntime(runtime_enum)
	// now, if there's no mismatch, then it is time for the deletion to take place.
	switch (runtime_enum) {
		case RUNTIME.DENO:
			return (runtime as typeof Deno).remove(path, { recursive }).then(() => true)
		case RUNTIME.BUN:
		case RUNTIME.NODE:
			return get_node_fs()
				.then((fs) => fs.rm(ensureFileUrlIsLocalPath(path), { recursive }))
				.then(() => true)
		case RUNTIME.TXIKI:
			return (runtime as typeof tjs).remove(ensureFileUrlIsLocalPath(path))
				.then(() => true)
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem writing operations` : "")
	}
}

/** provides information about the nature of a filesystem entry
 * (file, folder, or a symbolic link) scanned by the {@link readDir} function.
*/
export interface FsEntryRecord extends Pick<FsEntryInfo, "isDirectory" | "isFile" | "isSymlink"> {
	/** the name of the filesystem entry, **without** any trailing slashes, nor any leading dot-slashes;
	 * not even when the entry is a sub-directory (i.e. you will have to check the `isDirectory` flag to distinguish files from folders).
	 * 
	 * all names are all relative to the directory that you scan.
	*/
	name: string
}

/** read a directory's immediate child entries (files, folders, and symbolic links).
 * this operation is not recursive, and so, subdirectories will not be traversed.
 * 
 * @throws an error is thrown if the directory does not exist, or if it is a file/symbolic-link.
 * 
 * > [!note]
 * > each directory entry's name is stripped off of any trailing slash, and any leading dot-slash.
 * > this means, you will not be able to distinguish files from folders and symbolic links based on their
 * > {@link FsEntryRecord.name | name} alone, and instead, you will have to rely on the `isXYZ` flags.
 * 
 * TODO: what about symbolic links? should I follow them until I hit a "real" entry?
 * TODO: should I also give an option for recursive traversal? I think it might lead to more complexity,
 * but at the same time, it'll be faster since we won't have to double check the any subdir `dir_path`'s existence via `statEntry`.
 * 
 * @example
 * ```ts
 * import { assertEquals, assertObjectMatch } from "jsr:@std/assert"
 * 
 * const
 * 	runtime_id = identifyCurrentRuntime(),
 * 	base_dir = new URL(import.meta.resolve("../temp/a/")),
 * 	my_dir   = new URL(import.meta.resolve("../temp/a/b/c/")),
 * 	my_file1 = new URL(import.meta.resolve("../temp/a/b/x.txt")),
 * 	my_file2 = new URL(import.meta.resolve("../temp/a/y.txt")),
 * 	my_file3 = new URL(import.meta.resolve("../temp/a/z.txt"))
 * 
 * await ensureDir(runtime_id, my_dir)
 * await ensureFile(runtime_id, my_file1)
 * await ensureFile(runtime_id, my_file2)
 * await ensureFile(runtime_id, my_file3)
 * 
 * // the directories and files should now exist.
 * // so now, we'll iterate over them.
 * const entries: Record<string, FsEntryRecord> = {}
 * for await (const entry of readDir(runtime_id, base_dir)) {
 * 	entries[entry.name] = entry
 * }
 * 
 * assertEquals(Object.keys(entries).length, 3)
 * 
 * assertObjectMatch(entries["b"], {
 * 	name: "b",
 * 	isFile: false,
 * 	isDirectory: true,
 * 	isSymlink: false,
 * })
 * 
 * assertObjectMatch(entries["y.txt"], {
 * 	name: "y.txt",
 * 	isFile: true,
 * 	isDirectory: false,
 * 	isSymlink: false,
 * })
 * 
 * assertObjectMatch(entries["z.txt"], {
 * 	name: "z.txt",
 * 	isFile: true,
 * 	isDirectory: false,
 * 	isSymlink: false,
 * })
 * 
 * // deleting the base directory (recursively)
 * assertEquals(await removeEntry(runtime_id, base_dir, { recursive: true }), true)
 * 
 * // the directory no longer exists
 * assertEquals(await statEntry(runtime_id, base_dir),  undefined)
 * ```
*/
export async function* readDir(runtime_enum: RUNTIME, dir_path: string | URL): AsyncIterable<FsEntryRecord> {
	dir_path = ensureEndSlash(ensureFileUrlIsLocalPath(dir_path))
	const existing_entry_stats = await statEntry(runtime_enum, dir_path)
	// if the folder does not exist, we will throw an error.
	if (existing_entry_stats === undefined || !existing_entry_stats.isDirectory) {
		throw new Error(DEBUG.ERROR ? `[readDir]: the directory "${dir_path}" does not exist (it might be a file).` : "")
	}
	const runtime = getRuntime(runtime_enum)
	switch (runtime_enum) {
		case RUNTIME.DENO: {
			yield* (runtime as typeof Deno).readDir(dir_path)
			break
		}
		case RUNTIME.BUN:
		case RUNTIME.NODE: {
			const
				fs = await get_node_fs(),
				dir_iterator = await fs.readdir(dir_path, { recursive: false, withFileTypes: true })
			for await (const dir_entry of dir_iterator) {
				yield {
					isDirectory: dir_entry.isDirectory(),
					isFile: dir_entry.isFile(),
					isSymlink: dir_entry.isSymbolicLink(),
					name: dir_entry.name,
				}
			}
			break
		}
		case RUNTIME.TXIKI: {
			const dir_iterator = await (runtime as typeof tjs).readDir(dir_path)
			for await (const { isDirectory, isFile, isSymbolicLink: isSymlink, name } of dir_iterator) {
				yield { isDirectory, isFile, isSymlink, name }
			}
			break
		}
		default:
			throw new Error(DEBUG.ERROR ? `your non-system runtime environment enum ("${runtime_enum}") does not support filesystem reading operations` : "")
	}
}
