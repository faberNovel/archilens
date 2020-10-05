import p from "path"
import fs from "fs"

import * as YAML from "js-yaml"

import { debug } from "./debug"

type IncludeFileOpts = {
  rootDir: string
  srcDir: string
}
const IncludeFileOpts = (rootDir: string) => ({ rootDir, srcDir: rootDir })
const YamlIncludeFileType = (opts: IncludeFileOpts): YAML.Type =>
  new YAML.Type("tag:yaml.org,2002:inc/file", {
    kind: "scalar",
    resolve: (data: unknown) => typeof data === "string",
    construct: (filepath) => {
      const dirname = p.dirname(filepath)
      const filename = p.basename(filepath)
      const srcDir = p.isAbsolute(filename)
        ? p.normalize(opts.rootDir + dirname)
        : p.join(opts.srcDir, dirname)
      return parseYaml({ ...opts, srcDir }, filename)
    },
  })
const YamlIncludeFileSchema = (opts: IncludeFileOpts) =>
  YAML.Schema.create(YamlIncludeFileType(opts))
const parseYaml = (opts: IncludeFileOpts, path?: string) => {
  const src = fs.readFileSync(path ? p.join(opts.srcDir, path) : 0, "utf8")
  return YAML.safeLoad(src, {
    schema: YamlIncludeFileSchema(opts),
    filename: path ?? "stdin",
  })
}

export function parse(srcDir: string, input?: string): object {
  const parsed = parseYaml(IncludeFileOpts(srcDir), input)
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid YAML file: ${input ? `'${input}'` : "<stdin>"}`)
  }
  return parsed
}
