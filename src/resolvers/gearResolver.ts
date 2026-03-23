

import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

function buildGearField(): ResolvedField {
  return {
    name: 'gearId',
    title: 'Choose your gear',
    type: 'string',
    enum: ['standard', 'custom'],
    enumNames: ['Standard Equipment', 'Custom Equipment'],
    required: true,
    widget: 'select',
  };
}

export function resolveGearPicker(_draft: CharacterDraft): ResolverOutput {
  return {
    status: 'ready' as const,
    fields: [buildGearField()],
  };
}