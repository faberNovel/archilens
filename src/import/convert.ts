import * as Engine from "../engine/models"
import { Id, RelationType, Uid } from "../shared/models"
import { asWritable } from "../utils/types"

import * as Import from "./models"

export class ConvertionError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export function convert(imported: Import.System): Engine.System {
  return new ImportedSystem(imported)
}

class ImportedSystem extends Engine.System {
  readonly lastUpdateAt: Date
  readonly domains: readonly Engine.Domain[]
  readonly parts: ReadonlyMap<Uid, Engine.Part>
  readonly relations: readonly Engine.Relation[]

  constructor(imported: Import.System) {
    super()
    this.lastUpdateAt = imported.lastUpdateAt
    this.domains = imported.domains.map((d) => new ImportedDomain(d))
    this.parts = new Map<Uid, Engine.Part>(
      this.domains.flatMap((d) => [...d.descendents])
    )
    this.relations = populateRelations(imported, this)
  }
}

class ImportedDomain extends Engine.Domain {
  readonly parent: Engine.Domain | undefined
  readonly uid: Uid
  readonly id: Id
  readonly label: string
  readonly domains: Engine.Domain[]
  readonly modules: Engine.Module[]
  readonly descendents: ReadonlyMap<Uid, Engine.Part>

  constructor(
    imported: Import.Domain,
    parent: Engine.Domain | undefined = undefined
  ) {
    super()
    this.parent = parent
    this.uid = imported.uid
    this.id = imported.id ?? Id(imported.uid)
    this.label = imported.label
    this.domains = imported.domains.map((d) => new ImportedDomain(d, this))
    this.modules = imported.modules.map((m) => new ImportedModule(m, this))
    this.descendents = new Map<Uid, Engine.Part>([
      [this.uid, this],
      ...this.domains.flatMap((d) => [...d.descendents]),
      ...this.modules.flatMap((m) => [...m.descendents]),
    ])
  }
}

class ImportedModule extends Engine.Module {
  readonly parent: Engine.Domain
  readonly uid: Uid
  readonly id: Id
  readonly type: string
  readonly label: string
  readonly components: Engine.Component[]
  readonly relations: Engine.Relation[]
  readonly inverseRelations: Engine.Relation[]
  readonly descendents: Map<Uid, Engine.Module | Engine.Component>
  constructor(imported: Import.Module, parent: Engine.Domain) {
    super()
    this.parent = parent
    this.uid = imported.uid
    this.id = imported.id ?? Id(imported.uid)
    this.type = imported.type
    this.label = imported.label
    this.components = imported.components.map((c) => new ImportedComponent(c, this))
    this.relations = []
    this.inverseRelations = []
    this.descendents = new Map<Uid, Engine.Module | Engine.Component>([
      [this.uid, this],
      ...this.components.map(
        (c) => [c.uid, c] satisfies [Uid, Engine.Module | Engine.Component]
      ),
    ])
  }
}

class ImportedComponent extends Engine.Component {
  readonly uid: Uid
  readonly id: Id
  readonly type: string
  readonly label: string
  readonly relations: Engine.Relation[]
  readonly inverseRelations: Engine.Relation[]
  readonly descendents: Map<Uid, Engine.Component>

  constructor(imported: Import.Component, readonly parent: Engine.Module) {
    super()
    this.uid = imported.uid
    this.id = imported.id ?? Id(imported.uid)
    this.type = imported.type
    this.label = imported.label ?? imported.uid
    this.relations = []
    this.inverseRelations = []
    this.descendents = new Map([[this.uid, this]])
  }
}

function populateRelations(imported: Import.System, system: Engine.System): Engine.Relation[] {
  return imported.domains.flatMap((d) => populateRelationsForDomain(d, system))
}

function populateRelationsForDomain(
  imported: Import.Domain,
  system: Engine.System
): Engine.Relation[] {
  return [
    ...imported.domains.flatMap((d) => populateRelationsForDomain(d, system)),
    ...imported.modules.flatMap((m) => populateRelationsForModule(m, system)),
  ]
}

function populateRelationsForModule(
  imported: Import.Module,
  system: Engine.System
): Engine.Relation[] {
  return [
    ...imported.components.flatMap((c) => populateRelationsForComponent(c, system)),
    ...imported.relations.flatMap((r) => populateRelation(imported.uid, r, system)),
  ]
}

function populateRelationsForComponent(
  imported: Import.Component,
  system: Engine.System
): Engine.Relation[] {
  return imported.relations.map((r) => populateRelation(imported.uid, r, system))
}

function populateRelation(
  sourceUid: Uid,
  imported: Import.Relation,
  system: Engine.System
): Engine.Relation {
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
  const relation = new ImportedRelation(imported, source, target)
  asWritable(source.relations).push(relation)
  asWritable(target.inverseRelations).push(relation)
  return relation
}

class ImportedRelation extends Engine.Relation {
  readonly source: Engine.RelationEnd
  readonly target: Engine.RelationEnd
  readonly type: RelationType
  readonly description: string | undefined

  constructor(imported: Import.Relation, source: Engine.RelationEnd, target: Engine.RelationEnd) {
    super()
    this.source = source
    this.target = target
    this.type = imported.relationType
    this.description = imported.description
  }
}
