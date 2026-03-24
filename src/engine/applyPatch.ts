import type { CharacterDraft } from './types';
import type { DomainPatch } from './domainPatch';

export function applyPatch(
  draft: CharacterDraft,
  patch: DomainPatch
): CharacterDraft {
  return {
    ...draft,
    identity: {
      ...draft.identity,
      ...patch.identity,
    },
    abilities: patch.abilities
      ? {
          ...draft.abilities,
          ...patch.abilities,
        }
      : draft.abilities,
    abilityContributions: patch.abilityContributions
      ? {
          ...draft.abilityContributions,
          ...patch.abilityContributions,
          background: patch.abilityContributions.background
            ? {
                ...draft.abilityContributions.background,
                ...patch.abilityContributions.background,
              }
            : draft.abilityContributions.background,
          class: patch.abilityContributions.class
            ? {
                ...draft.abilityContributions.class,
                ...patch.abilityContributions.class,
              }
            : draft.abilityContributions.class,
          other: patch.abilityContributions.other
            ? {
                ...draft.abilityContributions.other,
                ...patch.abilityContributions.other,
              }
            : draft.abilityContributions.other,
        }
      : draft.abilityContributions,
  };
}