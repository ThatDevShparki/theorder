import { useEntryStatus } from '@/hooks'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface ProgressToggleProps {
  entryId: string
  fandomId: string
  className?: string
}

/**
 * Interactive checkbox for marking entries as complete
 * Entry status is global - shared across all lists
 */
export default function ProgressToggle({
  entryId,
  fandomId,
  className,
}: ProgressToggleProps) {
  const { status, toggle, isLoading } = useEntryStatus(entryId, fandomId)

  const isCompleted = status === 'completed'
  const isInProgress = status === 'in-progress'

  return (
    <Checkbox
      checked={isCompleted}
      onCheckedChange={() => toggle()}
      disabled={isLoading}
      className={cn(
        'h-5 w-5 rounded-sm border-2 transition-colors',
        isCompleted && 'glow-magenta border-primary bg-primary',
        isInProgress && 'border-accent',
        !isCompleted && !isInProgress && 'border-muted-foreground/50',
        className
      )}
      aria-label={`Mark as ${isCompleted ? 'not started' : 'completed'}`}
    />
  )
}
