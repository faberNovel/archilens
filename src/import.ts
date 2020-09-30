import * as t from "io-ts"

import {
  Component,
  Diagram,
  Domain,
  Entity,
  ExternalModule,
  ExternalModuleType,
  getExternalModuleTypeOrFail,
  getRelationTypeOrFail,
  Module,
  PartType,
  Relation,
  RelationType,
  Resource,
  Zone,
} from "./models"

export const RelationImport = t.intersection(
  [
    t.type({
      target: t.string,
    }),
    t.partial({
      rtype: t.string,
      reverse: t.boolean,
      description: t.string,
    }),
  ],
  "RelationImport"
)
export type RelationImport = t.TypeOf<typeof RelationImport>

export const importRelation = (opts: RelationImport): Relation => {
  return {
    targetId: opts.target,
    type: opts.rtype ? getRelationTypeOrFail(opts.rtype) : RelationType.Ask,
    description: opts.description,
  }
}

export const ComponentImport = t.intersection(
  [
    t.type({
      id: t.string,
      ctype: t.string,
    }),
    t.partial({
      name: t.string,
      relations: t.array(RelationImport),
    }),
  ],
  "ComponentImport"
)
export type ComponentImport = t.TypeOf<typeof ComponentImport>

export const importComponent = (ctypes: string[]) => (
  component: ComponentImport
): Component => {
  if (!ctypes.includes(component.ctype)) {
    throw new Error(
      `Invalid component type '${component.ctype}' in component ${component}`
    )
  }
  return {
    partType: PartType.Component,
    id: component.id,
    name: component.name ?? component.id,
    type: component.ctype,
    relations: component.relations?.map(importRelation) ?? [],
  }
}

export const ResourceImport = t.intersection(
  [
    t.type({
      id: t.string,
    }),
    t.partial({
      name: t.string,
    }),
  ],
  "Resource"
)
export type ResourceImport = t.TypeOf<typeof ResourceImport>

export const importResource = (opts: ResourceImport): Resource => {
  return {
    id: opts.id,
    name: opts.name ?? opts.id,
  }
}

export const ModuleImport = t.intersection(
  [
    t.type({
      id: t.string,
    }),
    t.partial({
      name: t.string,
      components: t.array(ComponentImport),
      api: t.boolean,
      resources: t.array(ResourceImport),
    }),
  ],
  "ModuleImport"
)
export type ModuleImport = t.TypeOf<typeof ModuleImport>

export const importModule = (ctypes: string[]) => (
  module: ModuleImport
): Module => {
  const api = (
    module.api !== undefined ? module.api : module.resources !== undefined
  )
    ? { resources: module.resources?.map(importResource) ?? [] }
    : undefined
  return {
    partType: PartType.Module,
    id: module.id,
    name: module.name ?? module.id,
    components: module.components?.map(importComponent(ctypes)) ?? [],
    api,
  }
}

export const ExternalModuleImport = t.intersection(
  [
    t.type({
      id: t.string,
    }),
    t.partial({
      name: t.string,
      mtype: t.string,
      relations: t.array(RelationImport),
    }),
  ],
  "ExternalModuleImport"
)
export type ExternalModuleImport = t.TypeOf<typeof ExternalModuleImport>

export const importExternalModule = (
  opts: ExternalModuleImport
): ExternalModule => {
  return {
    partType: PartType.ExternalModule,
    id: opts.id,
    name: opts.name ?? opts.id,
    type: opts.mtype
      ? getExternalModuleTypeOrFail(opts.mtype)
      : ExternalModuleType.Generic,
    relations: opts.relations?.map(importRelation) ?? [],
  }
}

export const EntityImport = t.union(
  [ModuleImport, ComponentImport, ExternalModuleImport],
  "EntityImport"
)
export type EntityImport = t.TypeOf<typeof EntityImport>

export const isModule = (entity: EntityImport): entity is ModuleImport =>
  (entity as ModuleImport).components !== undefined
export const isComponent = (entity: EntityImport): entity is ComponentImport =>
  (entity as ComponentImport).ctype !== undefined
export const isExternalModule = (
  entity: EntityImport
): entity is ExternalModuleImport => !isModule(entity) && !isComponent(entity)

export const importEntity = (ctypes: string[]) => (
  entity: EntityImport
): Entity => {
  if (isModule(entity)) return importModule(ctypes)(entity)
  if (isComponent(entity)) return importComponent(ctypes)(entity)
  if (isExternalModule(entity)) return importExternalModule(entity)
  throw new Error(`Can't import entity: ${entity}`)
}

export const DomainImport = t.intersection(
  [
    t.type({
      id: t.string,
    }),
    t.partial({
      name: t.string,
      entities: t.array(EntityImport),
    }),
  ],
  "DomainImport"
)
export type DomainImport = t.TypeOf<typeof DomainImport>

export const importDomain = (ctypes: string[]) => (
  domain: DomainImport
): Domain => {
  return {
    partType: PartType.Domain,
    id: domain.id,
    name: domain.name ?? domain.id,
    entities: domain.entities?.map(importEntity(ctypes)) ?? [],
  }
}

export const ZoneImport = t.intersection(
  [
    t.type({
      id: t.string,
    }),
    t.partial({
      name: t.string,
      domains: t.array(DomainImport),
    }),
  ],
  "Zone"
)
export type ZoneImport = t.TypeOf<typeof ZoneImport>

export const importZone = (ctypes: string[]) => (zone: ZoneImport): Zone => {
  return {
    partType: PartType.Zone,
    id: zone.id,
    name: zone.name ?? zone.id,
    domains: zone.domains?.map(importDomain(ctypes)) ?? [],
  }
}

export const DiagramImport = t.type(
  {
    ctypes: t.union([t.undefined, t.array(t.string)]),
    zones: t.array(ZoneImport),
  },
  "DiagramImport"
)
export type DiagramImport = t.TypeOf<typeof DiagramImport>

export const importDiagram = (diagram: DiagramImport): Diagram => {
  const ctypes = diagram.ctypes ?? []
  return {
    componentTypes: ctypes,
    zones: diagram.zones.map(importZone(ctypes)),
  }
}
