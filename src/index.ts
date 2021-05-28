import Ajv from "ajv"
import fs from "fs"
import p from "path"
import * as yup from "yup"

import { debug } from "./debug"
import { parse, parseSimple } from "./parser"
import { parseCli } from "./cli"
import { DiagramImport, importDiagram } from "./import"
import { pruneDiagram as pruneModuleDiagram } from "./prune/module"
import { pruneDiagram as pruneApiDiagram } from "./prune/api"
import { generateDiagram as generateApiDiagram } from "./generator/plantuml/api"
import { generateDiagram as generateModuleDiagram } from "./generator/plantuml/module"
import { Config, parseConfig, PruneType } from "./config"
import { Diagram } from "./models"

function main(): void {
  const ajv = new Ajv({ verbose: true }) // options can be passed, e.g. {allErrors: true}
  const schema = parse(p.join(__dirname, ".."), "schema.yml")
  const options = parseCli(process.argv)

  const config: Config =
    options.type === "cli" ? options : parseConfig(parseSimple(options.config))

  const content = parse(config.sourceDirectory, config.input)
  const valid = ajv.validate(schema, content)
  if (!valid) {
    const errors = ajv.errors?.map((err) => {
      const data = err.data.uid
        ? { uid: err.data.uid }
        : { data: err.data, path: err.dataPath }
      return {
        error: err.params,
        ...data,
      }
    })
    console.warn(errors)
    process.exit(3)
  }
  const parsed: DiagramImport = DiagramImport.validateSync(content)

  let imported: Diagram
  try {
    imported = importDiagram(parsed)
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      console.warn(e)
      process.exit(3)
    } else {
      throw e
    }
  }

  debug("config:", config)

  config.diagrams.forEach((diagram) => {
    console.error(`Generating ${diagram.output ?? ""}`)
    if (diagram.pruneType === PruneType.Api) {
      const pruned = pruneApiDiagram(diagram.pruneOptions, imported)
      const generated = generateApiDiagram(diagram, pruned)
      if (diagram.output) {
        fs.writeFileSync(diagram.output, generated)
      } else {
        console.log(generated)
      }
    } else {
      const pruned = pruneModuleDiagram(diagram.pruneOptions, imported)
      const generated = generateModuleDiagram(diagram, pruned)
      if (diagram.output) {
        fs.writeFileSync(diagram.output, generated)
      } else {
        console.log(generated)
      }
    }
  })
}
main()
