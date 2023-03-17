export type NonEmpty<T> = [T, ...T[]]

export type ValueOf<T> = T[keyof T]

export type Writeable<T> = { -readonly [P in keyof T]: T[P] }

export const asWritable = <T>(value: T): Writeable<T> => value

export function tryFocus<A, B extends A>(value: A | undefined, predicate: (value: A) => value is B): B | undefined {
  return value !== undefined ? predicate(value) ? value : undefined : undefined
}
