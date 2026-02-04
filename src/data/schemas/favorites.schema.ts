import { z } from 'zod/v4'

/**
 * Type of favorited item
 */
export const FavoriteTypeSchema = z.enum(['fandom', 'list'])
export type FavoriteType = z.infer<typeof FavoriteTypeSchema>

/**
 * A user's favorited item (fandom or list)
 */
export const FavoriteSchema = z.object({
  // Composite key: "fandom:star-wars" or "list:star-wars/chronological"
  id: z.string(),
  type: FavoriteTypeSchema,
  // The actual item ID (fandomId or listId)
  itemId: z.string(),
  // For lists, the parent fandom ID
  fandomId: z.string().optional(),
  addedAt: z.date(),
})
export type Favorite = z.infer<typeof FavoriteSchema>

/**
 * Helper to create a favorite ID
 */
export function createFavoriteId(type: FavoriteType, itemId: string): string {
  return `${type}:${itemId}`
}

/**
 * Helper to parse a favorite ID
 */
export function parseFavoriteId(id: string): {
  type: FavoriteType
  itemId: string
} {
  const [type, ...rest] = id.split(':')
  return {
    type: type as FavoriteType,
    itemId: rest.join(':'),
  }
}
