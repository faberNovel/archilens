import { program } from "commander"

import { component } from "./models"
import {
  generateDiagram,
  GenerationLevel,
  GenerationOptions,
} from "./generator"
import { diagram } from "./diagram"

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
  program.parse(process.argv)
  const cliOpts = program.opts()
  const options: GenerationOptions = {
    level: cliOpts.level,
    relationLevel: cliOpts.relationLevel,
    focus: cliOpts.focus,
    exclude: cliOpts.exclude,
    open: cliOpts.open,
  }
  const generated = generateDiagram(options, diagram())
  console.log(generated)
}
main()
