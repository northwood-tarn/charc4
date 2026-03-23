# Domain Patch Rules

- All trigger outputs must return a DomainPatch.
- DomainPatch mirrors the structure of CharacterDraft.
- No arbitrary keys are allowed.
- Patches are merged by the runner, not the trigger.
- Patches represent *explicit choices only*.
- Derived effects are handled elsewhere (resolvers).