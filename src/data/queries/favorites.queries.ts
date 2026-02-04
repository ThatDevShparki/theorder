import { getDb } from '../db'
import { createFavoriteId, type Favorite, type FavoriteType } from '../schemas'

/**
 * Get all favorites
 */
export async function getAllFavorites(): Promise<Favorite[]> {
  const db = getDb()
  return db.favorites.toArray()
}

/**
 * Get favorites by type
 */
export async function getFavoritesByType(
  type: FavoriteType
): Promise<Favorite[]> {
  const db = getDb()
  return db.favorites.where('type').equals(type).toArray()
}

/**
 * Get all favorited fandom IDs
 */
export async function getFavoriteFandomIds(): Promise<string[]> {
  const favorites = await getFavoritesByType('fandom')
  return favorites.map((f) => f.itemId)
}

/**
 * Get all favorited list IDs
 */
export async function getFavoriteListIds(): Promise<string[]> {
  const favorites = await getFavoritesByType('list')
  return favorites.map((f) => f.itemId)
}

/**
 * Check if an item is favorited
 */
export async function isFavorite(
  type: FavoriteType,
  itemId: string
): Promise<boolean> {
  const db = getDb()
  const id = createFavoriteId(type, itemId)
  const favorite = await db.favorites.get(id)
  return !!favorite
}

/**
 * Add a favorite
 */
export async function addFavorite(
  type: FavoriteType,
  itemId: string,
  fandomId?: string
): Promise<void> {
  const db = getDb()
  const id = createFavoriteId(type, itemId)

  // Check if already exists
  const existing = await db.favorites.get(id)
  if (existing) return

  const favorite: Favorite = {
    id,
    type,
    itemId,
    fandomId: type === 'list' ? fandomId : undefined,
    addedAt: new Date(),
  }

  await db.favorites.add(favorite)
}

/**
 * Remove a favorite
 */
export async function removeFavorite(
  type: FavoriteType,
  itemId: string
): Promise<void> {
  const db = getDb()
  const id = createFavoriteId(type, itemId)
  await db.favorites.delete(id)
}

/**
 * Toggle a favorite
 */
export async function toggleFavorite(
  type: FavoriteType,
  itemId: string,
  fandomId?: string
): Promise<boolean> {
  const db = getDb()
  const id = createFavoriteId(type, itemId)
  const existing = await db.favorites.get(id)

  if (existing) {
    await db.favorites.delete(id)
    return false
  } else {
    await addFavorite(type, itemId, fandomId)
    return true
  }
}

/**
 * Get favorites for a specific fandom (lists within that fandom)
 */
export async function getFandomListFavorites(
  fandomId: string
): Promise<Favorite[]> {
  const db = getDb()
  return db.favorites.where('fandomId').equals(fandomId).toArray()
}
