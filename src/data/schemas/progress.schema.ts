import { z } from 'zod/v4'

/**
 * Status of a single entry within a list
 */
export const EntryStatusSchema = z.enum([
  'not-started',
  'in-progress',
  'completed',
])
export type EntryStatus = z.infer<typeof EntryStatusSchema>

/**
 * Progress for a single entry within a list
 */
export const EntryProgressSchema = z.object({
  entryId: z.string(),
  status: EntryStatusSchema,
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  // For resumable content: "01:23:45" for video, "page 150" for book
  position: z.string().optional(),
})
export type EntryProgress = z.infer<typeof EntryProgressSchema>

/**
 * Progress for an entire list
 * This is the primary unit of progress tracking
 */
export const ListProgressSchema = z.object({
  // Composite key: "star-wars/chronological"
  listId: z.string(),

  // When user first started this list
  startedAt: z.date().optional(),

  // When user completed the entire list
  completedAt: z.date().optional(),

  // Progress for each entry in the list
  entries: z.array(EntryProgressSchema),
})
export type ListProgress = z.infer<typeof ListProgressSchema>

/**
 * Computed stats for a list (not stored, derived from ListProgress)
 */
export interface ListStats {
  totalEntries: number
  completedCount: number
  inProgressCount: number
  notStartedCount: number
  progressPercent: number
  // Time in minutes
  timeInvested: number
  timeRemaining: number
  // Entries per week since started
  speed: number | null
  // Days until completion at current speed
  projectedDaysRemaining: number | null
  // Current streak of consecutive days with progress
  currentStreak: number
}
