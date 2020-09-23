export type ExternalModule = {
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
    id: opts.id,
    name: opts.name ?? opts.id,
    relations: opts.relations ?? [],
  }
}

export type Module = {
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
    id: opts.id,
    name: opts.name ?? opts.id,
    components: opts.components ?? [],
  }
}

export type ModuleEntity = Module | ExternalModule

export enum ComponentType {
  ECS = "ecs",
  Lambda = "Lambda",
  DB = "DB",
  KDS = "KDS",
  S3 = "S3",
  APIGW = "APIGW",
}
export type Component = {
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
    id: opts.id,
    name: opts.name ?? opts.id,
    type: opts.type,
    relations: opts.relations ?? [],
  }
}

export type RelationTarget = Component | ExternalModule
export enum RelationType {
  Sync = "sync",
  Async = "async",
}
export type Relation = {
  readonly target: RelationTarget
  readonly type: RelationType
  readonly description?: string
  readonly reverse: boolean
}
export type RelationOptions = {
  target: RelationTarget
  type?: RelationType
  reverse?: boolean
  description?: string
}
export function relation(opts: RelationOptions): Relation {
  return {
    target: opts.target,
    type: opts.type ?? RelationType.Sync,
    reverse: opts.reverse ?? false,
    description: opts.description,
  }
}

export type Entity = Module | ExternalModule | Component

export type Domain = {
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
  (part as Domain).entities !== undefined
export const isModule = (part: Part): part is Module =>
  (part as Module).components !== undefined
export const isComponent = (part: Part): part is Component =>
  (part as Component).type !== undefined
export const isExternalModule = (part: Part): part is ExternalModule =>
  (part as ExternalModule).relations !== undefined &&
  (part as Component).type === undefined
