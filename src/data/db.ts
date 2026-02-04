import Dexie, { type Table } from 'dexie'
import type {
  ListProgress,
  FandomInterest,
  EntryCompletion,
  Favorite,
} from './schemas'

/**
 * Database status indicating storage mode
 */
export type DbStatus =
  | { mode: 'persistent'; db: TheOrderDB }
  | { mode: 'ephemeral'; db: TheOrderDB; reason: string }
  | { mode: 'memory'; db: TheOrderDB; reason: string }
  | { mode: 'unavailable'; reason: string }

/**
 * The Order database schema
 *
 * Version history:
 *   1 - Initial schema: progress (list-based), interests
 *   2 - Global entry completion: entries table, simplified progress
 *   3 - Favorites: unified favorites table for fandoms and lists
 */
export class TheOrderDB extends Dexie {
  // Global entry completion status (shared across lists)
  entries!: Table<EntryCompletion, string>
  // List-level metadata (when started, completed)
  progress!: Table<ListProgress, string>
  // User's fandom interests/favorites (legacy, kept for compatibility)
  interests!: Table<FandomInterest, string>
  // Unified favorites for fandoms and lists
  favorites!: Table<Favorite, string>

  constructor(options?: { indexedDB?: IDBFactory }) {
    super('theorder', options)

    this.version(3).stores({
      // entryId is primary key, fandomId for querying by fandom
      entries: 'entryId, fandomId',
      // listId is primary key
      progress: 'listId',
      // fandomId is primary key, priority for sorting
      interests: 'fandomId, priority',
      // id is primary key (type:itemId), type and fandomId for querying
      favorites: 'id, type, fandomId',
    })
  }
}

// Singleton instance
let dbInstance: TheOrderDB | null = null
let dbStatus: DbStatus | null = null

/**
 * Initialize the database and detect storage mode
 */
export async function initDatabase(): Promise<DbStatus> {
  // Return cached status if already initialized
  if (dbStatus) {
    return dbStatus
  }

  // Check IndexedDB support
  if (typeof indexedDB === 'undefined') {
    dbStatus = {
      mode: 'unavailable',
      reason: 'Your browser does not support IndexedDB.',
    }
    return dbStatus
  }

  const db = new TheOrderDB()

  try {
    await db.open()

    // Test write/read to verify functionality
    const testKey = '__connection_test__'
    await db.progress.put({ listId: testKey })
    await db.progress.delete(testKey)

    // Check quota to detect private browsing
    // Private browsing typically has very low quota (< 120MB)
    let isPrivateBrowsing = false
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      if (estimate.quota && estimate.quota < 120_000_000) {
        isPrivateBrowsing = true
      }
    }

    dbInstance = db

    if (isPrivateBrowsing) {
      dbStatus = {
        mode: 'ephemeral',
        db,
        reason:
          'Private browsing detected. Progress saves until you close the browser.',
      }
    } else {
      dbStatus = { mode: 'persistent', db }
    }

    return dbStatus
  } catch (error) {
    console.warn('IndexedDB failed, attempting in-memory fallback:', error)

    // Try in-memory fallback
    try {
      const { default: fakeIndexedDB } = await import('fake-indexeddb')
      const memoryDb = new TheOrderDB({ indexedDB: fakeIndexedDB })
      await memoryDb.open()

      dbInstance = memoryDb
      dbStatus = {
        mode: 'memory',
        db: memoryDb,
        reason:
          'Using temporary storage. Progress saves until you close this tab.',
      }
      return dbStatus
    } catch (fallbackError) {
      console.error('In-memory fallback failed:', fallbackError)
      dbStatus = {
        mode: 'unavailable',
        reason: 'Cannot access storage. Try a different browser.',
      }
      return dbStatus
    }
  }
}

/**
 * Get the database instance
 * Throws if database not initialized
 */
export function getDb(): TheOrderDB {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return dbInstance
}

/**
 * Get the current database status
 */
export function getDbStatus(): DbStatus | null {
  return dbStatus
}
