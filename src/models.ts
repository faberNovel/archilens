export const enum PartType {
  Zone = "Zone",
  Domain = "Domain",
  Module = "Module",
  ExternalModule = "ExternalModule",
  Component = "Component",
}

export const enum ExternalModuleType {
  Generic = "Generic",
  Legacy = "Legacy",
  App = "App",
}
export function getExternalModuleTypeOrFail(id: string): ExternalModuleType {
  switch (id.toLowerCase()) {
    case "generic":
      return ExternalModuleType.Generic
    case "legacy":
      return ExternalModuleType.Legacy
    case "app":
      return ExternalModuleType.App
    default:
      throw new Error(`Unknown ExternalModuleType '${id}'`)
  }
}

export type ExternalModule = {
  readonly partType: PartType.ExternalModule
  readonly id: string
  readonly type: ExternalModuleType
  readonly name: string
  readonly relations: readonly Relation[]
}

export type Resource = {
  readonly id: string
  readonly name: string
}

export type Api = {
  readonly resources: readonly Resource[]
}

export type Module = {
  readonly partType: PartType.Module
  readonly id: string
  readonly name: string
  readonly components: readonly Component[]
  readonly api?: Api
}

export type Component = {
  readonly partType: PartType.Component
  readonly id: string
  readonly name: string
  readonly type: string
  readonly relations: readonly Relation[]
}

export const enum RelationType {
  Ask = "Ask",
  Tell = "Tell",
  Listen = "Listen",
}
export function getRelationTypeOrFail(id: string): RelationType {
  switch (id.toLowerCase()) {
    case "ask":
      return RelationType.Ask
    case "tell":
      return RelationType.Tell
    case "listen":
      return RelationType.Listen
    default:
      throw new Error(`Unknown RelationType '${id}'`)
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
  readonly id: string
  readonly name: string
  readonly entities: readonly Entity[]
}

export type Zone = {
  readonly partType: PartType.Zone
  readonly id: string
  readonly name: string
  readonly domains: readonly Domain[]
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
