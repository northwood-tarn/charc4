import { useMemo } from 'react';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveGearPicker } from '../../resolvers/gearResolver';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

export function GearPicker({ context, onResolve }: TriggerComponentProps) {
  const currentGearId = context.draft.identity?.gearId;
  const resolved = resolveGearPicker(context.draft);

  if (resolved.status === 'skip') {
    onResolve({ status: 'skip' });
    return null;
  }

  const field = resolved.fields[0];

  if (!field || !field.enum || !field.enum.length) {
    onResolve({ status: 'skip' });
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
      label={field.label}
      options={options}
      value={currentGearId ?? ''}
      onChange={(value) => {
        const gearId = Array.isArray(value) ? value[0] ?? '' : value;

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              gearId: gearId || undefined,
            },
          },
          stayOnNode: true,
        });
      }}
      onHoverDetail={(detail) => {
        context.setHoverDetail?.(detail ?? null);
      }}
      multiple={false}
      placeholder="Choose gear"
      instructionText="— Choose gear —"
      emptyDetail={null}
    />
  );
}