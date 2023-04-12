export enum RelationType {
  Ask = "ask",
  Listen = "listen",
  Tell = "tell",
}

// Can't use objects since they will be used as Map keys

export type Uid = string & { readonly _uid: unique symbol }
export function Uid(value: string): Uid
export function Uid(value: Uid): Uid
export function Uid(value: string): Uid {
  return value as Uid
}
export type Id = string & { readonly _id: unique symbol }
export function Id(value: string): Id
export function Id(value: Id): Id
export function Id(value: Uid): Id
export function Id(value: string): Id {
  return value as Id
}
export type Tag = string & { readonly _tag: unique symbol }
export function Tag(value: string): Tag
export function Tag(value: Tag): Tag
export function Tag(value: string): Tag {
  return value as Tag
}
