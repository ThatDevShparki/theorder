import { useEntryStatus } from '@/hooks'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface ProgressToggleProps {
  listId: string
  entryId: string
  className?: string
}

/**
 * Interactive checkbox for marking entries as complete
 * Uses client:visible hydration for optimal performance
 */
export default function ProgressToggle({
  listId,
  entryId,
  className,
}: ProgressToggleProps) {
  const { status, toggle, isLoading } = useEntryStatus(listId, entryId)

  const isCompleted = status === 'completed'
  const isInProgress = status === 'in-progress'

  return (
    <Checkbox
      checked={isCompleted}
      onCheckedChange={() => toggle()}
      disabled={isLoading}
      className={cn(
        'h-5 w-5 rounded-sm border-2 transition-all',
        isCompleted &&
          'glow-magenta border-[var(--magenta)] bg-[var(--magenta)]',
        isInProgress && 'border-[var(--cyan)]',
        !isCompleted && !isInProgress && 'border-muted-foreground/50',
        className
      )}
      aria-label={`Mark as ${isCompleted ? 'not started' : 'completed'}`}
    />
  )
}
