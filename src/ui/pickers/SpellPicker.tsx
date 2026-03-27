import { useEffect, useMemo } from 'react';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveSpellPicker } from '../../resolvers/spellResolver';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

export function SpellPicker({ context, onResolve }: TriggerComponentProps) {
  const currentSpellId = context.draft.identity.spellId;
  const resolved = resolveSpellPicker(context.draft);
  const field = resolved.status === 'ready' ? resolved.fields[0] : undefined;
  const shouldSkip =
    resolved.status === 'skip' || !field || !field.enum || field.enum.length === 0;

  useEffect(() => {
    if (!shouldSkip) {
      return;
    }

    onResolve({ status: 'skip' });
  }, [onResolve, shouldSkip]);

  if (shouldSkip) {
    return null;
  }

  const options = useMemo<HoverChoiceOption[]>(() => {
    return field.enum.map((value, index) => ({
      value,
      label: field.enumNames?.[index] ?? value,
    }));
  }, [field]);

  return (
    <HoverChoiceField
      label={field.title}
      options={options}
      value={currentSpellId ?? ''}
      onChange={(value) => {
        const spellId = Array.isArray(value) ? value[0] ?? '' : value;

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              spellId: spellId || undefined,
            },
          },
          stayOnNode: true,
        });
      }}
      onHoverDetail={(detail) => {
        context.setHoverDetail?.(detail ?? null);
      }}
      multiple={false}
      placeholder="Choose a spell"
      instructionText="— Choose a spell —"
      emptyDetail={null}
    />
  );
}
