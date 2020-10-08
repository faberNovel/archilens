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
}
export function getExternalModuleTypeOrFail(uid: string): ExternalModuleType {
  switch (uid.toLowerCase()) {
    case "external":
      return ExternalModuleType.External
    case "legacy":
      return ExternalModuleType.Legacy
    case "app":
      return ExternalModuleType.App
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
}

export type Component = {
  readonly partType: PartType.Component
  readonly uid: string
  readonly name: string
  readonly type: string
  readonly relations: readonly Relation[]
  readonly flags?: Flags
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
}

export type Entity = Module | ExternalModule | Component

export type Domain = {
  readonly partType: PartType.Domain
  readonly uid: string
  readonly name: string
  readonly entities: readonly Entity[]
  readonly flags?: Flags
}

export type Zone = {
  readonly partType: PartType.Zone
  readonly uid: string
  readonly name: string
  readonly domains: readonly Domain[]
  readonly flags?: Flags
}

export type Diagram = {
  readonly componentTypes: readonly string[]
  readonly zones: Zone[]
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
