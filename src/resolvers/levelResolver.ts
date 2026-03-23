import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

function buildLevelField(): ResolvedField {
  return {
    name: 'level',
    title: 'Choose your level',
    type: 'string',
    enum: [
      '1', '2', '3', '4', '5',
      '6', '7', '8', '9', '10',
      '11', '12', '13', '14', '15',
      '16', '17', '18', '19', '20',
    ],
    enumNames: [
      '1', '2', '3', '4', '5',
      '6', '7', '8', '9', '10',
      '11', '12', '13', '14', '15',
      '16', '17', '18', '19', '20',
    ],
    required: true,
    widget: 'select',
  };
}

export function resolveLevelPicker(_draft: CharacterDraft): ResolverOutput {
  return {
    status: 'ready' as const,
    fields: [buildLevelField()],
  };
}