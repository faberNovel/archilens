import { toId } from "../../helpers"
import {
  Api,
  Diagram,
  Domain,
  Entity,
  isModule,
  Module,
  Resource,
  Zone,
} from "../../models"

import { D2Options } from "."

export const generateResource =
  (opts: D2Options) =>
  (resource: Resource): string[] => {
    return [`${resource.id}: "<<Resource>> ${resource.name}"`]
  }

export const generateApi =
  (opts: D2Options) =>
  (module: Module, api: Api): string[] => {
    const name = api.name ?? module.name
    const part = `${module.id}: "<<${api.type}>> ${name}"`
    const resources = api.resources.flatMap(generateResource(opts))
    if (!resources) {
      return [part]
    }
    return [`${part} {`, ...resources.map((s) => `  ${s}`), "}"]
  }

export const generateModuleApis =
  (opts: D2Options) =>
  (module: Module): string[] => {
    return module.apis.flatMap((api) => generateApi(opts)(module, api))
  }

export const generateEntity =
  (opts: D2Options) =>
  (entity: Entity): string[] => {
    if (!isModule(entity)) {
      return []
    }
    return generateModuleApis(opts)(entity)
  }

export const generateDomain =
  (opts: D2Options) =>
  (domain: Domain): string[] => {
    const part = `${domain.id}: "<<Domain>> ${domain.name}"`
    if (domain.entities.length === 0) {
      return [part]
    }
    return [
      `${part} {`,
      ...domain.entities.flatMap(generateEntity(opts)).map((s) => `  ${s}`),
      "}",
    ]
  }

export const generateZone =
  (opts: D2Options) =>
  (zone: Zone): string[] => {
    const part = `${zone.id}: "<<Zone>> ${zone.name}"`
    if (zone.domains.length === 0) {
      return [part]
    }
    return [
      `${part} {`,
      ...zone.domains.flatMap(generateDomain(opts)).map((s) => `  ${s}`),
      "}",
    ]
  }

export function generateDiagram(
  opts: D2Options,
  diagram: Diagram
): string {
  const zones = diagram.zones.flatMap(generateZone(opts))
  return zones.join("\n")
}
