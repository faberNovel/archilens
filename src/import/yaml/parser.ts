import { z } from "zod"

import { relationType, uid } from "../../shared/parser"

import * as Import from "../models"

const zRelation = (): z.ZodType<Import.Relation> => z.object({
  description: z.string().optional(),
  target: uid(),
  type: relationType(),
}).transform(data => ({
  description: data.description,
  targetUid: data.target,
  relationType: data.type,
}) satisfies Import.Relation) as unknown as z.ZodType<Import.Relation>

const zComponent = (): z.ZodType<Import.Component> => z.object({
  uid: uid(),
  label: z.string(),
  relations: z.array(zRelation()).default([]),
}).transform(data => data satisfies Import.Component) as unknown as z.ZodType<Import.Component>

const zModule = (): z.ZodType<Import.Module> => z.object({
  uid: uid(),
  label: z.string(),
  components: z.array(zComponent()).default([]),
}).transform(data => data satisfies Import.Module) as unknown as z.ZodType<Import.Module>

const zDomain = (): z.ZodType<Import.Domain> => z.object({
  uid: uid(),
  label: z.string(),
  domains: z.lazy(() => z.array(zDomain()).default([])),
  modules: z.array(zModule()).default([]),
}).transform(data => data satisfies Import.Domain) as unknown as z.ZodType<Import.Domain>

const zSystem = (): z.ZodType<Import.System> => z.object({
  lastUpdateAt: z.date(),
  domains: z.array(zDomain()).default([]),
}).transform(data => data satisfies Import.System) as unknown as z.ZodType<Import.System>

export function parse(raw: unknown): Import.System {
  return zSystem().parse(raw)
}
