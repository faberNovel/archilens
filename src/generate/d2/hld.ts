import path from "path"

import {
  D2GetDisplayInfo,
  generateCustomSVG,
  generateSVG,
  wrapInMd,
} from "./schema"
import { Uid } from "../../shared/models"
import { Part, Resource, System } from "../../engine/models"
import { RelationInclusion } from "../../engine/prune"
import { wrap } from "module"

export type GenerateHldOpts = {
  readonly getDisplayInfo?: D2GetDisplayInfo
  readonly followRelations?: RelationInclusion | undefined
  readonly followInverseRelations?: RelationInclusion | undefined
  readonly hideComponents?: boolean | undefined
  readonly forceOnResources?: boolean | undefined
}
export async function generateHld(
  outputDir: string,
  diagram: System,
  opts: GenerateHldOpts,
): Promise<void> {
  await generateCustomSVG(
    `${outputDir}/svg/index.svg`,
    wrapInMd("__body", "[HLD](hld/index.svg) | [LLD](lld/index.svg)"),
    {
      ...opts,
      d2Filepath: `${outputDir}/d2/index.d2`,
      header: "Index",
    },
  )

  for (const kind of ["hld", "lld"]) {
    await generateCustomSVG(
      `${outputDir}/svg/${kind}/_resources/index.svg`,
      wrapInMd(
        "__body",
        diagram
          .resources()
          .map((r) => `[${r.label}](./${r.uid}.svg)`)
          .join(" | "),
      ),
      {
        ...opts,
        d2Filepath: `${outputDir}/d2/_resources/index.d2`,
        header: "Resources",
        footer: "[index](../index.svg) | " + (kind === "hld" ? "[LLD](../../lld/_resources/index.svg)" : "[HLD](../../hld/_resources/index.svg)"),
      },
    )
  }
  for (const resource of diagram.resources()) {
    await generateResource(
      diagram,
      resource,
      outputDir,
      `_resources/${resource.uid}.svg`,
      { index: "index.svg", Resources: "_resources/index.svg" },
      opts,
    )
  }

  await generatePart(
    diagram,
    "Index",
    outputDir,
    "index.svg",
    { include: diagram.domains.map((d) => d.uid) },
    { index: "../index.svg", Resources: "_resources/index.svg" },
    opts,
  )
  for (const [uid, part] of diagram.parts) {
    await generatePart(
      diagram,
      part.label,
      outputDir,
      part.path(path.sep) + ".svg",
      part.isDomain ? { open: [uid] } : [uid],
      { index: "index.svg", Resources: "_resources/index.svg" },
      opts,
    )
  }
}

async function generateResource(
  diagram: System,
  resource: Resource,
  basePath: string,
  svgRelativePath: string,
  footer: Record<string, string>,
  opts: GenerateHldOpts,
): Promise<void> {
  const hldFilepath = path.join("..", "hld", svgRelativePath)
  const lldFilepath = path.join("..", "lld", svgRelativePath)
  await genDiagram(
    diagram,
    resource.label,
    basePath,
    "hld",
    svgRelativePath,
    { includeResources: [resource.uid] },
    false,
    undefined,
    {
      ...footer,
      LLD: lldFilepath,
    },
    { ...opts, hideComponents: true, forceOnResources: true },
  )
  await genDiagram(
    diagram,
    resource.label,
    basePath,
    "lld",
    svgRelativePath,
    { includeResources: [resource.uid] },
    true,
    undefined,
    {
      ...footer,
      HLD: hldFilepath,
    },
    { ...opts, forceOnResources: true },
  )
}

async function generatePart(
  diagram: System,
  title: string,
  basePath: string,
  svgRelativePath: string,
  target: { include: Uid[] } | { open: Uid[] } | Uid[],
  footer: Record<string, string>,
  opts: GenerateHldOpts,
): Promise<void> {
  const hldFilepath = path.join("..", "hld", svgRelativePath)
  const lldFilepath = path.join("..", "lld", svgRelativePath)
  await genDiagram(
    diagram,
    title,
    basePath,
    "hld",
    svgRelativePath,
    Array.isArray(target) ? { include: target } : target,
    false,
    lldFilepath,
    {
      ...footer,
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
    Array.isArray(target) ? { open: target } : target,
    Array.isArray(target),
    hldFilepath,
    { ...footer, HLD: hldFilepath },
    opts,
  )
}

async function genDiagram(
  diagram: System,
  title: string,
  basePath: string,
  prefixPath: string,
  svgRelativePath: string,
  target: { include: Uid[] } | { open: Uid[] } | { includeResources: Uid[] },
  displayRelatedComponents: boolean,
  alt: string | undefined,
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
    (alt: string | undefined) =>
    (part: Part): string | undefined => {
      let partPath = `${part.path(path.sep)}.svg`
      if (svgRelativePath === partPath && alt) {
        partPath = alt
      }
      return genRelLink(partPath)
    }
  await generateSVG(svgFilepath, diagram, {
    ...target,
    getLink: getLink(alt),
    d2Filepath,
    getDisplayInfo: opts.getDisplayInfo,
    followRelations: opts.followRelations ?? 1,
    followInverseRelations: opts.followInverseRelations ?? 1,
    hideComponents: opts.hideComponents,
    forceOnResources: opts.forceOnResources,
    displayRelatedComponents,
    header: `# ${title}`,
    footer: Object.entries(links)
      .map(([k, v]) => `[${k}](${genRelLink(v)})`)
      .join(" | "),
  })
}
