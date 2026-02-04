# BACKLOG.md

Future work, enhancements, and downscoped decisions for The Order. Organized for Claude Code indexing.

Each item includes rationale for deferral and effort/impact estimates to aid prioritization.

---

## Index

- [OFFLINE] Offline experience enhancements
- [STORAGE] Storage and data management
- [DATA] Data model and schema concerns
- [PWA] Progressive Web App features
- [UX] User experience improvements
- [CONTENT] Content management enhancements
- [PERF] Performance optimizations

---

## Estimates Key

**Effort**: S (hours) | M (1-2 days) | L (3-5 days) | XL (1+ week)
**Impact**: Low | Medium | High | Critical

---

## [OFFLINE-001] Update Notification Toast

**Priority**: P1
**Category**: Offline
**Effort**: S | **Impact**: High
**Downscope Rationale**: Service worker auto-updates work without UI. Toast is polish—users won't lose functionality without it, but stale content confusion is possible.
**Description**: When service worker detects new version, show toast: "New version available. Refresh to update."
**Implementation Notes**:

- Listen to Workbox `controlling` event
- Use shadcn Toast component
- Persist dismissal preference in localStorage
  **Acceptance Criteria**:
- [ ] Toast appears when SW updates
- [ ] "Refresh" button reloads page
- [ ] "Later" dismisses until next update

---

## [OFFLINE-002] Offline Status Indicator

**Priority**: P2
**Category**: Offline
**Effort**: S | **Impact**: Low
**Downscope Rationale**: App works fully offline—indicator is informational only. Users may not even notice they're offline since everything keeps working.
**Description**: Show subtle indicator in nav when user is offline.
**Implementation Notes**:

- Use `navigator.onLine` + `online`/`offline` events
- Small icon in header/nav area
- Tooltip explains "You're offline. Everything still works."
  **Acceptance Criteria**:
- [ ] Indicator visible when offline
- [ ] Disappears when back online
- [ ] Non-intrusive design

---

## [STORAGE-001] Quota Monitoring

**Priority**: P1
**Category**: Storage
**Effort**: M | **Impact**: High
**Downscope Rationale**: Quota issues are rare for this data volume. Export/import provides recovery. Monitoring is proactive prevention but not critical for MVP.
**Description**: Monitor storage usage and warn users before quota issues occur.
**Implementation Notes**:

```ts
const estimate = await navigator.storage.estimate()
const usedPercent = (estimate.usage / estimate.quota) * 100
// Warning at 75%, critical at 90%
```

- Show in settings page
- Show warning banner at 90%+
  **Acceptance Criteria**:
- [ ] Storage usage visible in settings
- [ ] Warning banner at 90% usage
- [ ] Banner suggests export

---

## [STORAGE-002] Corruption Recovery

**Priority**: P2
**Category**: Storage
**Effort**: M | **Impact**: Medium
**Downscope Rationale**: Database corruption is very rare. Basic failure detection exists in Phase 1. Advanced recovery (partial data salvage) is edge-case handling.
**Description**: Detect database corruption and offer recovery options.
**Implementation Notes**:

- Catch errors during db.open() or reads
- Attempt to export recoverable data
- Offer "Export what we can" + "Start fresh" options
  **Acceptance Criteria**:
- [ ] Corruption detected gracefully
- [ ] Partial data export attempted
- [ ] User can reset database

---

## [STORAGE-003] Storage Persistence Request

**Priority**: P2
**Category**: Storage
**Effort**: S | **Impact**: Medium
**Downscope Rationale**: Browsers rarely evict IndexedDB data unless under extreme pressure. Persistence API support varies. Good to have but not blocking.
**Description**: Request persistent storage to prevent browser from evicting data.
**Implementation Notes**:

```ts
if (navigator.storage?.persist) {
  const granted = await navigator.storage.persist()
  // If granted, data won't be evicted under storage pressure
}
```

- Request on first meaningful action (not page load)
- Show explanation to user first
  **Acceptance Criteria**:
- [ ] Persistence requested at appropriate time
- [ ] User informed of benefit
- [ ] Works without persistence if denied

---

## [PWA-001] Web App Manifest

**Priority**: P1
**Category**: PWA
**Effort**: S | **Impact**: High
**Downscope Rationale**: @vite-pwa/astro can generate basic manifest. Custom manifest with retro theming is polish. App works as website without it.
**Description**: Add manifest.json for installable PWA.
**Implementation Notes**:

- App name, icons, theme colors
- `display: standalone`
- Retro-themed icons matching design aesthetic
  **Acceptance Criteria**:
- [ ] Manifest present and valid
- [ ] Icons for all sizes (192, 512, maskable)
- [ ] Correct theme colors

---

## [PWA-002] Install Prompt

**Priority**: P2
**Category**: PWA
**Effort**: M | **Impact**: Medium
**Downscope Rationale**: Browser shows default install prompt. Custom prompt improves conversion but requires UX design work. Users can still install via browser menu.
**Description**: Custom "Add to Home Screen" prompt for mobile users.
**Implementation Notes**:

- Capture `beforeinstallprompt` event
- Show custom UI instead of browser default
- Don't show on desktop
  **Acceptance Criteria**:
- [ ] Custom install prompt on mobile
- [ ] Dismissal remembered
- [ ] Shows after user engagement (not immediately)

---

## [PWA-003] App Shortcuts

**Priority**: P3
**Category**: PWA
**Effort**: S | **Impact**: Low
**Downscope Rationale**: Shortcuts are convenience feature with limited discoverability. Most users won't know to long-press. Nice polish after core experience is solid.
**Description**: Define app shortcuts in manifest for quick access to fandoms.
**Implementation Notes**:

```json
"shortcuts": [
  { "name": "Star Wars", "url": "/star-wars", "icon": "..." }
]
```

**Acceptance Criteria**:

- [ ] Shortcuts appear on long-press (mobile)
- [ ] Icons match fandom themes

---

## [UX-001] Onboarding for Degraded Mode

**Priority**: P1
**Category**: UX
**Effort**: M | **Impact**: High
**Downscope Rationale**: Status banner provides basic communication. Full onboarding modal requires UX design and copy. Banner is sufficient for MVP; modal prevents confusion in edge cases.
**Description**: First-time explanation when user is in ephemeral/memory mode.
**Implementation Notes**:

- Modal or full-page explanation on first visit
- Explain limitations clearly
- Prominent export CTA
- Remember dismissal
  **Acceptance Criteria**:
- [ ] Shown once per degraded session
- [ ] Clear explanation of limitations
- [ ] Export button prominent

---

## [UX-002] Import Conflict Resolution

**Priority**: P2
**Category**: UX
**Effort**: M | **Impact**: Medium
**Downscope Rationale**: MVP import can use simple "replace all" strategy. Conflict resolution adds complexity. Most users import to empty state or after data loss, not merge scenarios.
**Description**: When importing, handle conflicts with existing data.
**Implementation Notes**:

- Detect overlapping entries
- Offer: "Replace all" / "Keep existing" / "Merge (keep newest)"
- Preview what will change
  **Acceptance Criteria**:
- [ ] Conflicts detected
- [ ] User chooses resolution strategy
- [ ] Preview before applying

---

## [UX-003] Export Scheduling Reminder

**Priority**: P3
**Category**: UX
**Effort**: S | **Impact**: Low
**Downscope Rationale**: Proactive reminder is nice but can feel naggy. Users who care about data will export naturally. Low impact for effort of getting UX right.
**Description**: Periodically remind users to export their data.
**Implementation Notes**:

- Track last export date
- Gentle reminder after 30 days
- Dismissible, remembers for another 30 days
  **Acceptance Criteria**:
- [ ] Reminder after 30 days without export
- [ ] Non-intrusive (toast or settings badge)
- [ ] Dismissible

---

## [CONTENT-001] CMS Migration Path

**Priority**: P3
**Category**: Content
**Effort**: L | **Impact**: Medium
**Downscope Rationale**: Repo-based content works for solo maintainer. CMS only matters if community grows or content velocity increases. Planning now is premature optimization.
**Description**: Document path to migrate from repo-based content to headless CMS.
**Implementation Notes**:

- Evaluate: Sanity, Contentful, or Decap CMS (git-based)
- Decap CMS might be best (keeps git workflow, adds UI)
- Document content model translation
  **Acceptance Criteria**:
- [ ] CMS options evaluated with pros/cons
- [ ] Migration guide documented
- [ ] No implementation yet (just planning)

---

## [CONTENT-002] Community Contributions

**Priority**: P3
**Category**: Content
**Effort**: L | **Impact**: Medium
**Downscope Rationale**: Community contributions require moderation infrastructure. Solo maintainer can handle PRs initially. Only invest when community demand is proven.
**Description**: Make it easier for non-technical users to suggest content.
**Implementation Notes**:

- GitHub issue templates for new entries
- Or: Simple form that creates PR via GitHub API
- Validation before submission
  **Acceptance Criteria**:
- [ ] Non-git users can suggest content
- [ ] Suggestions are validated
- [ ] Maintainer can approve/reject easily

---

## [PERF-001] Bundle Analysis

**Priority**: P2
**Category**: Performance
**Effort**: S | **Impact**: Medium
**Downscope Rationale**: Astro + islands architecture keeps bundles small by default. Analysis is useful when adding dependencies, not critical for MVP.
**Description**: Add bundle analysis to identify optimization opportunities.
**Implementation Notes**:

- `rollup-plugin-visualizer` or similar
- Run as part of build, output to reports/
- Track size over time
  **Acceptance Criteria**:
- [ ] Bundle visualization available
- [ ] Key metrics documented
- [ ] Alerts if bundle grows significantly

---

## [PERF-002] Image Optimization Audit

**Priority**: P2
**Category**: Performance
**Effort**: M | **Impact**: Medium
**Downscope Rationale**: Astro Image works automatically for assets in src/. Audit is cleanup task after content exists. Premature before content is authored.
**Description**: Ensure all images use Astro's Image component for optimization.
**Implementation Notes**:

- Audit all `<img>` tags
- Replace with `<Image>` from `astro:assets`
- Ensure proper sizing and lazy loading
  **Acceptance Criteria**:
- [ ] All images use Astro Image
- [ ] Appropriate sizes defined
- [ ] Lazy loading on below-fold images

---

## [DATA-001] Content/Progress Drift Handling

**Priority**: P2
**Category**: Storage
**Effort**: M | **Impact**: Medium
**Downscope Rationale**: Edge case for MVP. Content changes controlled by maintainer. Can address when content model stabilizes.
**Origin**: CRITIQUES.md [DATA-C001]
**Description**: Handle drift between MDX content (build time) and IndexedDB progress (runtime). Detect orphaned progress for removed/renamed entries.
**Implementation Notes**:

- On app init, compare progress entry IDs against known content IDs
- Surface orphaned entries to user or auto-clean
- Consider migration utility for renamed entries
  **Acceptance Criteria**:
- [ ] Orphaned progress detected
- [ ] User can view/export orphaned data
- [ ] Option to clean up orphaned entries

---

## [DATA-002] Export Format Migration Strategy

**Priority**: P3
**Category**: Storage
**Effort**: S | **Impact**: Low
**Downscope Rationale**: Can define migration when v2 is needed. v1 format should be minimal and stable.
**Origin**: CRITIQUES.md [DATA-C003]
**Description**: Define strategy for importing older export format versions when schema evolves.
**Implementation Notes**:

- Import function checks version field
- Version-specific transformers: `v1ToV2()`, etc.
- Fail gracefully with clear error if version unknown
  **Acceptance Criteria**:
- [ ] Migration strategy documented
- [ ] Older versions can be imported
- [ ] Unknown versions show helpful error

---

## [UX-004] Accessibility Constraints for Retro Aesthetic

**Priority**: P1
**Category**: UX
**Effort**: M | **Impact**: High
**Downscope Rationale**: Aesthetic implementation is future work. Define constraints when implementing design system.
**Origin**: CRITIQUES.md [UX-C001]
**Description**: Define accessibility guardrails that retro aesthetic must respect.
**Implementation Notes**:

- Minimum contrast ratios (WCAG AA: 4.5:1 text, 3:1 large text)
- `prefers-reduced-motion` support for animations
- Readable font sizes (min 16px body)
- Focus indicators visible
- No flashing/strobing effects
  **Acceptance Criteria**:
- [ ] Contrast requirements documented in design system
- [ ] Reduced motion variant for all animations
- [ ] Accessibility audit passes WCAG AA

---

## [UX-005] Error Boundary Strategy

**Priority**: P2
**Category**: UX
**Effort**: M | **Impact**: Medium
**Downscope Rationale**: Islands are small and isolated. Astro's partial hydration limits blast radius. Add as complexity grows.
**Origin**: CRITIQUES.md [UX-C002]
**Description**: Define error boundary placement and fallback UI for React island failures.
**Implementation Notes**:

- Error boundary wrapper component
- Fallback: "Something went wrong. Refresh to try again."
- Optional: error reporting to console or external service
- Per-island or per-section boundaries
  **Acceptance Criteria**:
- [ ] Error boundary component created
- [ ] Critical islands wrapped
- [ ] Fallback UI is user-friendly
- [ ] Errors logged for debugging

---

## Completed

Items move here when done. Include completion date and notes.

<!--
## [ID] Title
**Completed**: YYYY-MM-DD
**Effort Actual**: S/M/L/XL
**Notes**: Any relevant notes about implementation
-->
