import { memo, useState } from 'react'
import { ChevronDown, ExternalLink, Play, ShoppingCart, Tv } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export interface EntryLink {
  label: string
  url: string
  type?: 'stream' | 'purchase' | 'rent' | 'free' | 'library'
}

interface ExpandableEntryCardProps {
  id: string
  title: string
  type: string
  releaseDate: string
  description?: string
  runtime?: number
  seasonNumber?: number
  episodeNumber?: number
  showTitle?: string
  links?: EntryLink[]
  directors?: string[]
  authors?: string[]
  rating?: string
  compact?: boolean
  children?: React.ReactNode
}

function getEntryTypeLabel(type: string): string {
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

function getEntryTypeColor(type: string): string {
  const colors: Record<string, string> = {
    movie:
      'border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]',
    'tv-episode':
      'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]',
    'tv-special':
      'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]',
    book: 'border-[var(--purple)]/40 bg-[var(--purple)]/10 text-[var(--purple)]',
    comic:
      'border-[var(--purple)]/40 bg-[var(--purple)]/10 text-[var(--purple)]',
    short:
      'border-[var(--magenta)]/40 bg-[var(--magenta)]/10 text-[var(--magenta)]',
    game: 'border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]',
  }
  return (
    colors[type] ??
    'border-[var(--muted-foreground)]/30 bg-[var(--muted)]/50 text-[var(--muted-foreground)]'
  )
}

function formatDuration(minutes: number): string {
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

function getYear(releaseDate: string): number {
  if (!releaseDate) return new Date().getFullYear()
  const date = new Date(releaseDate)
  const year = date.getFullYear()
  if (Number.isNaN(year)) return new Date().getFullYear()
  return year
}

function getLinkIcon(type?: string) {
  switch (type) {
    case 'stream':
      return <Tv className="size-4" />
    case 'purchase':
    case 'rent':
      return <ShoppingCart className="size-4" />
    case 'free':
      return <Play className="size-4" />
    default:
      return <ExternalLink className="size-4" />
  }
}

function getLinkTypeLabel(type?: string): string {
  switch (type) {
    case 'stream':
      return 'Stream'
    case 'purchase':
      return 'Buy'
    case 'rent':
      return 'Rent'
    case 'free':
      return 'Free'
    case 'library':
      return 'Library'
    default:
      return 'Watch'
  }
}

export const ExpandableEntryCard = memo(function ExpandableEntryCard({
  id,
  title,
  type,
  releaseDate,
  description,
  runtime,
  seasonNumber,
  episodeNumber,
  showTitle,
  links,
  directors,
  authors,
  rating,
  compact = false,
  children,
}: ExpandableEntryCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  const typeLabel = getEntryTypeLabel(type)
  const typeColor = getEntryTypeColor(type)
  const year = getYear(releaseDate)
  const displayRuntime = runtime ? formatDuration(runtime) : undefined

  const episodeInfo =
    type === 'tv-episode' && seasonNumber && episodeNumber
      ? `S${seasonNumber}E${episodeNumber}`
      : null

  const hasExpandableContent =
    (links && links.length > 0) ||
    description ||
    directors?.length ||
    authors?.length ||
    rating

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'group relative rounded-lg border border-transparent transition-all',
          isOpen
            ? 'border-[var(--cyan)]/20 bg-[var(--background-hover)]'
            : 'bg-[var(--background-elevated)] hover:border-[var(--cyan)]/10'
        )}
      >
        {/* Left accent line */}
        <div
          className={cn(
            'absolute top-0 left-0 h-full w-0.5 rounded-l-lg transition-all',
            isOpen
              ? 'bg-gradient-to-b from-[var(--cyan)] to-[var(--purple)]'
              : 'bg-transparent group-hover:bg-[var(--cyan)]/30'
          )}
        />

        {/* Main card content */}
        <div
          className={cn('flex items-start gap-4 p-4 pl-5', compact && 'py-3')}
        >
          {/* Checkbox slot - stops propagation to prevent triggering expand */}
          <div
            className="flex-shrink-0 pt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>

          {/* Content - clickable to expand/collapse */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                'min-w-0 flex-1 cursor-pointer text-left',
                hasExpandableContent && 'hover:opacity-90'
              )}
              aria-expanded={isOpen}
              aria-controls={`entry-details-${id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate leading-tight font-medium">
                    {title}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--muted-foreground)]">
                    {episodeInfo && (
                      <span className="text-[var(--accent)]">
                        {episodeInfo}
                      </span>
                    )}
                    {showTitle && (
                      <span className="max-w-[150px] truncate">
                        {showTitle}
                      </span>
                    )}
                    <span className="opacity-60">{year}</span>
                    {displayRuntime && (
                      <span className="opacity-60">• {displayRuntime}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase',
                      typeColor
                    )}
                  >
                    {typeLabel}
                  </span>
                  {hasExpandableContent && (
                    <ChevronDown
                      className={cn(
                        'size-4 text-[var(--muted-foreground)] transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )}
                    />
                  )}
                </div>
              </div>
            </button>
          </CollapsibleTrigger>
        </div>

        {/* Expandable content */}
        <CollapsibleContent>
          <div
            id={`entry-details-${id}`}
            className="border-border/50 space-y-4 border-t px-4 pt-3 pb-4"
          >
            {/* Description */}
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}

            {/* Metadata row */}
            {(directors?.length || authors?.length || rating) && (
              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {directors && directors.length > 0 && (
                  <span>
                    <span className="text-foreground/70">Director:</span>{' '}
                    {directors.join(', ')}
                  </span>
                )}
                {authors && authors.length > 0 && (
                  <span>
                    <span className="text-foreground/70">Author:</span>{' '}
                    {authors.join(', ')}
                  </span>
                )}
                {rating && (
                  <span>
                    <span className="text-foreground/70">Rated:</span> {rating}
                  </span>
                )}
              </div>
            )}

            {/* Watch/Read links */}
            {links && links.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Where to Watch
                </h5>
                <div className="flex flex-wrap gap-2">
                  {links.map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background hover:bg-accent inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
                    >
                      {getLinkIcon(link.type)}
                      <span>{link.label}</span>
                      <span className="text-muted-foreground text-xs">
                        ({getLinkTypeLabel(link.type)})
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
})
