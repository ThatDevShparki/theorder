import { useMemo, useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useFandomInterests, useListProgress } from '@/hooks'
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

interface DashboardContentProps {
  allFandoms: FandomData[]
  allLists: ListData[]
}

/**
 * Dashboard showing user's active fandoms and their progress
 */
export default function DashboardContent({
  allFandoms,
  allLists,
}: DashboardContentProps) {
  const { isLoading: interestsLoading, fandomIds: interestFandomIds } =
    useFandomInterests()

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
  const allEntries = useLiveQuery(
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
    allEntries.forEach((entry) => {
      fandomIds.add(entry.fandomId)
    })
    return Array.from(fandomIds)
  }, [allEntries])

  // Combine interests and progress to get all active fandoms
  const activeFandomIds = useMemo(() => {
    const combined = new Set([...interestFandomIds, ...progressFandomIds])
    return Array.from(combined)
  }, [interestFandomIds, progressFandomIds])

  // Filter to only active fandoms
  const activeFandoms = useMemo(() => {
    if (activeFandomIds.length === 0) return []
    return allFandoms.filter((f) => activeFandomIds.includes(f.id))
  }, [allFandoms, activeFandomIds])

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

  const isLoading = interestsLoading || (isDbReady && allEntries === undefined)

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
          className="text-background hover:glow-magenta mt-4 inline-block rounded-lg bg-[var(--magenta)] px-6 py-2 font-medium transition-all"
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
        return <FandomProgress key={fandom.id} fandom={fandom} lists={lists} />
      })}
    </div>
  )
}

interface FandomProgressProps {
  fandom: FandomData
  lists: ListData[]
}

function FandomProgress({ fandom, lists }: FandomProgressProps) {
  return (
    <div className="bg-elevated rounded-xl p-6">
      <a
        href={`/fandom/${fandom.id}`}
        className="group flex items-center justify-between"
      >
        <h3 className="text-xl font-semibold group-hover:text-[var(--magenta)]">
          {fandom.name}
        </h3>
        <span className="text-muted-foreground group-hover:text-foreground text-sm">
          View →
        </span>
      </a>

      {lists.length > 0 && (
        <div className="mt-4 space-y-3">
          {lists.map((list) => (
            <ListProgressRow key={list.id} list={list} fandomId={fandom.id} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ListProgressRowProps {
  list: ListData
  fandomId: string
}

function ListProgressRow({ list, fandomId }: ListProgressRowProps) {
  const listId = createListId(fandomId, list.id)
  const entryIds = flattenEntries(list.structure)
  const { stats, isLoading } = useListProgress(listId, { entryIds, fandomId })

  if (isLoading) {
    return (
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    )
  }

  const { progressPercent, completedCount, totalEntries } = stats

  return (
    <a href={`/fandom/${fandomId}/list/${list.id}`} className="group block">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground group-hover:text-foreground">
          {list.title}
        </span>
        <span className="font-mono text-[var(--magenta)]">
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
  )
}
