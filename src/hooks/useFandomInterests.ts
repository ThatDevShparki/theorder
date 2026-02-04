import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import { getDbStatus } from '@/data/db'
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
  // Check if database is available
  const dbStatus = getDbStatus()
  const isDbAvailable = dbStatus && dbStatus.mode !== 'unavailable'

  // Live query for all interests
  const interests = useLiveQuery(
    async () => {
      if (!isDbAvailable) return []
      return getAllInterests()
    },
    [isDbAvailable],
    [] as FandomInterest[]
  )

  // Add fandom to interests
  const add = useCallback(
    async (fandomId: string) => {
      if (!isDbAvailable) return
      await addFandomInterest(fandomId)
    },
    [isDbAvailable]
  )

  // Remove fandom from interests
  const remove = useCallback(
    async (fandomId: string) => {
      if (!isDbAvailable) return
      await removeFandomInterest(fandomId)
    },
    [isDbAvailable]
  )

  // Toggle fandom interest
  const toggle = useCallback(
    async (fandomId: string): Promise<boolean> => {
      if (!isDbAvailable) return false
      return toggleQuery(fandomId)
    },
    [isDbAvailable]
  )

  // Check if fandom is in interests (from current data)
  const has = useCallback(
    (fandomId: string): boolean => {
      return interests.some((i) => i.fandomId === fandomId)
    },
    [interests]
  )

  // Reorder interests
  const reorder = useCallback(
    async (fandomIds: string[]) => {
      if (!isDbAvailable) return
      await reorderInterests(fandomIds)
    },
    [isDbAvailable]
  )

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
  const dbStatus = getDbStatus()
  const isDbAvailable = dbStatus && dbStatus.mode !== 'unavailable'

  const isInterested = useLiveQuery(
    async () => {
      if (!isDbAvailable) return false
      return hasFandomInterest(fandomId)
    },
    [fandomId, isDbAvailable],
    false
  )

  const toggle = useCallback(async () => {
    if (!isDbAvailable) return
    await toggleQuery(fandomId)
  }, [fandomId, isDbAvailable])

  return {
    isInterested,
    toggle,
    isLoading: isInterested === undefined,
  }
}
