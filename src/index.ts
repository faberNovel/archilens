import { program } from "commander";

import { component } from "./models";
import {
  generateDiagram,
  GenerationLevel,
  GenerationOptions,
} from "./generator";
import { diagram } from "./diagram";

function main(): void {
  program
    .version("0.1.0")
    .option(
      "-l,--level <level>",
      "Level",
      (value, previous) =>
        value === "component"
          ? GenerationLevel.Component
          : GenerationLevel.Module,
      GenerationLevel.Module
    )
    .option(
      "-o,--open <id>",
      "Open entity",
      (value, previous: string[]) => [...previous, value],
      []
    )
    .option(
      "-c,--close <id>",
      "Open entity",
      (value, previous: string[]) => [...previous, value],
      []
    );
  program.parse(process.argv);
  const cliOpts = program.opts();
  const options: GenerationOptions = {
    level: cliOpts.level,
    open: cliOpts.open,
    close: cliOpts.close,
  };
  const generated = generateDiagram(diagram(), options);
  console.log(generated);
}
main();
