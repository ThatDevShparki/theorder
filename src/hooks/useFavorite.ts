import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState, useEffect } from 'react'
import { getDbStatus, initDatabase } from '@/data/db'
import {
  isFavorite as isFavoriteQuery,
  toggleFavorite as toggleFavoriteQuery,
  getAllFavorites,
  getFavoriteFandomIds,
  getFavoriteListIds,
} from '@/data/queries'
import type { Favorite, FavoriteType } from '@/data/schemas'

interface UseFavoriteReturn {
  isFavorite: boolean
  isLoading: boolean
  toggle: () => Promise<void>
}

/**
 * Hook to check and toggle favorite status for a single item
 */
export function useFavorite(
  type: FavoriteType,
  itemId: string,
  fandomId?: string
): UseFavoriteReturn {
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

  // Live query for favorite status
  const result = useLiveQuery(
    async () => {
      if (!isDbReady) return { loaded: false as const }
      const favorite = await isFavoriteQuery(type, itemId)
      return { loaded: true as const, isFavorite: favorite }
    },
    [type, itemId, isDbReady],
    { loaded: false as const }
  )

  const toggle = useCallback(async () => {
    try {
      const dbStatus = await initDatabase()
      if (dbStatus.mode === 'unavailable') return
      await toggleFavoriteQuery(type, itemId, fandomId)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }, [type, itemId, fandomId])

  return {
    isFavorite: result.loaded ? result.isFavorite : false,
    isLoading: !result.loaded,
    toggle,
  }
}

interface UseFavoritesReturn {
  favorites: Favorite[]
  fandomIds: string[]
  listIds: string[]
  isLoading: boolean
}

/**
 * Hook to get all favorites
 */
export function useFavorites(): UseFavoritesReturn {
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

  // Live query for all favorites
  const result = useLiveQuery(
    async () => {
      if (!isDbReady) return { loaded: false as const }
      const [favorites, fandomIds, listIds] = await Promise.all([
        getAllFavorites(),
        getFavoriteFandomIds(),
        getFavoriteListIds(),
      ])
      return { loaded: true as const, favorites, fandomIds, listIds }
    },
    [isDbReady],
    { loaded: false as const }
  )

  return {
    favorites: result.loaded ? result.favorites : [],
    fandomIds: result.loaded ? result.fandomIds : [],
    listIds: result.loaded ? result.listIds : [],
    isLoading: !result.loaded,
  }
}
