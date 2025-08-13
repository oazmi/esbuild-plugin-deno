import { promiseTimeout } from "@oazmi/kitchensink/lambda"
import esbuild from "npm:esbuild@0.25.0"
import { denoPlugins } from "../../src/plugins/mod.ts"


Deno.test("test workspace feature", async () => {
	// alternate aliases for "projB" are "jsr:projB" and "jsr:projB@0.1.2".
	// however, currently "./b1/b2/proj-b/" will not work,
	// since there is no ancestor-directory workplace scanning feature implemented yet.
	const
		projb_workspace_aliases = ["projB", "jsr:projB", "jsr:projB@0.1.2"],
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

	for (const entrypoint of projb_workspace_aliases) {
		const result = await esbuild.build({
			...esbuild_config,
			entryPoints: [{ in: entrypoint, out: "proj-b" }],
			plugins: denoPlugins({
				scanAncestralWorkspaces: false,
				initialPluginData: {
					runtimePackage: "./deno.json",
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
