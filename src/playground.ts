import { spawn } from 'node:child_process'

import { CliConfig, parseCli } from "./cli"
import { parseSimple } from "./parser"
import { parseConfig } from "./config"
export { PruneType } from "./config"
import { importFromNotion, getNotionClient, NotionConfig } from "./importer/notion"
export { AllRelationTypes } from "./models"
import { AllRelationTypes, CompleteRelation, Diagram as LibDiagram } from "./models"
import {
  Part as LibPart,
  Zone as LibZone,
  Domain as LibDomain,
  ExternalModule as LibExternalModule,
  Module as LibModule, isModule as isLibModule,
  Component as LibComponent, isComponent as isLibComponent,
} from "./models"
import { generateDiagram as generateMermaidDiagram } from "./generator/mermaid/module"
import { generateDiagram as generateD2Diagram } from "./generator/d2/module"
import { PrunedDiagram, pruneDiagram } from "./prune/module"
import { PruneLevel, PruneOptions, PruneOptions as RealPruneOptions } from './prune'
export { PruneLevel } from './prune'

// Note: the rest of the code uses the name "modules" for the services, and "entities" for the modules

const mkPath = (...parts: string[]): string => parts.join('.')

const filterUndefined = <T, U extends T>(obj: T | undefined, predicate: (e: T) => e is U): U | undefined => {
  if (obj === undefined) return
  if (!predicate(obj)) return
  return obj
}

declare global {
  interface Array<T> {
    collect<U>(fn: (el: T) => U | undefined): U[]
  }
}
Array.prototype.collect = function<T, U>(this: T[], fn: (el: T) => U | undefined): U[] {
  const result: U[] = []
  for (const el of this) {
    const newEl = fn(el)
    if (newEl !== undefined) {
      result.push(newEl)
    }
  }
  return result
}

type Descendents<ChildType extends Part> = Iterable<ChildType> & {
  list: ChildType[]
  ids: string[]
  uids: string[]
  paths: string[]
  get(id: string): ChildType | undefined
  find(id: string, acceptSingleId?: boolean | undefined): Part | undefined
  filter<C extends ChildType>(fn: (el: ChildType) => el is C): Descendents<C>
}
type DescendentsBuilder<ChildType extends Part> = {
  descendents: Descendents<ChildType>
  addChildren(elems: ChildType[]): void
}
function buildDescendents<ChildType extends Part>(firstChildren: ChildType[] = []): DescendentsBuilder<ChildType> {
  const children: ChildType[] = []
  const childrenById: Record<string, ChildType> = {}
  const childrenByUid: Record<string, ChildType> = {}
  const addChildren = (elems: ChildType[]): void => {
    for (const el of elems) {
      children.push(el)
      childrenById[el.id] = el
      childrenByUid[el.path] = el
      childrenByUid[el.uid] = el
    }
  }
  addChildren(firstChildren)
  const get = (id: string): ChildType | undefined => childrenById[id] || childrenByUid[id]
  const find = (id: string, acceptSingleId?: boolean | undefined): Part | undefined => {
    const foundChildById = acceptSingleId === true ? childrenById[id] : undefined
    if (foundChildById) return foundChildById
    const foundChild = childrenByUid[id]
    if (foundChild) return foundChild
    for (const child of children) {
      const foundDescendant = child.get(id, false)
      if (foundDescendant) return foundDescendant
    }
  }
  let descendents: Descendents<ChildType>
  const filter = <C extends ChildType>(predicate: (el: Part) => el is C): Descendents<C> =>
    buildFilteredDescendents<ChildType, C>(descendents, predicate)
  descendents = {
    [Symbol.iterator]: () => children[Symbol.iterator](),
    get list() { return children },
    get ids() { return children.map(c => c.id) },
    get uids() { return children.map(c => c.uid) },
    get paths() { return children.map(c => c.path) },
    get,
    find,
    filter,
  }
  return {
    descendents,
    addChildren,
  }
}
function buildFilteredDescendents<ChildType extends Part, SpecifiedType extends ChildType>(
  filtered: Descendents<ChildType>,
  predicate: (child: Part) => child is SpecifiedType,
): Descendents<SpecifiedType> {
  const filteredChildren = () => filtered.list.filter(predicate)
  const descendents: Descendents<SpecifiedType> = {
    [Symbol.iterator]: () => filteredChildren()[Symbol.iterator](),
    get list() { return filteredChildren() },
    get ids() { return filteredChildren().map(c => c.id) },
    get uids() { return filteredChildren().map(c => c.uid) },
    get paths() { return filteredChildren().map(c => c.path) },
    get: (id: string) => filterUndefined(filtered.get(id), predicate),
    find: (uid: string) => filterUndefined(filtered.find(uid), predicate),
    filter: <T extends SpecifiedType>(p: (child: Part) => child is T) =>
      buildFilteredDescendents(descendents, p),
  }
  return descendents
}

export type Diagram = {
  readonly lib: LibDiagram
  readonly zones: Descendents<Zone>
  zone(id: string): Zone | undefined
  get(id: string): Part | undefined
  readonly display: Display
}
const Diagram = (libDiagram: LibDiagram, display: Display): Diagram => {
  const { descendents: zones, addChildren: addZones } = buildDescendents<Zone>()
  const diagram: Diagram = {
    lib: libDiagram,
    zones,
    zone: zones.get,
    get: zones.find,
    display,
  }
  addZones(libDiagram.zones.map(z => Zone(diagram, z)))
  return diagram;
}

export type PartType = "Zone" | "Domain" | "Module" | "Component"
export const PartType = {
  Zone: "Zone",
  Domain: "Domain",
  Module: "Module",
  Component: "Component",
} satisfies Record<PartType, PartType>

export type Part = {
  readonly diagram: Diagram
  readonly partType: PartType
  readonly lib: LibPart
  readonly path: string
  readonly uid: string
  readonly id: string
  get(id: string, acceptSingleId?: boolean | undefined): Part | undefined
}

export type Zone = Part & {
  readonly diagram: Diagram
  readonly lib: LibZone
  readonly partType: typeof PartType.Zone
  readonly name: string
  readonly domains: Descendents<Domain>
  domain(id: string): Domain | undefined
}
const Zone = (diagram: Diagram, libZone: LibZone): Zone => {
  const { descendents: domains, addChildren: addDomains } = buildDescendents<Domain>()
  const zone: Zone = {
    diagram,
    partType: PartType.Zone,
    lib: libZone,
    path: libZone.id,
    uid: libZone.uid,
    id: libZone.id,
    name: libZone.name,
    domains,
    domain: domains.get,
    get: domains.find,
  }
  addDomains(libZone.domains.map(d => Domain(zone, d)))
  return zone;
}
export const isZone = (part: Part): part is Zone => part.partType === PartType.Zone
export type Domain = Part & {
  readonly partType: typeof PartType.Domain
  readonly lib: LibDomain
  readonly zone: Zone
  readonly name: string
  readonly entities: Descendents<Module | Component>
  entity(id: string): Module | Component | undefined
  readonly modules: Descendents<Module>
  module(id: string): Module | undefined
  readonly apps: Descendents<App>
  app(id: string): Module | undefined
  readonly services: Descendents<Service>
  service(id: string): Module | undefined
  readonly components: Descendents<Component>
  component(id: string): Component | undefined
  display(opts?: PlaygroundOptions): Promise<unknown>
}
const Domain = (zone: Zone, libDomain: LibDomain): Domain => {
  const { descendents: entities, addChildren: addEntities } = buildDescendents<Module | Component>()
  const modules = entities.filter(isModule)
  const apps = entities.filter(isApp)
  const services = entities.filter(isService)
  const components = entities.filter(isComponent)
  const domain: Domain = {
    get diagram() { return zone.diagram },
    partType: PartType.Domain,
    lib: libDomain,
    path: mkPath(zone.path, libDomain.id),
    zone,
    uid: libDomain.uid,
    id: libDomain.id,
    name: libDomain.name,
    entities,
    entity: entities.get,
    modules: modules,
    module: modules.get,
    apps: entities.filter(isApp),
    app: apps.get,
    services: entities.filter(isService),
    service: services.get,
    components: entities.filter(isComponent),
    component: components.get,
    get: entities.find,
    display: (opts?: PlaygroundOptions): Promise<unknown> => {
      return displayDomain(domain.diagram, domain, domain.diagram.display, opts)
    }
  }
  addEntities(libDomain.entities.map(libEntity => {
    if (isLibComponent(libEntity)) {
      return Component(domain, libEntity)
    } else {
      return Module(domain, libEntity)
    }
  }))
  return domain
}
export const isDomain = (part: Part): part is Domain => part.partType === PartType.Domain

export type ModuleType = "Service" | "App"
export const ModuleType = {
  Service: "Service",
  App: "App",
} satisfies Record<ModuleType, ModuleType>
export type Module = Part & {
  readonly partType: typeof PartType.Module
  readonly moduleType: ModuleType
  readonly lib: LibModule | LibExternalModule
  readonly domain: Domain
  readonly uid: string
  readonly id: string
  readonly name: string
  readonly components: Descendents<Component>
  component(id: string): Component | undefined
  // relations
  display(opts?: PlaygroundOptions): Promise<unknown>
}
const Module = (domain: Domain, libModule: LibModule | LibExternalModule): Module => {
  const { descendents: components, addChildren: addComponents } = buildDescendents<Component>()
  const module: Module = {
    get diagram() { return domain.diagram },
    partType: PartType.Module,
    moduleType: (
      (libModule.partType === "ExternalModule" && libModule.type === "App")
        ? ModuleType.App
        : ModuleType.Service
    ),
    lib: libModule,
    path: mkPath(domain.path, libModule.id),
    domain,
    uid: libModule.uid,
    id: libModule.id,
    name: libModule.name,
    components,
    component: components.get,
    get: components.find,
    display: (opts?: PlaygroundOptions): Promise<unknown> => {
      if (isService(module)) {
        return displayService(module.diagram, module, module.diagram.display, opts)
      } else {
        throw new Error(`Module ${module.path} is not a service`)
      }
    }
  }
  if (isLibModule(libModule)) {
    addComponents(libModule.components.map(c => Component(module, c)))
  }
  return module
}
export const isModule = (part: Part): part is Module => part.partType === PartType.Module
export type Service = Module & { moduleType: typeof ModuleType.Service }
export const isService = (part: Part): part is Service =>
isModule(part) && part.moduleType === ModuleType.Service
export type App = Module & { moduleType: typeof ModuleType.App }
export const isApp = (part: Part): part is App =>
  isModule(part) && part.moduleType === ModuleType.App


export type Component = Part & {
  readonly partType: typeof PartType.Component
  readonly parent: Domain | Module
  readonly domain: Domain | undefined
  readonly service: Service | undefined
  readonly uid: string
  readonly id: string
  readonly name: string
  readonly type: string

  // relations
}
const Component = (parent: Domain | Module, libComponent: LibComponent): Component => ({
  get diagram() { return parent.diagram },
  partType: PartType.Component,
  path: mkPath(parent.path, libComponent.id),
  lib: libComponent,
  parent,
  domain: isDomain(parent) ? parent : undefined,
  service: isService(parent) ? parent : undefined,
  uid: libComponent.uid,
  id: libComponent.id,
  name: libComponent.name,
  type: libComponent.type,
  get: (id: string, acceptSingleId?: boolean | undefined): Part | undefined => undefined,
})
export const isComponent = (part: Part): part is Component => part.partType === PartType.Component


export type Display = {
  text: (content: string) => unknown,
  markdown: (content: string) => unknown,
  html: (content: string) => unknown,
}

export type RealPlaygroundOptions = {
  syntax: "d2" | "mermaid"
  width: string
}
export type PlaygroundOptions = Partial<RealPlaygroundOptions> | undefined
function PlaygroundOptions(options: PlaygroundOptions): RealPlaygroundOptions {
  return {
    syntax: options?.syntax ?? "d2",
    width: options?.width ?? "100%",
  }
}

export type PruneOption = Partial<RealPruneOptions>

export type PlaygroundContext = {
  diagram: Diagram
  get(id: string): Part | undefined
  zone(id: string): Zone | undefined
  domain(id: string): Domain | undefined
  module(id: string): Module | undefined
  app(id: string): App | undefined
  service(id: string): Service | undefined
  component(id: string): Component | undefined
  prune(pruneOpts: PruneOption, opts?: PlaygroundOptions): PrunedDiagram
  toText(pruneOpts: PruneOption, opts?: PlaygroundOptions): string | undefined
  toImage(pruneOpts: PruneOption, opts?: PlaygroundOptions): Promise<unknown>
  displayPart(id: string, opts?: PlaygroundOptions): Promise<unknown>
}
export async function init(
  configFile: string,
  notionToken: string,
  display: Display,
  globalOpts?: PlaygroundOptions,
): Promise<PlaygroundContext> {
  const libDiagram = await getDiagram(configFile, notionToken)
  const diagram = Diagram(libDiagram, display)

  const ctx = {
    diagram,
    get: (id: string): Part | undefined => diagram.get(id),
    zone: (id: string): Zone | undefined => { const p = ctx.get(id); return p && isZone(p) ? p : undefined },
    domain: (id: string): Domain | undefined => { const p = ctx.get(id); return p && isDomain(p) ? p : undefined },
    module: (id: string): Module | undefined => { const p = ctx.get(id); return p && isModule(p) ? p : undefined },
    app: (id: string): App | undefined => { const p = ctx.get(id); return p && isApp(p) ? p : undefined },
    service: (id: string): Service | undefined => { const p = ctx.get(id); return p && isService(p) ? p : undefined },
    component: (id: string): Component | undefined => { const p = ctx.get(id); return p && isComponent(p) ? p : undefined },
    prune: (pruneOpts: PruneOption, opts?: PlaygroundOptions): PrunedDiagram => {
      return prune(ctx.diagram, pruneOpts)
    },
    toText: (pruneOpts: PruneOption, opts?: PlaygroundOptions): string | undefined => {
      const realOps = {...opts, ...globalOpts}
      const pruned = ctx.prune(pruneOpts, realOps)
      return diagramToText(pruned, realOps)
    },
    toImage: (pruneOpts: PruneOption, opts?: PlaygroundOptions): Promise<unknown> => {
      const realOps = {...opts, ...globalOpts}
      const pruned = ctx.prune(pruneOpts, realOps)
      return diagramToImage(pruned, display, realOps)
    },
    displayPart: async (id: string, opts?: PlaygroundOptions): Promise<unknown> => {
      const part = ctx.get(id)
      if (!part) return
      if (isDomain(part)) return displayDomain(ctx.diagram, part, display, opts)
      if (isService(part)) return displayService(ctx.diagram, part, display, opts)
    },
  }
  return ctx
}

function getDiagram(configFile: string, notionToken: string): Promise<LibDiagram> {
  const cli = parseCli(['', '', '-c', configFile]) as CliConfig
  const config = parseConfig(parseSimple(cli.config)).input as NotionConfig
  const client = getNotionClient(notionToken)
  return importFromNotion({ config, client })
}

function prune(diagram: Diagram, pruneOpts: PruneOption): PrunedDiagram {
  return pruneDiagram(PruneOptions(pruneOpts), diagram.lib)
}

function diagramToText(diagram: PrunedDiagram, opts?: PlaygroundOptions): string | undefined {
  const realOps = PlaygroundOptions(opts)
  const genOptions = {}
  if (realOps.syntax === "mermaid") {
    return generateMermaidDiagram(genOptions, diagram)
  } else {
    return generateD2Diagram(genOptions, diagram)
  }
}

async function diagramToImage(diagram: PrunedDiagram, display: Display, opts?: PlaygroundOptions): Promise<unknown> {
  const realOps = PlaygroundOptions(opts)
  const text = diagramToText(diagram, opts)
  if (!text) return text
  if (realOps.syntax === "mermaid") {
    return convertMermaid(text, display)
  } else {
    return convertD2(text, display, opts)
  }
}

function splitWrappingXmlTag(xml: string): [string | undefined, string, string | undefined] {
  const split = xml.split('>')
  if (split.length < 3) return [undefined, xml, undefined]
  if (split[split.length-1] !== '') return [undefined, xml, undefined]
  return [split[0] + '>', split.slice(1, -1).join('>').trim() + '>', split[split.length-2] + '>']
}
function splitXmlDeclarationTag(xml: string): [string | undefined, string] {
  const rx = /^<\?[^>]+\?>/
  const header = xml.match(rx)
  if (!header) return [undefined, xml]
  return [header[0], xml.replace(rx, '').trim()]
}
export async function convertD2(input: string, display: Display, opts?: PlaygroundOptions): Promise<unknown> {
  const realOps = PlaygroundOptions(opts)
  return new Promise<string>((resolve, reject) => {
    const d2 = spawn('d2', ['-'], { stdio: "pipe" })
    d2.stdin.write(input, () => { d2.stdin.end() })
    d2.on('error', reject)
    const output: string[] = []
    d2.stdout.on('data', (data) => output.push(data.toString()))
    d2.on('close', (code) => {
      if (code !== 0) reject(new Error("d2 exited with code " + code))
      resolve(output.join(''))
    })
  }).then(svg => {
    const [xmlDecl, svgContent] = splitXmlDeclarationTag(svg)
    const [svgIn, svgBody, svgOut] = splitWrappingXmlTag(svgContent)
    const svgInFixed = svgIn?.replace(/\bwidth="[^"]+"/, (_full, attr, _val) => {
      return `${attr}="${realOps.width}"`
    }).replace(/\bheight="[^"]+"/, '')
    display.html([xmlDecl, svgInFixed, svgBody, svgOut].join(""))
  })
}

export async function convertMermaid(input: string, display: Display): Promise<unknown> {
  return display.markdown("```mermaid\n" + input + "\n```")
}

export async function displayDomain(diagram: Diagram, domain: Domain, display: Display, opts?: PlaygroundOptions): Promise<unknown> {
  const realOps = PlaygroundOptions(opts)
  if (!domain) return
  const pruned = prune(diagram, {
    reverseRelationTypes: AllRelationTypes,
    relationLevel: PruneLevel.Module,
    open: [domain.uid],
    focus: domain.entities.uids,
  })
  return diagramToImage(pruned, display, realOps)
}

export async function displayService(diagram: Diagram, service: Service, display: Display, opts?: PlaygroundOptions): Promise<unknown> {
  const realOps = PlaygroundOptions(opts)
  if (!service) return
  const pruned = prune(diagram, {
    reverseRelationTypes: AllRelationTypes,
    relationLevel: PruneLevel.Component,
    open: [service.uid],
  })
  return diagramToImage(pruned, display, realOps)
}
