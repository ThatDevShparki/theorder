import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { getDbStatus, initDatabase } from '@/data/db'
import {
  getListProgress,
  setEntryStatus as setEntryStatusQuery,
  computeListStats,
} from '@/data/queries'
import type { EntryStatus, ListProgress, ListStats } from '@/data/schemas'

interface UseListProgressOptions {
  /** Total number of entries in the list (from content) */
  totalEntries: number
  /** Map of entry ID to runtime in minutes (optional, for time stats) */
  entryRuntimes?: Map<string, number>
}

interface UseListProgressReturn {
  /** The progress data for this list */
  progress: ListProgress | undefined
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
}

/**
 * Hook for tracking progress on a specific list
 *
 * @param listId - Composite list ID (e.g., "star-wars/chronological")
 * @param options - Configuration including total entries count
 */
export function useListProgress(
  listId: string,
  options: UseListProgressOptions
): UseListProgressReturn {
  const { totalEntries, entryRuntimes } = options

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

  // Live query for progress data
  const progress = useLiveQuery(
    async () => {
      if (!isDbReady) return undefined
      return getListProgress(listId)
    },
    [listId, isDbReady],
    undefined
  )

  // Compute stats from progress
  const stats = useMemo(
    () => computeListStats(progress, totalEntries, entryRuntimes),
    [progress, totalEntries, entryRuntimes]
  )

  // Set entry status - ensures db is initialized before writing
  const setEntryStatus = useCallback(
    async (entryId: string, status: EntryStatus) => {
      const dbStatus = await initDatabase()
      if (dbStatus.mode === 'unavailable') return
      await setEntryStatusQuery(listId, entryId, status)
    },
    [listId]
  )

  // Toggle entry between not-started and completed
  const toggleEntry = useCallback(
    async (entryId: string) => {
      const dbStatus = await initDatabase()
      if (dbStatus.mode === 'unavailable') return

      const currentProgress = await getListProgress(listId)
      const entry = currentProgress?.entries.find((e) => e.entryId === entryId)
      const currentStatus = entry?.status ?? 'not-started'

      const newStatus: EntryStatus =
        currentStatus === 'completed' ? 'not-started' : 'completed'
      await setEntryStatusQuery(listId, entryId, newStatus)
    },
    [listId]
  )

  // Get entry status from current progress
  const getEntryStatus = useCallback(
    (entryId: string): EntryStatus => {
      const entry = progress?.entries.find((e) => e.entryId === entryId)
      return entry?.status ?? 'not-started'
    },
    [progress]
  )

  return {
    progress,
    stats,
    isLoading: progress === undefined && isDbReady,
    setEntryStatus,
    toggleEntry,
    getEntryStatus,
  }
}
