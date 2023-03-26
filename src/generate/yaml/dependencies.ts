import fs from "node:fs/promises"
import path from "node:path"
import * as YAML from "js-yaml"

import { System } from "../../engine/models"
import { computeTextDependencies } from "../../engine/dependencies"

export async function generateDependencies(
  outputFile: string,
  diagram: System,
): Promise<void> {
  console.log("Generating dependencies...")
  const dependencies = computeTextDependencies(diagram)
  const dirname = path.dirname(outputFile)
  await fs.access(dirname).catch(() => fs.mkdir(dirname, { recursive: true }))
  await fs.writeFile(outputFile, YAML.dump(dependencies))
}
