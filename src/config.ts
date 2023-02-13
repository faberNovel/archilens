import { z } from "zod"

import { PruneLevel, PruneOptions } from "./prune"
import { RelationType } from "./models"
import { NotionConfig } from "./importer/notion"

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
                ? [PruneLevel.Module, PruneLevel.Component].includes(imported.level as any)
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
  return transformed as unknown as z.ZodType<DiagramConfig>
})()

export type YamlConfig = {
  configType: "YAML"
  sourceDirectory: string
  rootFile: string
}

export type HldConfig = {
  output: string
  extension: string
  links: {
    prefix?: string | undefined
    suffix: string
  }
}

export type Config = {
  input: NotionConfig | YamlConfig
  hld?: HldConfig | undefined
  diagrams: DiagramConfig[]
}
export const config: z.ZodType<Config> = z.object({
  input: (
    z
      .object({
        sourceDirectory: z.string(),
        rootFile: z.string().default("index.yaml"),
      })
      .transform((c) => ({
        ...c,
        configType: "YAML",
      })) as unknown as z.ZodType<YamlConfig>
  ).or(
    z
      .object({
        useCache: z.boolean().default(true),
        cacheDir: z.string().default(".notion_cache"),
        pages: z.object({
          projects: z.string(),
          modules: z.string(),
          components: z.string(),
          relations: z.string(),
          apis: z.string(),
          resources: z.string(),
        }),
      })
      .transform((c) => ({
        ...c,
        configType: "NotionConfig",
      })) as unknown as z.ZodType<NotionConfig>
  ),
  hld: z.object({
    output: z.string(),
    extension: z.string(),
    links: z.object({
      prefix: z.string().optional(),
      suffix: z.string(),
    }),
  }).optional(),
  diagrams: z.array(diagramConfig),
})

export function parseConfig(raw: unknown): Config {
  return config.parse(raw)
}
