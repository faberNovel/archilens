import path from "path"
import fs from "node:fs/promises"
import { spawn } from "node:child_process"
import { promisify } from "node:util"

import {
  Component,
  Domain,
  isComponent,
  Module,
  Part,
  Relation,
  RelationEnd,
  System,
} from "../engine/models"
import { prune, PruneOpts } from "../engine/prune"
import { RelationType } from "../shared/models"

export type D2DisplayInfo = {
  readonly type?: string | undefined
  readonly icon?: string | undefined
}

export type D2GetDisplayInfo = (
  type: string,
  partType: "Module" | "Component"
) => D2DisplayInfo | undefined
export function D2GetDisplayInfo(
  icons: Record<string, string | undefined>
): D2GetDisplayInfo
export function D2GetDisplayInfo(
  moduleIcons: Record<string, string | undefined>,
  componentIcons: Record<string, string | undefined>
): D2GetDisplayInfo
export function D2GetDisplayInfo(
  moduleIcons: Record<string, string | undefined>,
  componentIcons?: Record<string, string | undefined>
): D2GetDisplayInfo {
  const icons = {
    Module: moduleIcons,
    Component: componentIcons ?? moduleIcons,
  } as const
  return (type, partType) => {
    const iconsForPartType = icons[partType]
    if (!iconsForPartType) {
      return { type }
    }
    const icon = iconsForPartType[type]
    return icon ? { icon } : undefined
  }
}

export type D2Options = PruneOpts & {
  readonly getDisplayInfo?: undefined | D2GetDisplayInfo
  readonly displayRelatedComponents?: undefined | boolean
}

export async function generateSVG(
  /** name without the extension */ filename: string,
  system: System,
  opts: D2Options
): Promise<void> {
  const d2Filename = `${filename}.d2`
  const svgFilename = `${filename}.svg`
  console.log(`generating ${svgFilename} using D2...`)
  const dirname = path.dirname(d2Filename)
  await fs.access(dirname).catch(() => fs.mkdir(dirname, { recursive: true }))
  // console.log(`  generating ${d2Filename}...`)
  const d2 = generateD2(system, opts)
  await fs.writeFile(d2Filename, d2)
  // console.log(`  generating ${d2Filename}... OK`)
  // console.log(`  generating ${svgFilename}...`)
  const executable = process.env.D2_EXECUTABLE ?? "d2"
  const args = [
    `--layout=${process.env.D2_LAYOUT ?? "elk"}`,
    d2Filename,
    svgFilename,
  ]
  // console.log(`    ${executable} ${args.map(a => JSON.stringify(a)).join(" ")}...`)
  const process_child = spawn(executable, args)
  await (new Promise((resolve, reject) => {
    process_child.on("error", reject)
    process_child.on("exit", (code) => {
      // console.log(`    ${executable} ${args.map(a => JSON.stringify(a)).join(" ")}... OK`)
      if (code !== 0) {
        reject(new Error(`d2 exited with code ${code}`))
      } else {
        resolve(undefined)
      }
    })
  }))
  // console.log(`  generating ${svgFilename}... OK`)
  return undefined
}

export function generateD2(system: System, opts: D2Options): string {
  const [pruned, isSelected] = prune(system, opts)
  const realOpts = new RealD2Options(opts, isSelected, pruned)
  return [
    `# data updated at ${system.lastUpdateAt.toISOString()}`,
    `# schema generated at ${new Date().toISOString()}`,
    "",
    ...pruned.domains.flatMap((d) => generateDomain(d, realOpts)),
    "",
    ...pruned.relations.flatMap((r) => generateRelation(r, realOpts)),
  ].join("\n")
}

function generateDomain(domain: Domain, opts: RealD2Options): string[] {
  return [
    `${domain.uid}: "${domain.label}" {`,
    ...opts.selectedStyle(domain),
    ...domain.domains
      .flatMap((d) => generateDomain(d, opts.addDepth()))
      .map(indent),
    ...domain.modules
      .flatMap((m) => generateModule(m, opts.addDepth()))
      .map(indent),
    "}",
  ]
}

function generateModule(module: Module, opts: RealD2Options): string[] {
  const displayInfo: D2DisplayInfo =
    opts.getDisplayInfo(module.type, "Module") ?? {}
  const icon = displayInfo.icon && `icon: ${displayInfo.icon}`
  const shape = icon && module.components.length === 0 ? ["shape: image"] : []
  const moduleType = displayInfo.type ? `«${module.type}»\\n` : ""
  return [
    `${module.uid}: "${moduleType}${module.label}" {`,
    ...opts.selectedStyle(module),
    ...(icon ? [...shape, icon].map(indent) : []),
    ...module.components
      .flatMap((c) => generateComponent(c, opts.addDepth()))
      .map(indent),
    "}",
  ]
}

function generateComponent(
  component: Component,
  opts: RealD2Options
): string[] {
  if (!opts.isSelected(component) && !opts.displayRelatedComponents) {
    return []
  }
  const displayInfo: D2DisplayInfo =
    opts.getDisplayInfo(component.type, "Component") ?? {}
  const icon = displayInfo.icon && `icon: ${displayInfo.icon}`
  const shape = icon ? ["shape: image"] : []
  const componentType = displayInfo.type ? `«${component.type}»\\n` : ""
  return [
    `${component.uid}: "${componentType}${component.label}" {`,
    ...opts.selectedStyle(component),
    ...(icon ? [...shape, icon] : []).map(indent),
    "}",
  ]
}

function generateRelation(relation: Relation, opts: RealD2Options): string[] {
  const source = opts.uptoModule(relation.source)
  const target = opts.uptoModule(relation.target)
  if (
    source === target &&
    (relation.source !== source || relation.target !== target) &&
    !opts.displayRelatedComponents
  ) {
    return []
  }
  let arrow: string
  let custom: string
  switch (relation.relationType) {
    case RelationType.Ask:
      arrow = "->"
      custom = "{ style.border-radius: 5 }"
      break
    case RelationType.Listen:
      arrow = "<-"
      custom =
        "{ style.border-radius: 5; style.stroke-dash: 3; style.animated: true }"
      break
  }
  const description = relation.description ? `"${relation.description}" ` : ""
  return [
    `${source.path(".")} ${arrow} ${target.path(".")}: ${description}${custom}`,
  ]
}

class RealD2Options {
  readonly system: System
  readonly depth: number
  readonly isSelected: (part: Part) => boolean
  readonly getDisplayInfo: D2GetDisplayInfo
  readonly displayRelatedComponents: boolean
  constructor(
    opts: Partial<RealD2Options> | undefined,
    isSelected: (part: Part) => boolean,
    system: System,
    depth: number = 0
  ) {
    this.system = system
    this.depth = depth
    this.isSelected = isSelected
    this.getDisplayInfo = opts?.getDisplayInfo ?? (() => undefined)
    this.displayRelatedComponents = opts?.displayRelatedComponents ?? false
  }

  uptoModule(part: Module): Module
  uptoModule(part: RelationEnd): RelationEnd
  uptoModule(part: RelationEnd) {
    return this.doesUptoModule(part) ? part.parent : part
  }
  doesUptoModule(part: RelationEnd): boolean {
    return (
      isComponent(part) &&
      !this.isSelected(part) &&
      !this.displayRelatedComponents
    )
  }
  addDepth(): RealD2Options {
    return new RealD2Options(this, this.isSelected, this.system, this.depth + 1)
  }

  selectedStyle(part: Part): string[] {
    if (!this.isSelected(part)) {
      return []
    }
    let color: string
    switch (this.depth) {
      case 1:
        color = "#49bc99"
        break
      case 2:
        color = "#a7e2d0"
        break
      default:
        color = "#ebfdf7"
        break
    }
    return ["  style.bold: true", `  style.fill: "${color}"`]
  }
}

function indent(s: string): string {
  return "  " + s
}
