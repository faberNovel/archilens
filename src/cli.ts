import p from "path"

import { program } from "commander"

import { Config, DiagramConfig, PruneType } from "./config"
import { RelationType } from "./models"
import { PruneLevel, PruneOptions } from "./prune"

function die(message: string): never {
  console.error(message)
  return process.exit(1)
}

program
  .version("0.1.0")
  .option("-i,--input <file>", "Input file", (value: string): string => value)
  .option("-o,--output <file>", "Ouput file", (value: string): string => value)
  .option(
    "-c,--config <file>",
    "Configuration file",
    (value: string): string => value
  )
  .option(
    "-sd,--source-directory <dir>",
    "Source base directory",
    (value: string): string => value
  )
  .option(
    "-l,--level <level>",
    "Level (nothing|zone|domain|module|component)",
    (value: string): PruneLevel | undefined => {
      switch (value) {
        case "nothing":
          return PruneLevel.Nothing
        case "zone":
          return PruneLevel.Zone
        case "domain":
          return PruneLevel.Domain
        case "module":
        case "api":
          return PruneLevel.Module
        case "component":
        case "resource":
          return PruneLevel.Component
        default:
          return die(`Invalid level: ${value}`)
      }
    }
  )
  .option(
    "-rl,--relation-level <level>",
    "Relation level (nothing|zone|domain|module|component)",
    (value: string): PruneLevel => {
      switch (value) {
        case "nothing":
          return PruneLevel.Nothing
        case "zone":
          return PruneLevel.Zone
        case "domain":
          return PruneLevel.Domain
        case "module":
          return PruneLevel.Module
        case "component":
          return PruneLevel.Component
        default:
          return die(`Invalid level: ${value}`)
      }
    },
    undefined
  )
  .option(
    "-f,--focus <id>",
    "Focus on part",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-ft,--focus-tag <id>",
    "Focus parts with tag",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-ce,--completely-exclude <id>",
    "Exclude this part and its relations",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-e,--exclude <id>",
    "Exclude this part",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-et,--exclude-tag <id>",
    "Exclude parts with tag",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-se,--soft-exclude <id>",
    "Only include this part if it is referenced",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-sed,--soft-exclude-deep <id>",
    "Only include this part of its descent if it is referenced",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-o,--open <id>",
    "Include this part and its children",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-ot,--open-tag <id>",
    "Include parts with this tags and their children",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-c,--close <id>",
    "Doesn't open this part",
    (value: string, previous: string[]) => [...previous, ...value.split(",")],
    []
  )
  .option(
    "-rrt,--reverse-relation-type <level>",
    "Reverse relation level (none|all|ask|tell|listen)",
    (value: string, previous: RelationType[]): RelationType[] => {
      switch (value) {
        case "none":
          return []
        case "all":
          return [
            ...previous,
            RelationType.Ask,
            RelationType.Tell,
            RelationType.Listen,
          ]
        case "ask":
          return [...previous, RelationType.Ask]
        case "tell":
          return [...previous, RelationType.Tell]
        case "listen":
          return [...previous, RelationType.Listen]
        default:
          return die(`Invalid level: ${value}`)
      }
    },
    [] as RelationType[]
  )
  .option(
    "-t,--type <type>",
    "Schema type (api | module)",
    (value: string): PruneType => {
      switch (value) {
        case "api":
          return PruneType.Api
        case "archi":
        case "architecture":
          return PruneType.Architecture
        default:
          return die(`Invalid type: ${value}`)
      }
    },
    PruneType.Architecture as PruneType
  )

export type CliOptions =
  | { type: "config"; config: string }
  | (Config & { type: "cli" })

export function parseCli(args: string[]): CliOptions {
  program.parse(args)
  const cliOpts = program.opts()
  if (cliOpts.config) {
    return { type: "config", config: cliOpts.config }
  }
  return {
    type: "cli",
    input: cliOpts.input && {
      configType: "YAML",
      rootFile: p.basename(cliOpts.input),
      sourceDirectory:
        cliOpts.sourceDirectory ??
        (cliOpts.input ? p.dirname(cliOpts.input) : "."),
    },
    diagrams: [
      {
        output: cliOpts.output,
        pruneType: cliOpts.type,
        pruneOptions: {
          level: cliOpts.level ?? PruneLevel.Nothing,
          relationLevel:
            cliOpts.type === PruneType.Api
              ? PruneLevel.Nothing
              : cliOpts.relationLevel ??
                (cliOpts.level
                  ? [PruneLevel.Module, PruneLevel.Component].includes(
                      cliOpts.level
                    )
                    ? PruneLevel.Module
                    : PruneLevel.Nothing
                  : PruneLevel.Module),
          focus: cliOpts.focus,
          focusTags: cliOpts.focusTag,
          completelyExclude: cliOpts.completelyExclude,
          exclude: cliOpts.exclude,
          excludeTags: cliOpts.excludeTag,
          softExclude: cliOpts.softExclude,
          softExcludeDeep: cliOpts.softExcludeDeep,
          open: cliOpts.open,
          openTags: cliOpts.openTag,
          close: cliOpts.close,
          reverseRelationTypes: [
            ...new Set(cliOpts.reverseRelationType as RelationType[]),
          ],
        },
      },
    ],
  }
}
