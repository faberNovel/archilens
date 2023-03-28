import { Component, Domain, isDomain, Module, Part, System } from "./engine"
import { D2GetDisplayInfoOpts, generateSvgString } from "./generate"
import { importDiagramFromYaml } from "./import"
import { Uid } from "./shared/models"

export type Display = {
  text: (content: string) => unknown
  markdown: (content: string) => unknown
  html: (content: string) => unknown
}

export type DisplayGraphOptions = {
  lld?: boolean | undefined
}

declare module "./engine" {
  interface System {
    part(id: string): Part | undefined
    domain(uid: string): Domain | undefined
    module(uid: string): Module | undefined
    component(uid: string): Component | undefined
  }

  interface Part {
    display(opts?: DisplayGraphOptions | boolean | undefined): Promise<unknown>
    child(id: string): Part | undefined
    descendent(uid: string): Part | undefined
    part(id: string): Part | undefined
    domain(uid: string): Domain | undefined
    module(uid: string): Module | undefined
    component(uid: string): Component | undefined
  }
}

export function init(display: Display, getDisplayInfo: D2GetDisplayInfoOpts) {
  Domain.prototype.display = async function (
    this: Domain,
    opts?: DisplayGraphOptions | boolean | undefined,
  ) {
    display.html(await generateSchema(this, getDisplayInfo, opts))
  }
  Module.prototype.display = async function (
    this: Module,
    opts?: DisplayGraphOptions | boolean | undefined,
  ) {
    display.html(await generateSchema(this, getDisplayInfo, opts))
  }
  Component.prototype.display = async function (
    this: Component,
    opts?: DisplayGraphOptions | boolean | undefined,
  ) {
    display.html(await generateSchema(this, getDisplayInfo, opts))
  }
}

async function generateSchema(
  part: Part,
  getDisplayInfo: D2GetDisplayInfoOpts,
  opts: DisplayGraphOptions | boolean | undefined,
): Promise<string> {
  const lld: boolean = typeof opts === "boolean" ? opts : opts?.lld ?? false
  const open: Uid[] | undefined =
    !isComponent(part) && (!isDomain(part) || lld) ? [part.uid] : undefined
  const include: Uid[] | undefined = open ? undefined : [part.uid]
  const svg = await generateSvgString(part.system, {
    getDisplayInfo,
    followRelations: 1,
    followInverseRelations: 1,
    displayRelatedComponents: lld,
    header: `# ${part.label}`,
    include,
    open,
  })
  return resizeSvg(svg)
}

function splitWrappingXmlTag(
  xml: string,
): [string | undefined, string, string | undefined] {
  const split = xml.split(">")
  if (split.length < 3) return [undefined, xml, undefined]
  if (split[split.length - 1] !== "") return [undefined, xml, undefined]
  return [
    split[0] + ">",
    split.slice(1, -1).join(">").trim() + ">",
    split[split.length - 2] + ">",
  ]
}
function splitXmlDeclarationTag(xml: string): [string | undefined, string] {
  const rx = /^<\?[^>]+\?>/
  const header = xml.match(rx)
  if (!header) return [undefined, xml]
  return [header[0], xml.replace(rx, "").trim()]
}
function resizeSvg(svg: string): string {
  const [xmlDecl, svgContent] = splitXmlDeclarationTag(svg)
  const [svgIn, svgBody, svgOut] = splitWrappingXmlTag(svgContent)
  const svgInFixed = svgIn
    ?.replace(/\bwidth="[^"]+"/, (_full, attr, _val) => {
      // return `${attr}="${realOps.width}"`
      return ""
    })
    .replace(/\bheight="[^"]+"/, "")
  return [xmlDecl, svgInFixed, svgBody, svgOut].join("")
}

export default {
  init,
  importDiagramFromYaml,
}
