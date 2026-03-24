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

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      draft: {
        identity: {},
        abilities: createZeroAbilities(),
        abilityContributions: {
          background: createZeroAbilities(),
          class: createZeroAbilities(),
          other: createZeroAbilities(),
        },
      },
      setDraft: (draft) => set({ draft }),
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