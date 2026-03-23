import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

function getClassFeatureOptions(classId: string): {
  values: string[];
  labels: string[];
} {
  // Temporary mapping (replace with real data later)
  if (classId === 'fighter') {
    return {
      values: ['rage'],
      labels: ['Rage'],
    };
  }

  if (classId === 'wizard') {
    return {
      values: ['spellcasting'],
      labels: ['Spellcasting'],
    };
  }

  return {
    values: [],
    labels: [],
  };
}

function buildClassFeatureField(draft: CharacterDraft): ResolvedField {
  const classId = draft.identity.classId!;
  const { values, labels } = getClassFeatureOptions(classId);

  return {
    name: 'classFeatureId',
    title: 'Choose your class feature',
    type: 'string',
    enum: values,
    enumNames: labels,
    required: true,
    widget: 'select',
  };
}

export function resolveClassFeaturePicker(draft: CharacterDraft): ResolverOutput {
  if (!draft.identity.classId) {
    return { status: 'skip' };
  }

  return {
    status: 'ready',
    fields: [buildClassFeatureField(draft)],
  };
}
