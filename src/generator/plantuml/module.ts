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
import { skinparam, skinparams } from "./common"

export type PlantumlOptions = {}

const getShapreForComponentType = (componentType: string): string => {
  switch (componentType.toLowerCase()) {
    case "DB":
    case "S3":
      return "database"
    case "KDS":
      return "queue"
    default:
      return "rectangle"
  }
}

export const generateComponent = (opts: PlantumlOptions) => (
  component: Component
): string[] => {
  const shape = getShapreForComponentType(component.type)
  return [
    `${shape} "${component.name}" <<${component.type}>> as ${component.uid}`,
  ]
}

export const generateModule = (opts: PlantumlOptions) => (
  module: Module
): string[] => {
  const part = `rectangle "${module.name}" <<Module>> as ${module.uid}`
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
    case ExternalModuleType.App:
      skin = "App"
      break
    case ExternalModuleType.External:
      skin = "ExternalModule"
      break
    case ExternalModuleType.Legacy:
      skin = "LegacyModule"
      break
    case ExternalModuleType.Platform:
      skin = "Platform"
      break
    default:
      throw new Error(
        `Unknown ExternalModuleType '${module.type}' for module ${module}`
      )
  }
  return [`rectangle "${module.name}" <<${skin}>> as ${module.uid}`]
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
  const part = `rectangle "${domain.name}" <<Domain>> as ${domain.uid}`
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
  const part = `rectangle "${zone.name}" <<Zone>> as ${zone.uid}`
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
  relation: CompleteRelation
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
  const sourceId = relation.sourceId
  const targetId = relation.targetId
  return `${sourceId} ${arrow} ${targetId}${desc}`
}

export function generateDiagram(
  opts: PlantumlOptions,
  diagram: PrunedDiagram
): string {
  const componentSkinparams = diagram.componentTypes.flatMap((ctype) => {
    const shape = getShapreForComponentType(ctype)
    return skinparam(`${shape}<<${ctype}>>`, { BackgroundColor: "#E1D5E7" })
  })

  const skinParams = [
    ...skinparam("", { ...skinparams.base, "'linetype": "ortho" }),
    ...skinparam("rectangle", skinparams.rectangle),
    ...skinparam("rectangle<<Zone>>", {
      ...skinparams.rectangleZone,
      BackgroundColor: "#DAE8FC",
    }),
    ...skinparam("rectangle<<Domain>>", {
      ...skinparams.rectangleDomain,
      BackgroundColor: "#D5E8D4",
    }),
    ...skinparam("rectangle<<App>>", { BackgroundColor: "#F5F5F5" }),
    ...skinparam("rectangle<<ExternalModule>>", { BackgroundColor: "#F5F5F5" }),
    ...skinparam("rectangle<<Platform>>", { BackgroundColor: "#FFF2CB" }),
    ...skinparam("rectangle<<LegacyModule>>", { BackgroundColor: "#F8CECC" }),
    ...skinparam("rectangle<<Module>>", { BackgroundColor: "#FFE6CC" }),
    ...skinparam("queue", { BorderColor: "black" }),

    ...componentSkinparams,
  ]
  const zones = diagram.zones.flatMap(generateZone(opts))
  const relations = diagram.relations.flatMap(generateRelation(opts))
  return [
    "@startuml",
    "",
    ...skinParams,
    "",
    ...zones,
    "",
    ...relations,
    "",
    "@enduml",
  ].join("\n")
}
