import {
  component,
  ComponentType,
  Diagram,
  domain,
  externalModule,
  module,
  relation,
  RelationType,
} from "./models"

export function diagram(): Diagram {
  const service1APIGW = component({
    id: "Service1APIGW",
    name: "API GW",
    type: ComponentType.APIGW,
  })
  const service1 = module({
    id: "Service1",
    components: [service1APIGW],
  })

  const service2KDSStuff = component({
    id: "Service2KDSStuff",
    name: "Stuff",
    type: ComponentType.KDS,
  })
  const service2 = module({
    id: "Service2",
    components: [service2KDSStuff],
  })

  const articlesDB = component({
    id: "ArticlesDB",
    name: "Articles",
    type: ComponentType.DB,
  })
  const articlesBucketImport = component({
    id: "ArticlesBucketImport",
    name: "articles_import",
    type: ComponentType.S3,
  })
  const articlesKDSupdate = component({
    id: "ArticlesKDSupdate",
    name: "articles_update",
    type: ComponentType.KDS,
  })
  const articlesAPI = component({
    id: "ArticlesAPI",
    name: "API",
    type: ComponentType.ECS,
    relations: [
      relation({
        target: "service1APIGW",
        description: "Get thing",
      }),
      relation({
        target: "articlesDB",
      }),
    ],
  })
  const articlesImport = component({
    id: "ArticlesImport",
    name: "Import",
    type: ComponentType.Lambda,
    relations: [
      relation({
        target: "articlesDB",
      }),
      relation({
        target: "articlesBucketImport",
        description: "Watches",
      }),
    ],
  })
  const articlesStuffConsolidator = component({
    id: "ArticlesStuffConsolidator",
    name: "Stuff Consolidator",
    type: ComponentType.Lambda,
    relations: [
      relation({
        target: "service2KDSStuff",
        type: RelationType.Listen,
        description: "Stuff",
      }),
      relation({
        target: "articlesDB",
      }),
    ],
  })
  const articlesEmitter = component({
    id: "ArticlesEmitter",
    name: "Emitter",
    type: ComponentType.Lambda,
    relations: [
      relation({
        target: "articlesDB",
        description: "Fetches events",
      }),
      relation({
        target: "articlesKDSupdate",
        description: "Publishes events",
      }),
    ],
  })
  const articlesAPIGW = component({
    id: "ArticlesAPIGW",
    name: "API GW",
    type: ComponentType.APIGW,
    relations: [
      relation({
        target: "articlesAPI",
      }),
    ],
  })
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
  })

  const app = externalModule({
    id: "App",
    relations: [
      relation({
        target: "articlesAPIGW",
      }),
    ],
  })

  const domain1 = domain({
    id: "domain1",
    name: "Domain 1",
    entities: [app, articles, service1],
  })

  const domain2 = domain({
    id: "domain2",
    name: "Domain 2",
    entities: [service2],
  })

  const domain3 = domain({
    id: "domain3",
    name: "Domain 3",
    entities: [
      module({
        id: "service3",
        components: [
          component({
            id: "Service3API",
            type: ComponentType.ECS,
          }),
        ],
      }),
    ],
  })

  return { domains: [domain1, domain2, domain3] }
}
