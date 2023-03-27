import p from "node:path"
import { readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"

import * as YAML from "js-yaml"

type IncludeFileOpts = {
  rootDir: string
  srcDir: string
}
function IncludeFileOpts(rootDir: string): IncludeFileOpts {
  return { rootDir, srcDir: rootDir }
}

function parseInDir(opts: IncludeFileOpts, path: string): unknown {
  const src = readFileSync(p.join(opts.srcDir, path), "utf8")
  return YAML.safeLoad(src, {
    schema: YAML.Schema.create(
      new YAML.Type("tag:yaml.org,2002:inc/file", {
        kind: "scalar",
        resolve: (data: unknown) => typeof data === "string",
        construct: (filepath) => {
          const dirname = p.dirname(filepath)
          const filename = p.basename(filepath)
          const srcDir = p.isAbsolute(filename)
            ? p.normalize(opts.rootDir + dirname)
            : p.join(opts.srcDir, dirname)
          return parseInDir({ ...opts, srcDir }, filename)
        },
      }),
    ),
    filename: path,
  })
}

export type YamlInput = string | { dir: string; file: string }

export function loadSync(input: YamlInput): unknown {
  if (typeof input === "string") {
    const src = readFileSync(input === "stdin" ? 0 : input, "utf-8")
    return YAML.safeLoad(src)
  } else {
    const parsed = parseInDir(IncludeFileOpts(input.dir), input.file)
    if (!parsed || typeof parsed !== "object") {
      throw new Error(`Invalid YAML file: ${input}`)
    }
    return parsed
  }
}

export async function load(input: string): Promise<unknown> {
  const src = await readFile(input, { encoding: "utf-8" })
  return YAML.safeLoad(src)
}
