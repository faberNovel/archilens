import { RelationType } from "../models"

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
  readonly focusTags: string[]
  readonly exclude: string[]
  readonly excludeTags: string[]
  readonly softExclude: string[]
  readonly softExcludeDeep: string[]
  readonly open: string[]
  readonly openTags: string[]
  readonly close: string[]
  readonly reverseRelationTypes: RelationType[]
}
