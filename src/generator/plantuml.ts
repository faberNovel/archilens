import {
  Component,
  ComponentType,
  Diagram,
  Domain,
  Entity,
  ExternalModule,
  isComponent,
  isDomain,
  isExternalModule,
  isModule,
  isZone,
  Module,
  Part,
  Relation,
  RelationType,
  Zone,
} from "../models"
import { debug } from "../debug"
import { PrunedDiagram, PrunedRelation } from "../prune"

export type PlantumlOptions = {}

export const generateComponent = (opts: PlantumlOptions) => (
  component: Component
): string[] => {
  let declaration: string
  switch (component.type) {
    case ComponentType.APIGW:
      declaration = "rectangle"
      break
    case ComponentType.DB:
      declaration = "database"
      break
    case ComponentType.ECS:
      declaration = "component"
      break
    case ComponentType.KDS:
      declaration = "queue"
      break
    case ComponentType.Lambda:
      declaration = "component"
      break
    case ComponentType.S3:
      declaration = "storage"
      break
    default:
      throw new Error(
        `Unknown type '${component.type}' for component ${component}`
      )
  }
  return [`${declaration} "${component.name}" as ${component.id}`]
}

export const generateModule = (opts: PlantumlOptions) => (
  module: Module
): string[] => {
  const part = `rectangle "${module.name}" as ${module.id}`
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
  return [`rectangle "${module.name}" as ${module.id}`]
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
  const part = `rectangle "${domain.name}" as ${domain.id}`
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
  const part = `rectangle "${zone.name}" as ${zone.id}`
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
  const zones = diagram.zones.flatMap(generateZone(opts))
  const relations = diagram.relations.flatMap(generateRelation(opts))
  return ["@startuml", "", ...zones, "", ...relations, "", "@enduml"].join("\n")
}
