import { importDiagramFromYaml } from "../src"
import { cleanParserError } from "../src"
import { writeHldAsSvgFiles } from "../src"
import { D2GetDisplayInfo } from "../src"
import { writeDependenciesIntoNotion } from "../src"
import { writeDependenciesInYaml } from "../src"
import { computeDependencies } from "../src"

async function main() {
  const diagram = importDiagramFromYaml({ file: "spec.yml", dir: "example" })

  const dependencies = computeDependencies(diagram)
  await writeDependenciesInYaml("export/data/dependencies.yaml", dependencies)
  // await writeDependenciesIntoNotion(process.env.NOTION_PAGE_DEPENDENCIES!, dependencies)

  await writeHldAsSvgFiles("export", diagram, {
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
