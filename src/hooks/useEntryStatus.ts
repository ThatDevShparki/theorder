import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import { getDbStatus } from '@/data/db'
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
  // Check if database is available
  const dbStatus = getDbStatus()
  const isDbAvailable = dbStatus && dbStatus.mode !== 'unavailable'

  // Live query for this specific entry's status
  const status = useLiveQuery(
    async (): Promise<EntryStatus> => {
      if (!isDbAvailable) return 'not-started'

      const progress = await getListProgress(listId)
      if (!progress) return 'not-started'

      const entry = progress.entries.find((e) => e.entryId === entryId)
      return entry?.status ?? 'not-started'
    },
    [listId, entryId, isDbAvailable],
    'not-started' as EntryStatus
  )

  // Set status
  const setStatus = useCallback(
    async (newStatus: EntryStatus) => {
      if (!isDbAvailable) return
      await setEntryStatusQuery(listId, entryId, newStatus)
    },
    [listId, entryId, isDbAvailable]
  )

  // Toggle between not-started and completed
  const toggle = useCallback(async () => {
    if (!isDbAvailable) return

    const newStatus: EntryStatus =
      status === 'completed' ? 'not-started' : 'completed'
    await setEntryStatusQuery(listId, entryId, newStatus)
  }, [listId, entryId, status, isDbAvailable])

  return {
    status,
    isLoading: status === undefined,
    setStatus,
    toggle,
    isCompleted: status === 'completed',
    isInProgress: status === 'in-progress',
  }
}
