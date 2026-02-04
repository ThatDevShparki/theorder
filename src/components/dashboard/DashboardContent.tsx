import { memo, useMemo, useState, useEffect } from 'react'
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
          <div
            key={i}
            className="bg-elevated rounded-lg border border-[var(--cyan)]/10 p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (activeFandoms.length === 0) {
    return (
      <div className="relative rounded-lg border border-[var(--cyan)]/20 bg-[var(--background-elevated)] p-10 text-center">
        {/* Corner marks */}
        <div className="absolute top-3 left-3 size-4 border-t-2 border-l-2 border-[var(--cyan)]/30" />
        <div className="absolute top-3 right-3 size-4 border-t-2 border-r-2 border-[var(--cyan)]/30" />
        <div className="absolute bottom-3 left-3 size-4 border-b-2 border-l-2 border-[var(--cyan)]/30" />
        <div className="absolute right-3 bottom-3 size-4 border-r-2 border-b-2 border-[var(--cyan)]/30" />

        <p className="mb-3 font-mono text-xs tracking-widest text-[var(--cyan)]/60">
          NO ACTIVE MISSIONS
        </p>
        <h3 className="font-serif text-xl font-bold tracking-wider uppercase">
          No Archives Tracked
        </h3>
        <p className="mx-auto mt-3 max-w-sm font-mono text-sm text-[var(--muted-foreground)]">
          Initialize tracking by selecting archives from the main directory.
        </p>
        <a
          href="/"
          className="glow-cyan mt-6 inline-flex items-center gap-2 rounded border border-[var(--cyan)]/50 bg-[var(--cyan)]/10 px-6 py-2.5 font-mono text-sm tracking-wider text-[var(--cyan)] transition-all hover:border-[var(--cyan)] hover:bg-[var(--cyan)]/20"
        >
          <span>→</span>
          <span>BROWSE ARCHIVES</span>
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activeFandoms.map((fandom, index) => {
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
            index={index}
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
  index: number
}

const FandomProgress = memo(function FandomProgress({
  fandom,
  lists,
  isFavorite,
  favoriteListIds,
  allEntries,
  index,
}: FandomProgressProps) {
  const archiveCode = fandom.id.toUpperCase().slice(0, 3)

  return (
    <div className="group/card relative rounded-lg border border-[var(--cyan)]/10 bg-[var(--background-elevated)] transition-all hover:border-[var(--cyan)]/30">
      {/* Top accent line */}
      <div className="h-0.5 rounded-t-lg bg-gradient-to-r from-transparent via-[var(--cyan)]/0 to-transparent transition-all group-hover/card:via-[var(--cyan)]/60" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cyan)]/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-widest text-[var(--cyan)]/60">
            MISSION.{String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-[var(--cyan)]/30">│</span>
          <span className="font-mono text-[10px] tracking-widest text-[var(--muted-foreground)]">
            {archiveCode}
          </span>
        </div>
        {isFavorite && (
          <span
            className="font-mono text-[10px] tracking-widest text-[var(--warning)]"
            title="Priority Mission"
          >
            ★ PRIORITY
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="p-5">
        <a
          href={`/fandom/${fandom.id}`}
          className="group flex items-center justify-between"
        >
          <h3 className="truncate font-serif text-xl font-bold tracking-wider uppercase transition-colors group-hover:text-[var(--accent)]">
            {fandom.name}
          </h3>
          <span className="flex items-center gap-2 font-mono text-xs tracking-wider text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--accent)]">
            ACCESS <span className="text-[var(--accent)]">→</span>
          </span>
        </a>

        {lists.length > 0 && (
          <div className="mt-5 space-y-4">
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
    </div>
  )
})

interface ListProgressRowProps {
  list: ListData
  fandomId: string
  isFavorite: boolean
  allEntries: Record<string, EntryDisplayData>
}

const ListProgressRow = memo(function ListProgressRow({
  list,
  fandomId,
  isFavorite,
  allEntries,
}: ListProgressRowProps) {
  const listId = createListId(fandomId, list.id)
  const entryIds = useMemo(
    () => flattenEntries(list.structure),
    [list.structure]
  )
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
      <div className="space-y-2 rounded border border-[var(--cyan)]/5 bg-[var(--background)]/50 p-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-1 w-full" />
      </div>
    )
  }

  const { progressPercent, completedCount, totalEntries } = stats
  const isComplete = completedCount === totalEntries

  return (
    <div className="space-y-3">
      <a
        href={`/fandom/${fandomId}/list/${list.id}`}
        className="group block rounded border border-[var(--cyan)]/5 bg-[var(--background)]/50 p-3 transition-all hover:border-[var(--cyan)]/20 hover:bg-[var(--background)]"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono text-sm tracking-wide text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
            {isFavorite && (
              <span className="text-[10px] text-[var(--warning)]">★</span>
            )}
            {list.title}
          </span>
          <span className="font-mono text-xs tracking-wider text-[var(--accent)]">
            {completedCount}/{totalEntries}
          </span>
        </div>

        {/* Progress bar with glow effect */}
        <div className="relative h-1 overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete
                ? 'bg-[var(--warning)] shadow-[0_0_10px_var(--warning)]'
                : 'bg-gradient-to-r from-[var(--purple)] to-[var(--magenta)]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
          {/* Animated scan line for in-progress */}
          {!isComplete && progressPercent > 0 && (
            <div
              className="absolute top-0 h-full w-1 animate-pulse bg-white/30"
              style={{ left: `${progressPercent}%` }}
            />
          )}
        </div>

        {/* Status indicator */}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest text-[var(--muted-foreground)]">
            {isComplete ? 'COMPLETE' : 'IN PROGRESS'}
          </span>
          <span
            className={`font-mono text-[10px] font-bold tracking-wider ${
              isComplete
                ? 'text-[var(--warning)]'
                : 'text-[var(--muted-foreground)]'
            }`}
          >
            {progressPercent}%
          </span>
        </div>
      </a>

      {/* Watch Next callout - show if list is not complete */}
      {!isComplete && nextEntry && (
        <WatchNextCard fandomId={fandomId} listId={list.id} entry={nextEntry} />
      )}
    </div>
  )
})

interface WatchNextCardProps {
  fandomId: string
  listId: string
  entry: EntryDisplayData
}

const WatchNextCard = memo(function WatchNextCard({
  fandomId,
  listId,
  entry,
}: WatchNextCardProps) {
  const episodeInfo =
    entry.type === 'tv-episode' && entry.seasonNumber && entry.episodeNumber
      ? `S${entry.seasonNumber}E${entry.episodeNumber}`
      : null

  return (
    <a
      href={`/fandom/${fandomId}/list/${listId}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded border border-[var(--magenta)]/20 bg-[var(--magenta)]/5 p-3 transition-all hover:border-[var(--magenta)]/40 hover:bg-[var(--magenta)]/10"
    >
      {/* Animated border accent */}
      <div className="absolute top-0 left-0 h-full w-0.5 bg-gradient-to-b from-[var(--magenta)] to-[var(--purple)]" />

      {/* Play icon with pulse */}
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded border border-[var(--magenta)]/30 bg-[var(--magenta)]/10">
        <Play className="size-4 text-[var(--magenta)]" />
        {/* Pulse ring */}
        <div className="absolute inset-0 animate-ping rounded border border-[var(--magenta)]/20" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest text-[var(--magenta)]">
            ▶ NEXT
          </span>
          {episodeInfo && (
            <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
              {episodeInfo}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate font-medium transition-colors group-hover:text-[var(--magenta)]">
          {entry.title}
        </div>
        {entry.showTitle && (
          <div className="truncate font-mono text-xs text-[var(--muted-foreground)]">
            {entry.showTitle}
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <span className="font-mono text-[var(--magenta)] opacity-50 transition-all group-hover:translate-x-1 group-hover:opacity-100">
        →
      </span>
    </a>
  )
})
