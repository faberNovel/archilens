import path from "path"

import { importFromYaml } from "./import"
import { cleanParserError } from "./utils/parser-errors"
import { D2GetDisplayInfo, generateSVG } from "./generate/d2"
import { Uid } from "shared/models"
import { Domain } from "./engine/models"

async function main() {
  const model = importFromYaml({ file: "spec.yml", dir: "example" })

  async function gen(
    basePath: string,
    filepath: string,
    target: { include: Uid[] } | { open: Uid[] },
    type: "HLD" | "LLD",
    links: Record<string, string> = {}
  ) {
    const d2Filepath = path.join(basePath, "d2", filepath + ".d2")
    const svgFilepath = path.join(basePath, "svg", filepath + ".svg")

    return await generateSVG(svgFilepath, model, {
      ...target,
      linkPath: filepath,
      links: new Map(
        Object.entries(links).map(([k, v]) => [
          k,
          path.relative(path.dirname(filepath), v),
        ])
      ),
      d2Filepath,
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

  const outputDir = "export"
  await gen(
    outputDir,
    "index",
    { include: model.domains.map((d) => d.uid) },
    "HLD"
  )
  for (const [uid, part] of model.parts) {
    if (part.isDomain) {
      await gen(outputDir, part.path(path.sep), { open: [uid] }, "HLD", {
        index: "index.svg",
      })
    } else if (part.isModule) {
      const modulePath = part.path(path.sep)
      const componentsPath = `${modulePath}-components`
      await gen(outputDir, modulePath, { include: [uid] }, "HLD", {
        index: "index.svg",
        _alt: componentsPath + ".svg",
      })
      await gen(outputDir, componentsPath, { open: [uid] }, "LLD", {
        index: "index.svg",
        _alt: modulePath + ".svg",
      })
    }
  }
}
main().catch((e) => console.error(cleanParserError(e)))
