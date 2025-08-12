import { exportA } from "jsr:projA"
import { exportC } from "projC"
// import { exportD } from "jsr:projD@0.1.4" // deno would not permit this nephew import, but our plugin does.


console.log("loaded: \"projB\"")
export const exportB = "an export from \"projB\""
exportA.toUpperCase()
exportB.toUpperCase()
exportC.toUpperCase()
// exportD.toUpperCase()
