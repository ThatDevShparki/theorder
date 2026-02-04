/**
 * Utility functions for working with content collections
 */

/**
 * Layer structure from list schema
 * Note: children is typed as unknown[] in the Zod schema due to recursive typing limitations
 */
export interface Layer {
  title?: string
  description?: string
  entries?: string[]
  children?: Layer[] | unknown[]
}

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
 * Count total entries in a list structure (recursive)
 */
export function countEntries(structure: Layer[]): number {
  let count = 0

  for (const layer of structure) {
    if (layer.entries) {
      count += layer.entries.length
    }
    if (layer.children) {
      count += countEntries(layer.children as Layer[])
    }
  }

  return count
}

/**
 * Flatten entries from a list structure into an ordered array
 */
export function flattenEntries(structure: Layer[]): string[] {
  const entries: string[] = []

  for (const layer of structure) {
    if (layer.entries) {
      entries.push(...layer.entries)
    }
    if (layer.children) {
      entries.push(...flattenEntries(layer.children as Layer[]))
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
  structure: Layer[],
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
  structure: Layer[],
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
 */
export function getYear(releaseDate: string): number {
  return new Date(releaseDate).getFullYear()
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
