import { Component, Domain, Module, Relation, System } from '../../engine/models'
import { RelationType } from '../../shared/models'

export type D2Options = {
  readonly depth: number
  readonly iconFromComponentType: (type: string) => string | undefined
  readonly iconFromModuleType: (type: string) => string | undefined
}
export function D2Options(opts?: Partial<D2Options>): D2Options {
  return {
    depth: opts?.depth ?? 0,
    iconFromComponentType: opts?.iconFromComponentType ?? (() => undefined),
    iconFromModuleType: opts?.iconFromModuleType ?? (() => undefined),
  }
}

function addDepth(opts: D2Options): D2Options {
  return { ...opts, depth: opts.depth + 1 }
}

function indent(s: string): string {
  return '  ' + s
}

export function generate(system: System, opts?: Partial<D2Options>): string {
  const realOpts = D2Options(opts)
  return [
    `# data updated at ${system.lastUpdateAt.toISOString()}`,
    `# schema generated at ${new Date().toISOString()}`,
    '',
    ...system.domains.flatMap(d => generateDomain(d, realOpts)),
    '',
    ...system.relations.map(r => generateRelation(r, realOpts)),
  ].join("\n")
}

function generateDomain(domain: Domain, opts: D2Options): string[] {
  return [
    `${domain.uid}: "${domain.label}" {`,
    ...domain.domains.flatMap(d => generateDomain(d, addDepth(opts))).map(indent),
    ...domain.modules.flatMap(m => generateModule(m, addDepth(opts))).map(indent),
    "}",
  ]
}

function generateModule(module: Module, opts: D2Options): string[] {
  const icon = opts.iconFromModuleType(module.type)
  const shape = icon && module.components.length === 0 ? ['shape: image'] : []
  return [
    `${module.uid}: "${module.label}" {`,
    ...(icon ? [...shape, `icon: ${icon}`].map(indent) : []),
    ...module.components.flatMap(c => generateComponent(c, addDepth(opts))).map(indent),
    "}",
  ]
}

function generateComponent(component: Component, opts: D2Options): string[] {
  const icon = opts.iconFromComponentType(component.type)
  return [
    `${component.uid}: "${component.label}" {`,
    ...(icon ? ['shape: image', `icon: ${icon}`] : []).map(indent),
    "}",
  ]
}

function generateRelation(relation: Relation, opts: D2Options): string {
  const source = relation.source.path.map((p) => p.uid).join(".")
  const target = relation.target.path.map((p) => p.uid).join(".")
  let arrow: string
  let custom: string
  switch (relation.relationType) {
    case RelationType.Ask:
      arrow = "->"
      custom = "{ style.border-radius: 5 }"
      break
    case RelationType.Listen:
      arrow = "<-"
      custom = "{ style.border-radius: 5; style.stroke-dash: 3; style.animated: true }"
      break
  }
  const description = relation.description ? `"${relation.description}" ` : ''
  return `${source} ${arrow} ${target}: ${description}${custom}`
}
