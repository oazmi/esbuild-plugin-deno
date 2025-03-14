import { promiseTimeout } from "@oazmi/kitchensink/lambda"
import { parseFilepathInfo } from "@oazmi/kitchensink/pathman"
import esbuild from "npm:esbuild@0.25.0"
import { entryPlugin } from "../../src/plugins/filters/entry.ts"
import { httpPlugin } from "../../src/plugins/filters/http.ts"
import { jsrPlugin } from "../../src/plugins/filters/jsr.ts"
import { npmPlugin } from "../../src/plugins/filters/npm.ts"
import { resolverPlugin } from "../../src/plugins/resolvers.ts"
// import { denoPlugins } from "../../src/plugins/mod.ts"


Deno.test("test http plugin", async () => {
	const entry_points = [
		"@remote-file-alias",    // this remote-file alias will be resolved by the "deno.json" file in the current directory
		"@local-file-alias",     // this local-file alias will be resolved by the "deno.json" file in the current directory
		"./local_path_entry.ts", // this will be loaded by esbuild natively (although it will initially pass though the entry-plugin's resolver pipeline)
		"file://" + import.meta.dirname + "/file_uri_entry.ts", // this will be resolved and loaded by our http-plugin
		// "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array1d.ts",
		"jsr:@oazmi/kitchensink@^0.9.2/array1d", // this will be resolved by our jsr-plugin, and loaded by the http-plugin
		"https://2d-lib", // this will bundle via our `importMap` setting inside of the entry plugin's `initialPluginData`
		"2d-array-utils", // this will bundle via our `globalImportMap` setting inside of our resolvers-pipeline plugin
		// "https://jsr.io/@oazmi/kitchensink/0.9.3/src/struct.ts",
		"jsr:@oazmi/kitchensink/struct",         // this will be resolved to the latest version of the package by our jsr-plugin
		"npm:@oazmi/kitchensink/stringman",      // this will be resolved to whatever-is-available-version of the package (in the `node_modules` directory) by our npm-plugin
		"https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css", // http-plugin resolution and loading
		"npm:d3-brush@3.0.0", // this, despite not being part of "deno.json", will get auto-installed via our npm-plugin.
	].map((path) => ({
		in: path,
		out: "entry-" + parseFilepathInfo(path).basename.replace(/^npm:/, ""),
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
			npmPlugin({ autoInstall: true, log: true, }),
			entryPlugin({
				initialPluginData: {
					runtimePackage: "./deno.json",
					importMap: { "https://2d-lib": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts" },
					resolverConfig: { useNodeModules: false },
				}
			}),
			httpPlugin(),
			jsrPlugin(),
			resolverPlugin({ log: false, importMap: { globalImportMap: { "2d-array-utils": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts" } } }),

			// simpler alternative:
			//
			// ...denoPlugins({
			// 	globalImportMap: { "2d-array-utils": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts" },
			// 	pluginData: {
			// 		runtimePackage: "./deno.json",
			// 		importMap: { "https://2d-lib": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts" },
			// 		resolverConfig: { useNodeModules: false },
			// 	},
			// })
		],
	})

	console.log(result.outputFiles.map((v) => (v.path)))
	await esbuild.stop()
	await promiseTimeout(500)
})
