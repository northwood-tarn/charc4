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
  // expand later:
  // abilities: Partial<CharacterDraft['abilities']>;
  // proficiencies: Partial<CharacterDraft['proficiencies']>;
  // choices: ...
}>;