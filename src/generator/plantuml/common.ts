export const skinparam = (
  name: string,
  values: { [key: string]: string }
): string[] => {
  return [
    `skinparam ${name} {`,
    ...Object.entries(values).map(([k, v]) => `  ${k} ${v}`),
    "}",
  ]
}

const base = {
  BorderColor: "black",
  roundcorner: "8",
  DPI: "200",
  Shadowing: "false",
}
const rectangle = { borderThickness: "1.5" }
const rectangleZone = {
  ...rectangle,
  borderThickness: "2",
  BorderStyle: "dashed",
  roundcorner: "0",
}
const rectangleDomain = { ...rectangle, borderThickness: "2" }
export const skinparams = {
  base,
  rectangle,
  rectangleZone,
  rectangleDomain,
}
