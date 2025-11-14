import { promiseTimeout } from "@oazmi/kitchensink/lambda"
import esbuild from "npm:esbuild@0.27.0"
import { denoPlugins } from "../../src/plugins/mod.ts"


Deno.test("test skipping of external modules", async () => {
	const entry_points = [{ in: "./main.ts", out: "./main" }]
	const result = await esbuild.build({
		absWorkingDir: import.meta.dirname,
		entryPoints: entry_points,
		outdir: "./dist/",
		format: "esm",
		platform: "node",
		splitting: true,
		bundle: true,
		minifySyntax: true,
		treeShaking: true,
		write: false,
		metafile: true,
		external: [
			"@ts-morph/bootstrap", // this is a dependency of "jsr:@deno/dnt"
			"@gerrit0/mini-shiki", // this is a dependency of "npm:typedoc"
		],
		plugins: [
			...denoPlugins({
				globalImportMap: {
					"assert": "node:assert",
					"child_process": "node:child_process",
					"fs": "node:fs",
					"fs/": "node:fs/",
					"inspector": "node:inspector",
					"module": "node:module",
					"path": "node:path",
					"pnpapi": "node:pnpapi",
					"source-map-support": "node:source-map-support",
					"tty": "node:tty",
					"url": "node:url",
					"util": "node:util",
					"worker_threads": "node:worker_threads",
					"zlib": "node:zlib",
				},
				initialPluginData: {
					runtimePackage: "./",
					resolverConfig: { useImportMap: true },
				},
				log: true,
			})
		],
	})

	console.log(result.outputFiles.map((v) => (v.path)))
	await esbuild.stop()
	await promiseTimeout(500)
})
