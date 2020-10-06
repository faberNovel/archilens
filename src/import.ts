import * as yup from "yup"

import {
  Component,
  Diagram,
  Domain,
  Entity,
  ExternalModule,
  ExternalModuleType,
  Flags,
  getExternalModuleTypeOrFail,
  getRelationTypeOrFail,
  Module,
  PartType,
  Relation,
  RelationType,
  Resource,
  Zone,
} from "./models"

export type FlagsImport = {
  soft_exclude_deep?: boolean
}
export const FlagsImport: yup.ObjectSchema<FlagsImport> = yup
  .object({
    soft_exclude_deep: yup.boolean().notRequired(),
  })
  .required()
export const importFlags = (flags: FlagsImport | undefined): Flags => {
  return {
    softExcludeDeep: flags?.soft_exclude_deep,
  }
}

export type RelationImport = {
  target: string
  rtype: string
  reverse?: boolean
  description?: string
}
export const RelationImport: yup.ObjectSchema<RelationImport> = yup
  .object({
    target: yup.string().required(),
    rtype: yup.string().required(),
    reverse: yup.boolean().notRequired(),
    description: yup.string().notRequired(),
  })
  .required()
export const importRelation = (relation: RelationImport): Relation => {
  return {
    targetId: relation.target,
    type: relation.rtype
      ? getRelationTypeOrFail(relation.rtype)
      : RelationType.Ask,
    description: relation.description,
  }
}

export type ComponentImport = {
  id: string
  ctype: string
  name?: string
  relations?: RelationImport[]
  flags?: FlagsImport
}
export const ComponentImport: yup.ObjectSchema<ComponentImport> = yup
  .object({
    id: yup.string().required(),
    ctype: yup.string().required(),
    name: yup.string().notRequired(),
    relations: yup.array().of(RelationImport).notRequired(),
    flags: FlagsImport.notRequired(),
  })
  .required()
export const importComponent = (ctypes: string[]) => (
  component: ComponentImport
): Component => {
  if (!ctypes.includes(component.ctype)) {
    const value =
      component.ctype === undefined ? "<undefined>" : `'${component.ctype}'`
    throw new Error(
      `Invalid ctype ${value} in component ${JSON.stringify(component)}`
    )
  }
  return {
    partType: PartType.Component,
    id: component.id,
    name: component.name ?? component.id,
    type: component.ctype,
    relations: component.relations?.map(importRelation) ?? [],
    flags: importFlags(component.flags),
  }
}

export type ResourceImport = {
  id: string
  name?: string
}
export const ResourceImport: yup.ObjectSchema<ResourceImport> = yup
  .object({
    id: yup.string().required(),
    name: yup.string().notRequired(),
  })
  .required()
export const importResource = (resource: ResourceImport): Resource => {
  return {
    id: resource.id,
    name: resource.name ?? resource.id,
  }
}

export type ModuleImport = {
  id: string
  name?: string
  components?: ComponentImport[]
  api?: boolean
  resources?: ResourceImport[]
  flags?: FlagsImport
}
export const ModuleImport: yup.ObjectSchema<ModuleImport> = yup
  .object({
    id: yup.string().required(),
    name: yup.string().notRequired(),
    components: yup.array().of(ComponentImport).notRequired(),
    api: yup.boolean().notRequired(),
    resources: yup.array().of(ResourceImport).notRequired(),
    flags: FlagsImport.notRequired(),
  })
  .required()
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
    flags: importFlags(module.flags),
  }
}

export type ExternalModuleImport = {
  id: string
  mtype?: string
  name?: string
  relations?: RelationImport[]
  flags?: FlagsImport
}
export const ExternalModuleImport: yup.ObjectSchema<ExternalModuleImport> = yup
  .object({
    id: yup.string().required(),
    mtype: yup.string().notRequired(),
    name: yup.string().notRequired(),
    relations: yup.array().of(RelationImport).notRequired(),
    flags: FlagsImport.notRequired(),
  })
  .required()
export const importExternalModule = (
  externalModule: ExternalModuleImport
): ExternalModule => {
  return {
    partType: PartType.ExternalModule,
    id: externalModule.id,
    type: externalModule.mtype
      ? getExternalModuleTypeOrFail(externalModule.mtype)
      : ExternalModuleType.Generic,
    name: externalModule.name ?? externalModule.id,
    relations: externalModule.relations?.map(importRelation) ?? [],
    flags: importFlags(externalModule.flags),
  }
}

export type EntityImport = ModuleImport | ComponentImport | ExternalModuleImport
export const EntityImport = yup.lazy((value) => {
  if (ModuleImport.isValidSync(value)) return ModuleImport
  if (ComponentImport.isValidSync(value)) return ComponentImport
  if (ExternalModuleImport.isValidSync(value)) return ExternalModuleImport
  return yup
    .mixed()
    .test("failed", "${path} is not a valid entity", () => false)
})

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

export type DomainImport = {
  id: string
  name?: string
  entities?: EntityImport[]
  flags?: FlagsImport
}
export const DomainImport: yup.ObjectSchema<DomainImport> = yup
  .object({
    id: yup.string().required(),
    name: yup.string().notRequired(),
    entities: yup.array().of(EntityImport).notRequired(),
    flags: FlagsImport.notRequired(),
  })
  .required()
export const importDomain = (ctypes: string[]) => (
  domain: DomainImport
): Domain => {
  return {
    partType: PartType.Domain,
    id: domain.id,
    name: domain.name ?? domain.id,
    entities: domain.entities?.map(importEntity(ctypes)) ?? [],
    flags: importFlags(domain.flags),
  }
}

export type ZoneImport = {
  id: string
  name?: string
  domains?: DomainImport[]
  flags?: FlagsImport
}
export const ZoneImport: yup.ObjectSchema<ZoneImport> = yup
  .object({
    id: yup.string().required(),
    name: yup.string().notRequired(),
    domains: yup.array().of(DomainImport).notRequired(),
    flags: FlagsImport.notRequired(),
  })
  .required()
export const importZone = (ctypes: string[]) => (zone: ZoneImport): Zone => {
  return {
    partType: PartType.Zone,
    id: zone.id,
    name: zone.name ?? zone.id,
    domains: zone.domains?.map(importDomain(ctypes)) ?? [],
    flags: importFlags(zone.flags),
  }
}

export type DiagramImport = {
  ctypes: string[]
  zones: ZoneImport[]
}
export const DiagramImport: yup.ObjectSchema<DiagramImport> = yup
  .object({
    ctypes: yup.array().of(yup.string().required()).required(),
    zones: yup.array().of(ZoneImport).required(),
  })
  .required()
export const importDiagram = (diagram: DiagramImport): Diagram => {
  const ctypes = diagram.ctypes ?? []
  return {
    componentTypes: ctypes,
    zones: diagram.zones.map(importZone(ctypes)),
  }
}
