import { z } from "zod"

import { RelationType, Uid } from "../../shared/models"
import { zId, zRelationType, zUid } from "../../shared/parser"

import * as Import from "../models"

const zResource = (): z.ZodType<Import.Resource> =>
  z.string().nonempty().transform(
    (data) => ({
      uid: Uid(data.toLocaleLowerCase()),
      label: data,
   } satisfies Import.Resource),
  ) as unknown as z.ZodType<Import.Resource>

const zRelation = (): z.ZodType<Import.Relation> =>
  z
    .object({
      description: z.string().nonempty().optional(),
      target: zUid(),
      rtype: zRelationType().optional(),
      resources: z.array(zResource()).default([]),
    })
    .transform(
      (data) =>
        ({
          description: data.description,
          targetUid: data.target,
          relationType: data.rtype ?? RelationType.Ask,
          resources: data.resources,
        } satisfies Import.Relation),
    ) as unknown as z.ZodType<Import.Relation>

const zComponent = (): z.ZodType<Import.Component> =>
  z
    .object({
      uid: zUid(),
      id: zId().optional(),
      ctype: z.string().nonempty(),
      label: z.string().nonempty().optional(),
      relations: z.array(zRelation()).default([]),
      resources: z.array(zResource()).default([]),
    })
    .transform(
      (data) =>
        ({
          uid: data.uid,
          id: data.id,
          type: data.ctype,
          label: data.label,
          relations: data.relations,
          resources: data.resources,
        } satisfies Import.Component),
    ) as unknown as z.ZodType<Import.Component>

const zModule = (): z.ZodType<Import.Module> =>
  z
    .object({
      uid: zUid(),
      id: zId().optional(),
      mtype: z.string().nonempty(),
      label: z.string().nonempty(),
      components: z.array(zComponent()).default([]),
      relations: z.array(zRelation()).default([]),
      ownedResources: z.array(zResource()).default([]),
    })
    .transform(
      (data) =>
        ({
          uid: data.uid,
          id: data.id,
          type: data.mtype,
          label: data.label,
          components: data.components,
          relations: data.relations,
          ownedResources: data.ownedResources,
        } satisfies Import.Module),
    ) as unknown as z.ZodType<Import.Module>

const zDomain = (): z.ZodType<Import.Domain> =>
  z
    .object({
      uid: zUid(),
      id: zId().optional(),
      label: z.string().nonempty(),
      domains: z.lazy(() => z.array(zDomain()).default([])),
      modules: z.array(zModule()).default([]),
    })
    .transform(
      (data) =>
        ({
          uid: data.uid,
          id: data.id,
          label: data.label,
          domains: data.domains,
          modules: data.modules,
        } satisfies Import.Domain),
    ) as unknown as z.ZodType<Import.Domain>

const zSystem = (): z.ZodType<Import.System> =>
  z
    .object({
      lastUpdateAt: z.date(),
      domains: z.array(zDomain()).default([]),
    })
    .transform(
      (data) =>
        ({
          lastUpdateAt: data.lastUpdateAt,
          domains: data.domains,
        } satisfies Import.System),
    ) as unknown as z.ZodType<Import.System>

export function parse(raw: unknown): Import.System {
  return zSystem().parse(raw)
}
