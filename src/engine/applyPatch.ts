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
    proficiencies: patch.proficiencies
      ? {
          ...draft.proficiencies,
          ...patch.proficiencies,
          skills: patch.proficiencies.skills ?? draft.proficiencies.skills,
        }
      : draft.proficiencies,
    featSlots: patch.featSlots ?? draft.featSlots,
    featFollowupSelections: patch.featFollowupSelections
      ? {
          ...draft.featFollowupSelections,
          ...patch.featFollowupSelections,
        }
      : draft.featFollowupSelections,
    classFeatureSelections: patch.classFeatureSelections
      ? {
          ...draft.classFeatureSelections,
          ...patch.classFeatureSelections,
        }
      : draft.classFeatureSelections,
  };
}