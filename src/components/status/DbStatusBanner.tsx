import { useDbStatus } from '@/hooks'
import { cn } from '@/lib/utils'

/**
 * Non-dismissible banner showing database status warnings
 * Only appears for degraded modes (ephemeral, memory, unavailable)
 */
export default function DbStatusBanner() {
  const { status, isLoading, warningMessage } = useDbStatus()

  // Don't show anything while loading or if storage is fine
  if (isLoading || !warningMessage) {
    return null
  }

  const mode = status?.mode

  return (
    <div
      role="alert"
      className={cn(
        'px-4 py-2 text-center text-sm font-medium',
        mode === 'ephemeral' && 'bg-warning/10 text-warning',
        mode === 'memory' && 'bg-warning/20 text-warning',
        mode === 'unavailable' && 'bg-destructive/20 text-destructive'
      )}
    >
      {mode === 'ephemeral' && (
        <span>
          <span className="mr-2">🔒</span>
          {warningMessage}
        </span>
      )}
      {mode === 'memory' && (
        <span>
          <span className="mr-2">⚠️</span>
          {warningMessage}
        </span>
      )}
      {mode === 'unavailable' && (
        <span>
          <span className="mr-2">❌</span>
          {warningMessage}
        </span>
      )}
    </div>
  )
}
