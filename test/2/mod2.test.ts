import { promiseTimeout } from "@oazmi/kitchensink/lambda"
import esbuild from "npm:esbuild@0.25.0"
import { denoPlugins } from "../../src/plugins/mod.ts"


Deno.test("test workspace scanning feature", async () => {
	const
		projb_workspace_aliases = ["projB", "jsr:projB", "jsr:projB@0.1.2"],
		main_export_aliases = ["", ".", "./b1/b2/proj-b/mod.ts", ...projb_workspace_aliases],
		esbuild_config = {
			absWorkingDir: import.meta.dirname,
			outdir: "./dist/",
			format: "esm" as const,
			splitting: true,
			bundle: true,
			minifySyntax: true,
			treeShaking: true,
			write: false as const,
			metafile: true as const,
		}

	// the following direct bundling operations on `projB` ("./b1/b2/proj-b/jsr.jsonc")
	// will require parent/ancestor directory scanning for the parental-workspace packages to get discovered.
	// luckily, this kind of parental-workspace discovery/scanning can be conveniently done by the plugin;
	// simply set this plugin's `scanAncestralWorkspaces` configuration option to `true`,
	// and the plugin will traverse all ancestral directories of `initialPluginData.runtimePackage` (your project's "deno.json" or its directory).
	for (const entrypoint of main_export_aliases) {
		const result = await esbuild.build({
			...esbuild_config,
			entryPoints: [{ in: entrypoint, out: "proj-b" }],
			plugins: denoPlugins({
				scanAncestralWorkspaces: true,
				initialPluginData: {
					runtimePackage: "./b1/b2/proj-b/",
					resolverConfig: { useNodeModules: false },
				},
				log: true,
			}),
		})
		// console.log(result.outputFiles.map((v) => (v.path)))
	}

	await esbuild.stop()
	await promiseTimeout(500)
})
