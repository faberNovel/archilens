import * as Engine from "../../engine/models"
import { load, loadSync, YamlInput } from "../../utils/yaml"

import { convert } from "../convert"
import * as Import from "../models"

import { parse } from "./parser"
export * from "./parser"

export function importDiagramFromYamlSync(input: YamlInput): Engine.System {
  const raw = loadSync(input)
  const imported: Import.System = parse(raw)
  return convert(imported)
}

export async function importDiagramFromYaml(input: string): Promise<Engine.System> {
  const raw = await load(input)
  const imported: Import.System = parse(raw)
  return convert(imported)
}
