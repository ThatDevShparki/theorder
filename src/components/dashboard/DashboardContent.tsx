import { useMemo } from 'react'
import { useFandomInterests, useListProgress } from '@/hooks'
import { Skeleton } from '@/components/ui/skeleton'
import { countEntries, createListId } from '@/lib/content-utils'
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
  const { isLoading: interestsLoading, fandomIds } = useFandomInterests()

  // Filter to only fandoms the user is interested in
  const activeFandoms = useMemo(() => {
    if (fandomIds.length === 0) return []
    return allFandoms.filter((f) => fandomIds.includes(f.id))
  }, [allFandoms, fandomIds])

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

  if (interestsLoading) {
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
  const totalEntries = countEntries(list.structure)
  const { stats, isLoading } = useListProgress(listId, { totalEntries })

  if (isLoading) {
    return (
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    )
  }

  const { progressPercent, completedCount } = stats

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
