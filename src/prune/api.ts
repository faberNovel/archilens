import {
  Diagram,
  Domain,
  Entity,
  isComponent,
  isDomain,
  isModule,
  isZone,
  Module,
  Part,
  PartType,
  Zone,
} from "../models"
import { debug } from "../debug"
import { PruneLevel, PruneOptions } from "./index"

type DiagramInfos = {
  readonly diagram: Diagram
  readonly opts: PruneOptions
  readonly ids: ReadonlyMap<string, Part>
  readonly focused: ReadonlyMap<string, boolean>
  readonly containsFocused: ReadonlyMap<string, boolean>
  readonly parents: ReadonlyMap<string, Part>
  readonly ancestors: ReadonlyMap<string, readonly Part[]>
  readonly children: ReadonlyMap<string, readonly Part[]>
  readonly descent: ReadonlyMap<string, readonly Part[]>
}

function prepareDiagram(opts: PruneOptions, diagram: Diagram): DiagramInfos {
  const ids: Map<string, Part> = new Map()
  const focused: Map<string, boolean> = new Map()
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
      (parent !== undefined && opts.open.includes(parent.uid))
    focused.set(part.uid, hasFocus)
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
  const containsFocused = Array.from(ids.keys()).reduce((acc, partId): Map<
    string,
    boolean
  > => {
    acc.set(
      partId,
      focused.get(partId) ||
        descent.get(partId)?.find((d) => focused.get(d.uid)) !== undefined
    )
    return acc
  }, new Map<string, boolean>())
  return {
    diagram,
    opts,
    ids,
    focused,
    parents,
    ancestors,
    children,
    descent,
    containsFocused,
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
  if (opts.exclude.includes(part.uid) || opts.softExclude.includes(part.uid)) {
    return false
  }
  if (opts.focus.includes(part.uid)) {
    return true
  }
  if (isZone(part)) return focusAcceptZone(opts)
  if (isDomain(part)) return focusAcceptDomain(opts)
  if (isModule(part)) return focusAcceptApi(opts)
  if (isComponent(part)) return focusAcceptResource(opts)
  return false
}

const partContainsFocused = (infos: DiagramInfos, part: Part): boolean =>
  infos.containsFocused.get(part.uid) ?? false

export const pruneApi = (infos: DiagramInfos) => (module: Module): Module => {
  const resources =
    infos.opts.level === PruneLevel.Component ? module.api?.resources ?? [] : []
  return {
    partType: PartType.Module,
    uid: module.uid,
    name: module.name,
    components: [],
    api: module.api ? { ...module.api, resources } : undefined,
  }
}

export const pruneDomain = (infos: DiagramInfos) => (
  domain: Domain
): Domain => {
  const apis = domain.entities.flatMap((entity) => {
    if (isModule(entity) && partContainsFocused(infos, entity)) {
      return pruneApi(infos)(entity)
    }
    return []
  })
  return {
    partType: PartType.Domain,
    uid: domain.uid,
    name: domain.name,
    entities: apis,
  }
}

export const pruneZone = (infos: DiagramInfos) => (zone: Zone): Zone => {
  const domains = zone.domains.flatMap((domain) => {
    if (partContainsFocused(infos, domain)) {
      return pruneDomain(infos)(domain)
    }
    return []
  })
  return {
    partType: PartType.Zone,
    uid: zone.uid,
    name: zone.name,
    domains,
  }
}

export function pruneDiagram(opts: PruneOptions, diagram: Diagram): Diagram {
  const infos = prepareDiagram(opts, diagram)
  debug("infos:", infos)
  const zones = diagram.zones.flatMap((zone) => {
    if (partContainsFocused(infos, zone)) {
      return pruneZone(infos)(zone)
    }
    return []
  })
  return {
    componentTypes: [],
    zones,
  }
}
