export enum RelationType {
  Ask = "ask",
  Listen = "listen",
  Tell = "tell",
}

export type Uid = string & { readonly _uid: unique symbol }
export function Uid(uid: string): Uid {
  return uid as Uid
}

export type Id = string & { readonly _id: unique symbol }
export function Id(id: string): Id {
  return id as Id
}
