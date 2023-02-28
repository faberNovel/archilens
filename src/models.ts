export type PartType = "Zone" | "Domain" | "Module" | "ExternalModule" | "Component"
export const PartType = {
  Zone: "Zone",
  Domain: "Domain",
  Module: "Module",
  ExternalModule: "ExternalModule",
  Component: "Component",
} satisfies Record<PartType, PartType>

export type ExternalModuleType = "External" | "Legacy" | "App" | "Platform"
export const ExternalModuleType = {
  External: "External",
  Legacy: "Legacy",
  App: "App",
  Platform: "Platform",
} satisfies Record<ExternalModuleType, ExternalModuleType>

export function getExternalModuleType(
  type: string
): ExternalModuleType | undefined {
  switch (type.toLowerCase()) {
    case "app":
      return ExternalModuleType.App
    case "external":
      return ExternalModuleType.External
    case "legacy":
      return ExternalModuleType.Legacy
    case "platform":
      return ExternalModuleType.Platform
    default:
      return undefined
  }
}
export function getExternalModuleTypeOrFail(type: string): ExternalModuleType {
  const emt = getExternalModuleType(type)
  if (emt === undefined) {
    throw new Error(`Unknown ExternalModuleType '${type}'`)
  }
  return emt
}

export type Flags = {
  readonly softExcludeDeep?: boolean
}

export type ExternalModule = {
  readonly partType: typeof PartType.ExternalModule
  readonly uid: string
  readonly id: string
  readonly type: ExternalModuleType
  readonly name: string
  readonly relations: readonly Relation[]
  readonly flags?: Flags
  readonly tags: readonly string[]
}

export type Resource = {
  readonly uid: string
  readonly id: string
  readonly name: string
}

export type Api = {
  readonly type: string
  readonly name: string
  readonly resources: readonly Resource[]
}

export type Module = {
  readonly partType: typeof PartType.Module
  readonly uid: string
  readonly id: string
  readonly name: string
  readonly components: readonly Component[]
  readonly apis: Api[]
  readonly flags?: Flags
  readonly tags: readonly string[]
}

export type Component = {
  readonly partType: typeof PartType.Component
  readonly uid: string
  readonly id: string
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
export const AllRelationTypes: RelationType[] = [RelationType.Ask, RelationType.Tell, RelationType.Listen]

export function isAsyncRelationType(rt: RelationType): boolean {
  return rt !== RelationType.Ask
}
export function isListenRelationType(rt: RelationType): boolean {
  return rt === RelationType.Listen
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

export function isAsyncRelation(rel: Relation): boolean {
  return isAsyncRelationType(rel.type)
}
export function isListenRelation(rel: Relation): boolean {
  return isListenRelationType(rel.type)
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
  readonly partType: typeof PartType.Domain
  readonly uid: string
  readonly id: string
  readonly name: string
  readonly entities: readonly Entity[]
  readonly flags?: Flags
  readonly tags: readonly string[]
}

export type Zone = {
  readonly partType: typeof PartType.Zone
  readonly uid: string
  readonly id: string
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

export const foldEntity =
  <A>(
    fnModule: (module: Module) => A,
    fnExternalModule: (externalModule: ExternalModule) => A,
    fnComponent: (component: Component) => A
  ) =>
  (entity: Entity): A => {
    if (isModule(entity)) {
      return fnModule(entity)
    }
    if (isExternalModule(entity)) {
      return fnExternalModule(entity)
    }
    return fnComponent(entity)
  }

export type Predicate<A> = (value: A) => boolean

export type DiagramPredicates = {
  componentTypes: Predicate<string>
  zone: Predicate<Zone>
  domain: Predicate<Domain>
  module: Predicate<Module>
  externalModule: Predicate<ExternalModule>
  component: Predicate<Component>
  relation: Predicate<Relation>
  resource: Predicate<Resource>
}

export const Predicates: {
  readonly ALWAYS: (v: boolean) => Predicate<unknown>
  readonly ACCEPT: Predicate<unknown>
  readonly REJECT: Predicate<unknown>
} = {
  ALWAYS:
    (v: boolean) =>
    <A>(_: A) =>
      v,
  ACCEPT: (_: unknown) => true,
  REJECT: (_: unknown) => false,
}

export const filterDiagram =
  (predicates: DiagramPredicates) =>
  (diagram: Diagram): Diagram => ({
    componentTypes: diagram.componentTypes.filter(predicates.componentTypes),
    zones: diagram.zones.filter(predicates.zone).map(filterZone(predicates)),
  })

export const filterZone =
  (predicates: DiagramPredicates) =>
  (zone: Zone): Zone => ({
    partType: zone.partType,
    uid: zone.uid,
    id: zone.id,
    name: zone.name,
    domains: zone.domains
      .filter(predicates.domain)
      .map(filterDomain(predicates)),
    flags: zone.flags,
    tags: zone.tags,
  })
export const filterDomain =
  (predicates: DiagramPredicates) =>
  (domain: Domain): Domain => ({
    partType: domain.partType,
    uid: domain.uid,
    id: domain.id,
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
export const filterEntity =
  (predicates: DiagramPredicates) =>
  (entity: Entity): Entity =>
    foldEntity<Entity>(
      filterModule(predicates),
      filterExternalModule(predicates),
      filterComponent(predicates)
    )(entity)
export const filterModule =
  (predicates: DiagramPredicates) =>
  (module: Module): Module => ({
    partType: module.partType,
    uid: module.uid,
    id: module.id,
    name: module.name,
    components: module.components
      .filter(predicates.component)
      .map(filterComponent(predicates)),
    apis: module.apis
      .map(filterApi(predicates))
      .filter((e) => e !== undefined) as Api[],
    flags: module.flags,
    tags: module.tags,
  })
export const filterExternalModule =
  (predicates: DiagramPredicates) =>
  (externalModule: ExternalModule): ExternalModule => ({
    partType: externalModule.partType,
    uid: externalModule.uid,
    id: externalModule.id,
    type: externalModule.type,
    name: externalModule.name,
    relations: externalModule.relations
      .filter(predicates.relation)
      .map(filterRelation(predicates)),
    flags: externalModule.flags,
    tags: externalModule.tags,
  })
export const filterComponent =
  (predicates: DiagramPredicates) =>
  (component: Component): Component => ({
    partType: component.partType,
    uid: component.uid,
    id: component.id,
    name: component.name,
    type: component.type,
    relations: component.relations
      .filter(predicates.relation)
      .map(filterRelation(predicates)),
    flags: component.flags,
    tags: component.tags,
  })
export const filterApi =
  (predicates: DiagramPredicates) =>
  (api: Api): Api => ({
    name: api.name,
    type: api.type,
    resources: api.resources
      .filter(predicates.resource)
      .map(filterResource(predicates)),
  })
export const filterResource =
  (predicates: DiagramPredicates) =>
  (resource: Resource): Resource =>
    resource
export const filterRelation =
  (predicates: DiagramPredicates) =>
  (relation: Relation): Relation =>
    relation
