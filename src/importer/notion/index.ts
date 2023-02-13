import * as fs from "node:fs/promises"

import { Client as NotionClient } from "@notionhq/client"

import { toId } from "../../helpers"

import {
  getPageCheckboxOrFail,
  getPageMultiselectOrFail,
  getPageName,
  getPageNameOrFail,
  getPageRelationOrFail,
  getPageSelectOrFail,
  getPageSingleRelationOrFail,
  isNotEmptyPage,
  isNotIgnoredPage,
  Page,
  pageId,
} from "./helpers"
import {
  Component,
  Diagram,
  Domain,
  Entity,
  ExternalModuleType,
  getExternalModuleType,
  getRelationTypeOrFail,
  PartType,
  Relation,
  RelationType,
  Zone,
} from "../../models"

export type NotionConfig = {
  configType: "NotionConfig"
  useCache: boolean
  cacheDir: string
  pages: {
    projects: string
    modules: string
    components: string
    relations: string
    apis: string
    resources: string
  }
}

export type NotionContext = {
  client: NotionClient
  config: NotionConfig
}

export function getNotionClient(token?: string | undefined) {
  return new NotionClient({
    auth: token ?? process.env.NOTION_TOKEN,
  })
}

type RelationResult = {
  type: "relation"
  relation: {
    id: string
  }
  object: "property_item"
}
type RelationRetrieveResult = {
  object: "list"
  results: RelationResult[]
  next_cursor: string | null
  has_more: boolean
}

const MAX_RELATION_IN_RESULT = 20
async function completePageRelations(ctx: NotionContext, page: Page): Promise<Page> {
  for (const key of Object.keys(page.properties)) {
    const ppt = page.properties[key]
    if (
      ppt.type === "relation" &&
      ppt.relation.length >= MAX_RELATION_IN_RESULT
    ) {
      console.warn(
        `${pageId(page)} has too many relations (${
          ppt.relation.length
        }) in property '${key}'`
      )
      const retrievedRelations: RelationResult[] = []
      let nextCursor: string | null = null
      do {
        const retrieved = (await ctx.client.pages.properties.retrieve({
          page_id: page.id,
          property_id: ppt.id,
          // page_size: 30,
          start_cursor: nextCursor ?? undefined,
        })) as RelationRetrieveResult
        retrievedRelations.push(...retrieved.results)
        nextCursor = retrieved.next_cursor
      } while (nextCursor)
      ppt.relation = retrievedRelations.map((rel) => ({ id: rel.relation.id }))
      console.warn(
        `Retrieved ${retrievedRelations.length} relations for page ${pageId(
          page
        )} for property '${key}'`
      )
    }
  }
  return page
}

async function completePagesRelations(ctx: NotionContext, pages: Page[]): Promise<Page[]> {
  const completed: Page[] = []
  for (const page of pages) {
    const completedPage: Page = await completePageRelations(ctx, page)
    completed.push(completedPage)
  }
  return completed
}

function exists(path: string): Promise<boolean> {
  return fs.access(path).then(() => true).catch(() => false)
}

async function getAllPages(ctx: NotionContext, dbId: string): Promise<Page[]> {
  const cacheFile = `${ctx.config.cacheDir}/${dbId}.json`
  if (ctx.config.useCache && !(await (await exists(ctx.config.cacheDir)))) {
    await fs.mkdir(ctx.config.cacheDir, { recursive: true })
  }
  if (ctx.config.useCache && (await exists(cacheFile))) {
    return JSON.parse((await fs.readFile(cacheFile)).toString())
  }
  let response = await ctx.client.databases.query({
    database_id: dbId,
  })
  let parts = [response.results]
  while (response.next_cursor) {
    response = await ctx.client.databases.query({
      database_id: dbId,
      start_cursor: response.next_cursor || undefined,
    })
    parts = [...parts, response.results]
  }
  const filteredResults = (parts.flat() as Page[])
    .filter(isNotEmptyPage)
    .filter(isNotIgnoredPage)
  const completedResults = await completePagesRelations(ctx, filteredResults)
  if (ctx.config.useCache) {
    await fs.writeFile(
      cacheFile,
      JSON.stringify(completedResults, undefined, "  ")
    )
  }
  return completedResults
}

// --- Modules ---

type ModuleEntry = {
  id: string
  type: string
  name: string
  zone: string
  domain: string
  projectIds: string[]
  appId: string[]
  apiIds: string[]
  isFuture: boolean
  components: string[]
}

async function getModules(ctx: NotionContext): Promise<ModuleEntry[]> {
  const database: Page[] = await getAllPages(ctx, ctx.config.pages.modules)
  return database.map((page) => ({
    id: page.id,
    type: getPageSelectOrFail(page, { name: "Type" }),
    name: getPageNameOrFail(page),
    zone: getPageSelectOrFail(page, { name: "Zone" }),
    domain: getPageSelectOrFail(page, { name: "Domain" }),
    projectIds: getPageRelationOrFail(page, { name: "Projects" }),
    appId: getPageRelationOrFail(page, { name: "Is App" }),
    apiIds: getPageRelationOrFail(page, { name: "API" }),
    isFuture: getPageCheckboxOrFail(page, { name: "Future" }),
    components: getPageRelationOrFail(page, { name: "Components" }),
  }))
}

// --- Components ---

type ComponentEntry = {
  id: string
  name: string
  module: string
  type: string
  hosting: string
  language: string
  tags: string[]
}

async function getComponents(
  ctx: NotionContext,
): Promise<ComponentEntry[]> {
  const database: Page[] = await getAllPages(ctx, ctx.config.pages.components)
  return database.map((page) => ({
    id: page.id,
    name: getPageNameOrFail(page),
    module: getPageSingleRelationOrFail(page, { name: "Service" }),
    type: getPageSelectOrFail(page, { name: "Type" }),
    hosting: getPageSelectOrFail(page, { name: "Hosting" }),
    language: getPageSelectOrFail(page, { name: "Language" }),
    tags: getPageMultiselectOrFail(page, { name: "Tags" }),
  }))
}

// --- Relations ---

type RelationEntry = {
  id: string
  name: string | undefined
  componentId: string
  targetId: string
  type: RelationType
}

async function getRelations(
  ctx: NotionContext,
  componentsEntryById: Map<string, ComponentEntry>,
): Promise<RelationEntry[]> {
  const database: Page[] = await getAllPages(ctx, ctx.config.pages.relations)
  return database.map((page) => ({
    id: page.id,
    name: getPageName(page),
    componentId: getPageSingleRelationOrFail(
      page,
      { name: "Component" },
      componentsEntryById
    ),
    targetId: getPageSingleRelationOrFail(
      page,
      { name: "Target" },
      componentsEntryById
    ),
    type: getRelationTypeOrFail(getPageSelectOrFail(page, { name: "Type" })),
  }))
}

// --- Projects ---

type ProjectEntry = {
  id: string
  name: string
  secteur: string
  statut: string[]
}

async function getProjects(
  ctx: NotionContext,
): Promise<ProjectEntry[]> {
  const database: Page[] = await getAllPages(ctx, ctx.config.pages.projects)
  return database.map((page) => ({
    id: page.id,
    name: getPageNameOrFail(page),
    secteur: getPageSelectOrFail(page, { name: "Secteur" }),
    statut: getPageMultiselectOrFail(page, { name: "Statut" }),
  }))
}

// --- APIs ---

type ApiEntry = {
  id: string
  type: string
  name: string
  resources: string[]
}

async function getApis(ctx: NotionContext): Promise<ApiEntry[]> {
  const database: Page[] = await getAllPages(ctx, ctx.config.pages.apis)
  return database.map((page) => ({
    id: page.id,
    type: getPageSelectOrFail(page, { name: "Type" }),
    name: getPageNameOrFail(page),
    resources: getPageRelationOrFail(page, { name: "Resources" }),
  }))
}

// --- Resources ---

type ResourceEntry = {
  id: string
  name: string
}

async function getResources(
  ctx: NotionContext,
): Promise<ResourceEntry[]> {
  const database: Page[] = await getAllPages(ctx, ctx.config.pages.resources)
  return database.map((page) => ({
    id: page.id,
    name: getPageNameOrFail(page),
  }))
}

// --- TEST ---

export async function importFromNotion(ctx: NotionContext): Promise<Diagram> {
  function toMap<V, K extends keyof V>(arr: V[], key: K): Map<V[K], V> {
    const map = new Map<V[K], V>()
    arr.forEach((el) => map.set(el[key], el))
    return map
  }

  function groupBy<V, K extends keyof V>(arr: V[], key: K): Map<V[K], V[]> {
    const map = new Map<V[K], V[]>()
    arr.forEach((el) => {
      map.set(el[key], [...(map.get(el[key]) ?? []), el])
    })
    return map
  }

  const projectEntries = await getProjects(ctx)
  const projectEntryById = toMap(projectEntries, "id")

  const componentEntries = await getComponents(ctx)
  const componentEntryById = toMap(componentEntries, "id")

  const moduleEntries = (await getModules(ctx)).filter((m) => !m.isFuture)
  const moduleEntryById = toMap(moduleEntries, "id")

  const moduleByComponentId = new Map<string, ModuleEntry>()
  componentEntries.forEach((c) => {
    const module = moduleEntryById.get(c.module)
    if (module) {
      moduleByComponentId.set(c.id, module)
    }
  })

  const relationEntries = (
    await getRelations(ctx, componentEntryById)
  ).filter((entry) => {
    return (
      componentEntryById.has(entry.componentId) &&
      componentEntryById.has(entry.targetId)
    )
  })
  const relationEntriesBySource = groupBy(relationEntries, "componentId")
  function getRelationEntriesBySource(cId: string): RelationEntry[] {
    return relationEntriesBySource.get(cId) ?? []
  }

  const apiEntries = await getApis(ctx)
  const apiEntryById = toMap(apiEntries, "id")
  const resourceEntries = await getResources(ctx)
  const resourceEntryById = toMap(resourceEntries, "id")

  const zoneNames = [...new Set(moduleEntries.map((s) => s.zone))]

  const zones = zoneNames.map((zone): Zone => {
    const domainNames = [
      ...new Set(
        moduleEntries.filter((s) => s.zone === zone).map((s) => s.domain)
      ),
    ]
    const domains = domainNames.map((domain): Domain => {
      const modules = moduleEntries.filter(
        (m) => m.zone === zone && m.domain === domain
      )
      const entities = modules.map((module): Entity => {
        const externalModuleType = getExternalModuleType(module.type)
        const componentEntries = module.components
          .map((cId) => componentEntryById.get(cId))
          .filter((c) => c !== undefined) as ComponentEntry[]
        const projects = module.projectIds
          .map((pId) => projectEntryById.get(pId))
          .filter((p) => p !== undefined) as ProjectEntry[]
        if (externalModuleType) {
          const relations: Relation[] = componentEntries.flatMap(
            (component) =>
              getRelationEntriesBySource(component.id)
                .map((rel): Relation | undefined => {
                  const target = componentEntryById.get(rel.targetId)
                  if (target) {
                    return {
                      type: rel.type,
                      targetId: toId(`component_${target.name}_${target.id}`),
                      description: rel.name,
                    }
                  }
                })
                .filter((c) => c !== undefined) as Relation[]
          )

          return {
            partType: PartType.ExternalModule,
            uid: toId(`module_${module.name}_${module.id}`),
            id: toId(module.name ?? module.id),
            type: externalModuleType,
            name:
              externalModuleType === ExternalModuleType.App
                ? module.name.replace(" (app)", "")
                : module.name,
            relations: relations,
            flags: undefined, // TODO
            tags: projects.map((p) => p.name),
          }
        }
        const components = componentEntries.map((component): Component => {
          const relations = getRelationEntriesBySource(component.id)
            .map((rel): Relation | undefined => {
              const target = componentEntryById.get(rel.targetId)
              if (target) {
                const targetModule = moduleByComponentId.get(rel.targetId)
                if (
                  targetModule?.type &&
                  getExternalModuleType(targetModule.type)
                ) {
                  return {
                    type: rel.type,
                    targetId: toId(
                      `module_${targetModule.name}_${targetModule.id}`
                    ),
                    description: rel.name,
                  }
                }
                return {
                  type: rel.type,
                  targetId: toId(`component_${target.name}_${target.id}`),
                  description: rel.name,
                }
              }
            })
            .filter((c) => c !== undefined) as Relation[]

          return {
            partType: PartType.Component,
            uid: toId(`component_${component.name}_${component.id}`),
            id: toId(component.name),
            name: component.name,
            type: component.type,
            relations,
            flags: undefined, // TODO
            tags: component.tags,
          }
        })
        const apiEntries: ApiEntry[] = module.apiIds
          .map((apiId) => apiEntryById.get(apiId))
          .filter((e) => e !== undefined) as ApiEntry[]
        const apis = apiEntries.map((apiEntry) => {
          const resourceEntries = apiEntry.resources
            .map((resId) => resourceEntryById.get(resId))
            .filter((c) => c !== undefined) as ResourceEntry[]
          return {
            name: apiEntry.name,
            type: apiEntry.type,
            resources: resourceEntries.map((rs) => ({
              uid: toId(`resource_${apiEntry.name}_${rs.name}_${rs.id}`),
              id: toId(rs.name),
              name: rs.name,
            })),
          }
        })
        return {
          partType: PartType.Module,
          uid: toId(`module_${module.name}_${module.id}`),
          id: toId(module.name),
          name: module.name,
          components,
          apis,
          flags: undefined, // TODO
          tags: projects.map((p) => p.name),
        }
      })
      return {
        partType: PartType.Domain,
        uid: toId(`domain_${zone}_${domain}`),
        id: toId(domain),
        name: domain,
        entities,
        flags: undefined, // TODO
        tags: [],
      }
    })
    return {
      partType: PartType.Zone,
      uid: toId(`zone_${zone}`),
      id: toId(zone),
      name: zone,
      domains,
      flags: undefined, // TODO
      tags: [], // TODO
    }
  })

  return {
    componentTypes: [...new Set(componentEntries.map((c) => c.type))],
    zones,
  }
}
