import { getDb } from '../db'
import type {
  ListProgress,
  EntryProgress,
  EntryStatus,
  ListStats,
} from '../schemas'

/**
 * Get progress for a specific list
 */
export async function getListProgress(
  listId: string
): Promise<ListProgress | undefined> {
  const db = getDb()
  return db.progress.get(listId)
}

/**
 * Get progress for multiple lists
 */
export async function getListsProgress(
  listIds: string[]
): Promise<Map<string, ListProgress>> {
  const db = getDb()
  const results = await db.progress.bulkGet(listIds)
  const map = new Map<string, ListProgress>()
  results.forEach((progress, index) => {
    if (progress) {
      map.set(listIds[index], progress)
    }
  })
  return map
}

/**
 * Get all lists with any progress
 */
export async function getAllProgress(): Promise<ListProgress[]> {
  const db = getDb()
  return db.progress.toArray()
}

/**
 * Initialize progress for a list if it doesn't exist
 */
export async function ensureListProgress(
  listId: string
): Promise<ListProgress> {
  const db = getDb()
  const existing = await db.progress.get(listId)
  if (existing) {
    return existing
  }

  const newProgress: ListProgress = {
    listId,
    entries: [],
  }
  await db.progress.add(newProgress)
  return newProgress
}

/**
 * Set the status of a specific entry within a list
 */
export async function setEntryStatus(
  listId: string,
  entryId: string,
  status: EntryStatus
): Promise<void> {
  const db = getDb()
  const progress = await ensureListProgress(listId)
  const now = new Date()

  // Find existing entry progress or create new
  const entryIndex = progress.entries.findIndex((e) => e.entryId === entryId)

  if (entryIndex >= 0) {
    // Update existing entry
    const entry = progress.entries[entryIndex]
    entry.status = status

    if (status === 'in-progress' && !entry.startedAt) {
      entry.startedAt = now
    }
    if (status === 'completed') {
      entry.completedAt = now
      if (!entry.startedAt) {
        entry.startedAt = now
      }
    }
    if (status === 'not-started') {
      entry.startedAt = undefined
      entry.completedAt = undefined
      entry.position = undefined
    }
  } else {
    // Create new entry progress
    const newEntry: EntryProgress = {
      entryId,
      status,
      startedAt: status !== 'not-started' ? now : undefined,
      completedAt: status === 'completed' ? now : undefined,
    }
    progress.entries.push(newEntry)
  }

  // Update list timestamps
  if (!progress.startedAt && status !== 'not-started') {
    progress.startedAt = now
  }

  await db.progress.put(progress)
}

/**
 * Get the status of a specific entry within a list
 */
export async function getEntryStatus(
  listId: string,
  entryId: string
): Promise<EntryStatus> {
  const db = getDb()
  const progress = await db.progress.get(listId)
  if (!progress) {
    return 'not-started'
  }

  const entry = progress.entries.find((e) => e.entryId === entryId)
  return entry?.status ?? 'not-started'
}

/**
 * Update the position for resumable content (video timestamp, page number)
 */
export async function updateEntryPosition(
  listId: string,
  entryId: string,
  position: string
): Promise<void> {
  const db = getDb()
  const progress = await ensureListProgress(listId)

  const entry = progress.entries.find((e) => e.entryId === entryId)
  if (entry) {
    entry.position = position
    if (entry.status === 'not-started') {
      entry.status = 'in-progress'
      entry.startedAt = new Date()
    }
    await db.progress.put(progress)
  }
}

/**
 * Mark a list as completed
 */
export async function completeList(listId: string): Promise<void> {
  const db = getDb()
  const progress = await db.progress.get(listId)
  if (progress) {
    progress.completedAt = new Date()
    await db.progress.put(progress)
  }
}

/**
 * Compute statistics for a list
 */
export function computeListStats(
  progress: ListProgress | undefined,
  totalEntries: number,
  entryRuntimes?: Map<string, number>
): ListStats {
  if (!progress) {
    return {
      totalEntries,
      completedCount: 0,
      inProgressCount: 0,
      notStartedCount: totalEntries,
      progressPercent: 0,
      timeInvested: 0,
      timeRemaining: entryRuntimes
        ? Array.from(entryRuntimes.values()).reduce((a, b) => a + b, 0)
        : 0,
      speed: null,
      projectedDaysRemaining: null,
      currentStreak: 0,
    }
  }

  const completedCount = progress.entries.filter(
    (e) => e.status === 'completed'
  ).length
  const inProgressCount = progress.entries.filter(
    (e) => e.status === 'in-progress'
  ).length
  const notStartedCount = totalEntries - completedCount - inProgressCount

  const progressPercent =
    totalEntries > 0 ? Math.round((completedCount / totalEntries) * 100) : 0

  // Calculate time invested and remaining
  let timeInvested = 0
  let timeRemaining = 0

  if (entryRuntimes) {
    progress.entries.forEach((entry) => {
      const runtime = entryRuntimes.get(entry.entryId) ?? 0
      if (entry.status === 'completed') {
        timeInvested += runtime
      }
    })

    entryRuntimes.forEach((runtime, entryId) => {
      const entry = progress.entries.find((e) => e.entryId === entryId)
      if (!entry || entry.status !== 'completed') {
        timeRemaining += runtime
      }
    })
  }

  // Calculate speed (entries per week)
  let speed: number | null = null
  let projectedDaysRemaining: number | null = null

  if (progress.startedAt && completedCount > 0) {
    const daysSinceStart =
      (Date.now() - progress.startedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceStart >= 1) {
      speed = Math.round((completedCount / daysSinceStart) * 7 * 10) / 10
      if (speed > 0) {
        projectedDaysRemaining = Math.ceil(
          (notStartedCount + inProgressCount) / (speed / 7)
        )
      }
    }
  }

  // Calculate current streak (simplified - consecutive days with completions)
  const currentStreak = calculateStreak(progress.entries)

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
function calculateStreak(entries: EntryProgress[]): number {
  const completionDates = entries
    .filter((e) => e.completedAt)
    .map((e) => {
      const date = e.completedAt!
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).getTime()
    })
    .sort((a, b) => b - a) // Most recent first

  if (completionDates.length === 0) return 0

  const uniqueDates = [...new Set(completionDates)]
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

/**
 * Delete all progress for a list
 */
export async function deleteListProgress(listId: string): Promise<void> {
  const db = getDb()
  await db.progress.delete(listId)
}
