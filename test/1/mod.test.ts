import { promiseTimeout } from "@oazmi/kitchensink/lambda"
import { parseFilepathInfo } from "@oazmi/kitchensink/pathman"
import esbuild from "npm:esbuild@0.25.0"
import { httpPlugin, importMapPlugin, jsrPlugin, npmSpecifierPlugin } from "../../src/mod.ts"


Deno.test("test http plugin", async () => {
	const entry_points = [
		"./local_path_entry.ts", // this will be resolved and loaded by esbuild natively (although it will initially pass though the import-map-plugin resolver)
		"file://" + import.meta.dirname + "/file_uri_entry.ts", // this will be resolved and loaded by our http-plugin
		// "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array1d.ts",
		"jsr:@oazmi/kitchensink@^0.9.2/array1d", // this will be resolved by our jsr-plugin, and loaded by the http-plugin
		"https://2d-lib", // this will bundle via our `globalImportMap` setting inside of the http-plugin
		"2d-array-utils", // this will bundle via our `importMap` setting inside of our import-map-plugin
		// "https://jsr.io/@oazmi/kitchensink/0.9.3/src/struct.ts",
		"jsr:@oazmi/kitchensink/struct",         // this will be resolved to the latest version of the package by our jsr-plugin
		"npm:@oazmi/kitchensink/stringman",      // this will be resolved to whatever-is-available-version of the package (in the `node_modules` directory) by our npm-specifier-plugin
		"https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css", // http-plugin resolution and loading
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
			importMapPlugin({
				importMap: {
					"2d-array-utils": "jsr:@oazmi/kitchensink@0.9.2/array2d",
				}
			}),
			httpPlugin({
				globalImportMap: {
					"2d-array-utils": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts",
					"https://2d-lib": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts",
				}
			}),
			jsrPlugin(),
			npmSpecifierPlugin(),
		],
	})

	console.log(result.outputFiles.map((v) => (v.path)))
	await esbuild.stop()
	await promiseTimeout(500)
})
