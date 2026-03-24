import { useMemo } from 'react';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveSpeciesFeaturePicker } from '../../resolvers/speciesFeatureResolver';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

export function SpeciesFeaturePicker({ context, onResolve }: TriggerComponentProps) {
  const currentSpeciesFeatureId = context.draft.identity.speciesFeatureId;
  const resolved = resolveSpeciesFeaturePicker(context.draft);

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
      value={currentSpeciesFeatureId ?? ''}
      onChange={(value) => {
        const speciesFeatureId = Array.isArray(value) ? value[0] ?? '' : value;

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              speciesFeatureId: speciesFeatureId || undefined,
            },
          },
          stayOnNode: true,
        });
      }}
      onHoverDetail={(detail) => {
        context.setHoverDetail?.(detail ?? null);
      }}
      multiple={false}
      placeholder="Choose a species feature"
      instructionText="— Choose a species feature —"
      emptyDetail={null}
    />
  );
}
