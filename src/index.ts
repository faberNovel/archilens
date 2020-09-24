import { program } from "commander"
import YAML from "yaml"
import fs from "fs"

import { RelationType } from "./models"
import {
  generateDiagram,
  GenerationLevel,
  GenerationOptions,
} from "./generator"
import { DiagramImport, importDiagram } from "./import"
import { fold } from "fp-ts/Either"
import { pipe } from "fp-ts/pipeable"
import { failure as reportFailure } from "io-ts/PathReporter"
import { debug } from "./debug"

function die(message: string): never {
  console.error(message)
  return process.exit(1)
}

function main(): void {
  program
    .version("0.1.0")
    .option(
      "-l,--level <level>",
      "Level",
      (value: string, previous: GenerationLevel): GenerationLevel => {
        switch (value) {
          case "nothing":
            return GenerationLevel.Nothing
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
      GenerationLevel.Nothing as GenerationLevel
    )
    .option(
      "-rl,--relation-level <level>",
      "Level",
      (
        value: string,
        previous: GenerationLevel | undefined
      ): GenerationLevel | undefined => {
        switch (value) {
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
  program.parse(process.argv)
  const cliOpts = program.opts()
  debug("cliOpts", cliOpts)
  debug("cliOpts.reverseRelationType", cliOpts.reverseRelationType)
  const options: GenerationOptions = {
    level: cliOpts.level,
    relationLevel:
      cliOpts.relationLevel ??
      (cliOpts.level === GenerationLevel.Domain
        ? GenerationLevel.Domain
        : GenerationLevel.Module),
    focus: cliOpts.focus,
    exclude: cliOpts.exclude,
    open: cliOpts.open,
    reverseRelationTypes: [
      ...new Set(cliOpts.reverseRelationType as RelationType[]),
    ],
  }
  const raw = fs.readFileSync(0, "utf-8")
  const content = YAML.parse(raw)
  const imported: DiagramImport = pipe(
    DiagramImport.decode(content),
    fold(
      (errs) => {
        console.warn(`Errors`, reportFailure(errs))
        process.exit(1)
      },
      (diagram) => diagram
    )
  )
  const diagram = importDiagram(imported)
  const generated = generateDiagram(options, diagram)
  console.log(generated)
}
main()
