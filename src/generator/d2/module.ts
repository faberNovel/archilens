import path from 'path'

import {
  CompleteRelation,
  Component,
  Domain,
  Entity,
  ExternalModule,
  ExternalModuleType,
  isComponent,
  isExternalModule,
  isModule,
  Module,
  RelationType,
  Zone,
} from "../../models"
import { PrunedDiagram } from "../../prune/module"

import { D2Options } from "."

type GenerationResult = {
  keys: Record<string, string[]>
  values: string[]
}
function flattenGenerationResult(results: GenerationResult[]): GenerationResult {
  return results.reduce(
    (acc, result) => ({
      keys: { ...acc.keys, ...result.keys },
      values: [...acc.values, ...result.values],
    }),
    { keys: {}, values: [] }
  )
}

const genLink = (opts: D2Options, linkPath: string[]): string[] => {
  if (!opts.links) return []
  const link = 'curPath' in opts.links
    ? path.join(...opts.links.curPath.slice(2).map(() => '..'), ...linkPath)
    : path.join(opts.links.prefix,...linkPath)
  return [`  link: ${link}${opts.links.suffix}`]
}

const getIconFromComponentType = (componentType: string): string | undefined => {
  switch (componentType.toLowerCase()) {
    case "apigw": return "https://icons.terrastruct.com/aws%2FMobile%2FAmazon-API-Gateway.svg"
    case "db": return "https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS.svg"
    case "ecs": return "https://icons.terrastruct.com/aws%2FCompute%2FAmazon-Elastic-Container-Service.svg"
    case "kds": return "https://icons.terrastruct.com/aws%2FAnalytics%2FAmazon-Kinesis-Data-Streams.svg"
    case "lambda": return "https://icons.terrastruct.com/aws%2FCompute%2FAWS-Lambda.svg"
    case "rds": return "https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS.svg"
    case "s3": return "https://icons.terrastruct.com/aws%2FStorage%2FAmazon-Simple-Storage-Service-S3.svg"
    default:
      return undefined
  }
}

export const generateComponent =
  (opts: D2Options, diagram: PrunedDiagram, parentPath: string[]) =>
  (component: Component): GenerationResult => {
    const icon = getIconFromComponentType(component.type)
    const part = `${component.id}: "<<${component.type}>> ${component.name}"`
    const path = [...parentPath, component.id]
    return {
      keys: { [component.uid]: path },
      values: [
        `${part} {`,
        `  # uid: ${component.uid}`,
        ...(diagram.selected.has(component.uid) ? ['  style.bold: true', `  style.fill: "#ebfdf7"`] : []),
        ...(icon ? ['  shape: image', `  icon: ${icon}`] : []),
        "}"
      ],
    }
  }

export const generateModule =
  (opts: D2Options, diagram: PrunedDiagram, parentPath: string[]) =>
  (module: Module): GenerationResult => {
    const part = `${module.id}: "<<Service>> ${module.name}"`
    const path = [...parentPath, module.id]
    const { keys: componentsKeys, values: generatedComponents } = flattenGenerationResult(
      module.components.map(generateComponent(opts, diagram, path))
    )
    return {
      keys: { ...componentsKeys, [module.uid]: path },
      values: [
        `${part} {`,
        `  # uid: ${module.uid}`,
        ...(diagram.selected.has(module.uid) ? ['  style.bold: true', `  style.fill: "#ebfdf7"`] : []),
        ...genLink(opts, path),
        ...generatedComponents.map((s) => `  ${s}`),
        "}"
      ],
    }
  }

export const generateExternalModule =
  (opts: D2Options, diagram: PrunedDiagram, parentPath: string[]) =>
  (module: ExternalModule): GenerationResult => {
    let skin
    switch (module.type) {
      case ExternalModuleType.App:
        skin = "App"
        break
      case ExternalModuleType.External:
        skin = "ExternalService"
        break
      case ExternalModuleType.Legacy:
        skin = "LegacyService"
        break
      case ExternalModuleType.Platform:
        skin = "Platform"
        break
      default:
        throw new Error(
          `Unknown ExternalModuleType '${module.type}' for module ${module}`
        )
    }
    const part = `${module.id}: "<<${skin}>> ${module.name}"`
    const path = [...parentPath, module.id]
    return {
      keys: { [module.uid]: path },
      values: [
        `${part} {`,
        `  # uid: ${module.uid}`,
        ...(diagram.selected.has(module.uid) ? ['  style.bold: true', `  style.fill: "#ebfdf7"`] : []),
        ...genLink(opts, path),
        "}",
      ],
    }
  }

export const generateEntity =
  (opts: D2Options, diagram: PrunedDiagram, parentPath: string[]) =>
  (entity: Entity): GenerationResult => {
    if (isModule(entity)) {
      return generateModule(opts, diagram, parentPath)(entity)
    }
    if (isComponent(entity)) {
      return generateComponent(opts, diagram, parentPath)(entity)
    }
    if (isExternalModule(entity)) {
      return generateExternalModule(opts, diagram, parentPath)(entity)
    }
    throw new Error(`Unknown entity type: ${entity}`)
  }

export const generateDomain =
  (opts: D2Options, diagram: PrunedDiagram, parentPath: string[]) =>
  (domain: Domain): GenerationResult => {
    const part = `${domain.id}: "<<Domain>> ${domain.name}"`
    const path = [...parentPath, domain.id]
    const { keys: entitiesKeys, values: generatedEntities } = flattenGenerationResult(
      domain.entities.map(generateEntity(opts, diagram, path))
    )
    return {
      keys: { ...entitiesKeys, [domain.uid]: path },
      values: [
        `${part} {`,
        `  # uid: ${domain.uid}`,
        ...(diagram.selected.has(domain.uid) ? ['  style.bold: true', `  style.fill: "#a7e2d0"`] : []),
        ...genLink(opts, path),
        ...generatedEntities.map((s) => `  ${s}`),
        "}",
      ],
    }
  }

export const generateZone =
  (opts: D2Options, diagram: PrunedDiagram, parentPath: string[]) =>
  (zone: Zone): GenerationResult => {
    const part = `${zone.id}: "<<Zone>> ${zone.name}"`
    const path = [...parentPath, zone.id]
    const { keys: domainsKeys, values: generatedDomains } = flattenGenerationResult(
      zone.domains.map(generateDomain(opts, diagram, path))
    )
    return {
      keys: { ...domainsKeys, [zone.uid]: path },
      values: [
        `${part} {`,
        `  # uid: ${zone.uid}`,
        ...(diagram.selected.has(zone.uid) ? ['  style.bold: true', `  style.fill: "#49bc99"`] : []),
        ...genLink(opts, path),
        ...generatedDomains.map((s) => `  ${s}`),
        "}",
      ],
    }
  }

export const generateRelation =
  (opts: D2Options, diagram: PrunedDiagram, keys: Record<string, string[]>) =>
  (relation: CompleteRelation): string => {
    let arrow: string
    let custom: string = ''
    switch (relation.type) {
      case RelationType.Ask:
        arrow = "->"
        break
      case RelationType.Tell:
        arrow = "->"
        custom = '{ style.stroke-dash: 1 }'
        break
      case RelationType.Listen:
        arrow = "<-"
        custom = '{ style.stroke-dash: 3; style.animated: true }'
        break
      default:
        throw new Error(
          `Unknown relation type '${relation.type}' for relation ${relation}`
        )
    }
    let desc: string = ""
    if (relation.description) {
      desc = ` : ${relation.description}`
    }
    const sourceId = keys[relation.sourceId].join(".")
    const targetId = keys[relation.targetId].join(".")
    const sep = desc && custom ? " : " : " "
    return `${sourceId} ${arrow} ${targetId}${desc}${sep}${custom}`
  }

export function generateDiagram(
  opts: D2Options,
  diagram: PrunedDiagram
): string {
  const { keys, values: generatedZones } = flattenGenerationResult(
    diagram.zones.map(generateZone(opts, diagram, []))
  )
  const relations = diagram.relations.flatMap(generateRelation(opts, diagram, keys))
  return [
    ...generatedZones,
    "",
    ...relations,
  ].join("\n")
}