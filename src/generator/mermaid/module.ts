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

import { MermaidOptions } from "."

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

const genLink = (opts: MermaidOptions, linkPath: string[]): string[] => {
  if (!opts.links) return []
  const link = 'curPath' in opts.links
    ? path.join(...opts.links.curPath.slice(2).map(() => '..'), ...linkPath)
    : path.join(opts.links.prefix, ...linkPath)
  return [`  click ${linkPath.join('.')} href "${link}${opts.links.suffix}"`]
}

const getIconFromComponentType = (componentType: string): string | undefined => {
  switch (componentType.toLowerCase()) {
    case "apigw": return "fa-shield"
    case "db": return "fa-database"
    case "ecs": return "fa-cubes"
    case "kds": return "fa-barcode"
    case "lambda": return "fa-file-code"
    case "rds": return "fa-database"
    case "s3": return "fa-folder"
    default:
      return undefined
  }
}

export const generateComponent =
  (opts: MermaidOptions, parentPath: string[]) =>
  (component: Component): GenerationResult => {
    const icon = getIconFromComponentType(component.type)
    const path = [...parentPath, component.id]
    return {
      keys: { [component.uid]: path },
      values: [
        `%% uid: ${component.uid}`,
        `${path.join('.')}("${icon ? `fa:${icon}` : ''}&lt;&lt;${component.type}&gt;&gt; ${component.name}")`,
      ],
    }
  }

export const generateModule =
  (opts: MermaidOptions, parentPath: string[]) =>
  (module: Module): GenerationResult => {
    const path = [...parentPath, module.id]
    const { keys: componentsKeys, values: generatedComponents } = flattenGenerationResult(
      module.components.map(generateComponent(opts, path))
    )
    return {
      keys: { ...componentsKeys, [module.uid]: path },
      values: [
        `subgraph ${path.join('.')}["&lt;&lt;Service&gt;&gt; ${module.name}"]`,
        `  %% uid: ${module.uid}`,
        ...genLink(opts, path),
        ...generatedComponents.map((s) => `  ${s}`),
        "end"
      ],
    }
  }

export const generateExternalModule =
  (opts: MermaidOptions, parentPath: string[]) =>
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
    const path = [...parentPath, module.id]
    return {
      keys: { [module.uid]: path },
      values: [
        `subgraph ${path.join('.')}["&lt;&lt;${skin}&gt;&gt; ${module.name}"]`,
        `  %% uid: ${module.uid}`,
        ...genLink(opts, path),
        "end",
      ],
    }
  }

export const generateEntity =
  (opts: MermaidOptions, parentPath: string[]) =>
  (entity: Entity): GenerationResult => {
    if (isModule(entity)) {
      return generateModule(opts, parentPath)(entity)
    }
    if (isComponent(entity)) {
      return generateComponent(opts, parentPath)(entity)
    }
    if (isExternalModule(entity)) {
      return generateExternalModule(opts, parentPath)(entity)
    }
    throw new Error(`Unknown entity type: ${entity}`)
  }

export const generateDomain =
  (opts: MermaidOptions, parentPath: string[]) =>
  (domain: Domain): GenerationResult => {
    const path = [...parentPath, domain.id]
    const { keys: entitiesKeys, values: generatedEntities } = flattenGenerationResult(
      domain.entities.map(generateEntity(opts, path))
    )
    return {
      keys: { ...entitiesKeys, [domain.uid]: path },
      values: [
        `subgraph ${path.join('.')}["&lt;&lt;Domain&gt;&gt; ${domain.name}"]`,
        `  %% uid: ${domain.uid}`,
        ...genLink(opts, path),
        ...generatedEntities.map((s) => `  ${s}`),
        "end",
      ],
    }
  }

export const generateZone =
  (opts: MermaidOptions, parentPath: string[]) =>
  (zone: Zone): GenerationResult => {
    const path = [...parentPath, zone.id]
    const { keys: domainsKeys, values: generatedDomains } = flattenGenerationResult(
      zone.domains.map(generateDomain(opts, path))
    )
    return {
      keys: { ...domainsKeys, [zone.uid]: path },
      values: [
        `subgraph ${path.join('.')}["&lt;&lt;Zone&gt;&gt; ${zone.name}"]`,
        `  %% uid: ${zone.uid}`,
        ...genLink(opts, path),
        ...generatedDomains.map((s) => `  ${s}`),
        "end",
      ],
    }
  }

export const generateRelation =
  (opts: MermaidOptions, keys: Record<string, string[]>) =>
  (relation: CompleteRelation): string => {
    let arrow: string
    switch (relation.type) {
      case RelationType.Ask:
        arrow = "-->"
        break
      case RelationType.Tell:
        arrow = "-.->"
        break
      case RelationType.Listen:
        arrow = "-.->"
        break
      default:
        throw new Error(
          `Unknown relation type '${relation.type}' for relation ${relation}`
        )
    }
    let desc: string = ""
    if (relation.description) {
      desc = `|${relation.description}| `
    }
    const sourceId = relation.type === RelationType.Listen ? keys[relation.targetId].join(".") : keys[relation.sourceId].join(".")
    const targetId = relation.type === RelationType.Listen ? keys[relation.sourceId].join(".") : keys[relation.targetId].join(".")
    return `${sourceId} ${arrow} ${desc}${targetId}`
  }

export function generateDiagram(
  opts: MermaidOptions,
  diagram: PrunedDiagram
): string | undefined {
  const { keys, values: generatedZones } = flattenGenerationResult(
    diagram.zones.map(generateZone(opts, []))
  )
  const relations = diagram.relations.flatMap(generateRelation(opts, keys))
  return generatedZones.length === 0 ? undefined : [
    "%%{init: {'theme': 'base'}}%%",
    "graph TD",
    ...generatedZones.map((s) => `  ${s}`),
    "",
    ...relations.map((s) => `  ${s}`),
  ].join("\n")
}
