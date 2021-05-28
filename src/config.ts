import { z } from "zod"

import { PruneLevel, PruneOptions } from "./prune"
import { RelationType } from "./models"

export const enum PruneType {
  Api = "Api",
  Architecture = "Architecture",
}
export const pruneType: z.ZodType<PruneType> = z.enum([
  PruneType.Api,
  PruneType.Architecture,
])

export const pruneLevel: z.ZodType<PruneLevel> = z.enum([
  PruneLevel.Nothing,
  PruneLevel.Zone,
  PruneLevel.Domain,
  PruneLevel.Module,
  PruneLevel.Component,
])

export const relationType: z.ZodType<RelationType> = z.enum([
  RelationType.Ask,
  RelationType.Tell,
  RelationType.Listen,
])

export const pruneOptionsPartial: z.ZodType<Partial<PruneOptions>> = z.object({
  level: pruneLevel.optional(),
  relationLevel: pruneLevel.optional(),
  focus: z.array(z.string().nonempty()).optional(),
  focusTags: z.array(z.string().nonempty()).optional(),
  completelyExclude: z.array(z.string().nonempty()).optional(),
  exclude: z.array(z.string().nonempty()).optional(),
  excludeTags: z.array(z.string().nonempty()).optional(),
  softExclude: z.array(z.string().nonempty()).optional(),
  softExcludeDeep: z.array(z.string().nonempty()).optional(),
  open: z.array(z.string().nonempty()).optional(),
  openTags: z.array(z.string().nonempty()).optional(),
  close: z.array(z.string().nonempty()).optional(),
  reverseRelationTypes: z.array(relationType).optional(),
})

export type DiagramConfig = {
  output: string | undefined
  pruneType: PruneType
  pruneOptions: PruneOptions
}
export const diagramConfig: z.ZodType<DiagramConfig> = (() => {
  type SemiRaw = Partial<PruneOptions> & {
    output: string
    type?: PruneType | undefined
  }
  const semiRaw: z.ZodType<SemiRaw> = pruneOptionsPartial.and(
    z.object({
      output: z.string(),
      type: pruneType.optional(),
    })
  )
  const transformed = semiRaw.transform(
    (imported): DiagramConfig => ({
      output: imported.output,
      pruneType: imported.type ?? PruneType.Architecture,
      pruneOptions: {
        level: imported.level ?? PruneLevel.Nothing,
        relationLevel:
          imported.relationLevel ??
          (imported.type === PruneType.Api
            ? PruneLevel.Nothing
            : imported.relationLevel ??
              (imported.level
                ? [PruneLevel.Module, PruneLevel.Component].includes(
                    imported.level
                  )
                  ? PruneLevel.Module
                  : PruneLevel.Nothing
                : PruneLevel.Module)),
        focus: imported.focus ?? [],
        focusTags: imported.focusTags ?? [],
        completelyExclude: imported.completelyExclude ?? [],
        exclude: imported.exclude ?? [],
        excludeTags: imported.excludeTags ?? [],
        softExclude: imported.softExclude ?? [],
        softExcludeDeep: imported.softExcludeDeep ?? [],
        open: imported.open ?? [],
        openTags: imported.openTags ?? [],
        close: imported.close ?? [],
        reverseRelationTypes: imported.reverseRelationTypes ?? [],
      },
    })
  )
  return (transformed as unknown) as z.ZodType<DiagramConfig>
})()

export type Config = {
  sourceDirectory: string
  input: string
  diagrams: DiagramConfig[]
}
export const config: z.ZodType<Config> = (() => {
  const semiRaw = z.object({
    sourceDirectory: z.string(),
    input: z.string().default("index.yml"),
    diagrams: z.array(diagramConfig),
  })
  const transformed = semiRaw.transform(
    (imported): Config => ({
      sourceDirectory: imported.sourceDirectory,
      input: imported.input,
      diagrams: imported.diagrams,
    })
  )
  return transformed as z.ZodType<Config>
})()

export function parseConfig(raw: unknown): Config {
  return config.parse(raw)
}
