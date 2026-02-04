import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import { getDbStatus } from '@/data/db'
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

  // Check if database is available
  const dbStatus = getDbStatus()
  const isDbAvailable = dbStatus && dbStatus.mode !== 'unavailable'

  // Live query for progress data
  const progress = useLiveQuery(
    async () => {
      if (!isDbAvailable) return undefined
      return getListProgress(listId)
    },
    [listId, isDbAvailable],
    undefined
  )

  // Compute stats from progress
  const stats = useMemo(
    () => computeListStats(progress, totalEntries, entryRuntimes),
    [progress, totalEntries, entryRuntimes]
  )

  // Set entry status
  const setEntryStatus = useCallback(
    async (entryId: string, status: EntryStatus) => {
      if (!isDbAvailable) return
      await setEntryStatusQuery(listId, entryId, status)
    },
    [listId, isDbAvailable]
  )

  // Toggle entry between not-started and completed
  const toggleEntry = useCallback(
    async (entryId: string) => {
      if (!isDbAvailable) return

      const currentProgress = await getListProgress(listId)
      const entry = currentProgress?.entries.find((e) => e.entryId === entryId)
      const currentStatus = entry?.status ?? 'not-started'

      const newStatus: EntryStatus =
        currentStatus === 'completed' ? 'not-started' : 'completed'
      await setEntryStatusQuery(listId, entryId, newStatus)
    },
    [listId, isDbAvailable]
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
    isLoading: progress === undefined && !!isDbAvailable,
    setEntryStatus,
    toggleEntry,
    getEntryStatus,
  }
}
