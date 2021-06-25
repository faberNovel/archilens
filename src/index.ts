import Ajv from "ajv"
import fs from "fs"
import p from "path"
import * as yup from "yup"

import { debug } from "./debug"
import { parse, parseSimple } from "./parser"
import { parseCli } from "./cli"
import { DiagramImport, importDiagram } from "./importer/yaml"
import { pruneDiagram as pruneModuleDiagram } from "./prune/module"
import { pruneDiagram as pruneApiDiagram } from "./prune/api"
import { generateDiagram as generateApiDiagram } from "./generator/plantuml/api"
import { generateDiagram as generateModuleDiagram } from "./generator/plantuml/module"
import { Config, parseConfig, PruneType } from "./config"
import { Diagram } from "./models"
import { importFromNotion } from "./importer/notion"

async function main(): Promise<void> {
  const ajv = new Ajv({ verbose: true }) // options can be passed, e.g. {allErrors: true}
  const options = parseCli(process.argv)

  const config: Config =
    options.type === "cli" ? options : parseConfig(parseSimple(options.config))
  debug("config:", config)

  let diagram: Diagram
  if (config.input.configType === 'YAML') {
    const content = parse(config.input.sourceDirectory, config.input.rootFile)
    const schema = parse(p.join(__dirname, "importer/yaml"), "schema.yml")
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

    try {
      diagram = importDiagram(parsed)
    } catch (e) {
      if (e instanceof yup.ValidationError) {
        console.warn(e)
        process.exit(3)
      } else {
        throw e
      }
    }
  } else {
    diagram = await importFromNotion(config.input)
  }

  config.diagrams.forEach((diagramConfig) => {
    console.error(`Generating ${diagramConfig.output ?? ""}`)
    if (diagramConfig.pruneType === PruneType.Api) {
      const pruned = pruneApiDiagram(diagramConfig.pruneOptions, diagram)
      const generated = generateApiDiagram(diagramConfig, pruned)
      if (diagramConfig.output) {
        fs.writeFileSync(diagramConfig.output, generated)
      } else {
        console.log(generated)
      }
    } else {
      const pruned = pruneModuleDiagram(diagramConfig.pruneOptions, diagram)
      const generated = generateModuleDiagram(diagramConfig, pruned)
      if (diagramConfig.output) {
        fs.writeFileSync(diagramConfig.output, generated)
      } else {
        console.log(generated)
      }
    }
  })
}
main()
