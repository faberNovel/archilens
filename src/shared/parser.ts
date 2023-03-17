import { z } from "zod"

import { RelationType, Uid } from "./models"

export const relationType = (): z.ZodType<RelationType> =>
  z.union([z.literal(RelationType.Ask), z.literal(RelationType.Listen)])

export const uid = (): z.ZodEffects<z.ZodString, Uid, string> => z.string().transform(Uid)
