import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Input } from '@/components/ui/input'

interface FandomData {
  id: string
  name: string
  description?: string
}

interface FandomSearchProps {
  fandoms: FandomData[]
  onFilter: (filteredIds: string[] | null) => void
  placeholder?: string
}

/**
 * Search input that filters fandoms by name/description
 * Calls onFilter with matching fandom IDs (or null for no filter)
 * Uses debouncing to avoid excessive re-renders during typing
 */
const FandomSearch = memo(function FandomSearch({
  fandoms,
  onFilter,
  placeholder = 'Search fandoms...',
}: FandomSearchProps) {
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Memoize the filter function to avoid recreating on each render
  const filterFandoms = useCallback(
    (value: string) => {
      if (!value.trim()) {
        onFilter(null)
        return
      }

      const lowerQuery = value.toLowerCase()
      const filtered = fandoms.filter(
        (fandom) =>
          fandom.name.toLowerCase().includes(lowerQuery) ||
          fandom.description?.toLowerCase().includes(lowerQuery)
      )

      onFilter(filtered.map((f) => f.id))
    },
    [fandoms, onFilter]
  )

  // Debounce the filter operation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      filterFandoms(query)
    }, 150)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, filterFandoms])

  return (
    <div className="relative">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="bg-elevated pl-10"
      />
      <svg
        className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  )
})

export default FandomSearch
