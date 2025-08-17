import { cumulativeSum } from "@oazmi/kitchensink"
import { parse as parseJsonc } from "@std/jsonc"
import { build } from "@deno/dnt"
import * as http from "node:http"
import * as https from "node:https"
import { Application } from "typedoc"


const app = await Application.bootstrapWithPlugins()
console.log(build)
console.log(app.componentName)
console.log(http.Agent)
console.log(cumulativeSum([1, 2, 3, 4]))
console.log(parseJsonc(`// file: hello-world.jsonc\n{ "name": "hello", "planet": "world" }`))

export { http, https }

