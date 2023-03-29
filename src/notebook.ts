import {
  Component,
  Domain,
  isComponent,
  isDomain,
  Module,
  Part,
  System,
} from "./engine"
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
  width?: string | undefined
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
  opts: DisplayGraphOptions | boolean | string | undefined,
): Promise<string> {
  const realOps: DisplayGraphOptions =
    typeof opts === "boolean"
      ? { lld: opts }
      : typeof opts === "string"
      ? { width: opts }
      : opts ?? {}
  const lld: boolean = realOps.lld ?? false
  const open: Uid[] | undefined =
    !isComponent(part) && (!isDomain(part) || lld) ? [part.uid] : undefined
  const include: Uid[] | undefined = open ? undefined : [part.uid]
  const svg = await generateSvgString(part.system, {
    getDisplayInfo,
    followRelations: 1,
    followInverseRelations: 1,
    displayRelatedComponents: lld,
    hideComponents: !lld,
    header: `# ${part.label}`,
    include,
    open,
  })
  return realOps.width
    ? `<div style=\"max-width:${realOps.width}">${svg}</div>`
    : svg
}

export default {
  init,
  importDiagramFromYaml,
}
