import { Id, RelationType, Uid } from "../shared/models"

export abstract class System {
  abstract readonly lastUpdateAt: Date
  abstract readonly domains: readonly Domain[]
  abstract readonly parts: ReadonlyMap<Uid, Part>
  abstract relations: readonly Relation[]

  part(uid: Uid): Part | undefined
  part<T extends Part>(uid: Uid, refine?: (p: Part) => p is T): T | undefined
  part(uid: Uid, filter?: (p: Part) => boolean) {
    const part = this.parts.get(uid)
    if (part && (!filter || filter(part))) {
      return part
    }
  }

  domain(id: Id): Part | undefined {
    return (
      this.domains.filter((d) => d.id === id)[0] ||
      this.part(Uid(id.toString()), isDomain)
    )
  }
  module(uid: Uid): Module | undefined {
    return this.part(uid, isModule)
  }
  component(uid: Uid): Component | undefined {
    return this.part(uid, isComponent)
  }

  resources(): Resource[] {
    const descendentsResources = this.domains.flatMap((d) =>
      d.descendentsResources(),
    )
    const relationsResources = this.relations.flatMap((r) => r.resources)
    const resources = [...descendentsResources, ...relationsResources]
    return [...new Map(resources.map((r) => [r.uid, r])).values()]
  }
}

export type ParentPart = Domain | Module

export abstract class Part {
  abstract readonly system: System
  abstract readonly parent: ParentPart | undefined
  abstract readonly uid: Uid
  abstract readonly id: Id
  abstract readonly label: string
  abstract readonly children: ReadonlyMap<Id, Part>
  abstract readonly descendents: ReadonlyMap<Uid, Part>

  get isDomain(): boolean {
    return isDomain(this)
  }
  get isModule(): boolean {
    return isModule(this)
  }
  get isComponent(): boolean {
    return isComponent(this)
  }

  get ancestors(): Part[] {
    return this.parent ? this.parent.path() : []
  }

  child(id: Id): Part | undefined
  child<T extends Part>(id: Id, refine?: (p: Part) => p is T): T | undefined
  child(uid: Id, refine?: (p: Part) => boolean) {
    const part = this.children.get(uid)
    if (part && (!refine || refine(part))) {
      return part
    }
  }

  descendent(uid: Uid): Part | undefined
  descendent<T extends Part>(
    uid: Uid,
    refine?: (p: Part) => p is T,
  ): T | undefined
  descendent(uid: Uid, refine?: (p: Part) => boolean) {
    const part = this.descendents.get(uid)
    if (part && (!refine || refine(part))) {
      return part
    }
  }

  part(id: Id | Uid): Part | undefined
  part<T extends Part>(
    id: Id | Uid,
    refine?: (p: Part) => p is T,
  ): T | undefined
  part<T extends Part>(
    uid: Id | Uid,
    refine?: (p: Part) => p is T,
  ): T | undefined {
    return this.child(uid as Id, refine) ?? this.descendent(uid as Uid, refine)
  }

  path(): Part[]
  path(sep: string): string
  path(sep?: undefined | string) {
    const parentPath = this.parent ? this.parent.path() : []
    const path = [...parentPath, this]
    return sep === undefined ? path : path.map((p) => p.id).join(sep)
  }
  descendentsRelations(): Relation[] {
    return [
      ...new Set(
        [...this.descendents.values()].flatMap((part) => {
          if (isRelationEnd(part)) {
            return part.relations
          } else {
            return []
          }
        }),
      ),
    ]
  }
  descendentsInverseRelations(): Relation[] {
    return [...this.descendents.values()].flatMap((part) => {
      if (isRelationEnd(part)) {
        return part.inverseRelations
      } else {
        return []
      }
    })
  }

  directDependencies(): Module[] {
    return [
      ...new Set(
        this.descendentsRelations().flatMap((rel) => {
          const target = rel.target
          if (isComponent(target)) {
            if (isModule(target.parent)) {
              return [target.parent]
            } else {
              return []
            }
          } else {
            return [target]
          }
        }),
      ),
    ].filter((m) => m.uid !== this.uid)
  }
  indirectDependencies(): Module[] {
    const self = new Set<Part>(this.descendents.values())
    const toSee = new Set<Part>(
      this.descendentsRelations().map((r) => r.target),
    )
    const seen = new Set<Part>(self)
    while (toSee.size > 0) {
      for (const part of [...toSee]) {
        toSee.delete(part)
        seen.add(part)
        for (const target of part.descendentsRelations().map((r) => r.target)) {
          if (!seen.has(target)) {
            toSee.add(target)
          }
        }
      }
    }
    const result: Module[] = []
    for (const part of seen) {
      if (isModule(part) && !self.has(part)) {
        result.push(part)
      }
    }

    return result
  }

  directDependents(): Module[] {
    return [
      ...new Set(
        this.descendentsInverseRelations().flatMap((rel) => {
          const source = rel.source
          if (isComponent(source)) {
            if (isModule(source.parent)) {
              return [source.parent]
            } else {
              return []
            }
          } else {
            return [source]
          }
        }),
      ),
    ].filter((m) => m.uid !== this.uid)
  }
  indirectDependents(): Module[] {
    const seen = new Set<Module>()
    function indirect(part: Module) {
      if (!seen.has(part)) {
        seen.add(part)
        part.directDependents().forEach(indirect)
      }
    }
    this.directDependents().forEach(indirect)
    if (isModule(this)) {
      seen.delete(this)
    }
    return [...seen]
  }

  descendentsResources(): Resource[] {
    return [
      ...new Set(
        [...this.descendents.values()].flatMap((part) => {
          if (isModule(part)) {
            return part.ownedResources
          } else if (isComponent(part)) {
            return part.resources
          } else {
            return []
          }
        }),
      ),
    ]
  }
  descendentRelationEnds(): RelationEnd[] {
    return [...this.descendents.values()].filter(isRelationEnd)
  }
  domain(uid: Uid): Domain | undefined
  domain(id: Id): Domain | undefined
  domain(id: Id | Uid): Domain | undefined {
    return this.part(id, isDomain)
  }

  module(uid: Uid): Module | undefined
  module(id: Id): Module | undefined
  module(id: Id | Uid): Module | undefined {
    return this.part(id, isModule)
  }

  component(uid: Uid): Component | undefined
  component(id: Id): Component | undefined
  component(id: Id | Uid): Component | undefined {
    return this.part(id, isComponent)
  }
}

export abstract class Domain extends Part {
  abstract readonly parent: Domain | undefined
  abstract readonly domains: readonly Domain[]
  abstract readonly modules: readonly Module[]
  abstract readonly components: readonly Component[]
}
export function isDomain(value: unknown): value is Domain {
  return value instanceof Domain
}

export abstract class Module extends Part {
  abstract readonly parent: Domain
  abstract readonly descendents: ReadonlyMap<Uid, RelationEnd>
  abstract readonly type: string
  abstract readonly components: readonly Component[]
  abstract readonly relations: readonly Relation[]
  abstract readonly inverseRelations: readonly Relation[]
  abstract readonly ownedResources: readonly Resource[]
}
export function isModule(value: unknown): value is Module {
  return value instanceof Module
}

export abstract class Component extends Part {
  abstract readonly parent: Domain | Module
  abstract readonly descendents: ReadonlyMap<Uid, Component>
  abstract readonly type: string
  abstract readonly relations: readonly Relation[]
  abstract readonly inverseRelations: readonly Relation[]
  abstract readonly resources: readonly Resource[]
  abstract readonly mergeAsAsync: boolean
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
  abstract readonly resources: readonly Resource[]

  get label(): string | undefined {
    return this.description
      ? this.description
      : this.resources.length > 0
      ? this.resources.map((r) => r.label).join("\n")
      : undefined
  }
}

export abstract class Resource {
  abstract readonly uid: Uid
  abstract readonly label: string
}
