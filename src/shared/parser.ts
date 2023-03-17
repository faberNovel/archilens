import { z } from "zod"

import { ModuleType, RelationType, Uid } from "./models"

export const zRelationType = (): z.ZodType<RelationType> =>
  z.union([z.literal(RelationType.Ask), z.literal(RelationType.Listen)])

export const zUid = (): z.ZodEffects<z.ZodString, Uid, string> => z.string().transform(Uid)

export const zModuleType = (): z.ZodType<ModuleType> =>
  z.union([z.literal(ModuleType.Application), z.literal(ModuleType.Service)])
