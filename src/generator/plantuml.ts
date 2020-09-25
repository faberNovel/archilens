import {
  Component,
  ComponentType,
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
} from "../models"
import { PrunedDiagram, PrunedRelation } from "../prune"

export type PlantumlOptions = {}

export const generateComponent = (opts: PlantumlOptions) => (
  component: Component
): string[] => {
  let shape
  switch (component.type) {
    case ComponentType.APIGW:
      shape = "rectangle"
      break
    case ComponentType.DB:
      shape = "database"
      break
    case ComponentType.ECS:
      shape = "rectangle"
      break
    case ComponentType.KDS:
      shape = "queue"
      break
    case ComponentType.Lambda:
      shape = "rectangle"
      break
    case ComponentType.S3:
      shape = "database"
      break
    case ComponentType.SNS:
      shape = "rectangle"
      break
  }
  return [
    `${shape} "${component.name}" <<${component.type}>> as ${component.id}`,
  ]
}

export const generateModule = (opts: PlantumlOptions) => (
  module: Module
): string[] => {
  const part = `rectangle "${module.name}" <<Module>> as ${module.id}`
  if (module.components.length === 0) {
    return [part]
  }
  return [
    `${part} {`,
    ...module.components.flatMap(generateComponent(opts)).map((s) => `  ${s}`),
    "}",
  ]
}

export const generateExternalModule = (opts: PlantumlOptions) => (
  module: ExternalModule
): string[] => {
  let skin
  switch (module.type) {
    case ExternalModuleType.Generic:
      skin = "ExternalModule"
      break
    case ExternalModuleType.App:
      skin = "App"
      break
    case ExternalModuleType.Legacy:
      skin = "LegacyModule"
      break
    default:
      throw new Error(
        `Unknown ExternalModuleType '${module.type}' for module ${module}`
      )
  }
  return [`rectangle "${module.name}" <<${skin}>> as ${module.id}`]
}

export const generateEntity = (opts: PlantumlOptions) => (
  entity: Entity
): string[] => {
  if (isModule(entity)) {
    return generateModule(opts)(entity)
  }
  if (isComponent(entity)) {
    return generateComponent(opts)(entity)
  }
  if (isExternalModule(entity)) {
    return generateExternalModule(opts)(entity)
  }
  throw new Error(`Unknown entity type: ${entity}`)
}

export const generateDomain = (opts: PlantumlOptions) => (
  domain: Domain
): string[] => {
  const part = `rectangle "${domain.name}" <<Domain>> as ${domain.id}`
  if (domain.entities.length === 0) {
    return [part]
  }
  return [
    `${part} {`,
    ...domain.entities.flatMap(generateEntity(opts)).map((s) => `  ${s}`),
    "}",
  ]
}

export const generateZone = (opts: PlantumlOptions) => (
  zone: Zone
): string[] => {
  const part = `rectangle "${zone.name}" <<Zone>> as ${zone.id}`
  if (zone.domains.length === 0) {
    return [part]
  }
  return [
    `${part} {`,
    ...zone.domains.flatMap(generateDomain(opts)).map((s) => `  ${s}`),
    "}",
  ]
}

export const generateRelation = (opts: PlantumlOptions) => (
  relation: PrunedRelation
): string => {
  let arrow: string
  switch (relation.type) {
    case RelationType.Ask:
      arrow = "-->"
      break
    case RelationType.Tell:
      arrow = "..>"
      break
    case RelationType.Listen:
      arrow = "<.."
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
  const sourceId = relation.source.id
  const targetId = relation.target.id
  return `${sourceId} ${arrow} ${targetId}${desc}`
}

export function generateDiagram(
  opts: PlantumlOptions,
  diagram: PrunedDiagram
): string {
  const header = `
    skinparam {
      BorderColor black
    }
    skinparam rectangle<<Zone>> {
      BackgroundColor #DAE8FC
    }
    skinparam rectangle<<Domain>> {
      BackgroundColor #D5E8D4
    }
    skinparam rectangle<<Module>> {
      BackgroundColor #FFE6CC
    }
    skinparam rectangle<<ExternalModule>> {
      BackgroundColor #F5F5F5
    }
    skinparam rectangle<<App>> {
      BackgroundColor #F5F5F5
    }
    skinparam rectangle<<LegacyModule>> {
      BackgroundColor #F8CECC
    }
    skinparam rectangle<<ECS>> {
      BackgroundColor #E1D5E7
    }
    skinparam rectangle<<Lambda>> {
      BackgroundColor #E1D5E7
    }
    skinparam database<<DB>> {
      BackgroundColor #E1D5E7
    }
    skinparam queue {
      BorderColor black
    }
    skinparam queue<<KDS>> {
      BackgroundColor #E1D5E7
    }
    skinparam database<<S3>> {
      BackgroundColor #E1D5E7
    }
    skinparam rectangle<<APIGW>> {
      BackgroundColor #E1D5E7
    }
    skinparam rectangle<<SNS>> {
      BackgroundColor #E1D5E7
    }
  `
  const zones = diagram.zones.flatMap(generateZone(opts))
  const relations = diagram.relations.flatMap(generateRelation(opts))
  return [
    "@startuml",
    "",
    header,
    "",
    ...zones,
    "",
    ...relations,
    "",
    "@enduml",
  ].join("\n")
}
