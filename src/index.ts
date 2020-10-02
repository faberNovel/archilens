import p from "path"
import fs from "fs"

import * as YAML from "js-yaml"
import * as yup from "yup"

import { debug } from "./debug"
import { parseCli, PruneType } from "./cli"
import { DiagramImport, importDiagram } from "./import"
import { pruneDiagram as pruneModuleDiagram } from "./prune/module"
import { pruneDiagram as pruneApiDiagram } from "./prune/api"
import { generateDiagram as generateApiDiagram } from "./generator/plantuml/api"
import { generateDiagram as generateModuleDiagram } from "./generator/plantuml/module"

type IncludeFileOpts = {
  rootDir: string
  srcDir: string
}
const IncludeFileOpts = (rootDir: string) => ({ rootDir, srcDir: rootDir })
const YamlIncludeFileType = (opts: IncludeFileOpts): YAML.Type =>
  new YAML.Type("tag:yaml.org,2002:inc/file", {
    kind: "scalar",
    resolve: (data: unknown) => typeof data === "string",
    construct: (filepath) => {
      const dirname = p.dirname(filepath)
      const filename = p.basename(filepath)
      const srcDir = p.isAbsolute(filename)
        ? p.normalize(opts.rootDir + dirname)
        : p.join(opts.srcDir, dirname)
      const value = parseYaml({ ...opts, srcDir }, filename)
      debug(`${filepath} => `, value)
      return value
    },
  })
const YamlIncludeFileSchema = (opts: IncludeFileOpts) =>
  YAML.Schema.create(YamlIncludeFileType(opts))
const parseYaml = (opts: IncludeFileOpts, path?: string) => {
  const src = fs.readFileSync(path ? p.join(opts.srcDir, path) : 0, "utf8")
  return YAML.safeLoad(src, {
    schema: YamlIncludeFileSchema(opts),
    filename: path ?? "stdin",
  })
}

function main(): void {
  const options = parseCli(process.argv)
  const content = parseYaml(
    IncludeFileOpts(options.sourceDirectory),
    options.input
  )
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
