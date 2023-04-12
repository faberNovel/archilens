import { Id, RelationType, Tag, Uid } from "../shared/models"

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
  readonly components: readonly Component[]
  readonly tags: readonly Tag[]
}

export type Module = {
  readonly uid: Uid
  readonly id: Id | undefined
  readonly type: string
  readonly label: string
  readonly components: readonly Component[]
  readonly relations: readonly Relation[]
  readonly ownedResources: readonly Resource[]
  readonly tags: readonly Tag[]
}

export type Component = {
  readonly uid: Uid
  readonly id: Id | undefined
  readonly type: string
  readonly label: string | undefined
  readonly relations: readonly Relation[]
  readonly resources: readonly Resource[]
  readonly tags: readonly Tag[]
  readonly mergeAsAsync: boolean
}

export type Relation = {
  readonly targetUid: Uid
  readonly relationType: RelationType
  readonly description: string | undefined
  readonly resources: readonly Resource[]
  readonly tags: readonly Tag[]
}

export type Resource = {
  readonly uid: Uid
  readonly label: string
}
