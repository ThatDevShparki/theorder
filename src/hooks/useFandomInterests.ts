import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState, useEffect } from 'react'
import { getDbStatus, initDatabase } from '@/data/db'
import {
  getAllInterests,
  addFandomInterest,
  removeFandomInterest,
  toggleFandomInterest as toggleQuery,
  hasFandomInterest,
  reorderInterests,
} from '@/data/queries'
import type { FandomInterest } from '@/data/schemas'

interface UseFandomInterestsReturn {
  /** All fandom interests, sorted by priority */
  interests: FandomInterest[]
  /** Whether the data is still loading */
  isLoading: boolean
  /** Add a fandom to interests */
  add: (fandomId: string) => Promise<void>
  /** Remove a fandom from interests */
  remove: (fandomId: string) => Promise<void>
  /** Toggle a fandom interest */
  toggle: (fandomId: string) => Promise<boolean>
  /** Check if a fandom is in interests */
  has: (fandomId: string) => boolean
  /** Reorder interests */
  reorder: (fandomIds: string[]) => Promise<void>
  /** IDs of interested fandoms */
  fandomIds: string[]
}

/**
 * Hook for managing fandom interests
 */
export function useFandomInterests(): UseFandomInterestsReturn {
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

  // Live query for all interests
  const interests = useLiveQuery(
    async () => {
      if (!isDbReady) return []
      return getAllInterests()
    },
    [isDbReady],
    [] as FandomInterest[]
  )

  // Add fandom to interests
  const add = useCallback(async (fandomId: string) => {
    const dbStatus = await initDatabase()
    if (dbStatus.mode === 'unavailable') return
    await addFandomInterest(fandomId)
  }, [])

  // Remove fandom from interests
  const remove = useCallback(async (fandomId: string) => {
    const dbStatus = await initDatabase()
    if (dbStatus.mode === 'unavailable') return
    await removeFandomInterest(fandomId)
  }, [])

  // Toggle fandom interest
  const toggle = useCallback(async (fandomId: string): Promise<boolean> => {
    const dbStatus = await initDatabase()
    if (dbStatus.mode === 'unavailable') return false
    return toggleQuery(fandomId)
  }, [])

  // Check if fandom is in interests (from current data)
  const has = useCallback(
    (fandomId: string): boolean => {
      return interests.some((i) => i.fandomId === fandomId)
    },
    [interests]
  )

  // Reorder interests
  const reorder = useCallback(async (fandomIds: string[]) => {
    const dbStatus = await initDatabase()
    if (dbStatus.mode === 'unavailable') return
    await reorderInterests(fandomIds)
  }, [])

  return {
    interests,
    isLoading: interests === undefined,
    add,
    remove,
    toggle,
    has,
    reorder,
    fandomIds: interests.map((i) => i.fandomId),
  }
}

/**
 * Hook to check if a specific fandom is in user's interests
 */
export function useFandomInterest(fandomId: string) {
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

  const isInterested = useLiveQuery(
    async () => {
      if (!isDbReady) return false
      return hasFandomInterest(fandomId)
    },
    [fandomId, isDbReady],
    false
  )

  const toggle = useCallback(async () => {
    const dbStatus = await initDatabase()
    if (dbStatus.mode === 'unavailable') return
    await toggleQuery(fandomId)
  }, [fandomId])

  return {
    isInterested,
    toggle,
    isLoading: isInterested === undefined,
  }
}
