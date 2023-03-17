import { ValueOf } from "../utils/types"

export const ModuleType = {
  Application: "app",
  Service: "service",
}
export type ModuleType = ValueOf<typeof ModuleType>

export const RelationType = {
  Ask: "ask",
  Listen: "listen",
} as const
export type RelationType = ValueOf<typeof RelationType>

export type Uid = string & { readonly _uid: unique symbol }
export function Uid(uid: string): Uid {
  return uid as Uid
}
