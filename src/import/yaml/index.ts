import * as Engine from "../../engine/models"
import { load, YamlInput } from "../../utils/yaml"

import { convert } from "../convert"
import * as Import from "../models"

import { parse } from "./parser"
export * from "./parser"

export function importDiagramFromYaml(input: YamlInput): Engine.System {
  const raw = load(input)
  const imported: Import.System = parse(raw)
  return convert(imported)
}
