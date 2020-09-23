import {
  Component,
  ComponentType,
  Diagram,
  domain,
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
  RelationTarget,
  RelationType,
} from "./models"

function debugFn(fn: () => any): void {
  if (process.env.DEBUG === "true") {
    fn()
  }
}
function debug(...args: any): void {
  if (args.length === 1 && typeof args[0] === "function")
    return debugFn(args[0])
  debugFn(() => console.warn(...args))
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
  const complete = (part: Part, parent?: Part): void => {
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
        })
        children.set(entity.id, moduleChildren)
        descent.set(entity.id, moduleDescent)
      }
    })
    children.set(domain.id, domainChildren)
    descent.set(domain.id, domainDescent)
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
  }
}

const focusAcceptComponent = (opts: GenerationOptions): boolean =>
  opts.level === GenerationLevel.Component
const focusAcceptModule = (opts: GenerationOptions): boolean =>
  opts.level === GenerationLevel.Module || focusAcceptComponent(opts)
const focusAcceptDomain = (opts: GenerationOptions): boolean =>
  opts.level === GenerationLevel.Domain || focusAcceptModule(opts)

const relationAcceptComponent = (infos: DiagramInfos): boolean =>
  infos.opts.relationLevel === GenerationLevel.Component
const relationAcceptModule = (infos: DiagramInfos): boolean =>
  infos.opts.relationLevel === GenerationLevel.Module ||
  relationAcceptComponent(infos)
const relationAcceptDomain = (infos: DiagramInfos): boolean =>
  infos.opts.relationLevel === GenerationLevel.Domain ||
  relationAcceptModule(infos)

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

const partHasFocus = (infos: DiagramInfos, part: Part): boolean =>
  infos.focused.get(part.id) ?? false
const partContainsFocused = (infos: DiagramInfos, part: Part): boolean =>
  infos.containsFocused.get(part.id) ?? false

const getParent = (infos: DiagramInfos, part: Part): Part | undefined =>
  infos.parents.get(part.id)
const getFirstFocusedParent = (
  infos: DiagramInfos,
  part: Part
): Part | undefined => {
  const parent = getParent(infos, part)
  if (partContainsFocused(infos, part)) {
    return part
  }
  if (
    (isComponent(part) && relationAcceptComponent(infos)) ||
    (isModule(part) && relationAcceptModule(infos)) ||
    (isExternalModule(part) && relationAcceptModule(infos)) ||
    (isDomain(part) && relationAcceptDomain(infos))
  ) {
    return part
  }
  return parent && getFirstFocusedParent(infos, parent)
}

type Generated = {
  readonly definitions: string[]
  readonly relations: string[]
}
const EmptyGenerated = {
  definitions: [],
  relations: [],
}

function add(first: Generated, second: Generated): Generated {
  return {
    definitions: [...first.definitions, ...second.definitions],
    relations: [...first.relations, ...second.relations],
  }
}
function flatten(gen: Generated): string[] {
  return [...gen.definitions, ...gen.relations]
}

export const generateRelation = (infos: DiagramInfos, source: Entity) => (
  relation: Relation
): string[] => {
  let arrow: string
  switch (relation.type) {
    case RelationType.Sync:
      arrow = relation.reverse ? "<--" : "-->"
      break
    case RelationType.Async:
      arrow = relation.reverse ? "<.." : "..>"
      break
    default:
      throw new Error(
        `Unknown relation type '${relation.type}' for relation ${relation} of entity ${source.id}`
      )
  }
  let desc: string = ""
  if (relation.description !== undefined) {
    desc = ` : ${relation.description}`
  }
  const targetId = getFirstFocusedParent(infos, relation.target)?.id
  const sourceId = getFirstFocusedParent(infos, source)?.id
  if (
    !targetId ||
    !sourceId ||
    (!partHasFocus(infos, source) &&
      !partHasFocus(infos, relation.target) &&
      targetId === sourceId)
  ) {
    return []
  }
  return [`${sourceId} ${arrow} ${targetId}${desc}`]
}

export const generateComponent = (infos: DiagramInfos) => (
  component: Component
): Generated => {
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
  const relations = component.relations.flatMap(
    generateRelation(infos, component)
  )
  return {
    definitions: [`${declaration} "${component.name}" as ${component.id}`],
    relations,
  }
}

export const generateModule = (infos: DiagramInfos) => (
  module: Module
): Generated => {
  const { definitions, relations } = module.components
    .map((component) => {
      if (partContainsFocused(infos, component)) {
        return generateComponent(infos)(component)
      }
      const relations = component.relations.flatMap(
        generateRelation(infos, component)
      )
      return {
        definitions: [],
        relations,
      }
    })
    .reduce(add, EmptyGenerated)
  const open = definitions.length > 0 ? " {" : ""
  const close = definitions.length > 0 ? ["}"] : []
  return {
    definitions: [
      `rectangle "${module.name}" as ${module.id}${open}`,
      ...definitions.map((s) => `  ${s}`),
      ...close,
    ],
    relations: relations,
  }
}

export const generateExternalModule = (infos: DiagramInfos) => (
  module: ExternalModule
): Generated => {
  const relations = module.relations.flatMap(generateRelation(infos, module))
  return {
    definitions: [`rectangle "${module.name}" as ${module.id}`],
    relations,
  }
}

export const generateEntity = (infos: DiagramInfos) => (entity: Entity) => {
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
): Generated => {
  const { definitions, relations } = domain.entities
    .map((entity) => {
      debug(`entity ${entity.id} => ${partContainsFocused(infos, entity)}`)
      if (partContainsFocused(infos, entity)) {
        return generateEntity(infos)(entity)
      }
      return EmptyGenerated
    })
    .reduce(add, EmptyGenerated)
  const open = definitions.length > 0 ? " {" : ""
  const close = definitions.length > 0 ? ["}"] : []
  return {
    definitions: [
      `rectangle "${domain.name}" as ${domain.id}${open}`,
      ...definitions.map((s) => `  ${s}`),
      ...close,
    ],
    relations,
  }
}

export function generateDiagram(
  opts: GenerationOptions,
  diagram: Diagram
): string {
  const infos = prepareDiagram(opts, diagram)
  debug("info:", infos)
  const domains = diagram.domains
    .map((domain) => {
      debug(`domain ${domain.id} => ${partContainsFocused(infos, domain)}`)
      if (partContainsFocused(infos, domain)) {
        return generateDomain(infos)(domain)
      }
      return EmptyGenerated
    })
    .reduce(add, EmptyGenerated)
  return ["@startuml", ...flatten(domains), "@enduml"].join("\n")
}
