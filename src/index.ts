import YAML from "yaml"
import fs from "fs"
import { fold } from "fp-ts/Either"
import { pipe } from "fp-ts/pipeable"
import { failure as reportFailure } from "io-ts/PathReporter"

import { debug } from "./debug"
import { parseCli } from "./cli"
import { DiagramImport, importDiagram } from "./import"
import { pruneDiagram, PruneOptions } from "./prune"
import { generateDiagram } from "./generator/plantuml"

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
  const pruned = pruneDiagram((options as unknown) as PruneOptions, imported)

  const generated = generateDiagram(options, pruned)
  console.log(generated)
}
main()
