# DECISIONS.md

Architectural and technical decisions for The Order. Organized for Claude Code indexing.

---

## Index

- [CORE] Core product decisions
- [ARCH] Architecture patterns
- [DATA] Data layer decisions
- [UI] Component and styling
- [CONTENT] Content management
- [TOOLING] Development tooling

---

## [CORE-001] Product Definition

**Date**: 2025-02-03
**Status**: Active
**Decision**: The Order is a fandom canon tracker listing content in chronological order, starting with Star Wars.
**Rationale**: Solves the problem of tracking progress through fandoms with non-linear release orders. Target audience is deep fans, nerds, and geeks.

## [CORE-002] No Authentication

**Date**: 2025-02-03
**Status**: Active
**Decision**: No user accounts or authentication. All user data stored locally in browser.
**Rationale**: Simplicity, privacy, accessibility. No backend complexity. Users own their data.

## [CORE-003] Static Site with Local Content

**Date**: 2025-02-03
**Status**: Active
**Decision**: Deploy as static site to Netlify. All content (MDX, multimedia) stored in repository.
**Rationale**: No cloud storage costs, simple deployment, content versioned with code. May migrate to CMS later if investment increases.

---

## [ARCH-001] Tech Stack

**Date**: 2025-02-03
**Status**: Active
**Decision**: Astro 5 + React 19 + Tailwind CSS 4 + shadcn/ui + MDX + Dexie.js + Zod
**Rationale**: Astro for static performance, React for islands, Tailwind for styling, shadcn for accessible primitives, Dexie for IndexedDB, Zod for schema validation.

## [ARCH-002] Islands Architecture

**Date**: 2025-02-03
**Status**: Active
**Decision**: Use React islands aggressively. Prefer many small islands over few large ones. Default to `client:visible` hydration.
**Rationale**: Performance optimization. Static HTML ships fast; JS hydrates progressively as needed.

## [ARCH-003] Three-Layer Data Architecture

**Date**: 2025-02-03
**Status**: Active
**Decision**: Layered architecture with Data Layer (Dexie + Zod schemas + repositories), Service Layer (domain logic + type coercion), Presentation Layer (Astro + React).
**Rationale**: Separation of concerns, testability, flexibility to swap storage later. Zod validates at boundaries; TypeScript types flow freely in business logic.

## [ARCH-004] Layer Boundaries

**Date**: 2025-02-03
**Status**: Active
**Decision**: Astro components cannot import from data/ or services/. React islands access data through hooks → services → repositories.
**Rationale**: Enforces static/dynamic boundary. Astro handles build-time content; React handles runtime user state.

---

## [DATA-001] IndexedDB via Dexie

**Date**: 2025-02-03
**Status**: Active
**Alternatives Considered**: localStorage, idb, localForage
**Decision**: Use Dexie.js for all client-side persistence.
**Rationale**: Larger capacity than localStorage (~5MB limit), async non-blocking API, excellent TypeScript support, query capabilities, React hooks available (`dexie-react-hooks`), handles schema migrations. 15KB size acceptable for capabilities.

## [DATA-002] Zod for Schema Validation

**Date**: 2025-02-03
**Status**: Active
**Decision**: Use Zod schemas in data layer with versioning. Coerce to TypeScript types at service layer boundary.
**Rationale**: Runtime validation at storage boundary catches corruption. Schema versioning supports data migrations. TypeScript types derived from Zod prevent drift.

---

## [UI-001] shadcn/ui as Primitives

**Date**: 2025-02-03
**Status**: Active
**Decision**: Always use shadcn components as primitives. Custom components must wrap/compose shadcn. Never modify files in components/ui/.
**Rationale**: Consistent accessibility, keyboard navigation, behavior. Easy updates via CLI. Clear separation: ui/ = primitives, custom = domain components.

## [UI-002] No Inline Styles

**Date**: 2025-02-03
**Status**: Active
**Decision**: All styling via Tailwind CSS classes. No `style={{}}` props or inline CSS.
**Rationale**: Consistency, maintainability, theme adherence. All design tokens from global.css.

## [UI-003] Theme-Driven Design

**Date**: 2025-02-03
**Status**: Active
**Decision**: All colors, fonts, spacing, animations defined in Tailwind theme (global.css) first, consumed via utility classes.
**Rationale**: Single source of truth for design tokens. Palette changes require one file edit.

## [UI-004] Design Aesthetic

**Date**: 2025-02-03
**Status**: Active
**Decision**: Hyper-retro 16-bit style inspired by 70s/80s computing. Bold colors, quirky animations, pixelated touches.
**Rationale**: Appeals to target audience (geeks, nerds, deep fans). Distinctive brand identity.

## [UI-005] Mobile-First

**Date**: 2025-02-03
**Status**: Active
**Decision**: 100% mobile-first responsive design. Desktop must work well but mobile is priority.
**Rationale**: Users likely checking progress on phones while watching/reading.

---

## [CONTENT-001] MDX Content Collections

**Date**: 2025-02-03
**Status**: Active
**Decision**: All content in src/content/<type>/ as MDX files. Each type folder has \_template.mdx.
**Rationale**: Type-safe frontmatter, Astro content collections integration, version controlled, easy contribution.

## [CONTENT-002] Multimedia Organization

**Date**: 2025-02-03
**Status**: Active
**Decision**: Images in src/assets/ (Astro optimization). Videos/audio/fonts in public/ (served as-is).
**Rationale**: Images benefit from build-time optimization (WebP, responsive). Large media files don't need processing.

---

## [TOOLING-001] Package Manager

**Date**: 2025-02-03
**Status**: Active
**Decision**: pnpm for all package management. Use `pnpm dlx` for one-off commands.
**Rationale**: Workspace support, disk efficiency, strict dependency resolution.

## [TOOLING-002] Monorepo Structure

**Date**: 2025-02-03
**Status**: Active
**Decision**: pnpm workspace monorepo.
**Rationale**: Allows shared packages if needed later (@theorder/ui, @theorder/data).

## [TOOLING-003] Code Quality

**Date**: 2025-02-03
**Status**: Active
**Decision**: ESLint + Prettier + TypeScript strict mode. Husky + lint-staged for pre-commit hooks. Always run lint, format, tsc before committing.
**Rationale**: Consistent code style, catch errors early, enforce conventions automatically.

## [TOOLING-004] No Tests Initially

**Date**: 2025-02-03
**Status**: Active
**Decision**: Skip testing setup for now.
**Rationale**: Early stage, rapid iteration. Can add later when patterns stabilize.

---

## [FILE-001] One Export Per File

**Date**: 2025-02-03
**Status**: Active
**Decision**: Each React component file has single default or named export.
**Rationale**: Clear file organization, easier imports, better code splitting.

## [FILE-002] Component Categories

**Date**: 2025-02-03
**Status**: Active
**Decision**: Custom components in src/components/<category>/ where category reflects feature/domain.
**Rationale**: Scalable organization, discoverable structure.

## [FILE-003] Hooks Directory

**Date**: 2025-02-03
**Status**: Active
**Decision**: All custom React hooks in src/hooks/ with filename matching hook name.
**Rationale**: Conventional React pattern, easy to find hooks.

---

## [META-001] Context Maintenance

**Date**: 2025-02-03
**Status**: Active
**Decision**: After every conversation, update DECISIONS.md (append) and CLAUDE.md (current state).
**Rationale**: Maintains institutional knowledge for Claude across sessions. CLAUDE.md = what, DECISIONS.md = why.

---

## [ARCH-005] Simplified Two-Layer Architecture

**Date**: 2025-02-03
**Status**: Active
**Supersedes**: ARCH-003
**Decision**: Simplify from three layers to two: Data Layer (Dexie + Zod) and Presentation Layer (Astro + React + hooks). Remove dedicated Service Layer.
**Rationale**: Three layers was over-engineered for the current scope. Domain logic can live in hooks or small utility functions in lib/. Reduces abstraction overhead for simple operations.

## [ARCH-006] TanStack Query for Async State

**Date**: 2025-02-03
**Status**: Active
**Decision**: Use TanStack Query for all async data operations (Dexie queries).
**Rationale**: Provides caching, loading/error states, and consistent async patterns. Works well with IndexedDB's async nature. Reduces boilerplate in hooks.

## [ARCH-007] Offline-First Design

**Date**: 2025-02-03
**Status**: Active
**Decision**: App works fully offline. Service Worker (Workbox) caches static assets. IndexedDB provides local data. No network required after initial load.
**Rationale**: Aligns with local-only data model. Users can track progress anywhere. Strengthens "works on your device" value proposition.

## [ARCH-008] Failure Mode Strategy

**Date**: 2025-02-03
**Status**: Active
**Decision**: Graceful degradation when IndexedDB unavailable. Fall back to in-memory storage with clear UI warning. Always provide export/import for data recovery.
**Rationale**: Private browsing, quota limits, and corruption can break IndexedDB. Users should never lose access to the app, only persistence. Export/import is critical for recovery and portability.

---

## [DATA-003] Zod Without Versioning

**Date**: 2025-02-03
**Status**: Active
**Supersedes**: DATA-002 (partial)
**Decision**: Zod validates data integrity at write boundaries but has no version tracking. Dexie is single source of truth for schema versions.
**Rationale**: Dual versioning (Zod + Dexie) added complexity without benefit. Dexie handles migrations; Zod ensures shape integrity at runtime.

## [DATA-004] Export/Import Required

**Date**: 2025-02-03
**Status**: Active
**Decision**: Export/import functionality is a core feature, not optional. Must work in degraded mode.
**Rationale**: Local-only storage means users have no recovery path without export. Critical for device switching, backup, and corruption recovery.

---

## [UI-006] shadcn Edits Allowed When Necessary

**Date**: 2025-02-03
**Status**: Active
**Supersedes**: UI-001 (partial)
**Decision**: Avoid editing shadcn components where possible. Make edits where necessary, documenting changes in file header comments.
**Rationale**: "Never modify" was too rigid. Real-world accessibility or integration needs may require changes. Documentation ensures changes are intentional and traceable.

---

## [ARCH-009] Service Worker via @vite-pwa/astro

**Date**: 2025-02-03
**Status**: Active
**Alternatives Considered**: Manual SW, cache-control headers only, vite-plugin-pwa
**Decision**: Use `@vite-pwa/astro` with Workbox for service worker and offline caching.
**Rationale**: Astro-native integration, automatic cache versioning, handles SW updates gracefully. Workbox is industry standard. Precaches at build time.

## [ARCH-010] Fallback Chain for Storage

**Date**: 2025-02-03
**Status**: Active
**Decision**: Three-tier fallback: IndexedDB (persistent) → IndexedDB (ephemeral/private browsing) → In-memory Dexie (via fake-indexeddb) → Unavailable state.
**Rationale**: Graceful degradation ensures app always works. Users in private browsing get session-only storage. In-memory fallback uses same Dexie API (no code changes). Clear UI communication for each state.

## [ARCH-011] Database State Detection

**Date**: 2025-02-03
**Status**: Active
**Decision**: On init, detect storage mode via: feature detection → db.open() → navigator.storage.persisted() → write/read test. Return typed DbStatus.
**Rationale**: Different failure modes require different UI. Private browsing detection prevents false "everything is fine" when data will be cleared. Write test catches edge cases.

## [ARCH-012] Export/Import as Core Feature

**Date**: 2025-02-03
**Status**: Active
**Decision**: Export/import is not optional. JSON format with version field. Must work in all modes except unavailable. Always visible in UI.
**Rationale**: Local-only storage has no recovery path without export. Users switching devices, clearing data, or in degraded mode need data portability. Zod validates imports.

---

## [META-002] Backlog Tracking

**Date**: 2025-02-03
**Status**: Active
**Decision**: Track future work in BACKLOG.md with priority levels (P1/P2/P3), categories, effort/impact estimates, and acceptance criteria. Include downscope rationale for deferred decisions.
**Rationale**: Separates "what to build now" from "what to build later". Structured format allows Claude to find relevant items quickly. Rationale preserves context for why items were deferred.

## [META-003] Critique Tracking

**Date**: 2025-02-03
**Status**: Active
**Decision**: After planning sessions, critique the design. Track concerns in CRITIQUES.md with status (Open/Resolved/Downscoped/Accepted). Unresolved critiques must be addressed or explicitly downscoped.
**Rationale**: Forces honest evaluation of design decisions. Prevents blind spots from accumulating. Links critiques to resolutions or backlog items.

---

## [ARCH-013] Remove TanStack Query

**Date**: 2025-02-03
**Status**: Active
**Supersedes**: ARCH-006
**Decision**: Use `dexie-react-hooks` (`useLiveQuery`) instead of TanStack Query for reactive data.
**Rationale**: TanStack Query designed for API caching and network request management. For local-only IndexedDB, `useLiveQuery` provides reactivity with less abstraction. Removes unnecessary layer between hooks and Dexie.

---

## [CONTENT-003] Three-Tier Content Model

**Date**: 2025-02-03
**Status**: Active
**Decision**: Three core data structures: Fandom (container), Entry (individual media), List (ordered sequence referencing entries). Entries stored once per fandom, lists reference by ID.
**Rationale**: Avoids duplication—same entry (e.g., "A New Hope") can appear in multiple lists. Single source of truth for entry metadata.

## [CONTENT-004] List Layer Hierarchy

**Date**: 2025-02-03
**Status**: Active
**Decision**: Lists support 1-4 levels of visual hierarchy via `structure` field with nested `children`. Layers are for visual grouping only; progress tracks individual entries.
**Rationale**: Allows rich organization (eras, arcs, seasons) without complicating progress tracking. Users see "Prequel Era > Clone Wars > Episode", progress stores "completed entry X".

## [CONTENT-005] Entry Backlinks

**Date**: 2025-02-03
**Status**: Active
**Decision**: Entries include `links` array with label, URL, and type (stream/purchase/rent/free/library) pointing to external services.
**Rationale**: Core feature—users need to know WHERE to watch/read. Types enable filtering by availability.

## [CONTENT-006] Templates at Repo Root

**Date**: 2025-02-03
**Status**: Active
**Decision**: Content templates live in `/templates/` at repo root, not in content folders.
**Rationale**: Clear separation from actual content. Templates won't be picked up by content collections.

---

## [DATA-005] Progress Per List

**Date**: 2025-02-03
**Status**: Active
**Decision**: Progress tracked per list, not per entry. ListProgress contains array of EntryProgress with status, timestamps, and position.
**Rationale**: Same entry might be in different lists with different progress. Enables per-list stats (speed, investment, streak).

## [DATA-006] User Interests for Prioritization

**Date**: 2025-02-03
**Status**: Active
**Decision**: Track user fandom interests with priority ordering. Used to personalize home page and recommendations.
**Rationale**: Users care about specific fandoms. Priority ordering enables "My Fandoms" section.

---

## [DESIGN-001] Brand Personality

**Date**: 2025-02-03
**Status**: Active
**Decision**: Brand personality is "Epic, Reverent, Immersive". Treats fandoms with cinematic respect.
**Rationale**: Target users are passionate fans who want their fandoms respected, not trivialized. Chronicle/saga feel matches epic source material.

## [DESIGN-002] Dark Mode Only

**Date**: 2025-02-03
**Status**: Active
**Decision**: Dark mode only, no light mode. Blacks with navy undertone.
**Rationale**: Matches synthwave aesthetic, reduces eye strain during long viewing sessions, feels cinematic. Users likely using while watching in dark rooms.

## [DESIGN-003] Synthwave Accents, Not Theme

**Date**: 2025-02-03
**Status**: Active
**Decision**: Synthwave colors (magenta, cyan, purple, gold) used as accents only—for interactive elements, focus states, completion celebrations. Not as dominant visual theme.
**Rationale**: Full synthwave would be visually overwhelming and hurt usability. Subtle accents please geek users while maintaining readability and professionalism.

## [DESIGN-004] Typography Stack

**Date**: 2025-02-03
**Status**: Active
**Decision**: Cinzel (serif) for headings, Inter (sans-serif) for body, JetBrains Mono for stats/data.
**Rationale**: Cinzel evokes epic/chronicle feel matching Star Wars, Cosmere, LOTR inspiration. Inter is highly readable for content-heavy UI. Monospace for data gives technical/precise feel for stats.

## [DESIGN-005] Accessibility Standard

**Date**: 2025-02-03
**Status**: Active
**Decision**: WCAG AA compliance. Respect `prefers-reduced-motion`. Standard keyboard navigation and screen reader support.
**Rationale**: Inclusive design without over-engineering. AA provides good contrast while allowing design flexibility. Reduced motion support critical for synthwave glows/animations.
