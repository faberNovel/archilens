import * as Engine from "../engine/models"
import { Uid } from "../shared/models"
import { asWritable, tryFocus } from "../utils/types"

import * as Import from "./models"

export class ConvertionError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export function convert(
  imported: Import.System
): Engine.System {
  const domains = imported.domains.map(d => convertDomain(d))
  const parts = new Map<Uid, Engine.Part>(domains.flatMap(d => [...d.parts]))
  const system: Engine.System = {
    lastUpdateAt: imported.lastUpdateAt,
    domains,
    get parts() { return parts },
    partByUid: (uid: Uid): Engine.Part | undefined => parts.get(uid),
    domainByUid: (uid: Uid): Engine.Domain | undefined => tryFocus(parts.get(uid), Engine.isDomain),
    moduleByUid: (uid: Uid): Engine.Module | undefined => tryFocus(parts.get(uid), Engine.isModule),
    componentByUid: (uid: Uid): Engine.Component | undefined => tryFocus(parts.get(uid), Engine.isComponent),
  }
  populateRelations(imported, system)
  return system
}

function convertDomain(
  imported: Import.Domain,
  parent: Engine.Domain | undefined = undefined
): Engine.Domain {
  const domains: Engine.Domain[] = []
  const modules: Engine.Module[] = []
  const parts: Map<Uid, Engine.Part> = new Map()
  const domain: Engine.Domain = {
    partType: "Domain",
    parent,
    uid: imported.uid,
    label: imported.label,
    domains,
    modules,
    parts,
  }
  parts.set(domain.uid, domain)
  domains.push(...imported.domains.map((d) => convertDomain(d, domain)))
  modules.push(...imported.modules.map((m) => convertModule(m, domain)))
  for (const [uid, part] of [
    ...domains.flatMap((d) => [...d.parts]),
    ...modules.flatMap((m) => [...m.parts]),
  ]) {
    parts.set(uid, part)
  }
  return domain
}

function convertModule(
  imported: Import.Module,
  parent: Engine.Domain
): Engine.Module {
  const components: Engine.Component[] = []
  const parts: Map<Uid, Engine.Module | Engine.Component> = new Map()
  const module: Engine.Module = {
    partType: "Module",
    parent,
    uid: imported.uid,
    label: imported.label,
    components: components,
    parts,
  }
  parts.set(module.uid, module)
  components.push(
    ...imported.components.map((c) => convertComponent(c, module))
  )
  for (const component of components) {
    parts.set(component.uid, component)
  }
  return module
}

function convertComponent(
  imported: Import.Component,
  parent: Engine.Module
): Engine.Component {
  const parts: Map<Uid, Engine.Component> = new Map()
  const component: Engine.Component = {
    partType: "Component",
    parent,
    uid: imported.uid,
    label: imported.label,
    relations: [],
    inverseRelations: [],
    parts,
  }
  parts.set(component.uid, component)
  return component
}



function populateRelations(imported: Import.System, system: Engine.System) {
  imported.domains.forEach((d) => populateRelationsForDomain(d, system))
}

function populateRelationsForDomain(
  imported: Import.Domain,
  system: Engine.System
) {
  imported.domains.forEach((d) => populateRelationsForDomain(d, system))
  imported.modules.forEach((m) => populateRelationsForModule(m, system))
}

function populateRelationsForModule(
  imported: Import.Module,
  system: Engine.System
) {
  imported.components.forEach((c) => populateRelationsForComponent(c, system))
}

function populateRelationsForComponent(
  imported: Import.Component,
  system: Engine.System
) {
  imported.relations.forEach((r) => populateRelation(imported.uid, r, system))
}

function populateRelation(
  sourceUid: Uid,
  imported: Import.Relation,
  system: Engine.System
) {
  const source = system.componentByUid(sourceUid)
  const target = system.componentByUid(imported.targetUid)
  if (source === undefined) {
    throw new ConvertionError(
      `Source component ${sourceUid} not found (relation: ${JSON.stringify(
        imported
      )})`
    )
  }
  if (target === undefined) {
    throw new ConvertionError(
      `Target component ${
        imported.targetUid
      } not found (relation: ${JSON.stringify({ sourceUid, ...imported })})`
    )
  }
  const relation: Engine.Relation = {
    description: imported.description,
    source,
    target,
    relationType: imported.relationType,
  }
  asWritable(source.relations).push(relation)
  asWritable(target.inverseRelations).push(relation)
}
