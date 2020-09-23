import * as t from "io-ts"

import {
  Component,
  Diagram,
  Domain,
  Entity,
  ExternalModule,
  getComponentTypeOrFail,
  getRelationTypeOrFail,
  Module,
  Part,
  PartType,
  Relation,
  RelationType,
} from "./models"

export const RelationImport = t.intersection([
  t.type({
    target: t.string,
  }),
  t.partial({
    type: t.string,
    reverse: t.boolean,
    description: t.string,
  }),
])
export type RelationImport = t.TypeOf<typeof RelationImport>

export function importRelation(opts: RelationImport): Relation {
  return {
    targetId: opts.target,
    type: opts.type ? getRelationTypeOrFail(opts.type) : RelationType.Sync,
    reverse: opts.reverse ?? false,
    description: opts.description,
  }
}

export const ComponentImport = t.intersection([
  t.type({
    id: t.string,
    type: t.string,
  }),
  t.partial({
    name: t.string,
    relations: t.array(RelationImport),
  }),
])
export type ComponentImport = t.TypeOf<typeof ComponentImport>

export function importComponent(opts: ComponentImport): Component {
  return {
    partType: PartType.Component,
    id: opts.id,
    name: opts.name ?? opts.id,
    type: getComponentTypeOrFail(opts.type),
    relations: opts.relations?.map(importRelation) ?? [],
  }
}

export const ModuleImport = t.intersection([
  t.type({
    id: t.string,
  }),
  t.partial({
    name: t.string,
    components: t.array(ComponentImport),
  }),
])
export type ModuleImport = t.TypeOf<typeof ModuleImport>

export function importModule(opts: ModuleImport): Module {
  return {
    partType: PartType.Module,
    id: opts.id,
    name: opts.name ?? opts.id,
    components: opts.components?.map(importComponent) ?? [],
  }
}

export const ExternalModuleImport = t.intersection([
  t.type({
    id: t.string,
    relations: t.array(RelationImport),
  }),
  t.partial({
    name: t.string,
  }),
])
export type ExternalModuleImport = t.TypeOf<typeof ExternalModuleImport>

export function importExternalModule(
  opts: ExternalModuleImport
): ExternalModule {
  return {
    partType: PartType.ExternalModule,
    id: opts.id,
    name: opts.name ?? opts.id,
    relations: opts.relations?.map(importRelation) ?? [],
  }
}

export const EntityImport = t.union([
  ModuleImport,
  ComponentImport,
  ExternalModuleImport,
])
export type EntityImport = t.TypeOf<typeof EntityImport>

export const isModule = (entity: EntityImport): entity is ModuleImport =>
  (entity as ModuleImport).components !== undefined
export const isComponent = (entity: EntityImport): entity is ComponentImport =>
  (entity as ComponentImport).type !== undefined
export const isExternalModule = (
  entity: EntityImport
): entity is ExternalModuleImport => !isModule(entity) && !isComponent(entity)

export function importEntity(entity: EntityImport): Entity {
  if (isModule(entity)) return importModule(entity)
  if (isComponent(entity)) return importComponent(entity)
  if (isExternalModule(entity)) return importExternalModule(entity)
  throw new Error(`Can't import entity: ${entity}`)
}

export const DomainImport = t.intersection([
  t.type({
    id: t.string,
  }),
  t.partial({
    name: t.string,
    entities: t.array(EntityImport),
  }),
])
export type DomainImport = t.TypeOf<typeof DomainImport>

export function importDomain(opts: DomainImport): Domain {
  return {
    partType: PartType.Domain,
    id: opts.id,
    name: opts.name ?? opts.id,
    entities: opts.entities?.map(importEntity) ?? [],
  }
}

export const DiagramImport = t.type({
  domains: t.array(DomainImport),
})
export type DiagramImport = t.TypeOf<typeof DiagramImport>

export function importDiagram(diagram: DiagramImport): Diagram {
  return {
    domains: diagram.domains.map(importDomain),
  }
}
