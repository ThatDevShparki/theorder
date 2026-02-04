import { useState, useEffect } from 'react'
import { initDatabase, type DbStatus } from '@/data'

/**
 * Hook to initialize the database and track its status
 *
 * @returns Database status (persistent, ephemeral, memory, or unavailable)
 */
export function useDbStatus() {
  const [status, setStatus] = useState<DbStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const dbStatus = await initDatabase()
        if (mounted) {
          setStatus(dbStatus)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  return {
    status,
    isLoading,
    error,
    isAvailable: status?.mode !== 'unavailable',
    isPersistent: status?.mode === 'persistent',
    isEphemeral: status?.mode === 'ephemeral',
    isMemory: status?.mode === 'memory',
    warningMessage:
      status?.mode === 'ephemeral' || status?.mode === 'memory'
        ? status.reason
        : status?.mode === 'unavailable'
          ? status.reason
          : null,
  }
}
