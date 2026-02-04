import { z } from 'zod/v4'

/**
 * Status of a single entry
 */
export const EntryStatusSchema = z.enum([
  'not-started',
  'in-progress',
  'completed',
])
export type EntryStatus = z.infer<typeof EntryStatusSchema>

/**
 * Global entry completion status
 * Keyed by entryId - shared across all lists
 */
export const EntryCompletionSchema = z.object({
  // Primary key: entry ID (e.g., "phantom-menace")
  entryId: z.string(),
  // Fandom this entry belongs to (for querying)
  fandomId: z.string(),
  status: EntryStatusSchema,
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  // For resumable content: "01:23:45" for video, "page 150" for book
  position: z.string().optional(),
})
export type EntryCompletion = z.infer<typeof EntryCompletionSchema>

/**
 * Progress metadata for a list (optional - for tracking when user started a list)
 */
export const ListProgressSchema = z.object({
  // Composite key: "star-wars/chronological"
  listId: z.string(),
  // When user first interacted with this list
  startedAt: z.date().optional(),
  // When user completed the entire list
  completedAt: z.date().optional(),
})
export type ListProgress = z.infer<typeof ListProgressSchema>

// Legacy type for migration compatibility
export interface EntryProgress {
  entryId: string
  status: EntryStatus
  startedAt?: Date
  completedAt?: Date
  position?: string
}

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
