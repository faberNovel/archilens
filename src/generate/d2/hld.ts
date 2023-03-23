import path from "path"

import { D2GetDisplayInfo, generateSVG } from "./generate"
import { Uid } from "../../shared/models"
import { Part, System } from "../../engine/models"
import { RelationInclusion } from "../../engine/prune"

export type GenerateHldOpts = {
  readonly getDisplayInfo?: D2GetDisplayInfo
  readonly followRelations?: undefined | RelationInclusion
  readonly followInverseRelations?: undefined | RelationInclusion
}
export async function generateHld(outputDir: string, diagram: System, opts: GenerateHldOpts) {
  await generate(
    diagram,
    "Index",
    outputDir,
    "index.svg",
    { include: diagram.domains.map((d) => d.uid) },
    "index.svg",
    opts,
  )
  for (const [uid, part] of diagram.parts) {
    if (part.isDomain || part.isModule) {
      await generate(
        diagram,
        part.label,
        outputDir,
        part.path(path.sep) + ".svg",
        part.isModule ? [uid] : { open: [uid] },
        "index.svg",
        opts,
      )
    }
  }
}

async function generate(
  diagram: System,
  title: string,
  basePath: string,
  svgRelativePath: string,
  target: { include: Uid[] } | { open: Uid[] } | Uid[],
  index: string = "index.svg",
  opts: GenerateHldOpts,
) {
  const hldFilepath = path.join("..", "hld", svgRelativePath)
  const lldFilepath = path.join("..", "lld", svgRelativePath)
  await genDiagram(
    diagram,
    title,
    basePath,
    "hld",
    svgRelativePath,
    Array.isArray(target) ? {include: target } : target,
    false,
    lldFilepath,
    {
      index,
      LLD: lldFilepath,
    },
    opts,
  )
  await genDiagram(
    diagram,
    title,
    basePath,
    "lld",
    svgRelativePath,
    Array.isArray(target) ? {open: target } : target,
    Array.isArray(target),
    hldFilepath,
    { index, HLD: hldFilepath },
    opts,
  )
}

async function genDiagram(
  diagram: System,
  title: string,
  basePath: string,
  prefixPath: string,
  svgRelativePath: string,
  target: { include: Uid[] } | { open: Uid[] },
  displayRelatedComponents: boolean,
  alt: string,
  links: Record<string, string>,
  opts: GenerateHldOpts,
) {
  const d2Filepath = path.join(
    basePath,
    "d2",
    prefixPath,
    svgRelativePath.replace(".svg", ".d2"),
  )
  const svgFilepath = path.join(basePath, "svg", prefixPath, svgRelativePath)
  function genRelLink(target: string): string {
    return path.relative(path.dirname(svgRelativePath), target)
  }
  const getLink =
    (alt: string) =>
    (part: Part): string | undefined => {
      let partPath = `${part.path(path.sep)}.svg`
      if (svgRelativePath === partPath) {
        partPath = alt
      }
      return genRelLink(partPath)
    }
  return await generateSVG(svgFilepath, diagram, {
    ...target,
    getLink: getLink(alt),
    d2Filepath,
    getDisplayInfo: opts.getDisplayInfo,
    followRelations: opts.followRelations ?? 1,
    followInverseRelations: opts.followInverseRelations ?? 1,
    displayRelatedComponents,
    header: title,
    footer: Object.entries(links)
      .map(([k, v]) => `[${k}](${genRelLink(v)})`)
      .join(" | "),
  })
}
