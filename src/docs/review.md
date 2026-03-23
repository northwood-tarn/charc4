# Character Builder Review Log

This document tracks deferred decisions, edge cases, and architectural risks
to be reviewed once core systems are in place.

---

## How to Use This File

- Add items here when something is “good enough for now” but not fully resolved.
- Keep entries concise and actionable.
- Revisit sections after major milestones (e.g. all resolvers complete).
- Delete items once properly addressed.

---

## Triggers

### Contract & Data Flow

- [ ] Confirm all triggers return `TriggerResult` (no legacy `onComplete` usage remains)
- [ ] Confirm all triggers return **DomainPatch only** (no arbitrary data shapes)
- [ ] Confirm runner is the **only place** applying patches to the store
- [ ] Audit that no trigger writes directly to Zustand

### Skip / Applicability

- [ ] Verify all triggers correctly return `{ status: 'skip' }` when not applicable
- [ ] Confirm skip behavior does not produce UI flicker or race conditions
- [ ] Confirm skip chains (multiple skips in a row) behave predictably

### Trigger Registry

- [ ] Ensure all trigger names are defined in `triggerNames.ts`
- [ ] Confirm no raw string trigger names exist anywhere in the codebase
- [ ] Confirm all YAML triggers map to registered handlers
- [ ] Decide later whether registry should evolve beyond bare components

### Script Integration

- [ ] Confirm script validation catches:
  - [ ] duplicate node IDs
  - [ ] invalid `next` references
  - [ ] unknown trigger names
- [ ] Decide whether to support conditional script logic or keep script strictly linear

### Handler Responsibilities

- [ ] Confirm triggers only handle **explicit user choices**
- [ ] Confirm all derived consequences are handled in resolvers, not handlers
- [ ] Audit for any leakage of rules logic into UI components

### Re-entry / State Consistency

- [ ] Confirm triggers hydrate correctly from existing `draft` state
- [ ] Define behavior when upstream choices invalidate downstream selections
- [ ] Decide strategy for clearing or preserving invalidated data

### Navigation

- [ ] Define “back” behavior (full support vs limited vs none)
- [ ] Confirm re-entering a trigger restores prior selections correctly
- [ ] Decide whether arbitrary navigation (jumping sections) is allowed

### Error Handling

- [ ] Confirm unknown triggers hard-fail in development
- [ ] Decide user-facing behavior for runtime errors (dev vs production mode)
- [ ] Confirm error states do not corrupt draft state

### Debugging

- [ ] Add debug panel showing:
  - [ ] current node ID
  - [ ] active trigger
  - [ ] current draft state
- [ ] Confirm trigger resolution flow is easy to trace

### Extensibility

- [ ] Evaluate need for trigger configuration (e.g. `mode`, `contextual variants`)
- [ ] Evaluate whether some triggers should split further or consolidate
- [ ] Review whether any triggers are doing too much

---

## Notes

- The guiding rule: **Triggers orchestrate interaction; resolvers enforce rules.**
- Avoid duplicating logic between triggers and resolvers.
- Keep script layer declarative and minimal.

---

---

## Schema Builder

### Future Extensions (Deferred)

- [ ] Add support for array item structure (for multi-select and choose-N patterns)
- [ ] Add `minItems` / `maxItems` support for selection constraints
- [ ] Add support for default values (for hydration and edit stability)
- [ ] Extend field-level UI options beyond `widget` (placeholders, disabled state, ordering)
- [ ] Introduce grouped fields / sections for complex pickers
- [ ] Support conditional or nested field structures if required by resolvers
- [ ] Extend widget configuration to support custom widget options (e.g. feat/spell pickers)
- [ ] Evaluate need for non-string enum support or object-backed option values

### Notes

- Current implementation is sufficient for simple pickers (class, species, background).
- Do not expand schema complexity until a concrete picker requires it.
- Resolver remains the source of truth; schema builder should stay mechanical.

---

## ClassPicker / Resolver Integration

### Generalisation Work (Deferred)

- [ ] Remove hardcoded `formData` shape (`{ classId: ... }`) and derive from resolver fields
- [ ] Generalise patch construction (avoid manual `classId` mapping)
- [ ] Introduce field → patch mapping strategy (resolver-driven or schema-driven)
- [ ] Confirm multi-field resolvers work cleanly with current picker pattern
- [ ] Review default value handling and form rehydration behavior
- [ ] Replace or customise default RJSF submit UX if needed

### Notes

- Current implementation is intentionally narrow to validate architecture.
- Do not generalise prematurely; expand only when second picker requires it.

---

## Debug Panel

### Follow-up Review

- [ ] Confirm `DebugPanel` remains accurate through skip chains
- [ ] Confirm `lastTriggerResult` is always the most useful thing to display
- [ ] Decide later whether to show resolver output as well as trigger result
- [ ] Decide whether debug panel should be dev-only
- [ ] Review whether panel needs collapse / hide behavior
- [ ] Confirm debug output stays readable as draft structure grows

### Notes

- Current panel is intentionally minimal and functional.
- Its purpose is runtime visibility, not polished presentation.
- Do not style or expand it unless debugging pain justifies it.

---

## Persistence

### Follow-up Review

- [ ] Add versioning to persisted data to avoid schema drift issues
- [ ] Define strategy for clearing or migrating invalid stored drafts
- [ ] Validate persisted data against current resolver expectations
- [ ] Decide whether navigation state should remain separate from domain state
- [ ] Evaluate whether multi-slot save system is needed

### Notes

- Current persistence uses localStorage via Zustand middleware.
- Navigation state (`currentNodeId`) is stored separately.
- This is intentionally minimal and may require hard resets during development.


---

## Resolver Layer

### Follow-up Review

- [ ] Replace all `getXOptions` stubs with real data sources
- [ ] Ensure all resolvers correctly handle missing upstream dependencies (skip logic)
- [ ] Validate that resolver output matches schema builder expectations
- [ ] Review enum/label consistency across data sources
- [ ] Decide strategy for invalid stored values (e.g. class removed, subclass invalid)

### Notes

- Current resolvers are scaffolded and structurally correct.
- Data layer is intentionally stubbed.

---

## Spell Resolver – Data Leakage

### Issue

- `spellResolver.ts` currently contains hardcoded spell data (class, subclass, species, lineage, feat spell grants).
- This violates the intended architecture: resolvers should orchestrate, not define canonical data.

### Required Refactor

- [ ] Extract all hardcoded spell definitions into a dedicated data layer
- [ ] Replace inline `if (...) addOption(...)` logic with data-driven lookups
- [ ] Introduce functions:
  - `getClassSpells(classId)`
  - `getSubclassSpells(subclassId)`
  - `getSpeciesSpells(speciesId)`
  - `getLineageSpells(lineageId)`
  - `getFeatSpells(featId)`
- [ ] Ensure resolver only composes results from these sources

### Notes

- Current implementation is intentional scaffolding to validate multi-source aggregation
- Do not expand hardcoded spell data further in this file
- Data modelling (CSV / registry) should be tackled after resolver patterns are stable

---

## Spell Module / Spell Resolver

### Current Temporary State

- `spellResolver.ts` currently flattens all spell-granting sources into a single selectable spell list.
- This is temporary scaffolding only.
- The current `spellId` field does **not** represent the intended final spell-building experience.

### Later Refactor Required

- [ ] Replace flattened spell list with a structured spell model
- [ ] Support class-derived blank spell slots based on class and level
- [ ] Support constrained choice slots from feats / lineage / subclass / class features
- [ ] Support automatically granted named spells as prefilled entries
- [ ] Preserve current spell-access gating while replacing the output model
- [ ] Introduce a dedicated spell module renderer instead of a single generic field

### Notes

- `hasSpellAccess(...)` is the correct first-pass gate and should be preserved.
- Do not expand the current single-field `spellId` approach further.
- Canonical spell data should not remain embedded in `spellResolver.ts`.