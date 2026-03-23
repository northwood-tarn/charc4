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
  };
}