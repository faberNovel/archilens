import { RelationType } from "../models"

export const enum PruneType {
  Api = "Api",
  Architecture = "Architecture",
}

export const enum PruneLevel {
  Nothing = "Nothing",
  Zone = "Zone",
  Domain = "Domain",
  Module = "Module",
  Component = "Component",
}
export type PruneOptions = {
  readonly level: PruneLevel
  readonly relationLevel: PruneLevel
  readonly focus: string[]
  readonly exclude: string[]
  readonly open: string[]
  readonly reverseRelationTypes: RelationType[]
  readonly type: PruneType
}
