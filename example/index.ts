import archilens from "../src"

async function main() {
  const diagram = await archilens.importDiagramFromYaml("example/spec.yml")

  const exportDir = "export"

  const deps = archilens.computeDependencies(diagram)
  await archilens.writeDependenciesInYaml(`${exportDir}/deps.yaml`, deps)
  // await archilens.writeDependenciesIntoNotion(deps, {
  //   // of course, in a real project, real undefined checks are needed
  //   token: process.env.NOTION_TOKEN!,
  //   dependenciesPageId: process.env.NOTION_PAGE_DEPENDENCIES!,
  // })

  await archilens.writeHldAsSvgFiles(exportDir, diagram, {
    variations: [
      { name: 'HLD', alt: 'LLD', path: 'hld', hideComponents: true, excludeTags: ["BI"] },
      { name: 'HLD BI', alt: 'LLD BI', path: 'hld-bi', hideComponents: true },
      { name: 'LLD', alt: 'HLD', path: 'lld', hideComponents: false, excludeTags: ["BI"] },
      { name: 'LLD BI', alt: 'HLD BI', path: 'lld-bi', hideComponents: false },
    ],
    generateComponentsSchemas: false,
    // followRelations: 1,
    // followInverseRelations: 1,
    getDisplayInfo: archilens.D2GetDisplayInfo(
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
main().catch((e) => console.error(archilens.cleanParserError(e)))
