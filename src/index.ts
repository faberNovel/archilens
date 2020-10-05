import * as yup from "yup"

import { debug } from "./debug"
import { parse } from "./parser"
import { parseCli, PruneType } from "./cli"
import { DiagramImport, importDiagram } from "./import"
import { pruneDiagram as pruneModuleDiagram } from "./prune/module"
import { pruneDiagram as pruneApiDiagram } from "./prune/api"
import { generateDiagram as generateApiDiagram } from "./generator/plantuml/api"
import { generateDiagram as generateModuleDiagram } from "./generator/plantuml/module"

import Ajv from "ajv"
import p from "path"
import fs from "fs"
import * as YAML from "js-yaml"

function main(): void {
  const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
  const schema = parse(p.join(__dirname, ".."), "schema.yml")
  const options = parseCli(process.argv)
  const content = parse(options.sourceDirectory, options.input)
  const valid = ajv.validate(schema, content)
  if (!valid) {
    console.warn(ajv.errors)
    process.exit(3)
  }
  const parsed: DiagramImport = DiagramImport.validateSync(content)
  try {
    const imported = importDiagram(parsed)
    debug("options:", options)
    if (options.pruneType === PruneType.Api) {
      debug("Generate API")
      const pruned = pruneApiDiagram(options.pruneOptions, imported)
      const generated = generateApiDiagram(options, pruned)
      console.log(generated)
    } else {
      debug("Generate Archi")
      const pruned = pruneModuleDiagram(options.pruneOptions, imported)
      const generated = generateModuleDiagram(options, pruned)
      console.log(generated)
    }
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      console.warn(e)
    } else {
      throw e
    }
  }
}
main()
