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
import { type esbuild } from "../deps.js";
import type { EsbuildPluginBuildCompatible, EsbuildPluginCompatible } from "../plugins/typedefs.js";
/** a subset of build configuration options that the {@link esbuildNativeResolverFactory} function supports.
 * all of these build options have the potential to influence esbuild's resolved path.
*/
export type EsbuildNativeResolverBuildOptions = Pick<esbuild.BuildOptions, "absWorkingDir" | "alias" | "conditions" | "external" | "mainFields" | "nodePaths" | "packages" | "platform" | "resolveExtensions" | "tsconfig" | "tsconfigRaw">;
/** this class provides {@link resolve} method that is capable of resolving paths using esbuild's node-resolution scanner.
 *
 * it works by invoking esbuild's `PluginBuild.resolve` function whenever the {@link resolve} method is called,
 * and it holds an `onLoad` hook hostage by hanging forever,
 * so that the internal sub-build does not conclude until the {@link stop} method has been called.
*/
export declare class EsbuildNativeResolver {
    #private;
    protected entryPoint: string;
    protected namespace: string;
    protected readonly startBuildPromise: Promise<void>;
    protected readonly startBuildResolve: (() => void);
    protected readonly stopBuildPromise: Promise<void>;
    protected readonly stopBuildResolve: (() => void);
    constructor(base_esbuild: EsbuildPluginBuildCompatible["esbuild"], build_options?: esbuild.BuildOptions);
    resolve(path: string, options?: esbuild.ResolveOptions): Promise<esbuild.ResolveResult>;
    stop(): Promise<void>;
    protected initOptions(build_options?: esbuild.BuildOptions): esbuild.BuildOptions;
    protected initPlugin(): EsbuildPluginCompatible;
}
//# sourceMappingURL=esbuild_native_resolver.d.ts.map