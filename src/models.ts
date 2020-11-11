export const enum PartType {
  Zone = "Zone",
  Domain = "Domain",
  Module = "Module",
  ExternalModule = "ExternalModule",
  Component = "Component",
}

export const enum ExternalModuleType {
  External = "External",
  Legacy = "Legacy",
  App = "App",
  Platform = "Platform",
}
export function getExternalModuleTypeOrFail(uid: string): ExternalModuleType {
  switch (uid.toLowerCase()) {
    case "app":
      return ExternalModuleType.App
    case "external":
      return ExternalModuleType.External
    case "legacy":
      return ExternalModuleType.Legacy
    case "platform":
      return ExternalModuleType.Platform
    default:
      throw new Error(`Unknown ExternalModuleType '${uid}'`)
  }
}

export type Flags = {
  readonly softExcludeDeep?: boolean
}

export type ExternalModule = {
  readonly partType: PartType.ExternalModule
  readonly uid: string
  readonly type: ExternalModuleType
  readonly name: string
  readonly relations: readonly Relation[]
  readonly flags?: Flags
  readonly tags: readonly string[]
}

export type Resource = {
  readonly uid: string
  readonly name: string
}

export type Api = {
  readonly name: string
  readonly resources: readonly Resource[]
}

export type Module = {
  readonly partType: PartType.Module
  readonly uid: string
  readonly name: string
  readonly components: readonly Component[]
  readonly api?: Api
  readonly flags?: Flags
  readonly tags: readonly string[]
}

export type Component = {
  readonly partType: PartType.Component
  readonly uid: string
  readonly name: string
  readonly type: string
  readonly relations: readonly Relation[]
  readonly flags?: Flags
  readonly tags: readonly string[]
}

export const enum RelationType {
  Ask = "Ask",
  Tell = "Tell",
  Listen = "Listen",
}
export function getRelationTypeOrFail(uid: string): RelationType {
  switch (uid.toLowerCase()) {
    case "ask":
      return RelationType.Ask
    case "tell":
      return RelationType.Tell
    case "listen":
      return RelationType.Listen
    default:
      throw new Error(`Unknown RelationType '${uid}'`)
  }
}

export type Relation = {
  readonly targetId: string
  readonly type: RelationType
  readonly description?: string
}

export type CompleteRelation = {
  readonly sourceId: string
  readonly targetId: string
  readonly type: RelationType
  readonly description?: string
  readonly origSourceId: string
  readonly origTargetId: string
}

export type Entity = Module | ExternalModule | Component

export type Domain = {
  readonly partType: PartType.Domain
  readonly uid: string
  readonly name: string
  readonly entities: readonly Entity[]
  readonly flags?: Flags
  readonly tags: readonly string[]
}

export type Zone = {
  readonly partType: PartType.Zone
  readonly uid: string
  readonly name: string
  readonly domains: readonly Domain[]
  readonly flags?: Flags
  readonly tags: readonly string[]
}

export type Diagram = {
  readonly componentTypes: readonly string[]
  readonly zones: readonly Zone[]
}

export type Part = Zone | Domain | Module | ExternalModule | Component

export const isZone = (part: Part): part is Zone =>
  part.partType === PartType.Zone
export const isDomain = (part: Part): part is Domain =>
  part.partType === PartType.Domain
export const isModule = (part: Part): part is Module =>
  part.partType === PartType.Module
export const isComponent = (part: Part): part is Component =>
  part.partType === PartType.Component
export const isExternalModule = (part: Part): part is ExternalModule =>
  part.partType === PartType.ExternalModule

export const foldEntity = <A>(
  fnModule: (module: Module) => A,
  fnExternalModule: (externalModule: ExternalModule) => A,
  fnComponent: (component: Component) => A
) => (entity: Entity): A => {
  if (isModule(entity)) {
    return fnModule(entity)
  }
  if (isExternalModule(entity)) {
    return fnExternalModule(entity)
  }
  return fnComponent(entity)
}

export type DiagramPredicates = {
  componentTypes(componentTypes: string): boolean
  zone(zone: Zone): boolean
  domain(domain: Domain): boolean
  module(module: Module): boolean
  externalModule(externalModule: ExternalModule): boolean
  component(component: Component): boolean
  relation(relation: Relation): boolean
  resource(resource: Resource): boolean
}

export const ACCEPT = <A>(_: A) => true
export const REJECT = <A>(_: A) => false

export const filterDiagram = (predicates: DiagramPredicates) => (
  diagram: Diagram
): Diagram => ({
  componentTypes: diagram.componentTypes.filter(predicates.componentTypes),
  zones: diagram.zones.filter(predicates.zone).map(filterZone(predicates)),
})

export const filterZone = (predicates: DiagramPredicates) => (
  zone: Zone
): Zone => ({
  partType: zone.partType,
  uid: zone.uid,
  name: zone.name,
  domains: zone.domains.filter(predicates.domain).map(filterDomain(predicates)),
  flags: zone.flags,
  tags: zone.tags,
})
export const filterDomain = (predicates: DiagramPredicates) => (
  domain: Domain
): Domain => ({
  partType: domain.partType,
  uid: domain.uid,
  name: domain.name,
  entities: domain.entities
    .filter(
      foldEntity(
        predicates.module,
        predicates.externalModule,
        predicates.component
      )
    )
    .map(filterEntity(predicates)),
  flags: domain.flags,
  tags: domain.tags,
})
export const filterEntity = (predicates: DiagramPredicates) => (
  entity: Entity
): Entity =>
  foldEntity<Entity>(
    filterModule(predicates),
    filterExternalModule(predicates),
    filterComponent(predicates)
  )(entity)
export const filterModule = (predicates: DiagramPredicates) => (
  module: Module
): Module => ({
  partType: module.partType,
  uid: module.uid,
  name: module.name,
  components: module.components
    .filter(predicates.component)
    .map(filterComponent(predicates)),
  api: module.api && filterApi(predicates)(module.api),
  flags: module.flags,
  tags: module.tags,
})
export const filterExternalModule = (predicates: DiagramPredicates) => (
  externalModule: ExternalModule
): ExternalModule => ({
  partType: externalModule.partType,
  uid: externalModule.uid,
  type: externalModule.type,
  name: externalModule.name,
  relations: externalModule.relations
    .filter(predicates.relation)
    .map(filterRelation(predicates)),
  flags: externalModule.flags,
  tags: externalModule.tags,
})
export const filterComponent = (predicates: DiagramPredicates) => (
  component: Component
): Component => ({
  partType: component.partType,
  uid: component.uid,
  name: component.name,
  type: component.type,
  relations: component.relations
    .filter(predicates.relation)
    .map(filterRelation(predicates)),
  flags: component.flags,
  tags: component.tags,
})
export const filterApi = (predicates: DiagramPredicates) => (
  api: Api
): Api => ({
  name: api.name,
  resources: api.resources
    .filter(predicates.resource)
    .map(filterResource(predicates)),
})
export const filterResource = (predicates: DiagramPredicates) => (
  resource: Resource
): Resource => resource
export const filterRelation = (predicates: DiagramPredicates) => (
  relation: Relation
): Relation => relation
