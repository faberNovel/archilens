import * as Engine from "../engine/models"
import { isDomain } from "../engine/models"
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
    this.domains = imported.domains.map((d) => new ImportedDomain(d, this))
    this.parts = new Map<Uid, Engine.Part>(
      this.domains.flatMap((d) => [...d.descendents]),
    )
    this.relations = populateRelations(imported, this)
  }
}

class ImportedDomain extends Engine.Domain {
  readonly system: Engine.System
  readonly parent: Engine.Domain | undefined
  readonly uid: Uid
  readonly id: Id
  readonly label: string
  readonly domains: Engine.Domain[]
  readonly modules: Engine.Module[]
  readonly components: Engine.Component[]
  readonly children: ReadonlyMap<Id, Engine.Part>
  readonly descendents: ReadonlyMap<Uid, Engine.Part>

  constructor(imported: Import.Domain, parent: Engine.Domain | Engine.System) {
    super()
    this.system = isDomain(parent) ? parent.system : parent
    this.parent = isDomain(parent) ? parent : undefined
    this.uid = imported.uid
    this.id = imported.id ?? Id(imported.uid)
    this.label = imported.label
    this.domains = imported.domains.map((d) => new ImportedDomain(d, this))
    this.modules = imported.modules.map((m) => new ImportedModule(m, this))
    this.components = imported.components.map(
      (m) => new ImportedComponent(m, this),
    )
    this.children = new Map<Id, Engine.Part>([
      ...this.domains.map((d) => [d.id, d] as const),
      ...this.modules.map((m) => [m.id, m] as const),
      ...this.components.map((c) => [c.id, c] as const),
    ])
    this.descendents = new Map<Uid, Engine.Part>([
      [this.uid, this],
      ...this.domains.flatMap((d) => [...d.descendents]),
      ...this.modules.flatMap((m) => [...m.descendents]),
      ...this.components.flatMap((m) => [...m.descendents]),
    ])
  }
}

class ImportedModule extends Engine.Module {
  get system(): Engine.System {
    return this.parent.system
  }
  readonly parent: Engine.Domain
  readonly uid: Uid
  readonly id: Id
  readonly type: string
  readonly label: string
  readonly components: Engine.Component[]
  readonly relations: Engine.Relation[]
  readonly inverseRelations: Engine.Relation[]
  readonly children: ReadonlyMap<Id, Engine.Component>
  readonly descendents: Map<Uid, Engine.Module | Engine.Component>
  readonly ownedResources: readonly Engine.Resource[]
  constructor(imported: Import.Module, parent: Engine.Domain) {
    super()
    this.parent = parent
    this.uid = imported.uid
    this.id = imported.id ?? Id(imported.uid)
    this.type = imported.type
    this.label = imported.label
    this.components = imported.components.map(
      (c) => new ImportedComponent(c, this),
    )
    this.relations = []
    this.inverseRelations = []
    this.ownedResources = imported.ownedResources.map(
      (r) => new ImportedResource(r),
    )
    this.children = new Map<Id, Engine.Component>(
      this.components.map((c) => [c.id, c]),
    )
    this.descendents = new Map<Uid, Engine.Module | Engine.Component>([
      [this.uid, this],
      ...this.components.map(
        (c) => [c.uid, c] satisfies [Uid, Engine.Module | Engine.Component],
      ),
    ])
  }
}

class ImportedComponent extends Engine.Component {
  get system(): Engine.System {
    return this.parent.system
  }
  readonly uid: Uid
  readonly id: Id
  readonly type: string
  readonly label: string
  readonly relations: Engine.Relation[]
  readonly inverseRelations: Engine.Relation[]
  readonly children: ReadonlyMap<Id, Engine.Component> = new Map()
  readonly descendents: Map<Uid, Engine.Component>
  readonly resources: readonly Engine.Resource[]
  readonly mergeAsAsync: boolean

  constructor(
    imported: Import.Component,
    readonly parent: Engine.Domain | Engine.Module,
  ) {
    super()
    this.uid = imported.uid
    this.id = imported.id ?? Id(imported.uid)
    this.type = imported.type
    this.label = imported.label ?? imported.uid
    this.relations = []
    this.inverseRelations = []
    this.descendents = new Map([[this.uid, this]])
    this.resources = imported.resources.map((r) => new ImportedResource(r))
    this.mergeAsAsync = imported.mergeAsAsync
  }
}

function populateRelations(
  imported: Import.System,
  system: Engine.System,
): Engine.Relation[] {
  return imported.domains.flatMap((d) => populateRelationsForDomain(d, system))
}

function populateRelationsForDomain(
  imported: Import.Domain,
  system: Engine.System,
): Engine.Relation[] {
  return [
    ...imported.domains.flatMap((d) => populateRelationsForDomain(d, system)),
    ...imported.modules.flatMap((m) => populateRelationsForModule(m, system)),
  ]
}

function populateRelationsForModule(
  imported: Import.Module,
  system: Engine.System,
): Engine.Relation[] {
  return [
    ...imported.components.flatMap((c) =>
      populateRelationsForComponent(c, system),
    ),
    ...imported.relations.flatMap((r) =>
      populateRelation(imported.uid, r, system),
    ),
  ]
}

function populateRelationsForComponent(
  imported: Import.Component,
  system: Engine.System,
): Engine.Relation[] {
  return imported.relations.map((r) =>
    populateRelation(imported.uid, r, system),
  )
}

function populateRelation(
  sourceUid: Uid,
  imported: Import.Relation,
  system: Engine.System,
): Engine.Relation {
  const source = system.part(sourceUid, Engine.isRelationEnd)
  if (source === undefined) {
    throw new ConvertionError(
      `Source component ${sourceUid} not found` +
        ` (relation: ${JSON.stringify(imported)})`,
    )
  }
  const target = system.part(imported.targetUid, Engine.isRelationEnd)
  if (target === undefined) {
    throw new ConvertionError(
      `Target component ${imported.targetUid} not found` +
        ` (relation: ${JSON.stringify({ sourceUid, ...imported })})`,
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
  readonly resources: readonly Engine.Resource[]

  constructor(
    imported: Import.Relation,
    source: Engine.RelationEnd,
    target: Engine.RelationEnd,
  ) {
    super()
    this.source = source
    this.target = target
    this.type = imported.relationType
    this.description = imported.description
    this.resources = imported.resources.map((r) => new ImportedResource(r))
  }
}

class ImportedResource extends Engine.Resource {
  readonly uid: Uid
  readonly label: string

  constructor(imported: Import.Resource) {
    super()
    this.uid = imported.uid
    this.label = imported.label
  }
}
