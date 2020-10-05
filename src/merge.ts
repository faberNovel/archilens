import * as YAML from "js-yaml"

import { parseCli } from "./cli"
import { parse } from "./parser"

function main(): void {
  const options = parseCli(process.argv)
  const content = parse(options.sourceDirectory, options.input)
  const merged = YAML.dump(content)
  console.log(merged)
}
main()
