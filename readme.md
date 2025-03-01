# @oazmi/esbuild-plugin-deno

A suite of multi-purpose esbuild plugins for bundling libraries and web-apps with Deno, Node, or Bun.
It is capable of resolving `file://`, `http://`, `https://`, `jsr:`, and `npm:` specifiers, in addition to supporting global `importMap`s.
With its non-intrusive design, it works seamlessly alongside esbuild's native resolver/loader and other plugins (including those from npm).
This means you won't face any issues with bundling non-javascript/typescript files (such as `.css`, `.svg`, etc...),
regardless of where they come from (http, jsr, or npm).

You may also use this library as a drop-in lightweight and cross-runtime alternative to the official [`jsr:@luca/esbuild-deno-loader`](https://jsr.io/@luca/esbuild-deno-loader) deno plugin;
That's because the plugins in this library do not rely on any javascript-runtime specific feature, apart from a soft-dependency on `Deno.cwd()`/`process.cwd()` (to query the current working directory).
This permits it portablility across any runtime environment (web, deno, node, bun, (cloudflare workers?)).

## Upsides

- Allows native esbuild resolvers and loaders to take over whenever possible.
  This means that you can bundle css files and whatnot, even if deno itself cannot make sense of such imports.
- Plays nicely with other plugins, by not snatching resource resolution and forcing it down a single namespace.
  The way it works is what it "unresolves" its internal namespaces, and queries other plugins (and esbuild's native resolver) to try and resolve the path first, before trying to do so itself.
- Uses web-compatible APIs only (with the exception of `Deno.cwd()` or `process.cwd()`, that is otherwise replaced by a stub function on the web).

## Downsides

- Since this library does not utilize Deno's cache, nor does it take advantage of its semantic-versioning resolver (to figure out the best package version), bundling will probably likely take longer, and not speed up across successive builds.
  (maybe I'll add a file caching mechanism in the future, but that'll require filesystem write access, which isn't practical for web-portability)
- for npm-packages (whether or not you use the `npm:` specifier), you will currently need to install the packages to your project's `./node_modules/` folder, either via `npm install`, or `deno install` with `"nodeModulesDir": "auto"` enabled in your `./deno.json` file.
  I will be adding an auto-install feature in the future, but it will require filesystem write access,
  since [npmjs.org](http://registry.npmjs.org/) only distributes tarballs, instead of individual fetchable files,
  like the way [jsr.io](https://jsr.io/) does.

## Plugins featured

- {@link "mod"!importMapPlugin}: provides import-map alias path-resolving for entry-points and esbuild's native resolvers (i.e. when in the default namespace).
- {@link "mod"!httpPlugin}: provides `http://` and `https://` path-resolving and resource-fetching loader.
- {@link "mod"!jsrPlugin}: provides a `jsr:` specifier to `https://jsr.io/` path-resolver.
- {@link "mod"!npmSpecifierPlugin}: provides an `npm:` specifier to a node-package-alias path resolver,
  so that esbuild can look for the node module in the filesystem by itself.
- {@link "mod"!denoPlugins}: cumulation of the four plugins above, so that you can bundle code that deno natively understands.

## Documentation and other links

- see [https://oazmi.github.io/esbuild-plugin-deno](https://oazmi.github.io/esbuild-plugin-deno/) for documentation.
- check [https://jsr.io/@oazmi/esbuild-plugin-deno](https://jsr.io/@oazmi/esbuild-plugin-deno/) for the jsr release page.
- check [https://www.npmjs.com/package/@oazmi/esbuild-plugin-deno](https://www.npmjs.com/package/@oazmi/esbuild-plugin-deno/) for the npm-compatible release page.
- see [https://github.com/oazmi/esbuild-plugin-deno](https://github.com/oazmi/esbuild-plugin-deno/) for the github repository.

## Installation

- for deno: `deno add jsr:@oazmi/esbuild-plugin-deno`
- for node: `npm install @oazmi/esbuild-plugin-deno --save-dev`

## Example

entry point 1:

```ts
// file: "./file_uri_entry.ts"

import { meshGrid } from "2d-array-utils" // this will be resolved by our `http_plugin`'s `globalImportMap` setting
import { transpose2D } from "https://jsr.io/@oazmi/kitchensink/0.9.2/src/numericarray.ts"
import { cumulativeSum } from "npm:@oazmi/kitchensink@^0.9.5/numericarray"
import { parse as parseJsonc } from "jsr:@std/jsonc"
import "https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css"
import * as http from "node:http"
import * as https from "node:https"
console.log("hello world", transpose2D([[1], [2], [3]]))
console.log(http.Agent)
console.log(meshGrid([1, 2, 3], [0, -1, -2, -3, -4]), cumulativeSum([1, 2, 3, 4]))
console.log(parseJsonc(`// file: hello-world.jsonc\n{ "name": "hello", "planet": "world" }`))
export { http, https }
```

entry point 2:

```ts
// file: "./local_path_entry.ts"

import { meshGrid } from "2d-array-utils" // this will be resolved by our `importmap_plugin`'s `importMap` setting
import { transpose2D } from "https://jsr.io/@oazmi/kitchensink/0.9.2/src/numericarray.ts"
import { cumulativeSum } from "jsr:@oazmi/kitchensink@~0.9.2/numericarray"
import "https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css"
import * as http from "node:http"
import * as https from "node:https"
console.log("skibidi gen-z rizzing toilet seat", transpose2D([[1], [2], [3]]))
console.log(http.Agent)
console.log(meshGrid([1, 2, 3], [0, -1, -2, -3, -4]), cumulativeSum([1, 2, 3, 4]))
export { http, https }
```

remote entry points 3 to 7:

```ts
// jsr-file version range:  "jsr:@oazmi/kitchensink@^0.9.2/array1d"
// fake-http-alias:         "https://2d-lib"
// importmap-alias:         "2d-array-utils"
// jsr-file latest version: "jsr:@oazmi/kitchensink/struct"
// npm-file any version:    "npm:@oazmi/kitchensink/stringman"
// http-file:               "https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css"
```

your bundle script:

```ts
// file: "./bundle_script.ts"

import esbuild from "esbuild"
import { denoPlugins } from "@oazmi/esbuild-plugin-deno"

const entry_points = [
	"./local_path_entry.ts", // this will be resolved and loaded by esbuild natively (although it will initially pass though the `importmap_plugin` resolver)
	"file://" + import.meta.dirname + "/file_uri_entry.ts", // this will be resolved and loaded by the `http_plugin`
	"jsr:@oazmi/kitchensink@^0.9.2/array1d", // this will be resolved by our `jsr_plugin`, and loaded by the `http_plugin`
	"https://2d-lib", // this will bundle via our `globalImportMap` setting inside of the `http_plugin`
	"2d-array-utils", // this will bundle via our `importMap` setting inside of our `importmap_plugin`
	"jsr:@oazmi/kitchensink/struct", // this will be resolved to the latest version of the package by our `jsr_plugin`
	"npm:@oazmi/kitchensink/stringman", // this will be resolved to whatever-is-available-version of the package (in the `node_modules` directory) by our npm-specifier-plugin
	"https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css", // `http_plugin` resolution and loading
].map((path) => ({
	in: path,
	out: "entry-" + path.split("/").at(-1)!.replace(/\..*$/, ""),
}))

const [importmap_plugin, http_plugin, jsr_plugin] = denoPlugins({
	importMap: {
		// notice that the different aliases point to the same resource.
		// however, in bundled code-splitting enabled output, there will be no duplication of this resource.
		"2d-array-utils": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts",
		"https://2d-lib": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts",
	},
})

const result = await esbuild.build({
	absWorkingDir: import.meta.dirname,
	entryPoints: entry_points,
	outdir: "./dist/",
	format: "esm",
	platform: "node", // needed due to dependency on "node:http" in two of the entry point files
	splitting: true,
	bundle: true,
	minifySyntax: true,
	treeShaking: true,
	write: false,
	metafile: true,
	plugins: [importmap_plugin, http_plugin, jsr_plugin],
})

console.log("bundled file list:")
console.log(result.outputFiles.map((v) => (v.path)))
await esbuild.stop()
```

expected resulting bundled list of files:

```txt
bundled file list:
[
	"./dist/entry-local_path_entry.js",
	"./dist/entry-file_uri_entry.js",
	"./dist/chunk-VVE7K4TT.js",
	"./dist/entry-array1d.js",
	"./dist/entry-2d-lib.js",
	"./dist/entry-2d-array-utils.js",
	"./dist/chunk-33JDUUI4.js",
	"./dist/entry-struct.js",
	"./dist/chunk-LPVSUOTJ.js",
	"./dist/chunk-TECORZCN.js",
	"./dist/entry-stringman.js",
	"./dist/chunk-RL3GSOWM.js",
	"./dist/entry-local_path_entry.css",
	"./dist/entry-file_uri_entry.css",
	"./dist/entry-chota.css"
]
```

## What is Deno?

<div style="max-width: min(100%, 384px);">

![deno2](./assets/deno2.svg)
_**Figure A**: A historic sighting of Deno the Dino deprecating its former version._
_Some believe Dino to be the [Lochness monster](https://en.wikipedia.org/wiki/Loch_Ness_Monster)._
_Others think it is an alphabetically sorted occurrence of Node._

</div>
