// @ts-nocheck: disable type checking for file since we use import aliases that only our plugin is capable of resolving.

// the "2d-array-utils" alias below will be resolved via our import-map-plugin, instead of the http-plugin,
// since we will be in the local "file" namespace when this file is loaded by esbuild.
import { meshGrid } from "2d-array-utils"
import "@local-file-alias" // this local-file alias will be resolved by the "deno.json" file in the current directory
import { parse as parseJsonc } from "@std/jsonc" // this reference is resolved by our initial-data plugin's `runtimePackage`
import { transpose2D } from "https://jsr.io/@oazmi/kitchensink/0.9.2/src/numericarray.ts"
import "https://raw.githubusercontent.com/jenil/chota/7d78073/src/chota.css"
import { cumulativeSum } from "jsr:@oazmi/kitchensink@~0.9.2/numericarray"
import * as http from "node:http"
import * as https from "node:https"

console.log("yahaha!", transpose2D([[1], [2], [3]]))
console.log(http.Agent)
console.log(meshGrid([1, 2, 3], [0, - 1, -2, -3, -4]), cumulativeSum([1, 2, 3, 4]))
console.log(parseJsonc(`// file: hello-world.jsonc\n{ "name": "hello", "planet": "world" }`))

export { http, https }

