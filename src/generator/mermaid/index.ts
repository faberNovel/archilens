export type MermaidOptions = {
  links?: {
    curPath: string[]
    suffix: string | undefined
  } | {
    prefix: string
    suffix: string | undefined
  } | undefined
}
