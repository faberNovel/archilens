export function toId(name: string): string {
  return name.normalize('NFD').toLowerCase().replace(/[^a-z0-9_]/ug, '_').replace(' ', '')
}