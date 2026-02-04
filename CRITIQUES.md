# CRITIQUES.md

Design critiques and architectural concerns for The Order. Organized for Claude Code indexing.

After each planning session, critique the design. Track concerns here with resolution status. Unresolved critiques should be addressed or explicitly downscoped to BACKLOG.md.

---

## Index

- [ARCH] Architecture concerns
- [DATA] Data model concerns
- [UX] User experience concerns
- [DX] Developer experience concerns

---

## Status Key

- **Open**: Unresolved, needs decision
- **Resolved**: Addressed in implementation or documentation
- **Downscoped**: Moved to BACKLOG.md for future work
- **Accepted**: Known tradeoff, intentionally not addressing

---

## [ARCH-C001] TanStack Query Unnecessary for Local-Only Data

**Date**: 2025-02-03
**Status**: Resolved
**Critique**: TanStack Query designed for API caching, deduplication, background refetching. For local IndexedDB, `dexie-react-hooks` provides `useLiveQuery()` with built-in reactivity. Adding TanStack Query adds abstraction without clear benefit.
**Resolution**: Removed TanStack Query from architecture. Use `dexie-react-hooks` directly.

---

## [DATA-C001] Two Sources of Truth for Content

**Date**: 2025-02-03
**Status**: Downscoped
**Critique**: Content in MDX (build time) + progress in IndexedDB (runtime) creates drift risk. What happens when entries are renamed/removed? Orphaned progress data possible.
**Downscoped To**: BACKLOG.md [DATA-001]
**Rationale**: Edge case for MVP. Content changes are controlled by maintainer. Can add cleanup/migration logic when content model stabilizes.

---

## [DATA-C002] No Defined Data Model

**Date**: 2025-02-03
**Status**: Open
**Critique**: Extensive architecture discussion without defining actual schemas. What fields does progress have? What frontmatter is required? How are entries identified?
**Action Needed**: Define content schema and progress schema before scaffolding.

---

## [DATA-C003] Export Format Migration Strategy

**Date**: 2025-02-03
**Status**: Downscoped
**Critique**: Export has `version: 1` but no migration strategy for future versions. How do we import v1 data when format is v2?
**Downscoped To**: BACKLOG.md [DATA-002]
**Rationale**: Can define migration when v2 is needed. v1 format should be minimal and stable.

---

## [UX-C001] Retro Aesthetic vs. Accessibility

**Date**: 2025-02-03
**Status**: Downscoped
**Critique**: 16-bit retro aesthetic may conflict with WCAG requirements. Pixel fonts, low contrast colors, aggressive animations could hurt usability.
**Downscoped To**: BACKLOG.md [UX-004]
**Rationale**: Aesthetic implementation is future work. When implementing, accessibility constraints will be defined. Not blocking architecture.

---

## [UX-C002] No Error Boundary Strategy

**Date**: 2025-02-03
**Status**: Downscoped
**Critique**: React islands can crash. No defined strategy for error boundaries, fallback UI, or error reporting.
**Downscoped To**: BACKLOG.md [UX-005]
**Rationale**: Islands are small and isolated. Astro's partial hydration limits blast radius. Can add error boundaries as complexity grows.

---

## [ARCH-C002] PWA Manifest P1 Clarity

**Date**: 2025-02-03
**Status**: Resolved
**Critique**: PWA manifest marked P1 but @vite-pwa/astro generates basic one automatically. Unclear if P1 is about manifest existence or custom retro icons.
**Resolution**: Clarified in BACKLOG.md—P1 is for custom themed icons and proper manifest config, not just existence.

---

## [DX-C001] Documentation-Heavy, No Code

**Date**: 2025-02-03
**Status**: Accepted
**Critique**: Three markdown files (~700 lines) describing an app with 4 source files. Risk of analysis paralysis.
**Rationale**: Intentional for Claude context. Documentation enables future Claude sessions to understand decisions without re-discovery. Scaffolding begins after documentation phase.

---

## Session: 2025-02-03

**Critiques Raised**: 8
**Resolved**: 2 (TanStack Query removed, PWA manifest clarified)
**Downscoped**: 5 (content drift, export migration, accessibility, error boundaries, data model definition)
**Accepted**: 1 (documentation-heavy is intentional)
**Open**: 1 (data model needs definition before scaffolding)
