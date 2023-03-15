import {
  Diagram,
  DiagramPredicates,
  Domain,
  Entity,
  filterDiagram,
  isComponent,
  isDomain,
  isModule,
  isZone,
  Part,
  Predicates,
} from "../models"
import { PruneLevel, PruneOptions } from "./index"

type DiagramInfos = {
  readonly diagram: Diagram
  readonly opts: PruneOptions
  readonly ids: ReadonlyMap<string, Part>
  readonly focused: ReadonlySet<string>
  readonly unprunedIds: ReadonlySet<string>
  readonly parents: ReadonlyMap<string, Part>
  readonly ancestors: ReadonlyMap<string, readonly Part[]>
  readonly children: ReadonlyMap<string, readonly Part[]>
  readonly descent: ReadonlyMap<string, readonly Part[]>
}

function prepareDiagram(opts: PruneOptions, diagram: Diagram): DiagramInfos {
  const ids: Map<string, Part> = new Map()
  const focused: Set<string> = new Set()
  const parents: Map<string, Part> = new Map()
  const ancestors: Map<string, readonly Part[]> = new Map()
  const children: Map<string, readonly Part[]> = new Map()
  const descent: Map<string, readonly Part[]> = new Map()

  const complete = (part: Part, parent?: Part): boolean => {
    if (ids.get(part.uid)) {
      throw new Error(
        `Trying to add a part with a duplicate uid '${
          part.uid
        }'.\nNew: ${JSON.stringify(part)}\nExisting: ${JSON.stringify(
          ids.get(part.uid)
        )}`
      )
    }
    ids.set(part.uid, part)
    const hasFocus =
      computeHasFocus(opts, part) ||
      (parent !== undefined &&
        (opts.open.includes(parent.uid) ||
          parent.tags.find((t) => opts.openTags.includes(t)) !== undefined))
    if (hasFocus) {
      focused.add(part.uid)
    }
    return hasFocus
  }
  diagram.zones.forEach((zone) => {
    complete(zone)
    const zoneChildren: Domain[] = []
    const zoneDescent: Part[] = []
    zone.domains.forEach((domain) => {
      complete(domain, zone)
      parents.set(domain.uid, zone)
      ancestors.set(domain.uid, [zone])
      zoneChildren.push(domain)
      zoneDescent.push(domain)
      const domainChildren: Entity[] = []
      const domainDescent: Part[] = []
      domain.entities.forEach((entity) => {
        if (isModule(entity)) {
          complete(entity, domain)
          parents.set(entity.uid, domain)
          ancestors.set(entity.uid, [zone, domain])
          domainChildren.push(entity)
          domainDescent.push(entity)
          zoneDescent.push(entity)
        }
      })
      children.set(domain.uid, domainChildren)
      descent.set(domain.uid, domainDescent)
    })
    children.set(zone.uid, zoneChildren)
    descent.set(zone.uid, zoneDescent)
  })
  const unprunedIds = Array.from(ids.keys()).reduce(
    (acc, partId): Set<string> => {
      const unprunedIds =
        focused.has(partId) ||
        descent.get(partId)?.find((d) => focused.has(d.uid)) !== undefined
      if (unprunedIds) {
        acc.add(partId)
      }
      return acc
    },
    new Set<string>()
  )
  return {
    diagram,
    opts,
    ids,
    focused,
    parents,
    ancestors,
    children,
    descent,
    unprunedIds,
  }
}

const focusAcceptResource = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Component
const focusAcceptApi = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Module || focusAcceptResource(opts)
const focusAcceptDomain = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Domain
const focusAcceptZone = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Zone

const computeHasFocus = (opts: PruneOptions, part: Part): boolean => {
  if (
    opts.exclude.includes(part.uid) ||
    part.tags.find((t) => opts.excludeTags.includes(t)) !== undefined
  ) {
    return false
  }
  if (
    opts.focus.includes(part.uid) ||
    part.tags.find((t) => opts.focusTags.includes(t)) !== undefined
  ) {
    return true
  }
  if (isZone(part)) return focusAcceptZone(opts)
  if (isDomain(part)) return focusAcceptDomain(opts)
  if (isModule(part)) return focusAcceptApi(opts)
  if (isComponent(part)) return focusAcceptResource(opts)
  return false
}

const partContainsFocused =
  (infos: DiagramInfos) =>
  (part: Part): boolean =>
    infos.unprunedIds.has(part.uid)

export function pruneDiagram(opts: PruneOptions, diagram: Diagram): Diagram {
  const infos = prepareDiagram(opts, diagram)
  const predicates: DiagramPredicates = {
    componentTypes: Predicates.REJECT,
    zone: partContainsFocused(infos),
    domain: partContainsFocused(infos),
    module: partContainsFocused(infos),
    externalModule: Predicates.REJECT,
    component: Predicates.REJECT,
    relation: Predicates.REJECT,
    resource: (_: unknown): boolean =>
      infos.opts.level === PruneLevel.Component,
  }
  return filterDiagram(predicates)(diagram)
}
