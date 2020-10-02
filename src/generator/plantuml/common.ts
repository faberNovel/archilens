export const skinparam = (
  name: string,
  values: string | string[]
): string[] => {
  const valuesAsArray = Array.of(values).flat()
  return [`skinparam ${name} {`, ...valuesAsArray.map((v) => `  ${v}`), "}"]
}

const base = [
  "BorderColor black",
  "roundcorner 8",
  "DPI 200",
  "Shadowing false",
]
const rectangle = ["borderThickness 1.5"]
const rectangleZone = [
  ...rectangle,
  "BorderStyle dashed",
  "BackgroundColor #DAE8FC",
  "roundcorner 0",
]
export const skinparams = {
  base,
  rectangle,
  rectangleZone,
}
