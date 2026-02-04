import { z } from 'zod/v4'

/**
 * A user's interest in a specific fandom
 */
export const FandomInterestSchema = z.object({
  fandomId: z.string(),
  // Lower number = higher priority (1 is top)
  priority: z.number().int().positive(),
  addedAt: z.date(),
})
export type FandomInterest = z.infer<typeof FandomInterestSchema>

/**
 * All user interests and preferences
 */
export const UserInterestsSchema = z.object({
  fandoms: z.array(FandomInterestSchema),
})
export type UserInterests = z.infer<typeof UserInterestsSchema>
