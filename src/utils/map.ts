export{}
declare global {
  interface Map<K, V> {
    addAll(other: ReadonlyArray<[K, V]>): this
    addAll(other: ReadonlyMap<K, V>): this
    addAll(other: IterableIterator<[K, V]>): this
  }
}

if (!Map.prototype.addAll) {
  Map.prototype.addAll = function<K, V>(this: Map<K, V>, other: ReadonlyArray<[K, V]> | ReadonlyMap<K, V> | IterableIterator<[K, V]>) {
    for (const [key, value] of other) {
      this.set(key, value)
    }
    return this;
  }
}
