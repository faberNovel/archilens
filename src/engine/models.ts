import { RelationType, Uid } from "../shared/models"

export type System = {
  readonly lastUpdateAt: Date
  readonly domains: readonly Domain[]
  readonly parts: ReadonlyMap<Uid, Part>

  partByUid(uid: Uid): Part | undefined
  domainByUid(uid: Uid): Domain | undefined
  moduleByUid(uid: Uid): Module | undefined
  componentByUid(uid: Uid): Component | undefined
}

export type Domain = {
  readonly partType: "Domain"
  readonly parent: Domain | undefined
  readonly uid: Uid
  readonly label: string
  readonly domains: readonly Domain[]
  readonly modules: readonly Module[]
  readonly parts: ReadonlyMap<Uid, Part>
}
export function isDomain(part: Part): part is Domain;
export function isDomain(value: unknown): value is Domain {
  return (value as Part).partType === "Domain"
}

export type Module = {
  readonly partType: "Module"
  readonly parent: Domain
  readonly uid: Uid
  readonly label: string
  readonly components: readonly Component[]
  readonly parts: ReadonlyMap<Uid, Module | Component>
}
export function isModule(part: Part): part is Module;
export function isModule(value: unknown): value is Module {
  return (value as Part).partType === "Module"
}

export type Component = {
  readonly partType: "Component"
  readonly parent: Module
  readonly uid: Uid
  readonly label: string
  readonly relations: readonly Relation[]
  readonly inverseRelations: readonly Relation[]
  readonly parts: ReadonlyMap<Uid, Component>
}
export function isComponent(part: Part): part is Component;
export function isComponent(value: unknown): value is Component {
  return (value as Part).partType === "Component"
}

export type Part = Domain | Module | Component

export type Relation = {
  readonly source: Component
  readonly target: Component
  readonly relationType: RelationType
  readonly description: string | undefined
}
