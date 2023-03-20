export enum RelationType {
  Ask = "ask",
  Listen = "listen",
}

export type Uid = string & { readonly _uid: unique symbol }
export function Uid(uid: string): Uid {
  return uid as Uid
}
