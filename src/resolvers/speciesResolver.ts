import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

function buildSpeciesField(): ResolvedField {
  return {
    name: 'speciesId',
    title: 'Choose your species',
    type: 'string',
    enum: ['human', 'elf'],
    enumNames: ['Human', 'Elf'],
    required: true,
    widget: 'select',
  };
}

export function resolveSpeciesPicker(_draft: CharacterDraft): ResolverOutput {
  return {
    status: 'ready' as const,
    fields: [buildSpeciesField()],
  };
}