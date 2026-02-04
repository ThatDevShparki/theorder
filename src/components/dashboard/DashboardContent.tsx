import { useMemo, useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play } from 'lucide-react'
import { useFavorites, useListProgress } from '@/hooks'
import { Skeleton } from '@/components/ui/skeleton'
import { flattenEntries, createListId } from '@/lib/content-utils'
import { getDbStatus, initDatabase } from '@/data/db'
import { getAllCompletedEntries } from '@/data/queries'
import type { Layer } from '@/lib/content-utils'

interface FandomData {
  id: string
  name: string
  description?: string
}

interface ListData {
  id: string
  title: string
  fandomId: string
  structure: Layer[]
}

interface EntryDisplayData {
  id: string
  title: string
  type: string
  seasonNumber?: number
  episodeNumber?: number
  showTitle?: string
  runtime?: number
}

interface DashboardContentProps {
  allFandoms: FandomData[]
  allLists: ListData[]
  allEntries: Record<string, EntryDisplayData>
}

/**
 * Dashboard showing user's active fandoms and their progress
 */
export default function DashboardContent({
  allFandoms,
  allLists,
  allEntries,
}: DashboardContentProps) {
  const {
    isLoading: favoritesLoading,
    fandomIds: favoriteFandomIds,
    listIds: favoriteListIds,
  } = useFavorites()

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

  // Get all completed/in-progress entries to find fandoms with activity
  const progressEntries = useLiveQuery(
    async () => {
      if (!isDbReady) return []
      return getAllCompletedEntries()
    },
    [isDbReady],
    []
  )

  // Extract fandom IDs from entries with progress
  const progressFandomIds = useMemo(() => {
    const fandomIds = new Set<string>()
    progressEntries.forEach((entry) => {
      fandomIds.add(entry.fandomId)
    })
    return Array.from(fandomIds)
  }, [progressEntries])

  // Combine favorites and progress to get all active fandoms
  const activeFandomIds = useMemo(() => {
    // Include favorited fandoms
    const combined = new Set([...favoriteFandomIds, ...progressFandomIds])
    // Also include fandoms from favorited lists
    favoriteListIds.forEach((listId) => {
      const fandomId = listId.split('/')[0]
      combined.add(fandomId)
    })
    return Array.from(combined)
  }, [favoriteFandomIds, progressFandomIds, favoriteListIds])

  // Filter to only active fandoms
  const activeFandoms = useMemo(() => {
    if (activeFandomIds.length === 0) return []
    return allFandoms.filter((f) => activeFandomIds.includes(f.id))
  }, [allFandoms, activeFandomIds])

  // Create a set of favorited list IDs for quick lookup
  const favoriteListIdSet = useMemo(
    () => new Set(favoriteListIds),
    [favoriteListIds]
  )

  // Group lists by fandom
  const listsByFandom = useMemo(() => {
    const map = new Map<string, ListData[]>()
    allLists.forEach((list) => {
      const existing = map.get(list.fandomId) || []
      existing.push(list)
      map.set(list.fandomId, existing)
    })
    return map
  }, [allLists])

  const isLoading =
    favoritesLoading || (isDbReady && progressEntries === undefined)

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-elevated rounded-xl p-6">
            <Skeleton className="mb-4 h-6 w-48" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (activeFandoms.length === 0) {
    return (
      <div className="bg-elevated rounded-xl p-8 text-center">
        <h3 className="text-lg font-semibold">No fandoms tracked yet</h3>
        <p className="text-muted-foreground mt-2">
          Start by browsing fandoms and adding some to your journey.
        </p>
        <a
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 hover:glow-magenta mt-4 inline-block rounded-lg px-6 py-2 font-medium transition-colors"
        >
          Browse Fandoms
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activeFandoms.map((fandom) => {
        const lists = listsByFandom.get(fandom.id) || []
        const isFavorite = favoriteFandomIds.includes(fandom.id)
        return (
          <FandomProgress
            key={fandom.id}
            fandom={fandom}
            lists={lists}
            isFavorite={isFavorite}
            favoriteListIds={favoriteListIdSet}
            allEntries={allEntries}
          />
        )
      })}
    </div>
  )
}

interface FandomProgressProps {
  fandom: FandomData
  lists: ListData[]
  isFavorite: boolean
  favoriteListIds: Set<string>
  allEntries: Record<string, EntryDisplayData>
}

function FandomProgress({
  fandom,
  lists,
  isFavorite,
  favoriteListIds,
  allEntries,
}: FandomProgressProps) {
  return (
    <div className="bg-elevated rounded-xl p-6">
      <a
        href={`/fandom/${fandom.id}`}
        className="group flex items-center justify-between"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isFavorite && (
            <span className="text-warning shrink-0" title="Favorited">
              ★
            </span>
          )}
          <h3 className="group-hover:text-primary truncate font-serif text-xl font-semibold tracking-wide">
            {fandom.name}
          </h3>
        </div>
        <span className="text-muted-foreground group-hover:text-foreground text-sm">
          View →
        </span>
      </a>

      {lists.length > 0 && (
        <div className="mt-4 space-y-4">
          {lists.map((list) => {
            const listId = createListId(fandom.id, list.id)
            const isListFavorite = favoriteListIds.has(listId)
            return (
              <ListProgressRow
                key={list.id}
                list={list}
                fandomId={fandom.id}
                isFavorite={isListFavorite}
                allEntries={allEntries}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ListProgressRowProps {
  list: ListData
  fandomId: string
  isFavorite: boolean
  allEntries: Record<string, EntryDisplayData>
}

function ListProgressRow({
  list,
  fandomId,
  isFavorite,
  allEntries,
}: ListProgressRowProps) {
  const listId = createListId(fandomId, list.id)
  const entryIds = flattenEntries(list.structure)
  const { stats, isLoading, completions } = useListProgress(listId, {
    entryIds,
    fandomId,
  })

  // Find the next unwatched entry
  const nextEntry = useMemo(() => {
    for (const entryId of entryIds) {
      const status = completions.get(entryId)
      if (!status || status !== 'completed') {
        const entry = allEntries[entryId]
        // Skip if entry data is missing
        if (entry) return entry
      }
    }
    return null
  }, [entryIds, completions, allEntries])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full" />
      </div>
    )
  }

  const { progressPercent, completedCount, totalEntries } = stats
  const isComplete = completedCount === totalEntries

  // Format episode info
  const formatEpisodeInfo = (entry: EntryDisplayData) => {
    if (
      entry.type === 'tv-episode' &&
      entry.seasonNumber &&
      entry.episodeNumber
    ) {
      return `S${entry.seasonNumber}E${entry.episodeNumber}`
    }
    return null
  }

  return (
    <div className="space-y-2">
      <a href={`/fandom/${fandomId}/list/${list.id}`} className="group block">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1">
            {isFavorite && <span className="text-warning text-xs">★</span>}
            {list.title}
          </span>
          <span className="text-primary font-mono">
            {completedCount}/{totalEntries}
          </span>
        </div>
        <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--magenta)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </a>

      {/* Watch Next callout - show if list is not complete */}
      {!isComplete && nextEntry && (
        <a
          href={`/fandom/${fandomId}/list/${list.id}`}
          className="border-border/50 bg-background/50 hover:bg-background group hover:border-accent/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
        >
          <div className="bg-accent/20 text-accent flex size-8 shrink-0 items-center justify-center rounded-full">
            <Play className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Watch Next
            </div>
            <div className="group-hover:text-accent truncate font-medium">
              {nextEntry.title}
            </div>
            {(formatEpisodeInfo(nextEntry) || nextEntry.showTitle) && (
              <div className="text-muted-foreground truncate text-sm">
                {formatEpisodeInfo(nextEntry)}
                {formatEpisodeInfo(nextEntry) && nextEntry.showTitle && ' • '}
                {nextEntry.showTitle}
              </div>
            )}
          </div>
        </a>
      )}
    </div>
  )
}
