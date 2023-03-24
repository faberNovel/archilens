import { importFromYaml } from "./import"
import { cleanParserError } from "./utils/parser-errors"
import { D2GetDisplayInfo } from "./generate/schemas/generate"
import { generateHld } from "./generate/schemas/hld"
import { generateDependencies } from "./generate/data/dependencies"

async function main() {
  const model = importFromYaml({ file: "spec.yml", dir: "example" })

  await generateDependencies("export/data/dependencies.yaml", model)

  await generateHld("export", model, {
    // followRelations: 1,
    // followInverseRelations: 1,
    getDisplayInfo: D2GetDisplayInfo(
      {
        MobileApp: "https://icons.terrastruct.com/tech%2F052-smartphone-3.svg",
        WebApp: "https://icons.terrastruct.com/tech%2Fbrowser-2.svg",
      },
      {
        APIGW:
          "https://icons.terrastruct.com/aws%2FMobile%2FAmazon-API-Gateway.svg",
        DB: "https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS.svg",
        RDS: "https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS.svg",
        ECS: "https://icons.terrastruct.com/aws%2FCompute%2FAmazon-Elastic-Container-Service.svg",
        KDS: "https://icons.terrastruct.com/aws%2FAnalytics%2FAmazon-Kinesis-Data-Streams.svg",
        Lambda: "https://icons.terrastruct.com/aws%2FCompute%2FAWS-Lambda.svg",
        S3: "https://icons.terrastruct.com/aws%2FStorage%2FAmazon-Simple-Storage-Service-S3.svg",
      },
    ),
  })
}
main().catch((e) => console.error(cleanParserError(e)))
