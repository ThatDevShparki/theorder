import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * Link to external service (streaming, purchase, etc.)
 */
const linkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  type: z.enum(['stream', 'purchase', 'rent', 'free', 'library']).optional(),
})

/**
 * Fandom collection
 * Top-level container for entries and lists
 */
const fandoms = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/fandoms' }),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      logo: image().optional(),
      coverImage: image().optional(),
      links: z.array(linkSchema).optional(),
    }),
})

/**
 * Entry media types
 */
const entryTypeSchema = z.enum([
  'movie',
  'tv-episode',
  'tv-special',
  'book',
  'comic',
  'short',
  'game',
])

/**
 * Entries collection
 * Individual media pieces (movies, episodes, books, etc.)
 */
const entries = defineCollection({
  loader: glob({
    pattern: '**/entries/*.{md,mdx}',
    base: './src/content/fandoms',
  }),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      title: z.string(),
      type: entryTypeSchema,
      releaseDate: z.string(), // ISO date string
      description: z.string().optional(),
      poster: image().optional(),

      // Type-specific fields
      runtime: z.number().optional(), // minutes
      seasonNumber: z.number().optional(),
      episodeNumber: z.number().optional(),
      showTitle: z.string().optional(),
      pages: z.number().optional(),
      authors: z.array(z.string()).optional(),
      directors: z.array(z.string()).optional(),

      // Backlinks
      links: z.array(linkSchema).optional(),

      // Metadata
      rating: z.string().optional(),
      language: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
})

/**
 * Arc schema - second level grouping (no nesting)
 * Simple grouping of entries within a saga
 */
const arcSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  entries: z.array(z.string()).optional(),
})

/**
 * Saga schema - top level grouping
 * Contains entries and/or arcs (children)
 */
const sagaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  entries: z.array(z.string()).optional(),
  children: z.array(arcSchema).optional(),
})

/**
 * Lists collection
 * Ordered sequences of entries (chronological, release order, etc.)
 */
const lists = defineCollection({
  loader: glob({
    pattern: '**/lists/*.{md,mdx}',
    base: './src/content/fandoms',
  }),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      coverImage: image().optional(),
      estimatedRuntime: z.string().optional(),
      tags: z.array(z.string()).optional(),
      structure: z.array(sagaSchema),
    }),
})

export const collections = {
  fandoms,
  entries,
  lists,
}
