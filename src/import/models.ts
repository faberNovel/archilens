import { RelationType, Uid } from "../shared/models"

export type System = {
  readonly lastUpdateAt: Date
  readonly domains: Domain[]
}

export type Domain = {
  readonly uid: Uid
  readonly label: string
  readonly domains: Domain[]
  readonly modules: Module[]
}

export type Module = {
  readonly uid: Uid
  readonly label: string
  readonly components: Component[]
}

export type Component = {
  readonly uid: Uid
  readonly label: string
  readonly relations: Relation[]
}

export type Relation = {
  readonly targetUid: Uid
  readonly relationType: RelationType
  readonly description: string | undefined
}
