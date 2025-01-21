import { promiseTimeout } from "@oazmi/kitchensink/lambda"
import { parseFilepathInfo } from "@oazmi/kitchensink/pathman"
import esbuild from "npm:esbuild@0.24.2"
import { httpPluginSetup } from "../../src/plugins/http.ts"


Deno.test("test http plugin", async () => {
	const entry_points = [
		"./sample_entry.ts",
		"https://jsr.io/@oazmi/kitchensink/0.9.2/src/array1d.ts",
		"https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts",
		"https://jsr.io/@oazmi/kitchensink/0.9.2/src/struct.ts",
		"https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css",
	].map((path) => ({
		in: path,
		out: parseFilepathInfo(path).basename
	}))

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
		plugins: [{ name: "my-http-plugin", setup: httpPluginSetup() }],
	})

	console.log(result.outputFiles.map((v) => (v.path)))
	await esbuild.stop()
	await promiseTimeout(500)
})
