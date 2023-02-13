import Ajv from "ajv"
import fs from "fs"
import path from "path"
import * as yup from "yup"

import { debug } from "./debug"
import { parse, parseSimple } from "./parser"
import { parseCli } from "./cli"
import { DiagramImport, importDiagram } from "./importer/yaml"
import { pruneDiagram as pruneModuleDiagram } from "./prune/module"
import { pruneDiagram as pruneApiDiagram } from "./prune/api"
import { D2Options } from "./generator/d2"
import { generateDiagram as generateMermaidApiDiagram } from "./generator/mermaid/api"
import { generateDiagram as generateMermaidModuleDiagram } from "./generator/mermaid/module"
import { generateDiagram as generateD2ApiDiagram } from "./generator/d2/api"
import { generateDiagram as generateD2ModuleDiagram } from "./generator/d2/module"
import { Config, DiagramConfig, parseConfig, pruneLevel, PruneType } from "./config"
import { AllRelationTypes, Diagram, isModule, RelationType } from "./models"
import { getNotionClient, importFromNotion } from "./importer/notion"
import { PruneLevel, PruneOptions } from "./prune"

export const getConfig = (): Config => {
  const options = parseCli(process.argv)

  const config: Config =
    options.type === "cli" ? options : parseConfig(parseSimple(options.config))

  return config
}

async function main(): Promise<void> {
  const ajv = new Ajv({ verbose: true }) // options can be passed, e.g. {allErrors: true}

  const config = getConfig()
  debug("config:", JSON.stringify(config))

  let diagram: Diagram
  if (config.input.configType === "YAML") {
    const content = parse(config.input.sourceDirectory, config.input.rootFile)
    const schema = parse(path.join(__dirname, "importer/yaml"), "schema.yml")
    const valid = ajv.validate(schema, content)
    if (!valid) {
      const errors = ajv.errors?.map((err: any) => {
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
    diagram = await importFromNotion({ config: config.input, client: getNotionClient() })
  }

  const generateDiagram = (diagramConfig: DiagramConfig, genOptions: D2Options) => {
    console.error(`Generating ${diagramConfig.output ?? ""}`)
    if (diagramConfig.pruneType === PruneType.Api) {
      const pruned = pruneApiDiagram(diagramConfig.pruneOptions, diagram)
      const generated = generateD2ApiDiagram(genOptions, pruned)
      if (diagramConfig.output) {
        fs.mkdirSync(path.dirname(diagramConfig.output), { recursive: true })
        fs.writeFileSync(diagramConfig.output, generated)
      } else {
        console.log(generated)
      }
    } else {
      const pruned = pruneModuleDiagram(diagramConfig.pruneOptions, diagram)
      const generated = generateD2ModuleDiagram(genOptions, pruned)
      if (diagramConfig.output) {
        if (generated) {
          fs.mkdirSync(path.dirname(diagramConfig.output), { recursive: true })
          fs.writeFileSync(diagramConfig.output, generated)
        }
      } else {
        if (generated) {
        console.log(generated)
        } else {
          console.warn("No diagram generated")
        }
      }
    }
  }

  if (config.hld) {
    const ext = config.hld.extension
    const baseOutput: string = config.hld.output.replace(/\$(PWD|\{PWD\})/g, process.env.PWD ?? '')
    const genOptions = (curPath: string[]): D2Options => {
      if (!config.hld?.links) return {}
      const suffix = config.hld.links?.suffix?.replace(/\$(PWD|\{PWD\})/g, process.env.PWD ?? '')
      const links = config.hld.links.prefix
        ? { prefix: config.hld.links.prefix.replace(/\$(PWD|\{PWD\})/g, process.env.PWD ?? ''), suffix }
        : { curPath, suffix }
      return { links }
    }
    const gen = (output: string[], options: Partial<PruneOptions>) => {
      generateDiagram({
        output: path.join(baseOutput, ...output),
        pruneType: PruneType.Architecture,
        pruneOptions: PruneOptions(options),
      }, genOptions(output))
    }
    gen(['hld', `index.${ext}`], {
      level: PruneLevel.Domain,
      reverseRelationTypes: AllRelationTypes,
    })
    diagram.zones.forEach(zone => {
      gen(['hld', `${zone.id}.${ext}`], {
        open: [zone.uid, ...zone.domains.map(d => d.uid)],
      })
      zone.domains.forEach(domain => {
        gen(['hld', zone.id, `${domain.id}.${ext}`], {
          reverseRelationTypes: AllRelationTypes,
          relationLevel: PruneLevel.Module,
          open: [domain.uid],
          focus: domain.entities.map(e => e.uid),
        })
        domain.entities.forEach(entity => {
          if (isModule(entity)) {
            gen(['hld', zone.id, domain.id, `${entity.id}.${ext}`], {
              reverseRelationTypes: AllRelationTypes,
              relationLevel: PruneLevel.Component,
              open: [entity.uid],
            })
          } else {
            gen(['hld', zone.id, domain.id, `${entity.id}.${ext}`], {
              reverseRelationTypes: AllRelationTypes,
              relationLevel: PruneLevel.Component,
              open: [entity.uid],
              focus: [entity.uid],
            })
          }
        })
      })
    })
  }

  config.diagrams.forEach(d => generateDiagram(d, {}))
}
main()
