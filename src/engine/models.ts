import { ModuleType, RelationType, Uid } from "../shared/models"

export abstract class System {
  abstract readonly lastUpdateAt: Date
  abstract readonly domains: readonly Domain[]
  abstract readonly parts: ReadonlyMap<Uid, Part>

  abstract partByUid(uid: Uid): Part | undefined
  abstract partByUid<T extends Part>(uid: Uid, refine?: (p: Part) => p is T): T | undefined
  domainByUid(uid: Uid): Domain | undefined {
    return this.partByUid(uid, isDomain)
  }
  moduleByUid(uid: Uid): Module | undefined {
    return this.partByUid(uid, isModule)
  }
  componentByUid(uid: Uid): Component | undefined {
    return this.partByUid(uid, isComponent)
  }
}

export interface Part {
  readonly parent: Domain | Module | undefined
  readonly uid: Uid
  readonly label: string | undefined
  readonly parts: ReadonlyMap<Uid, Part>
}

export abstract class Domain implements Part {
  abstract readonly parent: Domain | undefined
  abstract readonly uid: Uid
  abstract readonly label: string
  abstract readonly domains: readonly Domain[]
  abstract readonly modules: readonly Module[]
  abstract readonly parts: ReadonlyMap<Uid, Part>
}
export function isDomain(value: unknown): value is Domain {
  return value instanceof Domain
}

export abstract class Module implements Part {
  abstract readonly parent: Domain
  abstract readonly uid: Uid
  abstract readonly type: ModuleType
  abstract readonly label: string
  abstract readonly components: readonly Component[]
  abstract readonly relations: readonly Relation[]
  abstract readonly inverseRelations: readonly Relation[]
  abstract readonly parts: ReadonlyMap<Uid, Module | Component>
}
export function isModule(value: unknown): value is Module {
  return value instanceof Module
}

export abstract class Component implements Part {
  abstract readonly parent: Module
  abstract readonly uid: Uid
  abstract readonly type: string
  abstract readonly label: string | undefined
  abstract readonly relations: readonly Relation[]
  abstract readonly inverseRelations: readonly Relation[]
  abstract readonly parts: ReadonlyMap<Uid, Component>
}
export function isComponent(value: unknown): value is Component {
  return value instanceof Component
}

export type RelationEnd = Module | Component
export function isRelationEnd(value: unknown): value is RelationEnd {
  return isModule(value) || isComponent(value)
}

export abstract class Relation {
  abstract readonly source: RelationEnd
  abstract readonly target: RelationEnd
  abstract readonly relationType: RelationType
  abstract readonly description: string | undefined
}
