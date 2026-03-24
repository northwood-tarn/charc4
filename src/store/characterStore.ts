import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CharacterDraft } from '../engine/types';
import { createZeroAbilities } from '../builder/abilityContributions';

type CharacterStore = {
  draft: CharacterDraft;
  setDraft: (draft: CharacterDraft) => void;
  setClassId: (classId: string) => void;
  setSpeciesId: (speciesId: string) => void;
};

function createInitialDraft(): CharacterDraft {
  return {
    identity: {},
    abilities: createZeroAbilities(),
    abilityContributions: {
      background: createZeroAbilities(),
      class: createZeroAbilities(),
      other: createZeroAbilities(),
    },
    proficiencies: {
      skills: [],
    },
    featSlots: [],
    featFollowupSelections: {},
  };
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      draft: createInitialDraft(),
      setDraft: (draft) =>
        set((state) => {
          const initialDraft = createInitialDraft();

          return {
            draft: {
              ...initialDraft,
              ...state.draft,
              ...draft,
              identity: {
                ...initialDraft.identity,
                ...state.draft.identity,
                ...draft.identity,
              },
              abilityContributions: {
                ...initialDraft.abilityContributions,
                ...state.draft.abilityContributions,
                ...draft.abilityContributions,
              },
              proficiencies: {
                ...initialDraft.proficiencies,
                ...state.draft.proficiencies,
                ...draft.proficiencies,
                skills:
                  draft.proficiencies?.skills ??
                  state.draft.proficiencies?.skills ??
                  initialDraft.proficiencies.skills,
              },
              featSlots: draft.featSlots ?? state.draft.featSlots ?? initialDraft.featSlots,
              featFollowupSelections:
                draft.featFollowupSelections ??
                state.draft.featFollowupSelections ??
                initialDraft.featFollowupSelections,
            },
          };
        }),
      setClassId: (classId) =>
        set((state) => ({
          draft: {
            ...state.draft,
            identity: {
              ...state.draft.identity,
              classId,
            },
          },
        })),
      setSpeciesId: (speciesId) =>
        set((state) => ({
          draft: {
            ...state.draft,
            identity: {
              ...state.draft.identity,
              speciesId,
            },
          },
        })),
    }),
    {
      name: 'character-draft',
    }
  )
);