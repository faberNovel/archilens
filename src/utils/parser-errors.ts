import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'

export function cleanParserError(err: unknown): unknown {
  if (err instanceof z.ZodError) {
    return fromZodError(err)
  }
  return err
}
