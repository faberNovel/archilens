import { Client } from "@notionhq/client"

import { Module } from "../../engine/models"
import { Dependencies } from "../../engine/dependencies"
import { Uid } from "shared/models"

const notion = new Client({ auth: process.env.NOTION_TOKEN })

export async function writeDependenciesIntoNotion(parentPageId: string, dependencies: Dependencies[]) {
  console.log("Writing dependencies in Notion...")
  const pageName = `Dependencies ${new Date().toISOString()}`
  const page = await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: {
      title: [
        { text: { content: pageName } },
      ],
    },
  })
  console.log(`  Created page ${pageName} (${page.id})`)

  const modulesBlocksIds = new Map<Uid, string>()

  for (const deps of groups(dependencies, 100)) {
    const blocks = await notion.blocks.children.append({
      block_id: page.id,
      children: deps.map(d => Toggle(d.module.label)),
    })
    for (const [idx, dep] of deps.entries()) {
      modulesBlocksIds.set(dep.module.uid, blocks.results[idx].id)
    }
  }

  function linkToModuleBlock(module: Module) {
    const moduleBlockId = modulesBlocksIds.get(module.uid)!
    const href = `https://www.notion.so/${page.id}#${moduleBlockId}`.replaceAll("-", "")
    return Bulletlistitem(module.label, [], { href })
  }

  function listDeps(name: string, deps: readonly Module[]) {
    return Toggle(`${name} (${deps.length})`, deps.map(linkToModuleBlock))
  }

  for (const dep of dependencies) {
    const moduleBlockId = modulesBlocksIds.get(dep.module.uid)!
    await notion.blocks.children.append({
      block_id: moduleBlockId,
      children: [
        Bulletlistitem("dependencies", [
          listDeps("direct", dep.dependencies.direct),
          listDeps("indirect", dep.dependencies.indirect),
          listDeps("total", dep.dependencies.total),
        ]),
        Bulletlistitem("dependents", [
          listDeps("direct", dep.dependents.direct),
          listDeps("indirect", dep.dependents.indirect),
          listDeps("total", dep.dependents.total),
        ]),
      ],
    })
    await sleep(300)
  }
}

type Toggle<T> = {
  type: "toggle"
  toggle: {
    rich_text: Text[]
    children?: T[]
  }
}
function Toggle<T>(content: string, children?: T[] | undefined): Toggle<T> {
  return {
    type: "toggle",
    toggle: {
      rich_text: [Text(content)],
      children: children?.length ? children : undefined,
    },
  }
}

type Bulletlistitem<T> = {
  type: "bulleted_list_item"
  bulleted_list_item: {
    rich_text: Text[]
    children?: T[]
  }
}
function Bulletlistitem<T>(
  content: string,
  children?: T[] | undefined,
  opts: { href?: string } = {},
): Bulletlistitem<T> {
  return {
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [Text(content, opts)],
      children: children?.length ? children : undefined,
    },
  }
}

type Text = {
  type: "text"
  text: {
    content: string
    link?: {
      url: string
    }
  }
  href?: string
}
function Text(content: string, opts: { href?: string } = {}): Text {
  return {
    type: "text",
    text: {
      content,
      link: opts.href ? { url: opts.href } : undefined,
    },
  }
}

function groups<T>(arr: T[], groupSize: number) {
  const groups = []
  for (let i = 0; i < arr.length; i += groupSize) {
    groups.push(arr.slice(i, i + groupSize))
  }
  return groups
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
