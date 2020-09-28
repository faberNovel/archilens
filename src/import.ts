import * as t from "io-ts"

import {
  Component,
  Diagram,
  Domain,
  Entity,
  ExternalModule,
  ExternalModuleType,
  getComponentTypeOrFail,
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

export function importRelation(opts: RelationImport): Relation {
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

export function importComponent(opts: ComponentImport): Component {
  return {
    partType: PartType.Component,
    id: opts.id,
    name: opts.name ?? opts.id,
    type: getComponentTypeOrFail(opts.ctype),
    relations: opts.relations?.map(importRelation) ?? [],
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

export function importResource(opts: ResourceImport): Resource {
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

export function importModule(opts: ModuleImport): Module {
  const api = (opts.api !== undefined ? opts.api : opts.resources !== undefined)
    ? { resources: opts.resources?.map(importResource) ?? [] }
    : undefined
  return {
    partType: PartType.Module,
    id: opts.id,
    name: opts.name ?? opts.id,
    components: opts.components?.map(importComponent) ?? [],
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

export function importExternalModule(
  opts: ExternalModuleImport
): ExternalModule {
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

export function importEntity(entity: EntityImport): Entity {
  if (isModule(entity)) return importModule(entity)
  if (isComponent(entity)) return importComponent(entity)
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

export function importDomain(opts: DomainImport): Domain {
  return {
    partType: PartType.Domain,
    id: opts.id,
    name: opts.name ?? opts.id,
    entities: opts.entities?.map(importEntity) ?? [],
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

export function importZone(zone: ZoneImport): Zone {
  return {
    partType: PartType.Zone,
    id: zone.id,
    name: zone.name ?? zone.id,
    domains: zone.domains?.map(importDomain) ?? [],
  }
}

export const DiagramImport = t.type(
  {
    zones: t.array(ZoneImport),
  },
  "DiagramImport"
)
export type DiagramImport = t.TypeOf<typeof DiagramImport>

export function importDiagram(diagram: DiagramImport): Diagram {
  return {
    zones: diagram.zones.map(importZone),
  }
}
