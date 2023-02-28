import {
  CompleteRelation,
  Component,
  Diagram,
  DiagramPredicates,
  Domain,
  Entity,
  filterDiagram,
  isComponent,
  isDomain,
  isExternalModule,
  isListenRelation,
  isModule,
  isZone,
  Part,
  PartType,
  Predicates,
  Relation,
  RelationType,
} from "../models"
import { PruneLevel, PruneOptions } from "./index"

type DiagramInfos = {
  readonly diagram: Diagram
  readonly opts: PruneOptions
  readonly ids: ReadonlyMap<string, Part>
  readonly focused: ReadonlySet<string>
  readonly containsFocused: ReadonlySet<string>
  readonly parents: ReadonlyMap<string, Part>
  readonly ancestors: ReadonlyMap<string, readonly Part[]>
  readonly children: ReadonlyMap<string, readonly Part[]>
  readonly descent: ReadonlyMap<string, readonly Part[]>
  readonly relations: ReadonlyArray<CompleteRelation>
  readonly componentTypes: ReadonlyArray<string>
  readonly selected: ReadonlyArray<Part>
}

function prepareDiagram(opts: PruneOptions, diagram: Diagram): DiagramInfos {
  const ids: Map<string, Part> = new Map()
  const focused: Set<string> = new Set()
  const parents: Map<string, Part> = new Map()
  const ancestors: Map<string, readonly Part[]> = new Map()
  const children: Map<string, readonly Part[]> = new Map()
  const descent: Map<string, readonly Part[]> = new Map()
  const allRelations: { source: Part; relation: Relation }[] = []
  const selected: Part[] = []

  const complete = (part: Part): void => {
    if (ids.get(part.uid)) {
      throw new Error(
        `Trying to add a part with a duplicate uid '${
          part.uid
        }'.\nNew: ${JSON.stringify(part)}\nExisting: ${JSON.stringify(
          ids.get(part.uid)
        )}`
      )
    }
    if (part.flags) {
      if (part.flags.softExcludeDeep) {
        opts.softExcludeDeep.push(part.uid)
      }
    }
    ids.set(part.uid, part)
  }
  diagram.zones.forEach((zone) => {
    complete(zone)
    const zoneChildren: Domain[] = []
    const zoneDescent: Part[] = []
    zone.domains.forEach((domain) => {
      complete(domain)
      parents.set(domain.uid, zone)
      ancestors.set(domain.uid, [zone])
      zoneChildren.push(domain)
      zoneDescent.push(domain)
      const domainChildren: Entity[] = []
      const domainDescent: Part[] = []
      domain.entities.forEach((entity) => {
        complete(entity)
        parents.set(entity.uid, domain)
        ancestors.set(entity.uid, [zone, domain])
        domainChildren.push(entity)
        domainDescent.push(entity)
        zoneDescent.push(entity)
        if (isModule(entity)) {
          const moduleChildren: Component[] = []
          const moduleDescent: Part[] = []
          entity.components.forEach((component) => {
            complete(component)
            parents.set(component.uid, entity)
            ancestors.set(component.uid, [zone, domain, entity])
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
          children.set(entity.uid, moduleChildren)
          descent.set(entity.uid, moduleDescent)
        } else if (isExternalModule(entity)) {
          allRelations.push(
            ...entity.relations.map((relation) => ({
              source: entity,
              relation,
            }))
          )
        }
      })
      children.set(domain.uid, domainChildren)
      descent.set(domain.uid, domainDescent)
    })
    children.set(zone.uid, zoneChildren)
    descent.set(zone.uid, zoneDescent)
  })
  ids.forEach((part) => {
    if (computeIsExcluded(opts, part)) return
    const parent = parents.get(part.uid)
    if (computeIsSelected(opts, part)) {
      selected.push(part)
    }
    const hasFocus = (computeHasFocus(opts, part, ancestors) ||
        (parent !== undefined &&
          (opts.open.includes(parent.uid) ||
            parent.tags.some((t) => opts.openTags.includes(t)))))
    if (hasFocus) {
      focused.add(part.uid)
    }
  })
  const isDisplayed = (part: Part): boolean => {
    return (
      focused.has(part.uid) ||
      descent.get(part.uid)?.find((d) => focused.has(d.uid)) !== undefined
    )
  }
  const computedRelations: CompleteRelation[] =
    opts.relationLevel === PruneLevel.Nothing
      ? []
      : allRelations.flatMap(({ source, relation }) => {
          const target = ids.get(relation.targetId)
          if (!target) {
            return []
          }
          const sourceAncestors: readonly Part[] = ancestors.get(source.uid) || []
          const targetAncestors: readonly Part[] = ancestors.get(target.uid) || []

          if (
            opts.completelyExclude.includes(source.uid) ||
            opts.completelyExclude.includes(target.uid) ||
            sourceAncestors.find((a) =>
              opts.completelyExclude.includes(a.uid)
            ) !== undefined ||
            targetAncestors.find((a) =>
              opts.completelyExclude.includes(a.uid)
            ) !== undefined ||
            opts.completelyExcludeTags.some((tag) => source.tags.includes(tag)) ||
            opts.completelyExcludeTags.some((tag) => target.tags.includes(tag))
          ) {
            return []
          }

          const commonDisplayedAncestors = sourceAncestors.filter(
            (a) => targetAncestors.includes(a) && isDisplayed(a)
          )
          let firstSource: Part | undefined = getFirstRelationSource(
            opts,
            parents,
            focused,
            source
          )
          let firstTarget: Part | undefined = getFirstRelationTarget(
            opts,
            parents,
            focused,
            commonDisplayedAncestors,
            target
          )
          let reversed = false
          if (
            !firstSource &&
            firstTarget &&
            opts.reverseRelationTypes.includes(relation.type)
          ) {
            firstSource = getFirstRelationTarget(
              opts,
              parents,
              focused,
              commonDisplayedAncestors,
              source
            )
            firstTarget = getFirstRelationSource(opts, parents, focused, target)
            reversed = true
          }
          if (
            firstSource &&
            (reversed ? sourceAncestors : targetAncestors).includes(firstSource)
          ) {
            return []
          }
          if (!firstSource || !firstTarget || firstSource === firstTarget) {
            return []
          }
          return [
            {
              sourceId: firstSource.uid,
              targetId: firstTarget.uid,
              type: relation.type,
              description: relation.description,
              origSourceId: source.uid,
              origTargetId: target.uid,
            },
          ]
        })

  const listenRelationsPerTarget = new Map<string, CompleteRelation[]>()
  for (const rel of computedRelations.filter(isListenRelation)) {
    listenRelationsPerTarget.set(rel.origTargetId, [
      ...(listenRelationsPerTarget.get(rel.origTargetId) ?? []),
      rel,
    ])
  }
  const listenRelationsTargetSeen = new Set<string>()
  const mergedRelations = computedRelations.flatMap((relation) => {
    if (isListenRelation(relation)) {
      return []
    }
    const relatedListenRelations = listenRelationsPerTarget.get(
      relation.origTargetId
    )
    if (
      relation.type === RelationType.Ask &&
      ids.get(relation.origTargetId)?.partType === PartType.Component &&
      !focused.has(relation.origTargetId) &&
      relatedListenRelations !== undefined
    ) {
      listenRelationsTargetSeen.add(relation.origTargetId)
      return relatedListenRelations.map((rel) => {
        return {
          ...rel,
          targetId: relation.sourceId,
          origTargetId: relation.origSourceId,
        }
      })
    }
    return [relation]
  })
  const unrelatedListenRelations: CompleteRelation[] = [
    ...listenRelationsPerTarget.entries(),
  ]
    .filter(([origTargetId]) => !listenRelationsTargetSeen.has(origTargetId))
    .flatMap(([_, rels]) => rels)
  const newRelations = [...mergedRelations, ...unrelatedListenRelations]

  const acceptComponents =
    opts.level === PruneLevel.Component ||
    opts.relationLevel === PruneLevel.Component
  const maybeMergedRelations = acceptComponents
    ? computedRelations
    : newRelations

  const setFocus = (partId: string) => {
    const parent = parents.get(partId)
    if (parent && opts.close.includes(parent.uid)) {
      focused.delete(partId)
      focused.add(parent.uid)
    } else {
      focused.add(partId)
    }
  }
  maybeMergedRelations.forEach((relation) => {
    setFocus(relation.sourceId)
    setFocus(relation.targetId)
  })

  const cleanedRelations = maybeMergedRelations.flatMap<CompleteRelation>(
    (relation) => {
      const sourceId = findFirstFocusedParent(
        relation.origSourceId,
        parents,
        focused
      )
      const targetId = findFirstFocusedParent(
        relation.origTargetId,
        parents,
        focused
      )
      if (!sourceId || !targetId || sourceId === targetId) {
        return []
      }
      return [
        {
          ...relation,
          sourceId,
          targetId,
        },
      ]
    }
  )

  // Remove duplicates
  const relationsMap = new Map<string, CompleteRelation>()
  cleanedRelations.forEach((r) =>
    relationsMap.set(`${r.sourceId},${r.targetId}`, r)
  )
  const relations = Array.from(relationsMap.values())

  const containsFocused = Array.from(ids.keys()).reduce(
    (acc, partId): Set<string> => {
      const containsFocused =
        focused.has(partId) ||
        descent.get(partId)?.find((d) => focused.has(d.uid)) !== undefined
      if (containsFocused) {
        acc.add(partId)
      }
      return acc
    },
    new Set<string>()
  )
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
    selected,
  }
}

const focusAcceptComponent = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Component
const focusAcceptModule = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Module
const focusAcceptDomain = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Domain
const focusAcceptZone = (opts: PruneOptions): boolean =>
  opts.level === PruneLevel.Zone

const relationAcceptComponent = (opts: PruneOptions): boolean =>
  opts.relationLevel === PruneLevel.Component
const relationAcceptModule = (opts: PruneOptions): boolean =>
  opts.relationLevel === PruneLevel.Module || relationAcceptComponent(opts)
const relationAcceptDomain = (opts: PruneOptions): boolean =>
  opts.relationLevel === PruneLevel.Domain || relationAcceptModule(opts)
const relationAcceptZone = (opts: PruneOptions): boolean =>
  opts.relationLevel === PruneLevel.Zone || relationAcceptDomain(opts)

const computeIsExcluded = (opts: PruneOptions, part: Part) => {
  return (
    opts.exclude.includes(part.uid) ||
    opts.completelyExclude.includes(part.uid) ||
    opts.excludeTags.some((tag) => part.tags.includes(tag)) ||
    opts.completelyExcludeTags.some((tag) => part.tags.includes(tag))
  )
}
const computeIsSelected = (
  opts: PruneOptions,
  part: Part,
): boolean => {
  if (computeIsExcluded(opts, part)) {
    return false
  }
  return (
    opts.focus.includes(part.uid) ||
    opts.open.includes(part.uid) ||
    part.tags.find((t) => opts.focusTags.includes(t)) !== undefined ||
    part.tags.find((t) => opts.openTags.includes(t)) !== undefined
  )
}
const computeHasFocus = (
  opts: PruneOptions,
  part: Part,
  ancestors: ReadonlyMap<string, readonly Part[]>
): boolean => {
  if (computeIsExcluded(opts, part)) {
    return false
  }
  if (
    opts.focus.includes(part.uid) ||
    part.tags.find((t) => opts.focusTags.includes(t)) !== undefined ||
    part.tags.find((t) => opts.openTags.includes(t)) !== undefined
  ) {
    return true
  }
  if (
    opts.softExclude.includes(part.uid) ||
    opts.softExcludeDeep.includes(part.uid)
  ) {
    return false
  }
  const partAncestors = ancestors.get(part.uid) ?? []
  if (
    partAncestors.find((ancestor) =>
      opts.softExcludeDeep.includes(ancestor.uid)
    ) !== undefined
  ) {
    return false
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
  focused: ReadonlySet<string>,
  part: Part
): Part | undefined => {
  if (focused.has(part.uid)) {
    return part
  }
  const parent = parents.get(part.uid)
  if (!parent) {
    return undefined
  }
  return getFirstRelationSource(opts, parents, focused, parent)
}
const computeIsRelationTarget = (
  opts: PruneOptions,
  focused: ReadonlySet<string>,
  part: Part
): boolean => {
  if (focused.has(part.uid)) {
    return true
  }
  if (
    opts.exclude.includes(part.uid) ||
    opts.completelyExclude.includes(part.uid)
  ) {
    return false
  }
  if (isZone(part)) return relationAcceptZone(opts)
  if (isDomain(part)) return relationAcceptDomain(opts)
  if (isModule(part)) return relationAcceptModule(opts)
  if (isExternalModule(part)) return relationAcceptModule(opts)
  return relationAcceptComponent(opts)
}
const getFirstRelationTarget = (
  opts: PruneOptions,
  parents: ReadonlyMap<string, Part>,
  focused: ReadonlySet<string>,
  commonFocusedAncestors: readonly Part[],
  part: Part
): Part | undefined => {
  if (computeIsRelationTarget(opts, focused, part)) {
    return part
  }
  const parent = parents.get(part.uid)
  if (!parent) {
    return undefined
  }
  if (commonFocusedAncestors.includes(parent)) {
    return part
  }
  return getFirstRelationTarget(
    opts,
    parents,
    focused,
    commonFocusedAncestors,
    parent
  )
}

const findFirstFocusedParent = (
  partId: string,
  parents: ReadonlyMap<string, Part>,
  focused: ReadonlySet<string>
): string | undefined => {
  if (focused.has(partId)) {
    return partId
  }
  const parent = parents.get(partId)
  if (!parent) {
    return undefined
  }
  return findFirstFocusedParent(parent.uid, parents, focused)
}

const partContainsFocused =
  (infos: DiagramInfos) =>
  (part: Part): boolean =>
    infos.containsFocused.has(part.uid)

export type PrunedDiagram = Diagram & {
  readonly relations: readonly CompleteRelation[]
  readonly selected: ReadonlySet<string>
}

export function pruneDiagram(
  opts: PruneOptions,
  diagram: Diagram
): PrunedDiagram {
  const infos = prepareDiagram(opts, diagram)
  const predicates: DiagramPredicates = {
    componentTypes: Predicates.ACCEPT,
    zone: partContainsFocused(infos),
    domain: partContainsFocused(infos),
    module: partContainsFocused(infos),
    externalModule: partContainsFocused(infos),
    component: partContainsFocused(infos),
    relation: Predicates.REJECT,
    resource: Predicates.REJECT,
  }
  return {
    ...filterDiagram(predicates)(diagram),
    relations: infos.relations,
    selected: new Set(infos.selected.map((part) => part.uid)),
  }
}
