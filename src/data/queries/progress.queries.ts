import { getDb } from '../db'
import type {
  EntryCompletion,
  EntryStatus,
  ListProgress,
  ListStats,
} from '../schemas'

/**
 * Get completion status for a single entry (global, not list-specific)
 */
export async function getEntryCompletion(
  entryId: string
): Promise<EntryCompletion | undefined> {
  const db = getDb()
  return db.entries.get(entryId)
}

/**
 * Get completion status for multiple entries
 */
export async function getEntriesCompletion(
  entryIds: string[]
): Promise<Map<string, EntryCompletion>> {
  const db = getDb()
  const results = await db.entries.bulkGet(entryIds)
  const map = new Map<string, EntryCompletion>()
  results.forEach((completion, index) => {
    if (completion) {
      map.set(entryIds[index], completion)
    }
  })
  return map
}

/**
 * Get all entries for a fandom
 */
export async function getFandomEntries(
  fandomId: string
): Promise<EntryCompletion[]> {
  const db = getDb()
  return db.entries.where('fandomId').equals(fandomId).toArray()
}

/**
 * Get all completed/in-progress entries
 */
export async function getAllCompletedEntries(): Promise<EntryCompletion[]> {
  const db = getDb()
  return db.entries.toArray()
}

/**
 * Set the status of an entry (global)
 */
export async function setEntryStatus(
  entryId: string,
  fandomId: string,
  status: EntryStatus
): Promise<void> {
  const db = getDb()
  const now = new Date()

  const existing = await db.entries.get(entryId)

  if (existing) {
    // Update existing entry
    existing.status = status

    if (status === 'in-progress' && !existing.startedAt) {
      existing.startedAt = now
    }
    if (status === 'completed') {
      existing.completedAt = now
      if (!existing.startedAt) {
        existing.startedAt = now
      }
    }
    if (status === 'not-started') {
      // Remove entry entirely when reset to not-started
      await db.entries.delete(entryId)
      return
    }

    await db.entries.put(existing)
  } else if (status !== 'not-started') {
    // Create new entry (only if not resetting to not-started)
    const newEntry: EntryCompletion = {
      entryId,
      fandomId,
      status,
      startedAt: now,
      completedAt: status === 'completed' ? now : undefined,
    }
    await db.entries.add(newEntry)
  }
}

/**
 * Get the status of a specific entry
 */
export async function getEntryStatus(entryId: string): Promise<EntryStatus> {
  const db = getDb()
  const completion = await db.entries.get(entryId)
  return completion?.status ?? 'not-started'
}

/**
 * Update the position for resumable content (video timestamp, page number)
 */
export async function updateEntryPosition(
  entryId: string,
  fandomId: string,
  position: string
): Promise<void> {
  const db = getDb()
  const existing = await db.entries.get(entryId)

  if (existing) {
    existing.position = position
    if (existing.status === 'not-started') {
      existing.status = 'in-progress'
      existing.startedAt = new Date()
    }
    await db.entries.put(existing)
  } else {
    // Create new entry with in-progress status
    const newEntry: EntryCompletion = {
      entryId,
      fandomId,
      status: 'in-progress',
      startedAt: new Date(),
      position,
    }
    await db.entries.add(newEntry)
  }
}

// ============ List Progress (metadata only) ============

/**
 * Get progress metadata for a specific list
 */
export async function getListProgress(
  listId: string
): Promise<ListProgress | undefined> {
  const db = getDb()
  return db.progress.get(listId)
}

/**
 * Mark a list as started
 */
export async function markListStarted(listId: string): Promise<void> {
  const db = getDb()
  const existing = await db.progress.get(listId)
  if (!existing) {
    await db.progress.add({
      listId,
      startedAt: new Date(),
    })
  }
}

/**
 * Mark a list as completed
 */
export async function markListCompleted(listId: string): Promise<void> {
  const db = getDb()
  const existing = await db.progress.get(listId)
  if (existing) {
    existing.completedAt = new Date()
    await db.progress.put(existing)
  } else {
    await db.progress.add({
      listId,
      startedAt: new Date(),
      completedAt: new Date(),
    })
  }
}

/**
 * Get all lists with any progress metadata
 */
export async function getAllProgress(): Promise<ListProgress[]> {
  const db = getDb()
  return db.progress.toArray()
}

/**
 * Delete progress metadata for a list
 */
export async function deleteListProgress(listId: string): Promise<void> {
  const db = getDb()
  await db.progress.delete(listId)
}

// ============ Stats Computation ============

/**
 * Compute statistics for a list based on global entry completion
 */
export async function computeListStats(
  entryIds: string[],
  entryRuntimes?: Map<string, number>
): Promise<ListStats> {
  const totalEntries = entryIds.length

  if (totalEntries === 0) {
    return {
      totalEntries: 0,
      completedCount: 0,
      inProgressCount: 0,
      notStartedCount: 0,
      progressPercent: 0,
      timeInvested: 0,
      timeRemaining: 0,
      speed: null,
      projectedDaysRemaining: null,
      currentStreak: 0,
    }
  }

  const completions = await getEntriesCompletion(entryIds)

  let completedCount = 0
  let inProgressCount = 0
  let timeInvested = 0
  let timeRemaining = 0
  let earliestStart: Date | null = null
  const completionDates: number[] = []

  entryIds.forEach((entryId) => {
    const completion = completions.get(entryId)
    const runtime = entryRuntimes?.get(entryId) ?? 0

    if (completion?.status === 'completed') {
      completedCount++
      timeInvested += runtime
      if (completion.completedAt) {
        completionDates.push(completion.completedAt.getTime())
      }
      if (completion.startedAt) {
        if (!earliestStart || completion.startedAt < earliestStart) {
          earliestStart = completion.startedAt
        }
      }
    } else if (completion?.status === 'in-progress') {
      inProgressCount++
      if (completion.startedAt) {
        if (!earliestStart || completion.startedAt < earliestStart) {
          earliestStart = completion.startedAt
        }
      }
    }

    if (!completion || completion.status !== 'completed') {
      timeRemaining += runtime
    }
  })

  const notStartedCount = totalEntries - completedCount - inProgressCount
  const progressPercent =
    totalEntries > 0 ? Math.round((completedCount / totalEntries) * 100) : 0

  // Calculate speed (entries per week)
  let speed: number | null = null
  let projectedDaysRemaining: number | null = null

  if (earliestStart !== null && completedCount > 0) {
    const daysSinceStart =
      (Date.now() - (earliestStart as Date).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceStart >= 1 && Number.isFinite(daysSinceStart)) {
      const rawSpeed = (completedCount / daysSinceStart) * 7
      speed = Number.isFinite(rawSpeed) ? Math.round(rawSpeed * 10) / 10 : null
      if (speed !== null && speed > 0) {
        const remaining = notStartedCount + inProgressCount
        const daysCalc = remaining / (speed / 7)
        projectedDaysRemaining = Number.isFinite(daysCalc)
          ? Math.ceil(daysCalc)
          : null
      }
    }
  }

  // Calculate streak
  const currentStreak = calculateStreak(completionDates)

  return {
    totalEntries,
    completedCount,
    inProgressCount,
    notStartedCount,
    progressPercent,
    timeInvested,
    timeRemaining,
    speed,
    projectedDaysRemaining,
    currentStreak,
  }
}

/**
 * Calculate streak of consecutive days with completed entries
 */
function calculateStreak(completionTimestamps: number[]): number {
  if (completionTimestamps.length === 0) return 0

  const uniqueDates = [
    ...new Set(
      completionTimestamps.map((ts) => {
        const date = new Date(ts)
        return new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ).getTime()
      })
    ),
  ].sort((a, b) => b - a) // Most recent first

  const today = new Date()
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime()
  const oneDayMs = 24 * 60 * 60 * 1000

  let streak = 0
  let expectedDate = todayStart

  // Allow yesterday to count if no activity today
  if (uniqueDates[0] !== todayStart) {
    expectedDate = todayStart - oneDayMs
  }

  for (const date of uniqueDates) {
    if (date === expectedDate) {
      streak++
      expectedDate -= oneDayMs
    } else if (date < expectedDate) {
      break
    }
  }

  return streak
}
