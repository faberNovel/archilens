import { Id, RelationType, Uid } from "../shared/models"

export abstract class System {
  abstract readonly lastUpdateAt: Date
  abstract readonly domains: readonly Domain[]
  abstract readonly parts: ReadonlyMap<Uid, Part>
  abstract relations: readonly Relation[]

  partByUid(uid: Uid): Part | undefined
  partByUid<T extends Part>(
    uid: Uid,
    refine?: (p: Part) => p is T
  ): T | undefined
  partByUid(uid: Uid, filter?: (p: Part) => boolean) {
    const part = this.parts.get(uid)
    if (part && (!filter || filter(part))) {
      return part
    }
  }
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

export type ParentPart = Domain | Module

export abstract class Part {
  abstract readonly parent: ParentPart | undefined
  abstract readonly uid: Uid
  abstract readonly id: Id
  abstract readonly label: string
  abstract readonly descendents: ReadonlyMap<Uid, Part>

  get isDomain(): boolean { return isDomain(this) }
  get isModule(): boolean { return isModule(this) }
  get isComponent(): boolean { return isComponent(this) }

  get ancestors(): Part[] {
    return this.parent ? this.parent.path() : []
  }
  path(): Part[]
  path(sep: string): string
  path(sep?: undefined | string) {
    const parentPath = this.parent ? this.parent.path() : []
    const path = [...parentPath, this]
    return sep === undefined ? path : path.map(p => p.id).join(sep)
  }
  descendentsRelations(): Relation[] {
    return [this, ...this.descendents.values()].flatMap((part) => {
      if (isRelationEnd(part)) {
        return part.relations
      } else {
        return []
      }
    })
  }
  descendentsInverseRelations(): Relation[] {
    return [this, ...this.descendents.values()].flatMap((part) => {
      if (isRelationEnd(part)) {
        return part.inverseRelations
      } else {
        return []
      }
    })
  }
}

export abstract class Domain extends Part {
  abstract readonly parent: Domain | undefined
  abstract readonly domains: readonly Domain[]
  abstract readonly modules: readonly Module[]
}
export function isDomain(value: unknown): value is Domain {
  return value instanceof Domain
}

export abstract class Module extends Part {
  abstract readonly parent: Domain
  abstract readonly type: string
  abstract readonly components: readonly Component[]
  abstract readonly relations: readonly Relation[]
  abstract readonly inverseRelations: readonly Relation[]
}
export function isModule(value: unknown): value is Module {
  return value instanceof Module
}

export abstract class Component extends Part {
  abstract readonly parent: Module
  abstract readonly type: string
  abstract readonly relations: readonly Relation[]
  abstract readonly inverseRelations: readonly Relation[]
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
  abstract readonly type: RelationType
  abstract readonly description: string | undefined
  get endsHash(): string {
    return `${this.source.uid}-${this.target.uid}`
  }
  get endsTypeHash(): string {
    return `${this.source.uid}-${this.target.uid}-${this.type}`
  }
}
