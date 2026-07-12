/** the class exported here lets you resolve paths with respect to esbuild's native node-resolution algorithm.
 * 
 * the way how it works is that it instantiates a sub-build with a fake entrypoint and a {@link EsbuildNativeResolver.initPlugin | plugin},
 * and then hangs at its `onLoad` stage, accepting all incoming requests to resolve node-modules (via {@link EsbuildNativeResolver.resolve}),
 * and then at the end of the user's build, they call the {@link EsbuildNativeResolver.stop} method to terminate the sub-build.
 * 
 * the current implementation is copied from my other library (`@oazmi/superbuild`).
 * here's the source: [link](https://github.com/oazmi/superbuild/blob/4b764c9eb2849bdd51296f3bf26d476160022208/src/plugins/native_replica.ts#L95).
 * 
 * @module
*/

import { DEBUG, ensureFileUrlIsLocalPath, escapeLiteralStringForRegex, promise_outside, type esbuild } from "../deps.js"
import { logLogger } from "../plugins/funcdefs.js"
import type { EsbuildPluginBuild, EsbuildPluginBuildCompatible, EsbuildPluginCompatible } from "../plugins/typedefs.js"


/** a subset of build configuration options that the {@link esbuildNativeResolverFactory} function supports.
 * all of these build options have the potential to influence esbuild's resolved path.
*/
export type EsbuildNativeResolverBuildOptions = Pick<
	esbuild.BuildOptions,
	| "absWorkingDir" | "alias" | "conditions" | "external"
	| "mainFields" | "nodePaths" | "packages" | "platform"
	| "resolveExtensions" | "tsconfig" | "tsconfigRaw"
>

/** this class provides {@link resolve} method that is capable of resolving paths using esbuild's node-resolution scanner.
 *
 * it works by invoking esbuild's `PluginBuild.resolve` function whenever the {@link resolve} method is called,
 * and it holds an `onLoad` hook hostage by hanging forever,
 * so that the internal sub-build does not conclude until the {@link stop} method has been called.
*/
export class EsbuildNativeResolver {
	protected entryPoint = "<the-unloadable-void>"
	protected namespace = "the-void"
	protected readonly startBuildPromise: Promise<void>
	protected readonly startBuildResolve: (() => void)
	protected readonly stopBuildPromise: Promise<void>
	protected readonly stopBuildResolve: (() => void)

	#internal_resolve!: EsbuildPluginBuild["resolve"]
	#build_result!: ReturnType<EsbuildPluginBuild["esbuild"]["build"]>

	constructor(base_esbuild: EsbuildPluginBuildCompatible["esbuild"], build_options?: esbuild.BuildOptions) {
		[this.startBuildPromise, this.startBuildResolve] = promise_outside<void>();
		[this.stopBuildPromise, this.stopBuildResolve] = promise_outside<void>()
		build_options = this.initOptions(build_options)
		build_options.plugins = [this.initPlugin()]
		this.#build_result = base_esbuild.build(build_options)
	}

	public async resolve(path: string, options?: esbuild.ResolveOptions): Promise<esbuild.ResolveResult> {
		await this.startBuildPromise
		if (DEBUG.ASSERT && ((options?.resolveDir ?? "") === "")) {
			logLogger(
				`[EsbuildNativeResolver.resolve]: WARNING! received an empty resolve directory ("options.resolveDir").`,
				`\n\twe will fallback to esbuild's current-working-directory for filling in the "resolveDir" value,`,
				`\n\thowever, you must be using the "EsbuildNativeResolver.resolve" function incorrectly to have encountered this situation.`,
				`\n\tremember, the purpose of this function is to scan for a node-module, starting from a directory that YOU provide.`,
			)
		}
		path = ensureFileUrlIsLocalPath(path)
		options ??= {}
		options.resolveDir = ensureFileUrlIsLocalPath(options.resolveDir ? options.resolveDir : "./")
		return this.#internal_resolve(path, options)
	}

	public async stop(): Promise<void> {
		this.stopBuildResolve()
		await this.#build_result
	}

	protected initOptions(build_options: esbuild.BuildOptions = {}): esbuild.BuildOptions {
		const {
			absWorkingDir, alias, conditions, external,
			mainFields, nodePaths, packages, platform,
			resolveExtensions, tsconfig, tsconfigRaw,
		}: EsbuildNativeResolverBuildOptions = build_options
		const entrypoint = this.entryPoint
		return {
			absWorkingDir, alias, conditions, external,
			mainFields, nodePaths, packages, platform,
			resolveExtensions, tsconfig, tsconfigRaw,
			// `bundle` must be true, else `external` will get rejected fatally by esbuild.
			bundle: true, minify: false, write: false,
			outdir: "./temp/", entryPoints: [entrypoint],
		}
	}

	protected initPlugin(): EsbuildPluginCompatible {
		const self = this
		const setup_fn = (build: EsbuildPluginBuild) => {
			const
				entrypoint = self.entryPoint,
				filter = RegExp(escapeLiteralStringForRegex(entrypoint) + "$"),
				namespace = self.namespace
			build.onResolve({ filter }, async (args) => {
				return { path: entrypoint, namespace }
			})

			build.onLoad({ filter, namespace }, async (args) => {
				self.startBuildResolve()
				self.#internal_resolve = (path, args) => {
					return build.resolve(path, { kind: "entry-point", resolveDir: "./", ...args })
				}
				await self.stopBuildPromise
				return { contents: "", loader: "empty" }
			})
		}

		return {
			name: "native-esbuild-resolver-capture",
			setup: setup_fn,
		}
	}
}
