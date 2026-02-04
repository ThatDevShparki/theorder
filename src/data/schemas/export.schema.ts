import { z } from 'zod/v4'
import { ListProgressSchema } from './progress.schema'
import { UserInterestsSchema } from './interests.schema'

/**
 * Export format version
 * Increment when making breaking changes to export structure
 */
export const EXPORT_VERSION = 1

/**
 * Complete export of all user data
 * Used for backup/restore and device transfer
 */
export const ExportDataSchema = z.object({
  version: z.literal(EXPORT_VERSION),
  exportedAt: z.iso.datetime(),
  progress: z.array(ListProgressSchema),
  interests: UserInterestsSchema,
})
export type ExportData = z.infer<typeof ExportDataSchema>
