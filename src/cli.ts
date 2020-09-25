import { program } from "commander"
import { GenerationLevel, GenerationOptions } from "./generator"
import { RelationType } from "./models"

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
      previous: GenerationLevel | undefined
    ): GenerationLevel | undefined => {
      switch (value) {
        case "nothing":
          return GenerationLevel.Nothing
        case "zone":
          return GenerationLevel.Zone
        case "domain":
          return GenerationLevel.Domain
        case "module":
          return GenerationLevel.Module
        case "component":
          return GenerationLevel.Component
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
      previous: GenerationLevel | undefined
    ): GenerationLevel | undefined => {
      switch (value) {
        case "nothing":
          return GenerationLevel.Nothing
        case "zone":
          return GenerationLevel.Zone
        case "domain":
          return GenerationLevel.Domain
        case "module":
          return GenerationLevel.Module
        case "component":
          return GenerationLevel.Component
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

export function parseCli(args: string[]): GenerationOptions {
  program.parse(args)
  const cliOpts = program.opts()
  return {
    level: cliOpts.level || GenerationLevel.Nothing,
    relationLevel:
      cliOpts.relationLevel ?? cliOpts.level ?? GenerationLevel.Module,
    focus: cliOpts.focus,
    exclude: cliOpts.exclude,
    open: cliOpts.open,
    reverseRelationTypes: [
      ...new Set(cliOpts.reverseRelationType as RelationType[]),
    ],
  }
}
