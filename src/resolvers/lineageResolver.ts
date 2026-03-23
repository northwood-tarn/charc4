import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

function getLineageOptions(speciesId: string): {
  values: string[];
  labels: string[];
} {
  // Temporary mapping (replace with real data later)
  if (speciesId === 'elf') {
    return {
      values: ['high_elf', 'wood_elf'],
      labels: ['High Elf', 'Wood Elf'],
    };
  }

  if (speciesId === 'human') {
    return {
      values: ['standard_human'],
      labels: ['Standard Human'],
    };
  }

  return {
    values: [],
    labels: [],
  };
}

function buildLineageField(draft: CharacterDraft): ResolvedField {
  const speciesId = draft.identity.speciesId!;
  const { values, labels } = getLineageOptions(speciesId);

  return {
    name: 'lineageId',
    title: 'Choose your lineage',
    type: 'string',
    enum: values,
    enumNames: labels,
    required: true,
    widget: 'select',
  };
}

export function resolveLineagePicker(draft: CharacterDraft): ResolverOutput {
  if (!draft.identity.speciesId) {
    return { status: 'skip' };
  }

  return {
    status: 'ready',
    fields: [buildLineageField(draft)],
  };
}
