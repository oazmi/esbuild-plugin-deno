import { promiseTimeout } from "@oazmi/kitchensink/lambda"
import { parseFilepathInfo } from "@oazmi/kitchensink/pathman"
import esbuild from "npm:esbuild@0.24.2"
import { httpPluginSetup } from "../../src/plugins/http.ts"
import { importMapPluginSetup } from "../../src/plugins/importmap.ts"


Deno.test("test http plugin", async () => {
	const entry_points = [
		"./local_path_entry.ts",
		"file://" + import.meta.dirname + "/file_uri_entry.ts",
		"https://jsr.io/@oazmi/kitchensink/0.9.2/src/array1d.ts",
		"https://2d-lib", // this will bundle via our `globalImportMap` setting inside of the http-plugin
		"2d-array-utils", // this will bundle via our `importMap` setting inside of our import-map-plugin
		"https://jsr.io/@oazmi/kitchensink/0.9.2/src/struct.ts",
		"https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css",
	].map((path) => ({
		in: path,
		out: "entry-" + parseFilepathInfo(path).basename
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
		plugins: [
			{
				name: "my-importmap-plugin",
				setup: importMapPluginSetup({
					importMap: {
						"2d-array-utils": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts",
					}
				})
			},
			{
				name: "my-http-plugin",
				setup: httpPluginSetup({
					globalImportMap: {
						"2d-array-utils": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts",
						"https://2d-lib": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts",
					}
				})
			}
		],
	})

	console.log(result.outputFiles.map((v) => (v.path)))
	await esbuild.stop()
	await promiseTimeout(500)
})
