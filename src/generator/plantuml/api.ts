import {
  Diagram,
  Domain,
  Entity,
  isModule,
  Module,
  Resource,
  Zone,
} from "../../models"
import { skinparam, skinparams } from "./common"

export type PlantumlOptions = {}

export const generateResource = (opts: PlantumlOptions) => (
  resource: Resource
): string[] => {
  return [`rectangle "${resource.name}" <<Resource>> as ${resource.id}`]
}

export const generateApi = (opts: PlantumlOptions) => (
  module: Module
): string[] => {
  const part = `rectangle "${module.name}" <<API>> as ${module.id}`
  const resources =
    module.api && module.api.resources.flatMap(generateResource(opts))
  if (!resources) {
    return [part]
  }
  return [`${part} {`, ...resources.map((s) => `  ${s}`), "}"]
}

export const generateEntity = (opts: PlantumlOptions) => (
  entity: Entity
): string[] => {
  if (!isModule(entity)) {
    return []
  }
  return generateApi(opts)(entity)
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

export function generateDiagram(
  opts: PlantumlOptions,
  diagram: Diagram
): string {
  const skinParams = [
    ...skinparam("", skinparams.base),
    ...skinparam("rectangle", skinparams.rectangle),
    ...skinparam("rectangle<<Zone>>", {
      ...skinparams.rectangleZone,
      BackgroundColor: "#DAE8FC",
    }),
    ...skinparam("rectangle<<Domain>>", { BackgroundColor: "#D5E8D4" }),
    ...skinparam("rectangle<<App>>", { BackgroundColor: "#F5F5F5" }),
    ...skinparam("rectangle<<Api>>", { BackgroundColor: "#FFE6CC" }),
    ...skinparam("rectangle<<Resource>>", { BackgroundColor: "#E1D5E7" }),
  ]
  const zones = diagram.zones.flatMap(generateZone(opts))
  return ["@startuml", "", ...skinParams, "", ...zones, "", "@enduml"].join(
    "\n"
  )
}
