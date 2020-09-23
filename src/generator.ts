import {
  Component,
  ComponentType,
  Diagram,
  Domain,
  Entity,
  ExternalModule,
  isComponent,
  isDomain,
  isExternalModule,
  isModule,
  Module,
  Part,
  Relation,
  RelationType,
} from "./models"

function debugFn(fn: () => unknown): void {
  if (process.env.DEBUG !== "true") {
    return
  }
  fn()
}
function debug(...args: unknown[]): void {
  if (process.env.DEBUG !== "true") {
    return
  }
  const computedArgs = args.map((arg: unknown) => {
    if (typeof arg === "function") {
      return arg()
    } else {
      return arg
    }
  })
  console.warn(...computedArgs)
}

function truesFromMap<A>(map: ReadonlyMap<A, boolean>): readonly A[] {
  return Array.from(map.entries()).flatMap(([key, value]) =>
    value ? [key] : []
  )
}

export enum GenerationLevel {
  Nothing = "nothing",
  Domain = "domain",
  Module = "module",
  Component = "component",
}
export type GenerationOptions = {
  readonly level: GenerationLevel
  readonly relationLevel: GenerationLevel
  readonly focus: string[]
  readonly exclude: string[]
  readonly open: string[]
}

export type GeneratedRelation = {
  readonly source: Part
  readonly target: Part
  readonly type: RelationType
  readonly description?: string
}

type DiagramInfos = {
  readonly diagram: Diagram
  readonly opts: GenerationOptions
  readonly ids: ReadonlyMap<string, Part>
  readonly focused: ReadonlyMap<string, boolean>
  readonly containsFocused: ReadonlyMap<string, boolean>
  readonly parents: ReadonlyMap<string, Part>
  readonly ancestors: ReadonlyMap<string, readonly Part[]>
  readonly children: ReadonlyMap<string, readonly Part[]>
  readonly descent: ReadonlyMap<string, readonly Part[]>
  readonly relations: ReadonlyArray<GeneratedRelation>
}

function prepareDiagram(
  opts: GenerationOptions,
  diagram: Diagram
): DiagramInfos {
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
        `Trying to add a part with a duplicate id.\nNew: ${JSON.stringify(
          part
        )}\nExisting: ${JSON.stringify(ids.get(part.id))}`
      )
    }
    ids.set(part.id, part)
    const hasFocus =
      computeHasFocus(opts, part) ||
      (parent !== undefined && opts.open.includes(parent.id))
    focused.set(part.id, hasFocus)
    return hasFocus
  }
  diagram.domains.forEach((domain) => {
    complete(domain)
    const domainChildren: Entity[] = []
    const domainDescent: Entity[] = []
    domain.entities.forEach((entity) => {
      complete(entity, domain)
      parents.set(entity.id, domain)
      ancestors.set(entity.id, [domain])
      domainChildren.push(entity)
      domainDescent.push(entity)
      if (isModule(entity)) {
        const moduleChildren: Component[] = []
        const moduleDescent: Component[] = []
        entity.components.forEach((component) => {
          complete(component, entity)
          parents.set(component.id, entity)
          ancestors.set(component.id, [domain, entity])
          moduleChildren.push(component)
          moduleDescent.push(component)
          domainDescent.push(component)
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
          ...entity.relations.map((relation) => ({ source: entity, relation }))
        )
      }
    })
    children.set(domain.id, domainChildren)
    descent.set(domain.id, domainDescent)
  })
  const isDisplayed = (part: Part): boolean => {
    return (
      focused.get(part.id) ||
      descent.get(part.id)?.find((d) => focused.get(d.id)) !== undefined
    )
  }
  const relations: GeneratedRelation[] = allRelations.flatMap(
    ({ source, relation }) => {
      const target = ids.get(relation.targetId)
      if (!target) {
        return []
      }
      const sourceAncestors = ancestors.get(source.id) || []
      const targetAncestors = ancestors.get(target.id) || []
      const commonDisplayedAncestors = sourceAncestors.filter(
        (a) => targetAncestors.includes(a) && isDisplayed(a)
      )
      const firstSource: Part | undefined = getFirstRelationSource(
        opts,
        parents,
        focused,
        commonDisplayedAncestors,
        source
      )
      if (firstSource && targetAncestors.includes(firstSource)) {
        return []
      }
      const firstTarget: Part | undefined = getFirstRelationTaget(
        opts,
        parents,
        focused,
        commonDisplayedAncestors,
        target
      )
      if (!firstSource || !firstTarget || firstSource === firstTarget) {
        return []
      }
      return [
        {
          source: relation.reverse ? firstTarget : firstSource,
          target: relation.reverse ? firstSource : firstTarget,
          type: relation.type,
          description: relation.description,
        },
      ]
    }
  )
  relations.forEach((relation) => {
    focused.set(relation.source.id, true)
    focused.set(relation.target.id, true)
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
  }
}

const focusAcceptComponent = (opts: GenerationOptions): boolean =>
  opts.level === GenerationLevel.Component
const focusAcceptModule = (opts: GenerationOptions): boolean =>
  opts.level === GenerationLevel.Module || focusAcceptComponent(opts)
const focusAcceptDomain = (opts: GenerationOptions): boolean =>
  opts.level === GenerationLevel.Domain || focusAcceptModule(opts)

const relationAcceptComponent = (opts: GenerationOptions): boolean =>
  opts.relationLevel === GenerationLevel.Component
const relationAcceptModule = (opts: GenerationOptions): boolean =>
  opts.relationLevel === GenerationLevel.Module || relationAcceptComponent(opts)
const relationAcceptDomain = (opts: GenerationOptions): boolean =>
  opts.relationLevel === GenerationLevel.Domain || relationAcceptModule(opts)

const computeHasFocus = (opts: GenerationOptions, part: Part): boolean => {
  if (opts.exclude.includes(part.id)) {
    return false
  }
  if (opts.focus.includes(part.id)) {
    return true
  }
  if (isDomain(part)) return focusAcceptDomain(opts)
  if (isModule(part)) return focusAcceptModule(opts)
  if (isExternalModule(part)) return focusAcceptModule(opts)
  return focusAcceptComponent(opts)
}

const getFirstRelationSource = (
  opts: GenerationOptions,
  parents: ReadonlyMap<string, Part>,
  focused: ReadonlyMap<string, boolean>,
  commonDisplayedAncestors: readonly Part[],
  part: Part
): Part | undefined => {
  if (focused.get(part.id)) {
    return part
  }
  const parent = parents.get(part.id)
  if (!parent) {
    return undefined
  }
  // if (commonDisplayedAncestors.includes(parent)) {
  //   return part
  // }
  return getFirstRelationSource(
    opts,
    parents,
    focused,
    commonDisplayedAncestors,
    parent
  )
}
const computeIsRelationTarget = (
  opts: GenerationOptions,
  focused: ReadonlyMap<string, boolean>,
  part: Part
): boolean => {
  if (focused.get(part.id)) {
    return true
  }
  if (isDomain(part)) return relationAcceptDomain(opts)
  if (isModule(part)) return relationAcceptModule(opts)
  if (isExternalModule(part)) return relationAcceptModule(opts)
  return relationAcceptComponent(opts)
}
const getFirstRelationTaget = (
  opts: GenerationOptions,
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

const partHasFocus = (infos: DiagramInfos, part: Part): boolean =>
  infos.focused.get(part.id) ?? false
const partContainsFocused = (infos: DiagramInfos, part: Part): boolean =>
  infos.containsFocused.get(part.id) ?? false

export const generateComponent = (infos: DiagramInfos) => (
  component: Component
): string[] => {
  let declaration: string
  switch (component.type) {
    case ComponentType.APIGW:
      declaration = "rectangle"
      break
    case ComponentType.DB:
      declaration = "database"
      break
    case ComponentType.ECS:
      declaration = "component"
      break
    case ComponentType.KDS:
      declaration = "queue"
      break
    case ComponentType.Lambda:
      declaration = "component"
      break
    case ComponentType.S3:
      declaration = "storage"
      break
    default:
      throw new Error(
        `Unknown type '${component.type}' for component ${component}`
      )
  }
  return [`${declaration} "${component.name}" as ${component.id}`]
}

export const generateModule = (infos: DiagramInfos) => (
  module: Module
): string[] => {
  const definitions = module.components.flatMap((component) => {
    if (partContainsFocused(infos, component)) {
      return generateComponent(infos)(component)
    }
    return []
  })
  const open = definitions.length > 0 ? " {" : ""
  const close = definitions.length > 0 ? ["}"] : []
  return [
    `rectangle "${module.name}" as ${module.id}${open}`,
    ...definitions.map((s) => `  ${s}`),
    ...close,
  ]
}

export const generateExternalModule = (infos: DiagramInfos) => (
  module: ExternalModule
): string[] => {
  return [`rectangle "${module.name}" as ${module.id}`]
}

export const generateEntity = (infos: DiagramInfos) => (
  entity: Entity
): string[] => {
  if (isModule(entity)) {
    return generateModule(infos)(entity)
  }
  if (isComponent(entity)) {
    return generateComponent(infos)(entity)
  }
  if (isExternalModule(entity)) {
    return generateExternalModule(infos)(entity)
  }
  throw new Error(`Unknown entity type: ${entity}`)
}

export const generateDomain = (infos: DiagramInfos) => (
  domain: Domain
): string[] => {
  const definitions = domain.entities.flatMap((entity) => {
    if (partContainsFocused(infos, entity)) {
      return generateEntity(infos)(entity)
    }
    return []
  })
  const open = definitions.length > 0 ? " {" : ""
  const close = definitions.length > 0 ? ["}"] : []
  return [
    `rectangle "${domain.name}" as ${domain.id}${open}`,
    ...definitions.map((s) => `  ${s}`),
    ...close,
  ]
}

export const generateRelation = (relation: GeneratedRelation): string => {
  let arrow: string
  switch (relation.type) {
    case RelationType.Sync:
      arrow = "-->"
      break
    case RelationType.Async:
      arrow = "..>"
      break
    default:
      throw new Error(
        `Unknown relation type '${relation.type}' for relation ${relation}`
      )
  }
  let desc: string = ""
  if (relation.description) {
    desc = ` : ${relation.description}`
  }
  const sourceId = relation.source.id
  const targetId = relation.target.id
  return `${sourceId} ${arrow} ${targetId}${desc}`
}
const generateRelations = (infos: DiagramInfos): string[] => {
  return infos.relations.map(generateRelation)
}

export function generateDiagram(
  opts: GenerationOptions,
  diagram: Diagram
): string {
  const infos = prepareDiagram(opts, diagram)
  const domains = diagram.domains.flatMap((domain) => {
    if (partContainsFocused(infos, domain)) {
      return generateDomain(infos)(domain)
    }
    return []
  })
  const relations = generateRelations(infos)
  return ["@startuml", "", ...domains, "", ...relations, "", "@enduml"].join(
    "\n"
  )
}
