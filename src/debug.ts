export function debugFn(fn: () => unknown): void {
  if (process.env.DEBUG !== "true") {
    return
  }
  fn()
}
export function debug(...args: unknown[]): void {
  debugFn(() => {
    const computedArgs = args.map((arg: unknown) => {
      if (typeof arg === "function") {
        return arg()
      } else {
        return arg
      }
    })
    console.warn(...computedArgs)
  })
}

export function truesFromMap<A>(map: ReadonlyMap<A, boolean>): readonly A[] {
  return Array.from(map.entries()).flatMap(([key, value]) =>
    value ? [key] : []
  )
}
