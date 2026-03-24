import type { CharacterDraft } from './types';

/**
 * A DomainPatch represents a partial, structured update
 * to the CharacterDraft.
 *
 * It must:
 * - follow the shape of CharacterDraft
 * - not contain arbitrary keys
 * - be mergeable deterministically
 */
export type DomainPatch = Partial<{
  identity: Partial<CharacterDraft['identity']>;
  abilities: Partial<CharacterDraft['abilities']>;
  abilityContributions: Partial<CharacterDraft['abilityContributions']> & {
    background?: Partial<CharacterDraft['abilityContributions']['background']>;
    class?: Partial<CharacterDraft['abilityContributions']['class']>;
    other?: Partial<CharacterDraft['abilityContributions']['other']>;
  };
  featSlots: CharacterDraft['featSlots'];
  featFollowupSelections: CharacterDraft['featFollowupSelections'];
}>;