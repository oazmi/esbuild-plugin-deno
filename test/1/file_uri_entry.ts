// @ts-nocheck: disable type checking for file since we use import aliases that only our plugin is capable of resolving.

import { meshGrid } from "2d-array-utils" // this is referenced in our plugin's `globalImportMap` setting
import "@local-file-alias" // this local-file alias will be resolved by the "deno.json" file in the current directory
import { transpose2D } from "https://jsr.io/@oazmi/kitchensink/0.9.2/src/numericarray.ts"
import "https://raw.githubusercontent.com/jenil/chota/7d78073/src/chota.css"
import { parse as parseJsonc } from "jsr:@std/jsonc"
import * as http from "node:http"
import * as https from "node:https"
import { cumulativeSum } from "npm:@oazmi/kitchensink@^0.9.5/numericarray"
// import { cumulativeSum } from "npm:@oazmi/kitchensink/numericarray"

console.log("yahaha!", transpose2D([[1], [2], [3]]))
console.log(http.Agent)
console.log(meshGrid([1, 2, 3], [0, -1, -2, -3, -4]), cumulativeSum([1, 2, 3, 4]))
console.log(parseJsonc(`// file: hello-world.jsonc\n{ "name": "hello", "planet": "world" }`))

export { http, https }

