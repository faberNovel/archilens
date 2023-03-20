export{}
declare global {
  interface Set<T> {
    addAll(other: ReadonlyArray<T>): this
    addAll(other: ReadonlySet<T>): this
    addAll(other: IterableIterator<T>): this
  }
}

if (!Set.prototype.addAll) {
  Set.prototype.addAll = function<T>(this: Set<T>, other: ReadonlyArray<T> | ReadonlySet<T> | IterableIterator<T>) {
    for (const entry of other) {
      this.add(entry)
    }
    return this;
  }
}
