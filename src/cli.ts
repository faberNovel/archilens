import { program } from "commander"
import { RelationType } from "./models"
import { PruneLevel, PruneOptions } from "./prune"

function die(message: string): never {
  console.error(message)
  return process.exit(1)
}

program
  .version("0.1.0")
  .option(
    "-l,--level <level>",
    "Level",
    (
      value: string,
      previous: PruneLevel | undefined
    ): PruneLevel | undefined => {
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
    "-rl,--relation-level <level>",
    "Level",
    (
      value: string,
      previous: PruneLevel | undefined
    ): PruneLevel | undefined => {
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
    (value: string, previous: string[]) => [...previous, value],
    []
  )
  .option(
    "-e,--exclude <id>",
    "Exclude part",
    (value: string, previous: string[]) => [...previous, value],
    []
  )
  .option(
    "-o,--open <id>",
    "Open part",
    (value: string, previous: string[]) => [...previous, value],
    []
  )
  .option(
    "-rrt,--reverse-relation-type <level>",
    "Level",
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

export function parseCli(args: string[]): PruneOptions {
  program.parse(args)
  const cliOpts = program.opts()
  return {
    level: cliOpts.level || PruneLevel.Nothing,
    relationLevel: cliOpts.relationLevel ?? cliOpts.level ?? PruneLevel.Module,
    focus: cliOpts.focus,
    exclude: cliOpts.exclude,
    open: cliOpts.open,
    reverseRelationTypes: [
      ...new Set(cliOpts.reverseRelationType as RelationType[]),
    ],
  }
}
