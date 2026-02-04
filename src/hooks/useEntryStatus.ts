import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState, useEffect } from 'react'
import { getDbStatus, initDatabase } from '@/data/db'
import {
  getEntryCompletion,
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
 * Hook for a single entry's global completion status
 * Entry status is shared across all lists containing that entry
 *
 * @param entryId - The entry ID (e.g., "phantom-menace")
 * @param fandomId - The fandom this entry belongs to (e.g., "star-wars")
 */
export function useEntryStatus(
  entryId: string,
  fandomId: string
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

  // Live query for this entry's global completion status
  // Returns { loaded: false } initially, then { loaded: true, data: ... } after query
  const result = useLiveQuery(
    async () => {
      if (!isDbReady) return { loaded: false as const }
      const data = await getEntryCompletion(entryId)
      return { loaded: true as const, data }
    },
    [entryId, isDbReady],
    { loaded: false as const }
  )

  const status: EntryStatus = result.loaded
    ? (result.data?.status ?? 'not-started')
    : 'not-started'
  const queryLoading = !result.loaded

  // Set status - ensures db is initialized before writing
  const setStatus = useCallback(
    async (newStatus: EntryStatus) => {
      const dbStatus = await initDatabase()
      if (dbStatus.mode === 'unavailable') return
      await setEntryStatusQuery(entryId, fandomId, newStatus)
    },
    [entryId, fandomId]
  )

  // Toggle between not-started and completed
  const toggle = useCallback(async () => {
    try {
      const dbStatus = await initDatabase()
      if (dbStatus.mode === 'unavailable') {
        console.warn('Database unavailable, cannot toggle entry status')
        return
      }

      // Get current status fresh to avoid stale closure
      const current = await getEntryCompletion(entryId)
      const currentStatus = current?.status ?? 'not-started'

      const newStatus: EntryStatus =
        currentStatus === 'completed' ? 'not-started' : 'completed'
      await setEntryStatusQuery(entryId, fandomId, newStatus)
    } catch (error) {
      console.error('Failed to toggle entry status:', error)
    }
  }, [entryId, fandomId])

  return {
    status,
    isLoading: queryLoading,
    setStatus,
    toggle,
    isCompleted: status === 'completed',
    isInProgress: status === 'in-progress',
  }
}
