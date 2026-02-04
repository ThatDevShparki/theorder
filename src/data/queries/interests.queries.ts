import { getDb } from '../db'
import type { FandomInterest } from '../schemas'

/**
 * Get all fandom interests, sorted by priority
 */
export async function getAllInterests(): Promise<FandomInterest[]> {
  const db = getDb()
  return db.interests.orderBy('priority').toArray()
}

/**
 * Get a specific fandom interest
 */
export async function getFandomInterest(
  fandomId: string
): Promise<FandomInterest | undefined> {
  const db = getDb()
  return db.interests.get(fandomId)
}

/**
 * Check if user has expressed interest in a fandom
 */
export async function hasFandomInterest(fandomId: string): Promise<boolean> {
  const db = getDb()
  const interest = await db.interests.get(fandomId)
  return !!interest
}

/**
 * Get all fandom IDs the user is interested in
 */
export async function getInterestedFandomIds(): Promise<string[]> {
  const db = getDb()
  const interests = await db.interests.orderBy('priority').toArray()
  return interests.map((i) => i.fandomId)
}

/**
 * Add a fandom to user's interests
 * Automatically assigns the next priority number
 */
export async function addFandomInterest(fandomId: string): Promise<void> {
  const db = getDb()

  // Check if already exists
  const existing = await db.interests.get(fandomId)
  if (existing) {
    return
  }

  // Get the highest priority number
  const allInterests = await db.interests.orderBy('priority').reverse().first()
  const nextPriority = allInterests ? allInterests.priority + 1 : 1

  const interest: FandomInterest = {
    fandomId,
    priority: nextPriority,
    addedAt: new Date(),
  }

  await db.interests.add(interest)
}

/**
 * Remove a fandom from user's interests
 */
export async function removeFandomInterest(fandomId: string): Promise<void> {
  const db = getDb()
  await db.interests.delete(fandomId)
}

/**
 * Toggle a fandom interest (add if not exists, remove if exists)
 */
export async function toggleFandomInterest(fandomId: string): Promise<boolean> {
  const db = getDb()
  const existing = await db.interests.get(fandomId)

  if (existing) {
    await db.interests.delete(fandomId)
    return false
  } else {
    await addFandomInterest(fandomId)
    return true
  }
}

/**
 * Reorder fandom interests
 * @param fandomIds Array of fandom IDs in new priority order
 */
export async function reorderInterests(fandomIds: string[]): Promise<void> {
  const db = getDb()

  await db.transaction('rw', db.interests, async () => {
    // Update each interest with its new priority
    for (let i = 0; i < fandomIds.length; i++) {
      const fandomId = fandomIds[i]
      const interest = await db.interests.get(fandomId)
      if (interest) {
        interest.priority = i + 1
        await db.interests.put(interest)
      }
    }
  })
}

/**
 * Move a fandom to a specific priority position
 */
export async function moveFandomToPriority(
  fandomId: string,
  newPriority: number
): Promise<void> {
  const db = getDb()

  await db.transaction('rw', db.interests, async () => {
    const interest = await db.interests.get(fandomId)
    if (!interest) return

    const oldPriority = interest.priority

    if (newPriority === oldPriority) return

    // Shift other priorities
    if (newPriority < oldPriority) {
      // Moving up: increment priorities of items in between
      await db.interests
        .where('priority')
        .between(newPriority, oldPriority, true, false)
        .modify((item) => {
          item.priority++
        })
    } else {
      // Moving down: decrement priorities of items in between
      await db.interests
        .where('priority')
        .between(oldPriority, newPriority, false, true)
        .modify((item) => {
          item.priority--
        })
    }

    // Set new priority
    interest.priority = newPriority
    await db.interests.put(interest)
  })
}

/**
 * Get count of interested fandoms
 */
export async function getInterestsCount(): Promise<number> {
  const db = getDb()
  return db.interests.count()
}
