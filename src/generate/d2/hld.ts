import path from "path"

import {
  D2GetDisplayInfo,
  generateCustomSvg,
  generateSvgFile,
  wrapInMd,
} from "./schema"
import { Tag, Uid } from "../../shared/models"
import { Part, System } from "../../engine/models"
import { RelationInclusion } from "../../engine/prune"

export type Variation = {
  name: string
  alt?: string
  path: string
  hideComponents: boolean
  exclude?: (Uid | string)[]
  excludeTags?: (Tag | string)[]
}

export type Specific = {
  name: string
  path: string
  hideComponents: boolean
  includeTags: (Tag | string)[]
}

export type GenerateHldOpts = {
  readonly getDisplayInfo?: D2GetDisplayInfo
  readonly followRelations?: RelationInclusion | undefined
  readonly followInverseRelations?: RelationInclusion | undefined
  readonly hideComponents?: boolean | undefined
  readonly mergeRelations?: boolean | undefined
  readonly forceOnResources?: boolean | undefined
  readonly forceOnTags?: boolean | undefined
  readonly generateComponentsSchemas?: boolean | undefined
  readonly variations?: Variation[]
  readonly specifics?: Specific[]
}
export async function writeHldAsSvgFiles(
  outputDir: string,
  diagram: System,
  opts: GenerateHldOpts,
): Promise<void> {
  const variations: Variation[] = opts.variations ?? [
    { name: "HLD", path: "hld", hideComponents: true },
  ]

  await generateCustomSvg(
    `${outputDir}/svg/index.svg`,
    wrapInMd(
      "__body",
      variations
        .map((v) => [v.name, `${v.path}/index.svg`])
        .map(([n, p]) => `[${n}](${p})`)
        .join(" | "),
    ),
    {
      ...opts,
      d2Filepath: `${outputDir}/d2/index.d2`,
      header: "Index",
    },
  )

  await genVariations(
    diagram,
    "Index",
    outputDir,
    variations.map((v) => ({ ...v, hideComponents: true })),
    "index.svg",
    { include: diagram.domains.map((d) => d.uid) },
    opts,
  )

  if (opts.specifics) {
    for (const variation of variations) {
      await generateCustomSvg(
        `${outputDir}/svg/${variation.path}/_specifics/index.svg`,
        wrapInMd(
          "__body",
          opts.specifics.map((s) => `[${s.name}](${s.path}.svg)`).join(" | "),
        ),
        {
          ...opts,
          d2Filepath: `${outputDir}/d2/${variation.path}/_specifics/index.d2`,
          header: "Specifics",
          footer: [
            ["index", "index.svg"],
            ...variations
              .filter((v) => v.name !== variation.name)
              .map((v) => [v.name, `../${v.path}/index.svg`]),
          ]
            .map(([n, p]) => `[${n}](../${p})`)
            .join(" | "),
        },
      )
      for (const specific of opts.specifics) {
        await genDiagram(
          diagram,
          specific.name,
          outputDir,
          variation,
          `_specifics/${specific.path}.svg`,
          { include: specific.includeTags.map(Tag) },
          undefined,
          false,
          [
            ["index", "../index.svg"],
            ...(opts.specifics
              ? ([["Specifics", "index.svg"]] satisfies [string, string][])
              : []),
          ],
          {
            ...opts,
            forceOnTags: true,
          },
        )
      }
    }
  }

  for (const variation of variations) {
    await generateCustomSvg(
      `${outputDir}/svg/${variation.path}/_resources/index.svg`,
      wrapInMd(
        "__body",
        diagram
          .resources()
          .map((r) => `[${r.label}](./${r.uid}.svg)`)
          .join(" | "),
      ),
      {
        ...opts,
        d2Filepath: `${outputDir}/d2/${variation.path}/_resources/index.d2`,
        header: "Resources",
        footer: [
          ["index", "index.svg"],
          ...(opts.specifics ? [["Specifics", "_specifics/index.svg"]] : []),
          ...variations
            .filter((v) => v.name !== variation.name)
            .map((v) => [v.name, `${v.path}/index.svg`]),
        ]
          .map(([n, p]) => `[${n}](../${p})`)
          .join(" | "),
      },
    )
  }
  for (const resource of diagram.resources()) {
    await genVariations(
      diagram,
      resource.label,
      outputDir,
      variations,
      `_resources/${resource.uid}.svg`,
      { includeResources: [resource.uid] },
      opts,
    )
  }

  for (const [uid, part] of diagram.parts) {
    if (opts.generateComponentsSchemas !== false || !part.isComponent) {
      await genVariations(
        diagram,
        part.label,
        outputDir,
        variations.map((v) => ({
          ...v,
          hideComponents: part.isDomain || v.hideComponents,
        })),
        part.path(path.sep) + ".svg",
        { open: [uid] },
        opts,
      )
    }
  }
}

async function genVariations(
  diagram: System,
  title: string,
  outputDir: string,
  variations: Variation[],
  svgRelativePath: string,
  target: { include: Uid[] } | { open: Uid[] } | { includeResources: Uid[] },
  opts: GenerateHldOpts,
) {
  for (const variation of variations) {
    const others: [string, string][] = variations
      .filter((v) => v.name !== variation.name)
      .map((v) => [v.name, path.join("..", v.path, svgRelativePath)])
    const alt: string | undefined =
      variation.alt && new Map(others).get(variation.alt)
    await genDiagram(
      diagram,
      title,
      outputDir,
      variation,
      svgRelativePath,
      target,
      alt,
      true,
      [
        ["index", "index.svg"],
        ...(opts.specifics
          ? ([["Specifics", "_specifics/index.svg"]] satisfies [
              string,
              string,
            ][])
          : []),
        ["Resources", "_resources/index.svg"],
        ...others,
      ],
      opts,
    )
  }
}

async function genDiagram(
  diagram: System,
  title: string,
  basePath: string,
  variation: Variation,
  svgRelativePath: string,
  target:
    | { include: (Uid | Tag)[] }
    | { open: Uid[] }
    | { includeResources: Uid[] },
  alt: string | undefined,
  links: boolean,
  footerLinks: [string, string][],
  opts: GenerateHldOpts,
) {
  const d2Filepath = path.join(
    basePath,
    "d2",
    variation.path,
    svgRelativePath.replace(".svg", ".d2"),
  )
  const svgFilepath = path.join(
    basePath,
    "svg",
    variation.path,
    svgRelativePath,
  )
  function genRelLink(target: string): string {
    return path.relative(path.dirname(svgRelativePath), target)
  }
  function getLink(
    alt: string | undefined,
  ): (part: Part) => string | undefined {
    return (part: Part): string | undefined => {
      let partPath = `${part.path(path.sep)}.svg`
      if (svgRelativePath === partPath && alt) {
        partPath = alt
      }
      return genRelLink(partPath)
    }
  }
  const exclude = [
    ...(variation.exclude?.map(Uid) ?? []),
    ...(variation.excludeTags?.map(Tag) ?? []),
  ]
  await generateSvgFile(svgFilepath, diagram, {
    ...target,
    getLink: links ? getLink(alt) : undefined,
    d2Filepath,
    getDisplayInfo: opts.getDisplayInfo,
    followRelations: opts.followRelations ?? 1,
    followInverseRelations: opts.followInverseRelations ?? 1,
    forceOnResources: opts.forceOnResources,
    forceOnTags: opts.forceOnTags,
    hideComponents: variation.hideComponents,
    displayRelatedComponents: !variation.hideComponents,
    exclude,
    header: `# ${title}`,
    footer: footerLinks.map(([k, v]) => `[${k}](${genRelLink(v)})`).join(" | "),
  })
}
