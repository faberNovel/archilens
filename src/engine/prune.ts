import { Id, RelationType, Uid } from "../shared/models"
import { asWritable } from "../utils/types"

import {
  Component,
  Domain,
  isComponent,
  isDomain,
  isModule,
  isRelationEnd,
  Module,
  Part,
  Relation,
  RelationEnd,
  Resource,
  System,
} from "./models"

export type RelationInclusion = false | number | "all"

export type PruneOpts = {
  readonly include?: readonly (Uid | string)[] | undefined
  readonly open?: readonly (Uid | string)[] | undefined
  readonly followRelations?: RelationInclusion | undefined
  readonly followInverseRelations?: RelationInclusion | undefined
  readonly includeResources?: readonly (Uid | string)[] | undefined
  readonly forceOnResources?: boolean | undefined
}

export function prune(
  system: System,
  opts: PruneOpts,
): [System, (part: Part) => boolean] {
  const realOpts = new RealPruneOpts(opts)
  const [displayedParts, displayedRelations] = computeDisplayedParts(
    system,
    realOpts,
  )
  return [
    new PrunedSystem(system, displayedParts, displayedRelations),
    realOpts.isSelected.bind(realOpts),
  ]
}

export class PruneError extends Error {
  constructor(message: string) {
    super(message)
  }
}

class RealPruneOpts implements PruneOpts {
  readonly include: readonly Uid[]
  readonly open: readonly Uid[]
  readonly followRelations: RelationInclusion
  readonly followInverseRelations: RelationInclusion
  readonly includeResources: readonly Uid[]
  readonly forceOnResources: boolean
  constructor(opts: PruneOpts) {
    this.include = (opts.include ?? []).map((uid) => Uid(uid.toString()))
    this.open = (opts.open ?? []).map((uid) => Uid(uid.toString()))
    this.followRelations = opts.followRelations ?? 1
    this.followInverseRelations = opts.followInverseRelations ?? false
    this.includeResources = (opts.includeResources ?? []).map((uid) =>
      Uid(uid.toString()),
    )
    this.forceOnResources = opts.forceOnResources ?? false
  }
  isSelected(part: Part): boolean {
    const isIncluded = () => this.include.includes(part.uid)
    const isOpened = () => this.open.includes(part.uid)
    const containsIncludedResource = () =>
      (isComponent(part) &&
        this.includeResources.some((rUid) =>
          part.resources.some((r) => r.uid === rUid),
        )) ||
      (isModule(part) &&
        this.includeResources.some((rUid) =>
          part.ownedResources.some((r) => r.uid === rUid),
        ))
    const containsIncludedRelationResource = () =>
      isRelationEnd(part) &&
      this.includeResources.some((rUid) =>
        part.relations
          .flatMap((rls) => rls.resources)
          .some((r) => r.uid === rUid),
      )
    const isParentOpened = () =>
      part.parent !== undefined && this.open.includes(part.parent.uid)

    const result =
      isIncluded() ||
      isOpened() ||
      containsIncludedResource() ||
      containsIncludedRelationResource() ||
      isParentOpened()
    return result
  }
  isRelationExcluded(relation: Relation): boolean {
    return (
      this.forceOnResources &&
      !this.includeResources.some((rUid) =>
        relation.resources.some((r) => r.uid === rUid),
      )
    )
  }
  #isRelationIncluded(config: RelationInclusion, value: number): boolean {
    return config === "all" || (typeof config === "number" && config > value)
  }
  includedRelations(part: Part, depth: number): Relation[] {
    return isRelationEnd(part) &&
      this.#isRelationIncluded(this.followRelations, depth)
      ? part.descendentsRelations()
      : []
  }
  includedInverseRelations(part: Part, depth: number): Relation[] {
    return isRelationEnd(part) &&
      this.#isRelationIncluded(this.followInverseRelations, depth)
      ? part.descendentsInverseRelations()
      : []
  }
}

function computeDisplayedParts(
  system: System,
  opts: RealPruneOpts,
): [Set<Part>, Set<Relation>] {
  const displayedParts = new Set<Part>()
  const displayedRelations = new Set<Relation>()
  const relationEnds = new Set<Part>()
  const partsToConsider = new Set<Part>(system.parts.values())

  function displayPart(part: Part, depth: number) {
    displayedParts.add(part)
    partsToConsider.delete(part)
    const relations = [
      ...opts.includedRelations(part, depth),
      ...opts.includedInverseRelations(part, depth),
    ].filter((r) => !opts.isRelationExcluded(r))
    for (const relation of relations) {
      displayedRelations.add(relation)
      relationEnds.add(relation.source)
      relationEnds.add(relation.target)
    }
  }

  let depth = 0
  // Add all parts that are explicitly included
  for (const part of [...partsToConsider]) {
    if (opts.isSelected(part)) {
      displayPart(part, depth)
    }
  }

  // Add all parts that are reachable from explicitly included parts
  let changed: boolean
  do {
    changed = false
    depth++
    for (const part of [...partsToConsider]) {
      if (relationEnds.has(part)) {
        changed = true
        displayPart(part, depth)
      }
    }
  } while (changed)

  return [displayedParts, displayedRelations]
}

class PrunedSystem extends System {
  readonly lastUpdateAt: Date
  readonly domains: readonly Domain[]
  readonly relations: Relation[]
  readonly parts: ReadonlyMap<Uid, Part>

  constructor(
    original: System,
    displayedParts: ReadonlySet<Part>,
    displayedRelations: ReadonlySet<Relation>,
  ) {
    super()
    this.lastUpdateAt = original.lastUpdateAt
    this.domains = filterDomains(original.domains, this, displayedParts)
    this.parts = new Map<Uid, Part>(
      this.domains.flatMap((d) => [...d.descendents]),
    )
    this.relations = populateRelations(original, this, displayedRelations)
  }
}

function filterDomains(
  domains: readonly Domain[],
  parent: Domain | System,
  displayedParts: ReadonlySet<Part>,
): Domain[] {
  return domains
    .map((d) => filterDomain(d, parent, displayedParts))
    .filter((d): d is Domain => d !== undefined)
}

function filterDomain(
  domain: Domain,
  parent: Domain | System,
  displayedParts: ReadonlySet<Part>,
): Domain | undefined {
  const domains = filterDomains(domain.domains, domain, displayedParts)
  const modules = filterModules(domain.modules, domain, displayedParts)
  const components = filterComponents(domain.components, domain, displayedParts)
  if (
    displayedParts.has(domain) ||
    domains.length > 0 ||
    modules.length > 0 ||
    components.length > 0
  ) {
    return new PrunedDomain(domain, parent, domains, modules, components)
  }
}

class PrunedDomain extends Domain {
  readonly system: System
  readonly parent: Domain | undefined
  readonly uid: Uid
  readonly id: Id
  readonly label: string
  readonly domains: readonly Domain[]
  readonly modules: readonly Module[]
  readonly components: readonly Component[]
  readonly children: ReadonlyMap<Id, Part>
  readonly descendents: ReadonlyMap<Uid, Part>

  constructor(
    original: Domain,
    parent: Domain | System,
    domains: readonly Domain[],
    modules: readonly Module[],
    components: readonly Component[],
  ) {
    super()
    this.system = isDomain(parent) ? parent.system : parent
    this.parent = isDomain(parent) ? parent : undefined
    this.uid = original.uid
    this.id = original.id
    this.label = original.label
    this.domains = domains
    this.modules = modules
    this.components = components
    this.children = new Map<Id, Part>([
      ...this.domains.map((d) => [d.id, d] as const),
      ...this.modules.map((m) => [m.id, m] as const),
      ...this.components.map((c) => [c.id, c] as const),
    ])
    this.descendents = new Map<Uid, Part>([
      [this.uid, this],
      ...this.domains.flatMap((d) => [...d.descendents]),
      ...this.modules.flatMap((m) => [...m.descendents]),
      ...this.components.flatMap((m) => [...m.descendents]),
    ])
  }
}

function filterModules(
  modules: readonly Module[],
  parent: Domain,
  displayedParts: ReadonlySet<Part>,
): Module[] {
  return modules
    .map((m) => filterModule(m, parent, displayedParts))
    .filter((m): m is Module => m !== undefined)
}

function filterModule(
  mod: Module,
  parent: Domain,
  displayedParts: ReadonlySet<Part>,
): Module | undefined {
  const components = filterComponents(mod.components, mod, displayedParts)
  if (displayedParts.has(mod) || components.length > 0) {
    return new PrunedModule(mod, parent, components)
  }
}

class PrunedModule extends Module {
  get system(): System {
    return this.parent.system
  }
  readonly parent: Domain
  readonly uid: Uid
  readonly id: Id
  readonly type: string
  readonly label: string
  readonly relations: readonly Relation[]
  readonly inverseRelations: readonly Relation[]
  readonly components: readonly Component[]
  readonly children: ReadonlyMap<Id, Component>
  readonly descendents: ReadonlyMap<Uid, RelationEnd>
  readonly ownedResources: readonly Resource[]

  constructor(
    original: Module,
    parent: Domain,
    components: readonly Component[],
  ) {
    super()
    this.parent = parent
    this.uid = original.uid
    this.id = original.id
    this.type = original.type
    this.label = original.label
    this.relations = []
    this.inverseRelations = []
    this.components = components
    this.ownedResources = original.ownedResources
    this.children = new Map<Id, Component>(
      this.components.map((c) => [c.id, c]),
    )
    this.descendents = new Map<Uid, RelationEnd>([
      [this.uid, this],
      ...this.components.flatMap((r) => [...r.descendents]),
    ])
  }
}

function filterComponents(
  components: readonly Component[],
  parent: Domain | Module,
  displayedParts: ReadonlySet<Part>,
): Component[] {
  return components
    .map((c) => filterComponent(c, parent, displayedParts))
    .filter((c): c is Component => c !== undefined)
}

function filterComponent(
  component: Component,
  parent: Domain | Module,
  displayedParts: ReadonlySet<Part>,
): Component | undefined {
  if (displayedParts.has(component)) {
    return new PrunedComponent(component, parent)
  }
}

class PrunedComponent extends Component {
  get system(): System {
    return this.parent.system
  }
  readonly parent: Domain | Module
  readonly uid: Uid
  readonly id: Id
  readonly type: string
  readonly label: string
  readonly relations: readonly Relation[]
  readonly inverseRelations: readonly Relation[]
  readonly children: ReadonlyMap<Id, Component> = new Map()
  readonly descendents: ReadonlyMap<Uid, Component>
  readonly resources: readonly Resource[]
  readonly mergeAsAsync: boolean

  constructor(original: Component, parent: Domain | Module) {
    super()
    this.parent = parent
    this.uid = original.uid
    this.id = original.id
    this.type = original.type
    this.label = original.label
    this.relations = []
    this.inverseRelations = []
    this.descendents = new Map<Uid, Component>([[this.uid, this]])
    this.resources = original.resources
    this.mergeAsAsync = original.mergeAsAsync
  }
}

function populateRelations(
  original: System,
  system: System,
  displayedRelations: ReadonlySet<Relation>,
): Relation[] {
  return original.domains.flatMap((d) =>
    populateRelationsForDomain(d, system, displayedRelations),
  )
}

function populateRelationsForDomain(
  original: Domain,
  system: System,
  displayedRelations: ReadonlySet<Relation>,
): Relation[] {
  return [
    ...original.domains.flatMap((d) =>
      populateRelationsForDomain(d, system, displayedRelations),
    ),
    ...original.modules.flatMap((m) =>
      populateRelationsForModule(m, system, displayedRelations),
    ),
  ]
}

function populateRelationsForModule(
  original: Module,
  system: System,
  displayedRelations: ReadonlySet<Relation>,
): Relation[] {
  return [
    ...original.components.flatMap((c) =>
      populateRelationsForComponent(c, system, displayedRelations),
    ),
    ...original.relations.flatMap(
      (r) => populateRelation(r, system, displayedRelations) ?? [],
    ),
  ]
}

function populateRelationsForComponent(
  original: Component,
  system: System,
  displayedRelations: ReadonlySet<Relation>,
): Relation[] {
  return original.relations.flatMap(
    (r) => populateRelation(r, system, displayedRelations) ?? [],
  )
}

function populateRelation(
  original: Relation,
  system: System,
  displayedRelations: ReadonlySet<Relation>,
): Relation | undefined {
  if (!displayedRelations.has(original)) {
    return undefined
  }
  const source = system.part(original.source.uid, isRelationEnd)
  if (source === undefined) {
    throw new PruneError(
      `Source component ${original.source.uid} not found` +
        ` (relation: ${JSON.stringify({
          ...original,
          source: original.source.uid,
          target: original.target.uid,
        })})`,
    )
  }
  const target = system.part(original.target.uid, isRelationEnd)
  if (target === undefined) {
    throw new PruneError(
      `Target component ${original.target.uid} not found` +
        ` (relation: ${JSON.stringify({
          ...original,
          source: original.source.uid,
          target: original.target.uid,
        })})`,
    )
  }
  const relation = new PrunedRelation(original, source, target)
  asWritable(source.relations).push(relation)
  asWritable(target.inverseRelations).push(relation)
  return relation
}

class PrunedRelation extends Relation {
  readonly source: RelationEnd
  readonly target: RelationEnd
  readonly type: RelationType
  readonly description: string | undefined
  readonly resources: readonly Resource[]

  constructor(original: Relation, source: RelationEnd, target: RelationEnd) {
    super()
    this.source = source
    this.target = target
    this.type = original.type
    this.description = original.description
    this.resources = original.resources
  }
}
