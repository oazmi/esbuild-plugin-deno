import { throttle } from "@external/1/lambda"


console.log("loaded: \"projD\"")
export const exportD = "an export from \"projD\""
const a = throttle(500, () => { })
a()
