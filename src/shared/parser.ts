import { z } from "zod"

import { RelationType, Uid } from "./models"

export const zRelationType = (): z.ZodType<RelationType> =>
  z.union([z.literal(RelationType.Ask), z.literal(RelationType.Listen)])

export const zUid = (): z.ZodEffects<z.ZodString, Uid, string> => z.string().transform(Uid)
