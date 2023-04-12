export enum RelationType {
  Ask = "ask",
  Listen = "listen",
  Tell = "tell",
}

// Can't use objects since they will be used as Map keys

export type Uid = string & { readonly _uid: unique symbol }
export function Uid(value: string): Uid {
  return value as Uid
}
export type Id = string & { readonly _uid: unique symbol }
export function Id(value: string | Uid): Id {
  return value as Id
}
