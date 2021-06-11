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
} from "../../models"

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

export const TagsImport: yup.ArraySchema<string> = yup
  .array(yup.string().required())
  .required()
export const importTags = (tags: string[] | undefined): string[] => {
  return tags ?? []
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
  uid: string
  ctype: string
  name?: string
  relations?: RelationImport[]
  flags?: FlagsImport
  tags?: string[]
}
export const ComponentImport: yup.ObjectSchema<ComponentImport> = yup
  .object({
    uid: yup.string().required(),
    ctype: yup.string().required(),
    name: yup.string().notRequired(),
    relations: yup.array().of(RelationImport).notRequired(),
    flags: FlagsImport.notRequired(),
    tags: TagsImport.notRequired(),
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
    uid: component.uid,
    name: component.name ?? component.uid,
    type: component.ctype,
    relations: component.relations?.map(importRelation) ?? [],
    flags: importFlags(component.flags),
    tags: importTags(component.tags),
  }
}

export type ResourceImport = {
  uid: string
  name?: string
}
export const ResourceImport: yup.ObjectSchema<ResourceImport> = yup
  .object({
    uid: yup.string().required(),
    name: yup.string().notRequired(),
  })
  .required()
export const importResource = (resource: ResourceImport): Resource => {
  return {
    uid: resource.uid,
    name: resource.name ?? resource.uid,
  }
}

const apiField = union<boolean | string | undefined>(
  [yup.boolean().required(), yup.string().notRequired()],
  "${path} should be a boolean or a string"
)

export type ModuleImport = {
  uid: string
  name?: string
  components?: ComponentImport[]
  api?: string | boolean | undefined
  resources?: ResourceImport[]
  flags?: FlagsImport
  tags?: string[]
}
export const ModuleImport: yup.ObjectSchema<ModuleImport> = yup
  .object({
    uid: yup.string().required(),
    name: yup.string().notRequired(),
    components: yup.array().of(ComponentImport).notRequired(),
    api: apiField,
    resources: yup.array().of(ResourceImport).notRequired(),
    flags: FlagsImport.notRequired(),
    tags: TagsImport.notRequired(),
  })
  .required()
export const importModule = (ctypes: string[]) => (
  module: ModuleImport
): Module => {
  const name = module.name ?? module.uid
  const api = (
    module.api !== undefined
      ? module.api !== false
      : module.resources !== undefined
  )
    ? {
        name: typeof module.api === "string" ? module.api : name,
        resources: module.resources?.map(importResource) ?? [],
      }
    : undefined
  return {
    partType: PartType.Module,
    uid: module.uid,
    name: name,
    components: module.components?.map(importComponent(ctypes)) ?? [],
    api,
    flags: importFlags(module.flags),
    tags: importTags(module.tags),
  }
}

export type ExternalModuleImport = {
  uid: string
  mtype?: string
  name?: string
  relations?: RelationImport[]
  flags?: FlagsImport
  tags?: string[]
}
export const ExternalModuleImport: yup.ObjectSchema<ExternalModuleImport> = yup
  .object({
    uid: yup.string().required(),
    mtype: yup.string().notRequired(),
    name: yup.string().notRequired(),
    relations: yup.array().of(RelationImport).notRequired(),
    flags: FlagsImport.notRequired(),
    tags: TagsImport.notRequired(),
  })
  .required()
export const importExternalModule = (
  externalModule: ExternalModuleImport
): ExternalModule => {
  return {
    partType: PartType.ExternalModule,
    uid: externalModule.uid,
    type: externalModule.mtype
      ? getExternalModuleTypeOrFail(externalModule.mtype)
      : ExternalModuleType.External,
    name: externalModule.name ?? externalModule.uid,
    relations: externalModule.relations?.map(importRelation) ?? [],
    flags: importFlags(externalModule.flags),
    tags: importTags(externalModule.tags),
  }
}

function union<A>(schemas: yup.Schema<A>[], message: string): yup.Schema<A> {
  const loop = (value: unknown, schemas: yup.Schema<A>[]): yup.Schema<A> => {
    if (schemas.length === 0) {
      return (yup
        .mixed()
        .test("failed", message, () => false) as unknown) as yup.Schema<A>
    }
    const schema: yup.Schema<A> = schemas[0]
    if (schema.isValidSync(value)) {
      return schema
    }
    return loop(value, schemas.slice(1))
  }
  return yup.lazy((value) => loop(value, schemas))
}

export type EntityImport = ModuleImport | ComponentImport | ExternalModuleImport
export const EntityImport = union<EntityImport>(
  [ModuleImport, ComponentImport, ExternalModuleImport],
  "${path} is not a valid entity"
)

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
  uid: string
  name?: string
  entities?: EntityImport[]
  flags?: FlagsImport
  tags?: string[]
}
export const DomainImport: yup.ObjectSchema<DomainImport> = yup
  .object({
    uid: yup.string().required(),
    name: yup.string().notRequired(),
    entities: yup.array().of(EntityImport).notRequired(),
    flags: FlagsImport.notRequired(),
    tags: TagsImport.notRequired(),
  })
  .required()
export const importDomain = (ctypes: string[]) => (
  domain: DomainImport
): Domain => {
  return {
    partType: PartType.Domain,
    uid: domain.uid,
    name: domain.name ?? domain.uid,
    entities: domain.entities?.map(importEntity(ctypes)) ?? [],
    flags: importFlags(domain.flags),
    tags: importTags(domain.tags),
  }
}

export type ZoneImport = {
  uid: string
  name?: string
  domains?: DomainImport[]
  flags?: FlagsImport
  tags?: string[]
}
export const ZoneImport: yup.ObjectSchema<ZoneImport> = yup
  .object({
    uid: yup.string().required(),
    name: yup.string().notRequired(),
    domains: yup.array().of(DomainImport).notRequired(),
    flags: FlagsImport.notRequired(),
    tags: TagsImport.notRequired(),
  })
  .required()
export const importZone = (ctypes: string[]) => (zone: ZoneImport): Zone => {
  return {
    partType: PartType.Zone,
    uid: zone.uid,
    name: zone.name ?? zone.uid,
    domains: zone.domains?.map(importDomain(ctypes)) ?? [],
    flags: importFlags(zone.flags),
    tags: importTags(zone.tags),
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
