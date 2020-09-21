import {component, ComponentType, Diagram, externalModule, module, relation, RelationType} from './models'

export function diagram(): Diagram {
  const service3KDSStuff = component({
    id: "Service3KDSStuff",
    name: "Stuff",
    type: ComponentType.KDS,
  });
  const service3 = module({
    id: "Service3",
    components: [service3KDSStuff],
  });

  const service2APIGW = component({
    id: "Service2APIGW",
    name: "API",
    type: ComponentType.APIGW,
  });
  const service2 = module({
    id: "Service2",
    components: [service2APIGW],
  });

  const articlesDB = component({
    id: "ArticlesDB",
    name: "Articles",
    type: ComponentType.DB,
  });
  const articlesBucketImport = component({
    id: "ArticlesBucketImport",
    name: "articles_import",
    type: ComponentType.S3,
  });
  const articlesKDSupdate = component({
    id: "ArticlesKDSupdate",
    name: "articles_update",
    type: ComponentType.KDS,
  });
  const articlesAPI = component({
    id: "ArticlesAPI",
    name: "API",
    type: ComponentType.ECS,
    relations: [
      relation({
        target: service2APIGW,
        description: "Get thing",
      }),
      relation({
        target: articlesDB,
      }),
    ],
  });
  const articlesImport = component({
    id: "ArticlesImport",
    name: "Import",
    type: ComponentType.Lambda,
    relations: [
      relation({
        target: articlesDB,
      }),
      relation({
        target: articlesBucketImport,
        description: "Watches",
      }),
    ],
  });
  const articlesStuffConsolidator = component({
    id: "ArticlesStuffConsolidator",
    name: "Stuff Consolidator",
    type: ComponentType.Lambda,
    relations: [
      relation({
        target: service3KDSStuff,
        type: RelationType.Async,
        reverse: true,
        description: "Stuff",
      }),
      relation({
        target: articlesDB,
      }),
    ],
  });
  const articlesEmitter = component({
    id: "ArticlesEmitter",
    name: "Emitter",
    type: ComponentType.Lambda,
    relations: [
      relation({
        target: articlesDB,
        description: "Fetches events",
      }),
      relation({
        target: articlesKDSupdate,
        description: "Publishes events",
      }),
    ],
  });
  const articlesAPIGW = component({
    id: "ArticlesAPIGW",
    name: "API GW",
    type: ComponentType.APIGW,
    relations: [
      relation({
        target: articlesAPI,
      }),
    ],
  });
  const articles = module({
    id: "Articles",
    components: [
      articlesAPIGW,
      articlesAPI,
      articlesImport,
      articlesStuffConsolidator,
      articlesEmitter,
      articlesDB,
      articlesBucketImport,
      articlesKDSupdate,
    ],
  });

  const app = externalModule({
    id: "App",
    relations: [
      relation({
        target: articlesAPIGW,
      }),
    ],
  });

  return [app, articles, service2, service3];
}
