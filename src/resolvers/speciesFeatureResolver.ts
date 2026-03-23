import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

function getSpeciesFeatureOptions(speciesId: string): {
  values: string[];
  labels: string[];
} {
  // Temporary mapping (replace with real data later)
  if (speciesId === 'human') {
    return {
      values: ['relentless_endurance'],
      labels: ['Relentless Endurance'],
    };
  }

  if (speciesId === 'elf') {
    return {
      values: ['darkvision'],
      labels: ['Darkvision'],
    };
  }

  return {
    values: [],
    labels: [],
  };
}

function buildSpeciesFeatureField(draft: CharacterDraft): ResolvedField {
  const speciesId = draft.identity.speciesId!;
  const { values, labels } = getSpeciesFeatureOptions(speciesId);

  return {
    name: 'speciesFeatureId',
    title: 'Choose your species feature',
    type: 'string',
    enum: values,
    enumNames: labels,
    required: true,
    widget: 'select',
  };
}

export function resolveSpeciesFeaturePicker(draft: CharacterDraft): ResolverOutput {
  if (!draft.identity.speciesId) {
    return { status: 'skip' };
  }

  return {
    status: 'ready',
    fields: [buildSpeciesFeatureField(draft)],
  };
}
