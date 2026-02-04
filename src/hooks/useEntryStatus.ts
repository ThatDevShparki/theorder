import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState, useEffect } from 'react'
import { getDbStatus, initDatabase } from '@/data/db'
import {
  getListProgress,
  setEntryStatus as setEntryStatusQuery,
} from '@/data/queries'
import type { EntryStatus } from '@/data/schemas'

interface UseEntryStatusReturn {
  /** Current status of the entry */
  status: EntryStatus
  /** Whether the data is still loading */
  isLoading: boolean
  /** Set the entry status */
  setStatus: (status: EntryStatus) => Promise<void>
  /** Toggle between not-started and completed */
  toggle: () => Promise<void>
  /** Whether the entry is completed */
  isCompleted: boolean
  /** Whether the entry is in progress */
  isInProgress: boolean
}

/**
 * Hook for a single entry's status within a list
 * Optimized for individual ProgressToggle islands
 *
 * @param listId - Composite list ID (e.g., "star-wars/chronological")
 * @param entryId - The entry ID within the list
 */
export function useEntryStatus(
  listId: string,
  entryId: string
): UseEntryStatusReturn {
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

  // Live query for this specific entry's status
  const status = useLiveQuery(
    async (): Promise<EntryStatus> => {
      if (!isDbReady) return 'not-started'

      const progress = await getListProgress(listId)
      if (!progress) return 'not-started'

      const entry = progress.entries.find((e) => e.entryId === entryId)
      return entry?.status ?? 'not-started'
    },
    [listId, entryId, isDbReady],
    'not-started' as EntryStatus
  )

  // Set status - ensures db is initialized before writing
  const setStatus = useCallback(
    async (newStatus: EntryStatus) => {
      // Ensure database is initialized
      const dbStatus = await initDatabase()
      if (dbStatus.mode === 'unavailable') return
      await setEntryStatusQuery(listId, entryId, newStatus)
    },
    [listId, entryId]
  )

  // Toggle between not-started and completed
  const toggle = useCallback(async () => {
    // Ensure database is initialized
    const dbStatus = await initDatabase()
    if (dbStatus.mode === 'unavailable') return

    // Get current status fresh to avoid stale closure
    const progress = await getListProgress(listId)
    const entry = progress?.entries.find((e) => e.entryId === entryId)
    const currentStatus = entry?.status ?? 'not-started'

    const newStatus: EntryStatus =
      currentStatus === 'completed' ? 'not-started' : 'completed'
    await setEntryStatusQuery(listId, entryId, newStatus)
  }, [listId, entryId])

  return {
    status,
    isLoading: status === undefined,
    setStatus,
    toggle,
    isCompleted: status === 'completed',
    isInProgress: status === 'in-progress',
  }
}
