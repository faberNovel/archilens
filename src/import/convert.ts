import * as Engine from "../engine/models"
import { ModuleType, RelationType, Uid } from "../shared/models"
import { asWritable } from "../utils/types"

import * as Import from "./models"

export class ConvertionError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export function convert(imported: Import.System): Engine.System {
  return new System(imported)
}

class System extends Engine.System {
  readonly lastUpdateAt: Date
  readonly domains: readonly Engine.Domain[]

  readonly #parts: ReadonlyMap<Uid, Engine.Part>

  get parts() {
    return this.#parts
  }

  constructor(imported: Import.System) {
    super()
    this.lastUpdateAt = imported.lastUpdateAt
    this.domains = imported.domains.map((d) => new Domain(d))
    this.#parts = new Map<Uid, Engine.Part>(
      this.domains.flatMap((d) => [...d.parts])
    )
    populateRelations(imported, this)
  }

  partByUid(uid: Uid): Engine.Part | undefined
  partByUid<T extends Engine.Part>(
    uid: Uid,
    refine?: (p: Engine.Part) => p is T
  ): T | undefined
  partByUid(uid: Uid, filter?: (p: Engine.Part) => boolean) {
    const part = this.#parts.get(uid)
    if (part && (!filter || filter(part))) {
      return part
    }
  }
}

class Domain extends Engine.Domain {
  readonly parent: Engine.Domain | undefined
  readonly uid: Uid
  readonly label: string
  readonly domains: Engine.Domain[]
  readonly modules: Engine.Module[]
  readonly #parts: ReadonlyMap<Uid, Engine.Part>

  get parts() {
    return this.#parts
  }
  constructor(
    imported: Import.Domain,
    parent: Engine.Domain | undefined = undefined
  ) {
    super()
    this.parent = parent
    this.uid = imported.uid
    this.label = imported.label
    this.domains = imported.domains.map((d) => new Domain(d, this))
    this.modules = imported.modules.map((m) => new Module(m, this))
    this.#parts = new Map<Uid, Engine.Part>([
      [this.uid, this],
      ...this.domains.flatMap((d) => [...d.parts]),
      ...this.modules.flatMap((m) => [...m.parts]),
    ])
  }
}

class Module extends Engine.Module {
  readonly parent: Engine.Domain
  readonly uid: Uid
  readonly type: ModuleType
  readonly label: string
  readonly components: Engine.Component[]
  readonly relations: Engine.Relation[]
  readonly inverseRelations: Engine.Relation[]
  readonly #parts: Map<Uid, Engine.Module | Engine.Component>
  get parts() {
    return this.#parts
  }
  constructor(imported: Import.Module, parent: Engine.Domain) {
    super()
    this.parent = parent
    this.uid = imported.uid
    this.type = imported.type
    this.label = imported.label
    this.components = imported.components.map((c) => new Component(c, this))
    this.relations = []
    this.inverseRelations = []
    this.#parts = new Map<Uid, Engine.Module | Engine.Component>([
      [this.uid, this],
      ...this.components.map(
        (c) => [c.uid, c] satisfies [Uid, Engine.Module | Engine.Component]
      ),
    ])
  }
}

class Component extends Engine.Component {
  readonly uid: Uid
  readonly type: string
  readonly label: string | undefined
  readonly relations: Engine.Relation[]
  readonly inverseRelations: Engine.Relation[]
  readonly #parts: Map<Uid, Engine.Component>

  get parts() {
    return this.#parts
  }

  constructor(imported: Import.Component, readonly parent: Engine.Module) {
    super()
    this.uid = imported.uid
    this.type = imported.type
    this.label = imported.label
    this.relations = []
    this.inverseRelations = []
    this.#parts = new Map([[this.uid, this]])
  }
}

function populateRelations(imported: Import.System, system: Engine.System) {
  imported.domains.forEach((d) => populateRelationsForDomain(d, system))
}

function populateRelationsForDomain(
  imported: Import.Domain,
  system: Engine.System
) {
  imported.domains.forEach((d) => populateRelationsForDomain(d, system))
  imported.modules.forEach((m) => populateRelationsForModule(m, system))
}

function populateRelationsForModule(
  imported: Import.Module,
  system: Engine.System
) {
  imported.components.forEach((c) => populateRelationsForComponent(c, system))
  imported.relations.forEach((r) => populateRelation(imported.uid, r, system))
}

function populateRelationsForComponent(
  imported: Import.Component,
  system: Engine.System
) {
  imported.relations.forEach((r) => populateRelation(imported.uid, r, system))
}

function populateRelation(
  sourceUid: Uid,
  imported: Import.Relation,
  system: Engine.System
) {
  const source = system.partByUid(sourceUid, Engine.isRelationEnd)
  if (source === undefined) {
    throw new ConvertionError(
      `Source component ${sourceUid} not found` +
        ` (relation: ${JSON.stringify(imported)})`
    )
  }
  const target = system.partByUid(imported.targetUid, Engine.isRelationEnd)
  if (target === undefined ) {
    throw new ConvertionError(
      `Target component ${imported.targetUid} not found` +
        ` (relation: ${JSON.stringify({ sourceUid, ...imported })})`
    )
  }
  const relation = new Relation(imported, source, target)
  asWritable(source.relations).push(relation)
  asWritable(target.inverseRelations).push(relation)
}

class Relation extends Engine.Relation {
  readonly source: Engine.RelationEnd
  readonly target: Engine.RelationEnd
  readonly relationType: RelationType
  readonly description: string | undefined

  constructor(imported: Import.Relation, source: Engine.RelationEnd, target: Engine.RelationEnd) {
    super()
    this.source = source
    this.target = target
    this.relationType = imported.relationType
    this.description = imported.description
  }
}
