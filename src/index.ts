import path from "path"

import { importFromYaml } from "./import"
import { cleanParserError } from "./utils/parser-errors"
import { D2GetDisplayInfo, generateSVG } from "./generate/d2"
import { Uid } from "shared/models"
import { Domain } from "./engine/models"

async function main() {
  const model = importFromYaml({ file: "spec.yml", dir: "example" })

  async function gen(filename: string, target: {include: Uid[]} | {open: Uid[]}, type: "HLD" | "LLD") {
    return await generateSVG(filename, model, {
      ...target,
      followRelations: 1,
      followInverseRelations: 1,
      displayRelatedComponents: type === "LLD",
      getDisplayInfo: D2GetDisplayInfo(
        {
          MobileApp:
            "https://icons.terrastruct.com/tech%2F052-smartphone-3.svg",
          WebApp: "https://icons.terrastruct.com/tech%2Fbrowser-2.svg",
        },
        {
          APIGW:
            "https://icons.terrastruct.com/aws%2FMobile%2FAmazon-API-Gateway.svg",
          DB: "https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS.svg",
          RDS: "https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS.svg",
          ECS: "https://icons.terrastruct.com/aws%2FCompute%2FAmazon-Elastic-Container-Service.svg",
          KDS: "https://icons.terrastruct.com/aws%2FAnalytics%2FAmazon-Kinesis-Data-Streams.svg",
          Lambda:
            "https://icons.terrastruct.com/aws%2FCompute%2FAWS-Lambda.svg",
          S3: "https://icons.terrastruct.com/aws%2FStorage%2FAmazon-Simple-Storage-Service-S3.svg",
        }
      ),
    })
  }

  const outputDir = "export/hld"
  await gen(`${outputDir}/index`, { include: model.domains.map(d => d.uid) }, "HLD")
  for (const [uid, part] of model.parts) {
    if (part.isDomain) {
      await gen(`${outputDir}/${part.path(path.sep)}`, { open: [uid] }, "HLD")
    } else if (part.isModule) {
      await gen(`${outputDir}/${part.path(path.sep)}`, { include: [uid] }, "HLD")
      await gen(`${outputDir}/${part.path(path.sep)}-detailled`, { open: [uid] }, "LLD")
    }
  }
}
main().catch((e) => console.error(cleanParserError(e)))
