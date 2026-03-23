# Trigger Rules

- One trigger per script node.
- If a trigger is not applicable, it returns `skip`.
- Runner advances automatically on `skip`.
- Runner owns progression by default.
- Handlers may override next node only when necessary.
- Handlers do not write directly to the store; they return structured results.
- All trigger names come from `triggerNames.ts`.
- Unknown triggers hard-fail in development.
- Trigger UI hydrates from current store state when revisited.