/**
 * Utility functions for working with content collections
 */

/**
 * Arc - second level grouping (no nesting)
 * Simple grouping of entries within a saga
 */
export interface Arc {
  title?: string
  description?: string
  entries?: string[]
}

/**
 * Saga - top level grouping
 * Contains entries and/or arcs (children)
 */
export interface Saga {
  title?: string
  description?: string
  entries?: string[]
  children?: Arc[]
}

/**
 * Layer is a union type for backwards compatibility
 * Represents either a Saga (depth 0) or Arc (depth 1)
 */
export type Layer = Saga | Arc

/**
 * Link to external service (streaming, purchase, etc.)
 */
export interface EntryLink {
  label: string
  url: string
  type?: 'stream' | 'purchase' | 'rent' | 'free' | 'library'
}

/**
 * Entry data shape (from entries collection)
 */
export interface EntryData {
  id: string
  title: string
  type: string
  releaseDate: string
  description?: string
  runtime?: number
  pages?: number
  seasonNumber?: number
  episodeNumber?: number
  showTitle?: string
  authors?: string[]
  directors?: string[]
  rating?: string
  language?: string
  tags?: string[]
  links?: EntryLink[]
}

/**
 * Count total entries in a list structure
 */
export function countEntries(structure: Saga[]): number {
  let count = 0

  for (const saga of structure) {
    if (saga.entries) {
      count += saga.entries.length
    }
    if (saga.children) {
      for (const arc of saga.children) {
        if (arc.entries) {
          count += arc.entries.length
        }
      }
    }
  }

  return count
}

/**
 * Flatten entries from a list structure into an ordered array
 */
export function flattenEntries(structure: Saga[]): string[] {
  const entries: string[] = []

  for (const saga of structure) {
    if (saga.entries) {
      entries.push(...saga.entries)
    }
    if (saga.children) {
      for (const arc of saga.children) {
        if (arc.entries) {
          entries.push(...arc.entries)
        }
      }
    }
  }

  return entries
}

/**
 * Get runtime for an entry in minutes
 * Handles different content types
 */
export function getEntryRuntime(entry: EntryData): number {
  // Movies, episodes, shorts have runtime
  if (entry.runtime) {
    return entry.runtime
  }

  // Books and comics: estimate based on pages
  // Average reading speed: ~2 minutes per page
  if (entry.pages) {
    return Math.ceil(entry.pages * 2)
  }

  // Default estimate based on type
  switch (entry.type) {
    case 'movie':
      return 120 // 2 hours
    case 'tv-episode':
      return 45 // 45 minutes
    case 'tv-special':
      return 60 // 1 hour
    case 'short':
      return 15 // 15 minutes
    case 'book':
      return 600 // 10 hours
    case 'comic':
      return 30 // 30 minutes
    case 'game':
      return 1200 // 20 hours
    default:
      return 60 // 1 hour fallback
  }
}

/**
 * Compute total runtime of a list in minutes
 */
export function computeListRuntime(
  structure: Saga[],
  entryMap: Map<string, EntryData>
): number {
  const entryIds = flattenEntries(structure)
  let total = 0

  for (const id of entryIds) {
    const entry = entryMap.get(id)
    if (entry) {
      total += getEntryRuntime(entry)
    }
  }

  return total
}

/**
 * Create a map of entry IDs to runtimes
 */
export function createRuntimeMap(
  structure: Saga[],
  entryMap: Map<string, EntryData>
): Map<string, number> {
  const runtimeMap = new Map<string, number>()
  const entryIds = flattenEntries(structure)

  for (const id of entryIds) {
    const entry = entryMap.get(id)
    if (entry) {
      runtimeMap.set(id, getEntryRuntime(entry))
    }
  }

  return runtimeMap
}

/**
 * Format minutes as human-readable duration
 * e.g., 134 -> "2h 14m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

/**
 * Get display label for entry type
 */
export function getEntryTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    movie: 'Movie',
    'tv-episode': 'Episode',
    'tv-special': 'Special',
    book: 'Book',
    comic: 'Comic',
    short: 'Short',
    game: 'Game',
  }
  return labels[type] ?? type
}

/**
 * Get color class for entry type badge
 */
export function getEntryTypeColor(type: string): string {
  const colors: Record<string, string> = {
    movie: 'bg-[var(--gold)]/20 text-[var(--gold)]',
    'tv-episode': 'bg-[var(--cyan)]/20 text-[var(--cyan)]',
    'tv-special': 'bg-[var(--cyan)]/20 text-[var(--cyan)]',
    book: 'bg-[var(--purple)]/20 text-[var(--purple)]',
    comic: 'bg-[var(--purple)]/20 text-[var(--purple)]',
    short: 'bg-[var(--magenta)]/20 text-[var(--magenta)]',
    game: 'bg-success/20 text-success',
  }
  return colors[type] ?? 'bg-muted text-muted-foreground'
}

/**
 * Parse year from release date string
 * Returns current year as fallback for invalid dates
 */
export function getYear(releaseDate: string): number {
  if (!releaseDate) return new Date().getFullYear()
  const date = new Date(releaseDate)
  const year = date.getFullYear()
  // Check for Invalid Date (NaN)
  if (Number.isNaN(year)) return new Date().getFullYear()
  return year
}

/**
 * Get fandom ID from a composite content ID
 * e.g., "star-wars/entries/a-new-hope" -> "star-wars"
 */
export function getFandomId(contentId: string): string {
  return contentId.split('/')[0]
}

/**
 * Get entry ID from a composite content ID
 * e.g., "star-wars/entries/a-new-hope" -> "a-new-hope"
 */
export function getEntryId(contentId: string): string {
  const parts = contentId.split('/')
  return parts[parts.length - 1]
}

/**
 * Create composite list ID
 * e.g., ("star-wars", "chronological") -> "star-wars/chronological"
 */
export function createListId(fandomId: string, listId: string): string {
  return `${fandomId}/${listId}`
}
