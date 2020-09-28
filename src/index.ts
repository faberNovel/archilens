import YAML from "yaml"
import fs from "fs"
import { fold } from "fp-ts/Either"
import { pipe } from "fp-ts/pipeable"
import { failure as reportFailure } from "io-ts/PathReporter"

import { debug } from "./debug"
import { parseCli } from "./cli"
import { DiagramImport, importDiagram } from "./import"
import { PruneType } from "./prune/index"
import { pruneDiagram as pruneModuleDiagram } from "./prune/module"
import { pruneDiagram as pruneApiDiagram } from "./prune/api"
import { generateDiagram as generateApiDiagram } from "./generator/plantuml/api"
import { generateDiagram as generateModuleDiagram } from "./generator/plantuml/module"

function main(): void {
  const options = parseCli(process.argv)
  const raw = fs.readFileSync(0, "utf-8")
  const content = YAML.parse(raw)
  const parsed: DiagramImport = pipe(
    DiagramImport.decode(content),
    fold(
      (errs) => {
        console.warn(`Errors`, reportFailure(errs))
        process.exit(1)
      },
      (diagram) => diagram
    )
  )
  const imported = importDiagram(parsed)
  debug("options:", options)
  if (options.type === PruneType.Api) {
    debug("Generate API")
    const pruned = pruneApiDiagram(options, imported)
    const generated = generateApiDiagram(options, pruned)
    console.log(generated)
  } else {
    debug("Generate Archi")
    const pruned = pruneModuleDiagram(options, imported)
    const generated = generateModuleDiagram(options, pruned)
    console.log(generated)
  }
}
main()
