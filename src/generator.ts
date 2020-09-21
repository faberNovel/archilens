import {
  Component,
  ComponentType,
  Diagram, Entity,
  ExternalModule,
  isComponent, isExternalModule,
  isModule,
  Module,
  Relation, RelationTarget,
  RelationType,
} from './models'

export enum GenerationLevel {
  Module = 'module',
  Component = 'component',
}
export type GenerationOptions = {
  level: GenerationLevel;
  open: string[];
  close: string[];
}

const isOpen = (opts: GenerationOptions, entity: Entity): boolean => {
  if (opts.open.includes(entity.id)) {
    return true
  }
  if (opts.close.includes(entity.id)) {
    return false
  }
  if (isComponent(entity)) {
    return false;
  }
  return opts.level === GenerationLevel.Component
}

const getParent = (opts: GenerationOptions, target: Entity): Entity => {
  if (isComponent(target)) {
    if (target.parent === undefined || isOpen(opts, target.parent)) {
      return target
    } else {
      return getParent(opts, target.parent)
    }
  }
  return target
}

type Generated = {
  readonly definitions: string[];
  readonly relations: string[];
}
const EmptyGenerated = {
  definitions: [],
  relations: [],
}

function add(first: Generated, second: Generated): Generated {
  return {
    definitions: [...first.definitions, ...second.definitions],
    relations: [...first.relations, ...second.relations],
  }
}
function flatten(gen: Generated): string[] {
  return [...gen.definitions, ...gen.relations]
}


export const generateRelation = (opts: GenerationOptions, source: Entity) => (relation: Relation): string => {
  let arrow: string;
  switch (relation.type) {
    case RelationType.Sync:
      arrow = relation.reverse ? "<--" : "-->";
      break;
    case RelationType.Async:
      arrow = relation.reverse ? "<.." : "..>";
      break;
    default:
      throw new Error(
        `Unknown relation type '${relation.type}' for relation ${relation} of entity ${source.id}`
      );
  }
  let desc: string = "";
  if (relation.description !== undefined) {
    desc = ` : ${relation.description}`;
  }
  const targetId = getParent(opts, relation.target).id
  const sourceId = getParent(opts, source).id
  return `${sourceId} ${arrow} ${targetId}${desc}`;
};

export const generateComponent = (opts: GenerationOptions) => (component: Component): Generated => {
  let declaration: string;
  switch (component.type) {
    case ComponentType.APIGW:
      declaration = "rectangle";
      break;
    case ComponentType.DB:
      declaration = "database";
      break;
    case ComponentType.ECS:
      declaration = "component";
      break;
    case ComponentType.KDS:
      declaration = "queue";
      break;
    case ComponentType.Lambda:
      declaration = "component";
      break;
    case ComponentType.S3:
      declaration = "storage";
      break;
    default:
      throw new Error(
        `Unknown type '${component.type}' for component ${component}`
      );
  }
  const relations = component.relations.map(generateRelation(opts, component));
  return {
    definitions: [`${declaration} "${component.name}" as ${component.id}`],
    relations,
  };
}

export const generateModule = (opts: GenerationOptions) => (module: Module): Generated => {
  const moduleIsOpen = isOpen(opts, module)
  const {definitions, relations} = module.components.map(component => {
    if (moduleIsOpen) {
      return generateComponent(opts)(component)
    } else {
      const relations = component.relations.flatMap(relation => {
        if (isComponent(relation.target) && relation.target.parent === module) {
          return []
        }
        return generateRelation(opts, component)(relation)
      })
      return {
        definitions: [],
        relations
      }
    }
  }).reduce(add, EmptyGenerated)
  const open = definitions.length > 0 ? " {" : "";
  const close = definitions.length > 0 ? ["}"] : [];
  return {
    definitions: [
      `rectangle "${module.name}" as ${module.id}${open}`,
      ...definitions.map((s) => `  ${s}`),
      ...close,
    ],
    relations: relations,
  };
}

export const generateExternalModule = (opts: GenerationOptions) => (module: ExternalModule): Generated => {
  const relations = module.relations.map(generateRelation(opts, module));
  return {
    definitions: [`rectangle "${module.name}" as ${module.id}`],
    relations,
  };
}

export function generateDiagram(diagram: Diagram, opts: GenerationOptions): string {
  const module = generateModule(opts)
  const component = generateComponent(opts)
  const externalModule = generateExternalModule(opts)
  const entities = diagram.map((entity) => {
    if (isModule(entity)) {
      return module(entity);
    }
    if (isComponent(entity)) {
      return component(entity);
    }
    if (isExternalModule(entity)) {
      return externalModule(entity);
    }
    throw new Error(`Unknown entity type: ${entity}`);
  }).reduce(add);
  return ["@startuml", ...flatten(entities), "@enduml"].join('\n');
}
