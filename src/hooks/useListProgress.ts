import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState, useEffect } from 'react'
import { getDbStatus, initDatabase } from '@/data/db'
import {
  getEntriesCompletion,
  setEntryStatus as setEntryStatusQuery,
  getEntryCompletion,
  computeListStats,
} from '@/data/queries'
import type { EntryStatus, ListStats } from '@/data/schemas'

interface UseListProgressOptions {
  /** Entry IDs in this list */
  entryIds: string[]
  /** Fandom ID for this list */
  fandomId: string
  /** Map of entry ID to runtime in minutes (optional, for time stats) */
  entryRuntimes?: Map<string, number>
}

interface UseListProgressReturn {
  /** Computed statistics */
  stats: ListStats
  /** Whether the data is still loading */
  isLoading: boolean
  /** Set the status of a specific entry */
  setEntryStatus: (entryId: string, status: EntryStatus) => Promise<void>
  /** Toggle an entry between not-started and completed */
  toggleEntry: (entryId: string) => Promise<void>
  /** Get the status of a specific entry */
  getEntryStatus: (entryId: string) => EntryStatus
  /** Map of entry completions */
  completions: Map<string, EntryStatus>
}

const defaultStats: ListStats = {
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

/**
 * Hook for tracking progress on a specific list
 * Uses global entry completion status
 *
 * @param listId - Composite list ID (e.g., "star-wars/chronological") - used for caching
 * @param options - Configuration including entry IDs
 */
export function useListProgress(
  _listId: string,
  options: UseListProgressOptions
): UseListProgressReturn {
  const { entryIds, fandomId, entryRuntimes } = options

  // Track database availability reactively
  const [isDbReady, setIsDbReady] = useState(() => {
    const status = getDbStatus()
    return status !== null && status.mode !== 'unavailable'
  })

  // Initialize database on mount if not already initialized
  useEffect(() => {
    const status = getDbStatus()
    if (status === null) {
      initDatabase().then((dbStatus) => {
        setIsDbReady(dbStatus.mode !== 'unavailable')
      })
    }
  }, [])

  // Live query for stats (recomputes when any entry changes)
  const result = useLiveQuery(
    async () => {
      if (!isDbReady || entryIds.length === 0) {
        return {
          stats: { ...defaultStats, totalEntries: entryIds.length },
          completions: new Map(),
        }
      }

      const [stats, completionsMap] = await Promise.all([
        computeListStats(entryIds, entryRuntimes),
        getEntriesCompletion(entryIds),
      ])

      // Convert to status map
      const completions = new Map<string, EntryStatus>()
      completionsMap.forEach((completion, entryId) => {
        completions.set(entryId, completion.status)
      })

      return { stats, completions }
    },
    [entryIds, isDbReady, entryRuntimes],
    {
      stats: { ...defaultStats, totalEntries: entryIds.length },
      completions: new Map<string, EntryStatus>(),
    }
  )

  // Set entry status - ensures db is initialized before writing
  const setEntryStatus = useCallback(
    async (entryId: string, status: EntryStatus) => {
      const dbStatus = await initDatabase()
      if (dbStatus.mode === 'unavailable') return
      await setEntryStatusQuery(entryId, fandomId, status)
    },
    [fandomId]
  )

  // Toggle entry between not-started and completed
  const toggleEntry = useCallback(
    async (entryId: string) => {
      const dbStatus = await initDatabase()
      if (dbStatus.mode === 'unavailable') return

      const current = await getEntryCompletion(entryId)
      const currentStatus = current?.status ?? 'not-started'

      const newStatus: EntryStatus =
        currentStatus === 'completed' ? 'not-started' : 'completed'
      await setEntryStatusQuery(entryId, fandomId, newStatus)
    },
    [fandomId]
  )

  // Get entry status from current completions
  const getEntryStatus = useCallback(
    (entryId: string): EntryStatus => {
      return result.completions.get(entryId) ?? 'not-started'
    },
    [result.completions]
  )

  return {
    stats: result.stats,
    isLoading: isDbReady && result === undefined,
    setEntryStatus,
    toggleEntry,
    getEntryStatus,
    completions: result.completions,
  }
}
