import { isModule, Module, System } from "./models"

export type TextDependencies = {
  module: string
  dependencies: {
    direct: readonly string[]
    indirect: readonly string[]
    total: readonly string[]
  }
  dependents: {
    direct: readonly string[]
    indirect: readonly string[]
    total: readonly string[]
  }
}
export class Dependencies {
  module: Module
  dependencies: {
    direct: readonly Module[]
    indirect: readonly Module[]
    total: readonly Module[]
  }
  dependents: {
    direct: readonly Module[]
    indirect: readonly Module[]
    total: readonly Module[]
  }
  constructor(module: Module) {
    this.module = module
    const directDependencies = this.module.directDependencies()
    const indirectDependencies = this.module.indirectDependencies()
    this.dependencies = {
      direct: directDependencies,
      indirect: indirectDependencies,
      total: [...new Set([...directDependencies, ...indirectDependencies])],
    }
    const directDependents = this.module.directDependents()
    const indirectDependents = this.module.indirectDependents()
    this.dependents = {
      direct: directDependents,
      indirect: indirectDependents,
      total: [...new Set([...directDependents, ...indirectDependents])],
    }
  }
  asTextDependencies(): TextDependencies {
    return {
      module: this.module.label,
      dependencies: {
        direct: this.dependencies.direct.map((m) => m.label).sort(),
        indirect: this.dependencies.indirect.map((m) => m.label).sort(),
        total: this.dependencies.total.map((m) => m.label).sort(),
      },
      dependents: {
        direct: this.dependents.direct.map((m) => m.label).sort(),
        indirect: this.dependents.indirect.map((m) => m.label).sort(),
        total: this.dependents.total.map((m) => m.label).sort(),
      },
    }
  }
}

export function computeDependencies(diagram: System): Dependencies[] {
  return [...diagram.parts.values()].filter(isModule).map((m) => new Dependencies(m))
}

export function computeTextDependencies(diagram: System): TextDependencies[] {
  return computeDependencies(diagram).map((d) => d.asTextDependencies())
}
