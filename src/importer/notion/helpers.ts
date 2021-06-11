import {
  CheckboxPropertyValue, MultiSelectProperty,
  Page, PropertyBase,
  SelectPropertyValue,
  TitlePropertyValue,
} from "@notionhq/client/build/src/api-types"

export function pageId(page: Page): string {
  try {
    const name = getPageName(page)
    return name ? `${page.id}(${name})` : JSON.stringify(page)
  } catch (_e) {}
  return page.id
}

export function getPageName(page: Page): string | undefined {
  const ppt = page.properties["Name"] as TitlePropertyValue | undefined
  const name =
    ppt &&
    ppt.type === "title" &&
    ppt.title &&
    ppt.title[0] &&
    ppt.title[0].plain_text
  return name || undefined
}

export function getPageNameOrFail(page: Page): string {
  const name = getPageName(page)
  if (!name) {
    throw new Error(`Missing page name in page ${pageId(page)}`)
  }
  return name
}

export function getPageRelationOrFail(
  page: Page,
  property: { name: string }
): string[] {
  const ppt = (page.properties[property.name] as unknown) as
    | { type: "relation"; relation: { id: string }[] }
    | undefined
  if (ppt && ppt.type !== "relation") {
    throw new Error(
      `Property ${JSON.stringify(property)} in not a relation in page ${pageId(
        page
      )}`
    )
  }
  const relation = ppt?.relation
  if (relation === undefined) {
    throw new Error(
      `Missing relation ${JSON.stringify(property)} in page ${pageId(page)}`
    )
  }
  return relation.map((r) => r.id)
}

export function getPageSingleRelationOrFail(
  page: Page,
  property: { name: string },
  entryById?: Map<string, any> | undefined,
): string {
  const relations = getPageRelationOrFail(page, property)
  const filtered = entryById ? relations.filter(e => entryById.has(e)) : relations
  if (filtered.length !== 1) {
    const pId = pageId(page)
    if (relations.length === 0) {
      throw new Error(
        `Relation ${JSON.stringify(property)} has no element in page ${pId}`
      )
    } else if (filtered.length === 0) {
      throw new Error(
        `Relation ${JSON.stringify(property)} has no not-archived element in page ${pId} (archived relations are ${relations.join(', ')})`
      )
    } else if (entryById) {
      throw new Error(
        `Relation ${JSON.stringify(property)} has too many not-archived elements in page ${pId} (${filtered.map(id => entryById.get(id)?.name ?? id).join(', ')})`
      )
    } else {
      throw new Error(
        `Relation ${JSON.stringify(property)} has too many elements in page ${pId}`
      )
    }
  }
  return filtered[0]
}

export function getPageCheckboxOrFail(
  page: Page,
  property: { name: string }
): boolean {
  const ppt = page.properties[property.name] as
    | CheckboxPropertyValue
    | undefined
  if (ppt && ppt.type !== "checkbox") {
    throw new Error(
      `Property ${JSON.stringify(property)} in not a checkbox in page ${pageId(
        page
      )}`
    )
  }
  const checkbox = ppt?.checkbox
  if (checkbox === undefined) {
    throw new Error(
      `Missing checkbox ${JSON.stringify(property)} in page ${pageId(page)}`
    )
  }
  return checkbox
}

export function getPageSelectOrFail(page: Page, property: { name: string }): string {
  const ppt = page.properties[property.name] as SelectPropertyValue | undefined
  if (ppt && ppt.type !== "select") {
    throw new Error(
      `Property ${JSON.stringify(property)} in not a select in page ${pageId(
        page
      )}`
    )
  }
  const select = ppt?.select
  if (select === undefined) {
    throw new Error(
      `Missing select ${JSON.stringify(property)} in page ${pageId(page)}`
    )
  }
  return select.name
}

export function getPageMultiselectOrFail(page: Page, property: { name: string }): string[] {
  const ppt = page.properties[property.name] as PropertyBase | undefined
  if (ppt && ppt.type !== "multi_select") {
    throw new Error(
      `Property ${JSON.stringify(property)} in not a select in page ${pageId(
        page
      )}`
    )
  }
  const multiSelect = (ppt as {multi_select: {name: string}[]} | undefined)?.multi_select
  if (multiSelect === undefined) {
    throw new Error(
      `Missing multi_select ${JSON.stringify(property)} in page ${pageId(page)}`
    )
  }
  return multiSelect.map(s => s.name)
}
