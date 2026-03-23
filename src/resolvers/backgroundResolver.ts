import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

function buildBackgroundField(options: { value: string; label: string }[]): ResolvedField {
  return {
    name: 'backgroundId',
    title: 'Choose your background',
    type: 'string',
    enum: options.map((o) => o.value),
    enumNames: options.map((o) => o.label),
    required: true,
    widget: 'select',
  };
}

export function resolveBackgroundPicker(
  _draft: CharacterDraft,
  options: { value: string; label: string }[]
): ResolverOutput {
  if (!options || options.length === 0) {
    return { status: 'skip' as const };
  }

  return {
    status: 'ready' as const,
    fields: [buildBackgroundField(options)],
  };
}
