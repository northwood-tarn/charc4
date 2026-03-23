import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

function buildNameField(): ResolvedField {
  return {
    name: 'name',
    title: 'Enter your character name',
    type: 'string',
    required: true,
  };
}

export function resolveNamePicker(_draft: CharacterDraft): ResolverOutput {
  return {
    status: 'ready' as const,
    fields: [buildNameField()],
  };
}