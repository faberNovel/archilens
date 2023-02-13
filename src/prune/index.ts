import { RelationType } from "../models"

export const PruneLevel = {
  Nothing: "Nothing",
  Zone: "Zone",
  Domain: "Domain",
  Module: "Module",
  Component: "Component",
} as const
export type PruneLevel = keyof (typeof PruneLevel)

export type PruneOptions = {
  readonly level: PruneLevel
  readonly relationLevel: PruneLevel
  readonly focus: string[]
  readonly focusTags: string[]
  readonly completelyExclude: string[]
  readonly exclude: string[]
  readonly excludeTags: string[]
  readonly softExclude: string[]
  readonly softExcludeDeep: string[]
  readonly open: string[]
  readonly openTags: string[]
  readonly close: string[]
  readonly reverseRelationTypes: RelationType[]
}
export function PruneOptions(args: Partial<PruneOptions>): PruneOptions {
  return {
    level: args.level ?? PruneLevel.Nothing,
    relationLevel: args.relationLevel ?? PruneLevel.Nothing,
    focus: args.focus ?? [],
    focusTags: args.focusTags ?? [],
    completelyExclude: args.completelyExclude ?? [],
    exclude: args.exclude ?? [],
    excludeTags: args.excludeTags ?? [],
    softExclude: args.softExclude ?? [],
    softExcludeDeep: args.softExcludeDeep ?? [],
    open: args.open ?? [],
    openTags: args.openTags ?? [],
    close: args.close ?? [],
    reverseRelationTypes: args.reverseRelationTypes ?? [],
  }
}
