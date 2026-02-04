import Dexie, { type Table } from 'dexie'
import type { ListProgress, FandomInterest } from './schemas'

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
 *   1 - Initial schema: progress, interests
 */
export class TheOrderDB extends Dexie {
  progress!: Table<ListProgress, string>
  interests!: Table<FandomInterest, string>

  constructor(options?: { indexedDB?: IDBFactory }) {
    super('theorder', options)

    this.version(1).stores({
      // listId is primary key
      progress: 'listId',
      // fandomId is primary key, priority for sorting
      interests: 'fandomId, priority',
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
    await db.progress.put({ listId: testKey, entries: [] })
    await db.progress.delete(testKey)

    // Check if storage is persistent
    let isPersistent = true
    if (navigator.storage?.persisted) {
      isPersistent = await navigator.storage.persisted()
    }

    // Check quota to detect private browsing
    let isEphemeral = false
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      // Very low quota often indicates private browsing
      if (estimate.quota && estimate.quota < 120_000_000) {
        isEphemeral = true
      }
    }

    dbInstance = db

    if (!isPersistent || isEphemeral) {
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
