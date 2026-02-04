import * as React from 'react'
import { ChevronDown, ExternalLink, Play, ShoppingCart, Tv } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
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
  return new Date(releaseDate).getFullYear()
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

export function ExpandableEntryCard({
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
  const [isOpen, setIsOpen] = React.useState(false)

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
          'group bg-elevated rounded-lg transition-colors',
          isOpen && 'bg-hover'
        )}
      >
        {/* Main card content */}
        <div
          className={cn(
            'flex items-start gap-4 p-4',
            compact && 'py-3',
            !isOpen && 'hover:bg-hover rounded-lg'
          )}
        >
          {/* Checkbox slot */}
          <div className="flex-shrink-0 pt-1">{children}</div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="leading-tight font-medium">{title}</h4>
                <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                  {episodeInfo && (
                    <span className="font-mono">{episodeInfo}</span>
                  )}
                  {showTitle && <span>{showTitle}</span>}
                  <span>{year}</span>
                  {displayRuntime && <span>• {displayRuntime}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    typeColor
                  )}
                >
                  {typeLabel}
                </span>
                {hasExpandableContent && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown
                        className={cn(
                          'size-4 transition-transform duration-200',
                          isOpen && 'rotate-180'
                        )}
                      />
                      <span className="sr-only">
                        {isOpen ? 'Collapse' : 'Expand'} details
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expandable content */}
        <CollapsibleContent>
          <div className="border-border/50 space-y-4 border-t px-4 pt-3 pb-4">
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
                  {links.map((link, index) => (
                    <a
                      key={index}
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
}
