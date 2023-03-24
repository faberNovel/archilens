import fs from "node:fs/promises"
import path from "node:path"
import * as YAML from "js-yaml"

import { isModule, Module, System } from "../../engine/models"

export async function generateDependencies(
  outputFile: string,
  diagram: System,
): Promise<void> {
  console.log("Generating dependencies...")
  const modules = [...diagram.parts.values()].filter(isModule)
  const content = Object.fromEntries(
    modules.map((module) => {
      const directDependencies = module
        .directDependencies()
        .map((m) => m.label)
        .sort()
      const indirectDependencies = module
        .indirectDependencies()
        .map((m) => m.label)
        .sort()
      const totalDependencies = [
        ...new Set([...directDependencies, ...indirectDependencies]),
      ].sort()
      const directDependents = module
        .directDependents()
        .map((m) => m.label)
        .sort()
      const indirectDependents = module
        .indirectDependents()
        .map((m) => m.label)
        .sort()
      const totalDependents = [
        ...new Set([...directDependents, ...indirectDependents]),
      ].sort()
      return [
        `${module.label} (${module.uid})`,
        {
          dependencies: {
            direct: directDependencies,
            indirect: indirectDependencies,
            total: totalDependencies,
          },
          dependents: {
            direct: directDependents,
            indirect: indirectDependents,
            total: totalDependents,
          },
        },
      ]
    }),
  )
  const dirname = path.dirname(outputFile)
  await fs.access(dirname).catch(() => fs.mkdir(dirname, { recursive: true }))
  await fs.writeFile(outputFile, YAML.dump(content))
}
