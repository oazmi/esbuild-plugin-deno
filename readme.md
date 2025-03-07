# @oazmi/esbuild-plugin-deno

A suite of multi-purpose esbuild plugins for bundling libraries and web-apps with Deno, Node, or Bun.
It is capable of resolving `file://`, `http://`, `https://`, `jsr:`, and `npm:` specifiers, in addition to supporting global `importMap`s, initial `pluginData` injection, and path pre-resolution.
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
  ~~The way it works is what it "unresolves" its internal namespaces, and queries other plugins (and esbuild's native resolver) to try and resolve the path first, before trying to do so itself.~~
  > TODO: update description, since it is no longer entirely true, as I now use a central pipeline of resolvers,
  > and the entry-plugin needs to redirect everything to it first for pre-resolution.
- Uses web-compatible APIs only (with the exception of `Deno.cwd()` or `process.cwd()`, that is otherwise replaced by a stub function on the web).

## Downsides

- Since this library does not utilize Deno's cache, nor does it take advantage of its semantic-versioning resolver (to figure out the best package version), bundling will probably likely take longer, and not speed up across successive builds.
  (maybe I'll add a file caching mechanism in the future, but that'll require filesystem write access, which isn't practical for web-portability)
- for npm-packages (whether or not you use the `npm:` specifier), you will currently need to install the packages to your project's `./node_modules/` folder, either via `npm install`, or `deno install` with `"nodeModulesDir": "auto"` enabled in your `./deno.json` file.
  I will be adding an auto-install feature in the future, but it will require filesystem write access,
  since [npmjs.org](http://registry.npmjs.org/) only distributes tarballs, instead of individual fetchable files,
  like the way [jsr.io](https://jsr.io/) does.

## Plugins featured

- {@link "mod"!entryPlugin}: provides `pluginData` to all entry-points and their dependencies,
  in addition to pre-resolving all paths implicitly through the {@link "mod"!resolverPlugin}.
- {@link "mod"!httpPlugin}: provides `http://`, `https://`, and `file://` path-resolving and resource-fetching loader.
- {@link "mod"!jsrPlugin}: provides a `jsr:` to `https://jsr.io/` path-resolver.
- {@link "mod"!npmPlugin}: provides a resolver that strips away `npm:` specifier prefixes,
  so that package-resources can be obtained from your `./node_modules/` folder.
- {@link "mod"!resolverPlugin}: a namespaced plugin that provides the backbone pipeline for resolving the paths of all of the plugins above.
- {@link "mod"!denoPlugins}: cumulation of the five plugins above, so that you can bundle code that deno natively understands, free of hassles.

## Documentation and other links

- documentation page: [https://oazmi.github.io/esbuild-plugin-deno](https://oazmi.github.io/esbuild-plugin-deno/).
- jsr release page: [https://jsr.io/@oazmi/esbuild-plugin-deno](https://jsr.io/@oazmi/esbuild-plugin-deno/).
- npm release page: [https://www.npmjs.com/package/@oazmi/esbuild-plugin-deno](https://www.npmjs.com/package/@oazmi/esbuild-plugin-deno/).
- github repository: [https://github.com/oazmi/esbuild-plugin-deno](https://github.com/oazmi/esbuild-plugin-deno/).

## Installation

- for deno: `deno add jsr:@oazmi/esbuild-plugin-deno`
- for node: `npm install @oazmi/esbuild-plugin-deno --save-dev`

## Example

entry point 1:

```ts
// file: "./file_uri_entry.ts"

import { meshGrid } from "2d-array-utils" // this alias will be resolved by the resolver-plugin's `globalImportMap` setting
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

import { meshGrid } from "2d-array-utils" // this alias will be resolved by the resolver-plugin's `globalImportMap` setting
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

additional remote entry points, 3 to 8:

```ts
// jsr-file version range:  "jsr:@oazmi/kitchensink@^0.9.2/array1d"
// fake-http-alias:         "https://2d-lib"
// importmap-alias:         "2d-array-utils"
// jsr-file latest version: "jsr:@oazmi/kitchensink/struct"
// npm-file any version:    "npm:@oazmi/kitchensink/stringman"
// http-file:               "https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css"
// npm-library with deps:   "npm:d3-brush@3.0.0"
```

your bundle script:

```ts
// file: "./bundle_script.ts"

import esbuild from "esbuild"
import { denoPlugins } from "@oazmi/esbuild-plugin-deno"

const entry_points = [
	"./local_path_entry.ts", // this will be loaded by esbuild natively (although it will initially pass though the `entry_plugin`'s resolver pipeline)
	"file://" + import.meta.dirname + "/file_uri_entry.ts", // this will be resolved and loaded by our `http_plugin`
	"jsr:@oazmi/kitchensink@^0.9.2/array1d", // this will be resolved by our `jsr_plugin`, and loaded by the `http_plugin`
	"https://2d-lib", // this will bundle via our `importMap` setting inside of the `entry_plugin`'s `initialPluginData`
	"2d-array-utils", // this will bundle via our `globalImportMap` setting inside of our `resolvers_pipeline_plugin`
	"jsr:@oazmi/kitchensink/struct", // this will be resolved to the latest version of the package by our `jsr_plugin`
	"npm:@oazmi/kitchensink/stringman", // this will be resolved to whatever-is-available-version of the package (in the `node_modules` directory) by our `npm_plugin`
	"https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css", // `http_plugin` resolution and loading
	"npm:d3-brush@3.0.0", // this will be auto-installed by our `npm_plugin`, without modifying/creating a "package.json" file.
].map((path) => ({
	in: path,
	out: "entry-" + path.replace(/^npm\:/, "").split("/").at(-1)!.replace(/\..*$/, ""),
}))

const [entry_plugin, http_plugin, jsr_plugin, npm_plugin, resolver_pipeline_plugin] = denoPlugins({
	// notice that the different aliases in `globalImportMap` and `pluginData.importMap` point to the same resource.
	// however, in bundled code-splitting enabled output, there will be no duplication of this resource.
	globalImportMap: { "2d-array-utils": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts" },
	pluginData: {
		// (optional) provide the path to your "deno.json" file, relative to esbuild's `absWorkingDir` build-option.
		// if `absWorkingDir` is unavailable, then it will be resolved relative to `Deno.cwd()`.
		runtimePackage: "./deno.json",
		// here, we specify that we do not wish to allow node-path-resolution by default at the top level.
		// however, once we enter an npm-package's scope through the use of the `"npm:"` specifier in the import,
		// the switch will be flicked to `true`, and all of that package's imports will utilize node-path-resolution.
		// we leave it off initially for deno projects, since the usage of npm-specifiers is the norm,
		// but for node projects, leave it enabled (which is the default by the way).
		// the downside of it being enabled is that your filesystem will be read for resolving each resource's path (which is slow).
		resolverConfig: { useNodeModules: false },
		// this import-map only lingers around at the top-level scope.
		// once this plugin traverses into the domain of another self-contained package (such as an npm/jsr-package),
		// then this import-map will be cleared. (i.e. it will not affect other packages' scopes)
		importMap: { "https://2d-lib": "https://jsr.io/@oazmi/kitchensink/0.9.2/src/array2d.ts" },
	},
	// enabling logging will let you see which resources are being resolved, and what their resolved path is.
	log: true,
	// auto-install npm-packages that have not been cached into a local "./node_modules/" directory.
	autoInstall: true,
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
	plugins: [entry_plugin, http_plugin, jsr_plugin, npm_plugin, resolver_pipeline_plugin],
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
	"./dist/entry-d3-brush@3.0.js",
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

Eons ago, when man relied on `require` statements, and chanted `"use-strict"` to ward off chaos;
modules were tangled, compatibility was bound to localhost, lock files were an afterthought,
and non-asynchronicity lead to a maddening proliferation of child-processes.

For 5000 years, no one dared to envision an alternate runtime, grounded in simplicity.

It was never to happen, and for 5000 years, it never did.

Until one fateful day, the mastermind behind Nodejs rewrote the rules,
discarding legacy quirks that had plagued generations.

It was never meant to happen, but after 5000 years, it did.

Emerging from the universal pool of developer tears came a new runtime named Deno.
And with it began the ~~Shadow Games~~ Runtime Wars.

<div style="max-width: min(100%, 384px);">

![deno2](./assets/deno2.svg)
_**Figure A**: A historic sighting of Deno the Dino deprecating its former version._
_Some believe Dino to be the [Lochness monster](https://en.wikipedia.org/wiki/Loch_Ness_Monster)._
_Others think it is an alphabetically sorted occurrence of Node._

</div>
