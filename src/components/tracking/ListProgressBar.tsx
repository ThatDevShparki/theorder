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
        <Skeleton className="h-2 w-full" />
        {showDetails && <Skeleton className="h-4 w-32" />}
      </div>
    )
  }

  const { progressPercent, completedCount, totalEntries } = stats

  return (
    <div className={cn('space-y-2', className)}>
      <div className="bg-muted relative h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--magenta)] transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {showDetails && (
        <div className="text-muted-foreground flex items-center justify-between font-mono text-xs">
          <span>
            {completedCount} of {totalEntries}
          </span>
          <span
            className={cn(
              'font-semibold',
              progressPercent === 100 && 'text-glow-gold text-warning',
              progressPercent > 0 && progressPercent < 100 && 'text-primary'
            )}
          >
            {progressPercent}%
          </span>
        </div>
      )}
    </div>
  )
})

export default ListProgressBar
