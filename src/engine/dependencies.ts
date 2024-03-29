import { isModule, Module, System } from "./models"

export type TextDependencies = {
  readonly module: string
  readonly dependencies: {
    readonly direct: readonly string[]
    readonly indirect: readonly string[]
    readonly total: readonly string[]
  }
  readonly dependents: {
    readonly direct: readonly string[]
    readonly indirect: readonly string[]
    readonly total: readonly string[]
  }
}
export class Dependencies {
  readonly module: Module
  readonly dependencies: {
    readonly direct: readonly Module[]
    readonly indirect: readonly Module[]
    readonly total: readonly Module[]
  }
  readonly dependents: {
    readonly direct: readonly Module[]
    readonly indirect: readonly Module[]
    readonly total: readonly Module[]
  }
  constructor(module: Module) {
    this.module = module
    const directDependencies = this.module.directDependencies().sort(moduleSort)
    const indirectDependencies = this.module
      .indirectDependencies()
      .sort(moduleSort)
    this.dependencies = {
      direct: directDependencies,
      indirect: indirectDependencies,
      total: [
        ...new Set([...directDependencies, ...indirectDependencies]),
      ].sort(moduleSort),
    }
    const directDependents = this.module.directDependents().sort(moduleSort)
    const indirectDependents = this.module.indirectDependents().sort(moduleSort)
    this.dependents = {
      direct: directDependents,
      indirect: indirectDependents,
      total: [...new Set([...directDependents, ...indirectDependents])].sort(
        moduleSort,
      ),
    }
  }
  asTextDependencies(): TextDependencies {
    return {
      module: this.module.label,
      dependencies: {
        direct: this.dependencies.direct.map((m) => m.label),
        indirect: this.dependencies.indirect.map((m) => m.label),
        total: this.dependencies.total.map((m) => m.label),
      },
      dependents: {
        direct: this.dependents.direct.map((m) => m.label),
        indirect: this.dependents.indirect.map((m) => m.label),
        total: this.dependents.total.map((m) => m.label),
      },
    }
  }
}

export function computeDependencies(diagram: System): Dependencies[] {
  return [...diagram.parts.values()]
    .filter(isModule)
    .map((m) => new Dependencies(m))
    .sort(dependenciesSorter)
}

export function computeTextDependencies(diagram: System): TextDependencies[] {
  return computeDependencies(diagram).map((d) => d.asTextDependencies())
}

function dependenciesSorter(a: Dependencies, b: Dependencies) {
  return moduleSort(a.module, b.module)
}
function moduleSort(a: Module, b: Module) {
  return a.label.localeCompare(b.label)
}
