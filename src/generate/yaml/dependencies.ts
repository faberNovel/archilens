import fs from "node:fs/promises"
import path from "node:path"
import * as YAML from "js-yaml"

import { Dependencies } from "../../engine/dependencies"

export async function writeDependenciesInYaml(
  outputFile: string,
  dependencies: Dependencies[],
): Promise<void> {
  console.log("Writing dependencies in YAML files...")
  const dirname = path.dirname(outputFile)
  const content = new Object(dependencies.map(d => d.asTextDependencies()))
  await fs.access(dirname).catch(() => fs.mkdir(dirname, { recursive: true }))
  await fs.writeFile(outputFile, YAML.dump(content))
}
