# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Meta: Keeping Context Updated

**After every conversation**, update project context:

1. **DECISIONS.md** — Append new decisions with rationale (historical log)
2. **CLAUDE.md** — Update to reflect final state (current truth)
3. **BACKLOG.md** — Track deferred work with priorities, effort/impact, and downscope rationale
4. **CRITIQUES.md** — Track design critiques and their resolution status

| File         | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| CLAUDE.md    | Current truth — what the architecture IS                  |
| DECISIONS.md | Historical log — WHY we decided things                    |
| BACKLOG.md   | Future work — WHAT we'll do later and WHY it was deferred |
| CRITIQUES.md | Design review — concerns raised and their resolution      |

When adding to backlog, always include downscope rationale. When critiquing, explicitly resolve each concern (address, downscope, or accept as tradeoff).

## Project Overview

**The Order** is a fandom canon tracker that lists content (movies, shows, books, games) in chronological order. Users track their progress through fandoms like Star Wars, with all user data stored locally in the browser (localStorage). The app prioritizes simplicity and accessibility with no authentication or cloud storage.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build locally
```

**Always run before committing:**

```bash
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm typecheck    # Type-check (astro check + tsc --noEmit)
```

These checks run automatically via Husky pre-commit hooks, but run them manually during development to catch issues early.

**Package management**: Always use pnpm. Use `pnpm dlx` for one-off commands (e.g., `pnpm dlx shadcn@latest add button`).

## Architecture

### Tech Stack

- **Astro 5** - Static site generator with content collections
- **React 19** - Interactive components (islands architecture)
- **Tailwind CSS 4** - Styling via Vite plugin (`@tailwindcss/vite`)
- **shadcn/ui** - Component library (new-york style, neutral base)
- **MDX** - Content authoring for fandom lists
- **Dexie.js** - IndexedDB wrapper for client-side persistence
- **dexie-react-hooks** - Reactive hooks for Dexie (`useLiveQuery`)
- **Zod** - Schema validation for data integrity
- **@vite-pwa/astro** - Service worker and offline support (Workbox)
- **fake-indexeddb** - In-memory IndexedDB fallback for degraded mode

### Project Structure

```
src/
├── components/           # All components
│   ├── ui/              # shadcn/ui components (avoid edits)
│   ├── tracking/        # Progress tracking components
│   ├── navigation/      # Nav, menus, breadcrumbs
│   └── <category>/      # Group by feature/domain
├── data/                # Data layer (Dexie, Zod schemas, queries)
├── hooks/               # TanStack Query hooks, domain logic
├── content/             # MDX content collections (fandom lists)
├── layouts/             # Page layouts
├── lib/                 # Utilities (cn helper, small services)
├── pages/               # Astro pages and routes
└── styles/              # Global CSS with Tailwind theme
```

### Key Patterns

**Content Collections**: Fandom lists are managed as MDX files in `src/content/`. Each fandom (e.g., Star Wars) has entries with metadata (title, type, year, chronological order) that Astro processes at build time.

**Islands Architecture**: The site is primarily static HTML. Use React islands aggressively for performance—every interactive element should be its own island with the appropriate hydration directive.

**Path Aliases**: Use `@/` prefix for imports (maps to `src/`).

### Data Architecture

User data persists in IndexedDB via **Dexie.js**. Two-layer architecture:

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer                                     │
│  Astro pages, React islands, hooks, domain logic        │
│  dexie-react-hooks for reactive queries (useLiveQuery)  │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                             │
│  Dexie.js + IndexedDB, Zod schemas (integrity only)     │
└─────────────────────────────────────────────────────────┘
```

**File Organization**:

```
src/
├── data/                    # Data Layer
│   ├── db.ts               # Dexie database instance + migrations
│   ├── schemas/            # Zod schemas (validation, no versioning)
│   │   └── progress.schema.ts
│   └── queries/            # Dexie query functions
│       └── progress.queries.ts
└── hooks/                  # React hooks using useLiveQuery + domain logic
    └── useProgress.ts
```

**Data Flow**:

1. **Data Layer**: Dexie handles storage and migrations. Zod validates data integrity at write boundaries.
2. **Presentation**: Hooks use `useLiveQuery` from `dexie-react-hooks` for reactive data. Domain logic lives in hooks or small utility functions in `lib/`.

**Schema Strategy**: Dexie owns versioning (database migrations). Zod validates shape integrity at runtime but has no version tracking—single source of truth for schema versions is `db.ts`.

### Astro Islands

React islands are the bridge between static content and user interactivity. Use them aggressively—small, focused islands outperform large hydrated trees.

**Hydration Directives** (prefer lazier options):
| Directive | When to use |
|-----------|-------------|
| `client:visible` | Default choice. Progress toggles, cards below fold |
| `client:idle` | Critical UI that should hydrate soon after load |
| `client:load` | Rare. Only for immediately interactive elements |
| `client:only="react"` | Components that cannot SSR (direct Dexie access) |

**Layer Boundaries**:

```
Astro (Build Time)              React Islands (Runtime)
──────────────────              ───────────────────────
✓ Content collections           ✓ Hooks (useLiveQuery)
✓ Static components             ✓ Data layer (Dexie)
✓ Layouts, pages                ✓ lib/ utilities
✗ Data, Hooks                   ✗ astro:content imports
```

**Pattern**: Pass static data as props, let islands fetch user state:

```astro
---
const entries = await getCollection('entries')
---

{
  entries.map((entry) => (
    <article>
      {/* Static wrapper, dynamic island */}
      <h2>{entry.data.title}</h2>
      <ProgressToggle client:visible entryId={entry.slug} />
    </article>
  ))
}
```

**Granularity**: Prefer many small islands over few large ones. A list of 50 entries should have 50 `<ProgressToggle client:visible />` islands, not one `<EntryList client:load />` that hydrates everything.

### Offline Strategy

The app works fully offline once loaded. Uses `@vite-pwa/astro` with Workbox.

```
┌─────────────────────────────────────────────────────────┐
│  Service Worker (Workbox via @vite-pwa/astro)           │
│  Precaches static assets at build time                  │
├─────────────────────────────────────────────────────────┤
│  Dexie.js / IndexedDB                                   │
│  User progress data (already local)                     │
│  useLiveQuery for reactive UI updates                   │
└─────────────────────────────────────────────────────────┘
```

**Workbox Configuration** (`astro.config.mjs`):

- `registerType: 'autoUpdate'` — SW updates automatically
- Precache: `**/*.{html,css,js,woff2,png,jpg,webp,svg}`
- Runtime cache images with CacheFirst strategy

**Network States**:
| State | Behavior |
|-------|----------|
| Online | Normal operation, SW updates cache in background |
| Offline | Full functionality from cache + IndexedDB |

### Failure Modes

**Database States** (defined in `src/data/db.ts`):

```ts
type DbStatus =
  | { mode: 'persistent'; db: Dexie } // Normal operation
  | { mode: 'ephemeral'; db: Dexie } // Private browsing (works, clears on close)
  | { mode: 'memory'; db: Dexie } // In-memory fallback (session only)
  | { mode: 'unavailable' } // Nothing works
```

**Detection Flow**:

1. Check `indexedDB` exists in window
2. Attempt `db.open()`
3. Check `navigator.storage.persisted()` for ephemeral detection
4. Write/read test to verify functionality
5. Fall back to `fake-indexeddb` for in-memory mode if needed

**Fallback Chain**:

```
IndexedDB (persistent)
    ↓ fails
IndexedDB (ephemeral - private browsing)
    ↓ fails
In-Memory Dexie (fake-indexeddb package)
    ↓ fails
Unavailable state (show error)
```

**Required Dependencies**:

- `fake-indexeddb` — In-memory IndexedDB for fallback

**UI Communication** (non-dismissible banner when degraded):
| Mode | Message |
|------|---------|
| ephemeral | "🔒 Private browsing: Progress saves until you close the browser" |
| memory | "⚠️ Limited storage: Progress saves until you close this tab" |
| unavailable | "❌ Storage unavailable: Progress will not be saved" |

### Export/Import

Critical feature for data recovery and portability. Must work in all modes except `unavailable`.

**Export Format**:

```ts
interface ExportData {
  version: 1
  exportedAt: string
  progress: ProgressEntry[]
}
```

**Implementation**:

- Export: Serialize to JSON, trigger file download
- Import: File upload → Zod validation → bulkPut to Dexie
- Location: Always visible in settings/menu
- Works in degraded modes (exports from memory)

## Design System

**Aesthetic**: Hyper-retro 16-bit style inspired by 70s/80s computing. Bold colors, quirky animations, pixelated touches.

**Approach**: Mobile-first responsive design. Desktop should work well but mobile is the priority.

**Theme**: Uses CSS custom properties in `src/styles/global.css` with oklch colors. Supports light/dark modes via `.dark` class.

**Components**: Add shadcn/ui components via `pnpm dlx shadcn@latest add <component>`. Components install to `src/components/ui/`.

## Component & Styling Conventions

**shadcn/ui First**: Always use shadcn components as primitives. Custom components must be built on top of existing shadcn components. If a needed shadcn component doesn't exist in the project, add it before building custom functionality.

**No Inline Styles**: All styling must use Tailwind CSS classes. Never use `style={{}}` props or inline CSS.

**Theme-Driven Design**: All design tokens (colors, fonts, spacing, animations) must be defined in the Tailwind theme (`src/styles/global.css`) first, then consumed via utility classes. Do not hardcode color values or font names in components.

```tsx
// ✓ Correct - uses theme colors via Tailwind classes
<Button className="bg-primary text-primary-foreground">

// ✗ Wrong - inline styles and hardcoded values
<Button style={{ backgroundColor: '#ff0000' }}>
```

**Custom Theme Extensions**: When adding new design tokens:

1. Define CSS custom properties in `src/styles/global.css` (both `:root` and `.dark`)
2. Map them in the `@theme inline` block
3. Use the resulting Tailwind classes in components

## File Organization

**One Export Per File**: Each React component file should have a single default or named export. Do not bundle multiple components into one file.

**Component Categories**: Custom components live in `src/components/<category>/` where category reflects the feature or domain (e.g., `tracking`, `navigation`, `cards`). Choose descriptive category names.

**Hooks Directory**: All custom React hooks go in `src/hooks/` with filenames matching the hook name (e.g., `useLocalStorage.ts`).

**shadcn Components**: Files in `src/components/ui/` are managed by shadcn CLI. Avoid edits where possible to maintain consistency and allow easy updates. Make edits where necessary—when you do, add a comment at the top of the file documenting what was changed and why.

## Content Structure

All content uses MDX and lives in `src/content/<type>/`:

```
src/content/
├── fandoms/              # Fandom overview pages
│   ├── _template.mdx     # Template for new fandoms
│   └── star-wars.mdx
├── entries/              # Individual canon entries (movies, shows, books)
│   ├── _template.mdx     # Template for new entries
│   └── star-wars/
│       ├── a-new-hope.mdx
│       └── empire-strikes-back.mdx
└── config.ts             # Content collection schemas
```

**Templates**: Every content type folder must have a `_template.mdx` file documenting the required frontmatter and structure. Copy this template when creating new content.

## Multimedia

```
src/assets/               # Images (processed by Astro's image optimization)
├── posters/             # Movie/show posters
├── covers/              # Book/game covers
└── icons/               # UI icons and graphics

public/                   # Static files served as-is (no processing)
├── videos/              # Video files
├── audio/               # Audio files
└── fonts/               # Custom font files
```

**Images** go in `src/assets/` to leverage Astro's built-in optimization (automatic WebP/AVIF conversion, responsive sizes, lazy loading).

**Videos, audio, and fonts** go in `public/` since they don't benefit from build-time processing and are served directly.

## Monorepo

This is a pnpm workspace. Additional packages may be added to the workspace as the project grows.

## Deployment

Static site deployed to Netlify. All content (including media) is stored in the repository and deployed with the build.
