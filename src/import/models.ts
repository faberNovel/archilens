import { Id, RelationType, Uid } from "../shared/models"

export type System = {
  readonly lastUpdateAt: Date
  readonly domains: readonly Domain[]
}

export type Domain = {
  readonly uid: Uid
  readonly id: Id | undefined
  readonly label: string
  readonly domains: readonly Domain[]
  readonly modules: readonly Module[]
}

export type Module = {
  readonly uid: Uid
  readonly id: Id | undefined
  readonly type: string
  readonly label: string
  readonly components: readonly Component[]
  readonly relations: readonly Relation[]
}

export type Component = {
  readonly uid: Uid
  readonly id: Id | undefined
  readonly type: string
  readonly label: string | undefined
  readonly relations: readonly Relation[]
}

export type Relation = {
  readonly targetUid: Uid
  readonly relationType: RelationType
  readonly description: string | undefined
}
