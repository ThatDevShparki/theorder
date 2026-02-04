import { memo } from 'react'
import { useListProgress } from '@/hooks'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ListProgressBarProps {
  listId: string
  entryIds: string[]
  fandomId: string
  showDetails?: boolean
  className?: string
}

/**
 * Progress bar showing completion status for a list
 * Ship's Computer aesthetic with scan-line effect
 */
const ListProgressBar = memo(function ListProgressBar({
  listId,
  entryIds,
  fandomId,
  showDetails = true,
  className,
}: ListProgressBarProps) {
  const { stats, isLoading } = useListProgress(listId, { entryIds, fandomId })

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-1.5 w-full" />
        {showDetails && <Skeleton className="h-3 w-32" />}
      </div>
    )
  }

  const { progressPercent, completedCount, totalEntries } = stats
  const isComplete = progressPercent === 100

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar container */}
      <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
        {/* Progress fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete
              ? 'bg-[var(--warning)] shadow-[0_0_12px_var(--warning)]'
              : 'bg-gradient-to-r from-[var(--purple)] to-[var(--magenta)]'
          )}
          style={{ width: `${progressPercent}%` }}
        />
        {/* Scan-line indicator for in-progress */}
        {!isComplete && progressPercent > 0 && (
          <div
            className="absolute top-0 h-full w-0.5 animate-pulse bg-white/50"
            style={{ left: `${progressPercent}%` }}
          />
        )}
      </div>

      {showDetails && (
        <div className="flex items-center justify-between font-mono text-[10px] tracking-wider">
          <span className="text-[var(--muted-foreground)]">
            <span className="text-[var(--accent)]">{completedCount}</span>
            <span className="mx-1 opacity-50">/</span>
            <span>{totalEntries}</span>
            <span className="ml-2 opacity-50">ENTRIES</span>
          </span>
          <span
            className={cn(
              'font-bold',
              isComplete && 'text-glow-gold text-[var(--warning)]',
              progressPercent > 0 &&
                progressPercent < 100 &&
                'text-[var(--accent)]',
              progressPercent === 0 && 'text-[var(--muted-foreground)]'
            )}
          >
            {isComplete ? '✓ COMPLETE' : `${progressPercent}%`}
          </span>
        </div>
      )}
    </div>
  )
})

export default ListProgressBar
