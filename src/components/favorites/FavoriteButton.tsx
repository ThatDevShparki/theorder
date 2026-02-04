import { useFavorite } from '@/hooks'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FavoriteType } from '@/data/schemas'

interface FavoriteButtonProps {
  type: FavoriteType
  itemId: string
  fandomId?: string
  className?: string
  variant?: 'icon' | 'full'
}

/**
 * Button to favorite/unfavorite a fandom or list
 */
export default function FavoriteButton({
  type,
  itemId,
  fandomId,
  className,
  variant = 'icon',
}: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorite(type, itemId, fandomId)

  const label = isFavorite ? 'Remove from favorites' : 'Add to favorites'

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle()
        }}
        className={cn(
          'focus-visible:outline-ring rounded-sm text-2xl transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:hover:scale-110',
          isFavorite
            ? 'text-warning'
            : 'text-muted-foreground hover:text-warning',
          className
        )}
        aria-label={label}
        title={label}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    )
  }

  return (
    <Button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle()
      }}
      variant={isFavorite ? 'default' : 'outline'}
      className={cn(
        'gap-2',
        isFavorite && 'bg-warning text-warning-foreground hover:bg-warning/90',
        className
      )}
    >
      <span>{isFavorite ? '★' : '☆'}</span>
      <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
    </Button>
  )
}
