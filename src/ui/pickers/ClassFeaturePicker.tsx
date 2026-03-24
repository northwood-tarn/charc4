import { useMemo } from 'react';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveClassFeaturePicker } from '../../resolvers/classFeatureResolver';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

export function ClassFeaturePicker({ context, onResolve }: TriggerComponentProps) {
  const currentClassFeatureId = context.draft.identity.classFeatureId;
  const resolved = resolveClassFeaturePicker(context.draft);

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
      value={currentClassFeatureId ?? ''}
      onChange={(value) => {
        const classFeatureId = Array.isArray(value) ? value[0] ?? '' : value;

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              classFeatureId: classFeatureId || undefined,
            },
          },
          stayOnNode: true,
        });
      }}
      onHoverDetail={(detail) => {
        context.setHoverDetail?.(detail ?? null);
      }}
      multiple={false}
      placeholder="Choose a class feature"
      instructionText="— Choose a class feature —"
      emptyDetail={null}
    />
  );
}
