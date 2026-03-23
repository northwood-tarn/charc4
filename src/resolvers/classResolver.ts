import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

type Option = { value: string; label: string };

function buildClassField(options: Option[]): ResolvedField {
  return {
    name: 'classId',
    title: 'Choose your class',
    type: 'string',
    enum: options.map((o) => o.value),
    enumNames: options.map((o) => o.label),
    required: true,
    widget: 'select',
  };
}

function buildSubclassField(options: Option[]): ResolvedField {
  return {
    name: 'subclassId',
    title: 'Choose your subclass',
    type: 'string',
    enum: options.map((o) => o.value),
    enumNames: options.map((o) => o.label),
    required: true,
    widget: 'select',
  };
}

export function resolveClassPicker(
  _draft: CharacterDraft,
  options: Option[],
  subclassOptions?: Option[]
): ResolverOutput {
  if (!options || options.length === 0) {
    return { status: 'skip' as const };
  }

  const fields: ResolvedField[] = [buildClassField(options)];

  const classId = _draft.identity?.classId;

  if (classId && subclassOptions && subclassOptions.length > 0) {
    fields.push(buildSubclassField(subclassOptions));
  }

  return {
    status: 'ready' as const,
    fields,
  };
}