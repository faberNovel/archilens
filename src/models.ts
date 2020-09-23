export enum PartType {
  Domain = "Domain",
  Module = "Module",
  ExternalModule = "ExternalModule",
  Component = "Component",
}

export type ExternalModule = {
  readonly partType: PartType.ExternalModule
  readonly id: string
  readonly name: string
  readonly relations: readonly Relation[]
}
export type ExternalModuleOptions = {
  id: string
  name?: string
  relations?: Relation[]
}
export function externalModule(opts: ExternalModuleOptions): ExternalModule {
  return {
    partType: PartType.ExternalModule,
    id: opts.id,
    name: opts.name ?? opts.id,
    relations: opts.relations ?? [],
  }
}

export type Module = {
  readonly partType: PartType.Module
  readonly id: string
  readonly name: string
  readonly components: readonly Component[]
}
export type ModuleOptions = {
  id: string
  name?: string
  components?: Component[]
}
export function module(opts: ModuleOptions): Module {
  return {
    partType: PartType.Module,
    id: opts.id,
    name: opts.name ?? opts.id,
    components: opts.components ?? [],
  }
}

export enum ComponentType {
  ECS = "ecs",
  Lambda = "Lambda",
  DB = "DB",
  KDS = "KDS",
  S3 = "S3",
  APIGW = "APIGW",
}
export function getComponentTypeOrFail(id: string): ComponentType {
  switch (id.toLowerCase()) {
    case "ecs":
      return ComponentType.ECS
    case "lambda":
      return ComponentType.Lambda
    case "db":
      return ComponentType.DB
    case "kds":
      return ComponentType.KDS
    case "s3":
      return ComponentType.S3
    case "apigw":
      return ComponentType.APIGW
    default:
      throw new Error(`Unknown ComponentType '${id}'`)
  }
}

export type Component = {
  readonly partType: PartType.Component
  readonly id: string
  readonly name: string
  readonly type: ComponentType
  readonly relations: readonly Relation[]
}
export type ComponentOptions = {
  id: string
  name?: string
  type: ComponentType
  relations?: Relation[]
}
export function component(opts: ComponentOptions): Component {
  return {
    partType: PartType.Component,
    id: opts.id,
    name: opts.name ?? opts.id,
    type: opts.type,
    relations: opts.relations ?? [],
  }
}

export enum RelationType {
  Sync = "sync",
  Async = "async",
}
export function getRelationTypeOrFail(id: string): RelationType {
  switch (id.toLowerCase()) {
    case "sync":
      return RelationType.Sync
    case "async":
      return RelationType.Async
    default:
      throw new Error(`Unknown RelationType '${id}'`)
  }
}

export type Relation = {
  readonly targetId: string
  readonly type: RelationType
  readonly description?: string
  readonly reverse: boolean
}
export type RelationOptions = {
  target: string
  type?: RelationType
  reverse?: boolean
  description?: string
}
export function relation(opts: RelationOptions): Relation {
  return {
    targetId: opts.target,
    type: opts.type ?? RelationType.Sync,
    reverse: opts.reverse ?? false,
    description: opts.description,
  }
}

export type Entity = Module | ExternalModule | Component

export type Domain = {
  readonly partType: PartType.Domain
  readonly id: string
  readonly name: string
  readonly entities: readonly Entity[]
}
export type DomainOptions = {
  id: string
  name?: string
  entities?: Entity[]
}
export function domain(opts: DomainOptions): Domain {
  return {
    partType: PartType.Domain,
    id: opts.id,
    name: opts.name ?? opts.id,
    entities: opts.entities ?? [],
  }
}

export type Diagram = {
  readonly domains: Domain[]
}

export type Part = Domain | Module | ExternalModule | Component

export const isDomain = (part: Part): part is Domain =>
  part.partType === PartType.Domain
export const isModule = (part: Part): part is Module =>
  part.partType === PartType.Module
export const isComponent = (part: Part): part is Component =>
  part.partType === PartType.Component
export const isExternalModule = (part: Part): part is ExternalModule =>
  part.partType === PartType.ExternalModule
