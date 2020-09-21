export type ExternalModule = {
  id: string;
  name: string;
  relations: Relation[];
};
export type ExternalModuleOptions = {
  id: string;
  name?: string;
  relations?: Relation[];
};
export function externalModule(opts: ExternalModuleOptions): ExternalModule {
  return {
    id: opts.id,
    name: opts.name || opts.id,
    relations: opts.relations || [],
  };
}

export type Module = {
  id: string;
  name: string;
  components: Component[];
};
export type ModuleOptions = {
  id: string;
  name?: string;
  components?: Component[];
};
export function module(opts: ModuleOptions): Module {
  const m = {
    id: opts.id,
    name: opts.name || opts.id,
    components: opts.components || [],
  };
  m.components.forEach(c => { c.parent = m })
  return m
}

export enum ComponentType {
  ECS = "ecs",
  Lambda = "Lambda",
  DB = "DB",
  KDS = "KDS",
  S3 = "S3",
  APIGW = "APIGW",
}
export type Component = {
  parent?: ModuleEntity;
  id: string;
  name: string;
  type: ComponentType;
  relations: Relation[];
};
export type ComponentOptions = {
  id: string;
  name?: string;
  type: ComponentType;
  relations?: Relation[];
};
export function component(opts: ComponentOptions): Component {
  return {
    id: opts.id,
    name: opts.name || opts.id,
    type: opts.type,
    relations: opts.relations || [],
  };
}

export type RelationTarget = Component | ExternalModule

export enum RelationType {
  Sync = "sync",
  Async = "async",
}
export type Relation = {
  target: RelationTarget;
  type: RelationType;
  description?: string;
  reverse: boolean;
};
export type RelationOptions = {
  target: RelationTarget;
  type?: RelationType;
  reverse?: boolean;
  description?: string;
};
export function relation(opts: RelationOptions): Relation {
  return {
    target: opts.target,
    type: opts.type || RelationType.Sync,
    reverse: opts.reverse || false,
    description: opts.description,
  };
}

export type ModuleEntity = Module | ExternalModule;
export type Entity = Module | ExternalModule | Component;
export type Diagram = Entity[];

export const isModule = (e: Entity): e is Module =>
  (e as Module).components !== undefined;
export const isComponent = (e: Entity): e is Component =>
  (e as Component).type !== undefined;
export const isExternalModule = (e: Entity): e is ExternalModule =>
  (e as ExternalModule).relations !== undefined &&
  (e as Component).type === undefined;
