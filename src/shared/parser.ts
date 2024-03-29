import { z } from "zod"

import { Id, RelationType, Tag, Uid } from "./models"

export const zRelationType = (): z.ZodType<RelationType> =>
  z.union([
    z.literal(RelationType.Ask),
    z.literal(RelationType.Listen),
    z.literal(RelationType.Tell),
  ])

export const zUid = (): z.ZodEffects<z.ZodString, Uid, string> =>
  z.string().transform(Uid)

export const zId = (): z.ZodEffects<z.ZodString, Id, string> =>
  z.string().transform(Id)

export const zTag = (): z.ZodEffects<z.ZodString, Tag, string> =>
  z.string().transform(Tag)
