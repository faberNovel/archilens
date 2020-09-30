import {
  CompleteRelation,
  Component,
  Diagram,
  Domain,
  Entity,
  ExternalModule,
  isComponent,
  isDomain,
  isExternalModule,
  isModule,
  isZone,
  Module,
  Part,
  PartType,
  Relation,
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
  readonly relations: ReadonlyArray<CompleteRelation>
  readonly componentTypes: ReadonlyArray<string>
}

function prepareDiagram(opts: PruneOptions, diagram: Diagram): DiagramInfos {
  const ids: Map<string, Part> = new Map()
  const focused: Map<string, boolean> = new Map()
  const parents: Map<string, Part> = new Map()
  const ancestors: Map<string, readonly Part[]> = new Map()
  const children: Map<string, readonly Part[]> = new Map()
  const descent: Map<string, readonly Part[]> = new Map()
  const allRelations: { source: Part; relation: Relation }[] = []

  const complete = (part: Part, parent?: Part): boolean => {
    if (ids.get(part.id)) {
      throw new Error(
        `Trying to add a part with a duplicate id '${
          part.id
        }'.\nNew: ${JSON.stringify(part)}\nExisting: ${JSON.stringify(
          ids.get(part.id)
        )}`
      )
    }
    ids.set(part.id, part)
    const hasFocus =
      computeHasFocus(opts, part) ||
      (parent !== undefined && opts.open.includes(parent.id))
    focused.set(part.id, hasFocus)
    return hasFocus
  }
  diagram.zones.forEach((zone) => {
    complete(zone)
    const zoneChildren: Domain[] = []
    const zoneDescent: Part[] = []
    zone.domains.forEach((domain) => {
      complete(domain, zone)
      parents.set(domain.id, zone)
      ancestors.set(domain.id, [zone])
      zoneChildren.push(domain)
      zoneDescent.push(domain)
      const domainChildren: Entity[] = []
      const domainDescent: Part[] = []
      domain.entities.forEach((entity) => {
        complete(entity, domain)
        parents.set(entity.id, domain)
        ancestors.set(entity.id, [zone, domain])
        domainChildren.push(entity)
        domainDescent.push(entity)
        zoneDescent.push(entity)
        if (isModule(entity)) {
          const moduleChildren: Component[] = []
          const moduleDescent: Part[] = []
          entity.components.forEach((component) => {
            complete(component, entity)
            parents.set(component.id, entity)
            ancestors.set(component.id, [zone, domain, entity])
            moduleChildren.push(component)
            moduleDescent.push(component)
            domainDescent.push(component)
            zoneDescent.push(component)
            allRelations.push(
              ...component.relations.map((relation) => ({
                source: component,
                relation,
              }))
            )
          })
          children.set(entity.id, moduleChildren)
          descent.set(entity.id, moduleDescent)
        } else if (isExternalModule(entity)) {
          allRelations.push(
            ...entity.relations.map((relation) => ({
              source: entity,
              relation,
            }))
          )
        }
      })
      children.set(domain.id, domainChildren)
      descent.set(domain.id, domainDescent)
    })
    children.set(zone.id, zoneChildren)
    descent.set(zone.id, zoneDescent)
  })
  const isDisplayed = (part: Part): boolean => {
    return (
      focused.get(part.id) ||
      descent.get(part.id)?.find((d) => focused.get(d.id)) !== undefined
    )
  }
  debug("reverseRelationTypes", opts.reverseRelationTypes)
  const relations: CompleteRelation[] =
    opts.relationLevel === PruneLevel.Nothing
      ? []
      : allRelations.flatMap(({ source, relation }) => {
          const target = ids.get(relation.targetId)
          if (!target) {
            return []
          }
          const sourceAncestors = ancestors.get(source.id) || []
          const targetAncestors = ancestors.get(target.id) || []
          const commonDisplayedAncestors = sourceAncestors.filter(
            (a) => targetAncestors.includes(a) && isDisplayed(a)
          )
          let firstSource: Part | undefined = getFirstRelationSource(
            opts,
            parents,
            focused,
            source
          )
          let firstTarget: Part | undefined = getFirstRelationTaget(
            opts,
            parents,
            focused,
            commonDisplayedAncestors,
            target
          )
          if (
            !firstSource &&
            firstTarget &&
            opts.reverseRelationTypes.includes(relation.type)
          ) {
            firstSource = getFirstRelationTaget(
              opts,
              parents,
              focused,
              commonDisplayedAncestors,
              source
            )
            firstTarget = getFirstRelationSource(opts, parents, focused, target)
            debug("firstSource", firstSource, "firstTarget", firstTarget)
          }
          if (firstSource && targetAncestors.includes(firstSource)) {
            return []
          }
          if (!firstSource || !firstTarget || firstSource === firstTarget) {
            return []
          }
          return [
            {
              sourceId: firstSource.id,
              targetId: firstTarget.id,
              type: relation.type,
              description: relation.description,
            },
          ]
        })
  relations.forEach((relation) => {
    focused.set(relation.sourceId, true)
    focused.set(relation.targetId, true)
  })
  const containsFocused = Array.from(ids.keys()).reduce((acc, partId): Map<
    string,
    boolean
  > => {
    acc.set(
      partId,
      focused.get(partId) ||
        descent.get(partId)?.find((d) => focused.get(d.id)) !== undefined
    )
    return acc
  }, new Map<string, boolean>())
  const componentTypes: string[] = [
    ...new Set(
      Array.from(containsFocused.entries()).flatMap(([partId, value]) => {
        if (value) {
          const part = ids.get(partId)
          if (part && isComponent(part)) {
            return [part.type]
          }
        }
        return []
      })
    ),
  ]
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
    relations,
    componentTypes,
  }
}

const focusAcceptComponent = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Component
const focusAcceptModule = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Module || focusAcceptComponent(opts)
const focusAcceptDomain = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Domain || focusAcceptModule(opts)
const focusAcceptZone = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Zone || focusAcceptDomain(opts)

const relationAcceptComponent = (opts: PruneOptions): boolean =>
  opts.relationLevel === PruneLevel.Component
const relationAcceptModule = (opts: PruneOptions): boolean =>
  opts.relationLevel === PruneLevel.Module || relationAcceptComponent(opts)
const relationAcceptDomain = (opts: PruneOptions): boolean =>
  opts.relationLevel === PruneLevel.Domain || relationAcceptModule(opts)
const relationAcceptZone = (opts: PruneOptions): boolean =>
  opts.relationLevel === PruneLevel.Zone || relationAcceptDomain(opts)

const computeHasFocus = (opts: PruneOptions, part: Part): boolean => {
  if (opts.exclude.includes(part.id)) {
    return false
  }
  if (opts.focus.includes(part.id)) {
    return true
  }
  if (isZone(part)) return focusAcceptZone(opts)
  if (isDomain(part)) return focusAcceptDomain(opts)
  if (isModule(part)) return focusAcceptModule(opts)
  if (isExternalModule(part)) return focusAcceptModule(opts)
  return focusAcceptComponent(opts)
}

const getFirstRelationSource = (
  opts: PruneOptions,
  parents: ReadonlyMap<string, Part>,
  focused: ReadonlyMap<string, boolean>,
  part: Part
): Part | undefined => {
  if (focused.get(part.id)) {
    return part
  }
  const parent = parents.get(part.id)
  if (!parent) {
    return undefined
  }
  return getFirstRelationSource(opts, parents, focused, parent)
}
const computeIsRelationTarget = (
  opts: PruneOptions,
  focused: ReadonlyMap<string, boolean>,
  part: Part
): boolean => {
  if (focused.get(part.id)) {
    return true
  }
  if (isZone(part)) return relationAcceptZone(opts)
  if (isDomain(part)) return relationAcceptDomain(opts)
  if (isModule(part)) return relationAcceptModule(opts)
  if (isExternalModule(part)) return relationAcceptModule(opts)
  return relationAcceptComponent(opts)
}
const getFirstRelationTaget = (
  opts: PruneOptions,
  parents: ReadonlyMap<string, Part>,
  focused: ReadonlyMap<string, boolean>,
  commonFocusedAncestors: readonly Part[],
  part: Part
): Part | undefined => {
  if (computeIsRelationTarget(opts, focused, part)) {
    return part
  }
  const parent = parents.get(part.id)
  if (!parent) {
    return undefined
  }
  if (commonFocusedAncestors.includes(parent)) {
    return part
  }
  return getFirstRelationTaget(
    opts,
    parents,
    focused,
    commonFocusedAncestors,
    parent
  )
}

const partContainsFocused = (infos: DiagramInfos, part: Part): boolean =>
  infos.containsFocused.get(part.id) ?? false

export const pruneComponent = (infos: DiagramInfos) => (
  component: Component
): Component => {
  return component
}

export const pruneModule = (infos: DiagramInfos) => (
  module: Module
): Module => {
  const components = module.components.flatMap((component) => {
    if (partContainsFocused(infos, component)) {
      return pruneComponent(infos)(component)
    }
    return []
  })
  return {
    partType: PartType.Module,
    id: module.id,
    name: module.name,
    components,
  }
}

export const pruneExternalModule = (infos: DiagramInfos) => (
  externalModule: ExternalModule
): ExternalModule => {
  return externalModule
}

export const pruneEntity = (infos: DiagramInfos) => (
  entity: Entity
): Entity => {
  if (isModule(entity)) {
    return pruneModule(infos)(entity)
  }
  if (isComponent(entity)) {
    return pruneComponent(infos)(entity)
  }
  if (isExternalModule(entity)) {
    return pruneExternalModule(infos)(entity)
  }
  throw new Error(`Unknown entity type: ${entity}`)
}

export const pruneDomain = (infos: DiagramInfos) => (
  domain: Domain
): Domain => {
  const entities = domain.entities.flatMap((entity) => {
    if (partContainsFocused(infos, entity)) {
      return pruneEntity(infos)(entity)
    }
    return []
  })
  return {
    partType: PartType.Domain,
    id: domain.id,
    name: domain.name,
    entities,
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
    id: zone.id,
    name: zone.name,
    domains,
  }
}

export type PrunedDiagram = {
  readonly componentTypes: readonly string[]
  readonly zones: readonly Zone[]
  readonly relations: readonly CompleteRelation[]
}

export function pruneDiagram(
  opts: PruneOptions,
  diagram: Diagram
): PrunedDiagram {
  const infos = prepareDiagram(opts, diagram)
  debug("infos:", infos)
  const zones = diagram.zones.flatMap((zone) => {
    if (partContainsFocused(infos, zone)) {
      return pruneZone(infos)(zone)
    }
    return []
  })
  return {
    componentTypes: infos.componentTypes,
    zones: zones,
    relations: infos.relations,
  }
}
