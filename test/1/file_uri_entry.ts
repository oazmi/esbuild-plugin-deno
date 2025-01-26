import { meshGrid } from "2d-array-utils" // this is referenced in our plugin's `globalImportMap` setting
import { transpose2D } from "https://jsr.io/@oazmi/kitchensink/0.9.2/src/numericarray.ts"
import "https://raw.githubusercontent.com/jenil/chota/7d780731421fc987d8f7a1c8f66c730d8573684c/src/chota.css"
import * as http from "node:http"
import * as https from "node:https"

console.log("yahaha!", transpose2D([[1], [2], [3]]))
console.log(http.Agent)
console.log(meshGrid([1, 2, 3], [0, - 1, -2, -3, -4]))

export { http, https }

