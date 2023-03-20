import * as fs from 'fs'

import { importFromYaml } from './import'
import { cleanParserError } from './utils/parser-errors'
import { generate } from './generate/d2'
import { prune } from './engine/prune'
import { Uid } from 'shared/models'

async function main() {
  const model = importFromYaml({file: 'spec.yml', dir: 'example'})
  const pruned = prune(model, {
    include: ["dashboard"],
    includeRelations: 2,
    // includeInverseRelations: "all",
  })
  const schema = generate(pruned, {
    iconFromComponentType: (type) => {
      switch (type) {
        case "APIGW": return "https://icons.terrastruct.com/aws%2FMobile%2FAmazon-API-Gateway.svg"
        case "DB":
        case "RDS": return "https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS.svg"
        case "ECS": return "https://icons.terrastruct.com/aws%2FCompute%2FAmazon-Elastic-Container-Service.svg"
        case "KDS": return "https://icons.terrastruct.com/aws%2FAnalytics%2FAmazon-Kinesis-Data-Streams.svg"
        case "Lambda": return "https://icons.terrastruct.com/aws%2FCompute%2FAWS-Lambda.svg"
        case "S3": return "https://icons.terrastruct.com/aws%2FStorage%2FAmazon-Simple-Storage-Service-S3.svg"
        default:
          return undefined
      }
    },
    iconFromModuleType: (type) => {
      switch (type) {
        case "MobileApp": return "https://icons.terrastruct.com/tech%2F052-smartphone-3.svg"
        case "WebApp": return "https://icons.terrastruct.com/tech%2Fbrowser-2.svg"
        case "Service": return undefined
        default:
          return undefined
      }
    },
  })
  fs.writeFileSync('schema.d2', schema)
}
main().catch(e => console.error(cleanParserError(e)));
