import { useEffect, useMemo, useState } from 'react';

import featsData from '../../../public/data/feats.json';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { useCharacterStore } from '../../store/characterStore';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

type FeatRecord = {
  feat_id: string;
  name: string;
  type: string;
  notes?: string;
};

function buildOriginFeatOptions(): HoverChoiceOption[] {
  return (featsData as FeatRecord[])
    .filter((feat) => feat.type === 'Origin')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((feat) => ({
      value: feat.feat_id,
      label: feat.name,
      detail: feat.notes ? (
        <>
          <span style={{ color: '#4da3ff', fontWeight: 600 }}>{feat.name}</span>
          {': '}
          {feat.notes}
        </>
      ) : (
        <span style={{ color: '#4da3ff', fontWeight: 600 }}>{feat.name}</span>
      ),
    }));
}

export function FeatPicker({ context }: TriggerComponentProps) {
  const currentOriginFeatId =
    (context.draft.identity as typeof context.draft.identity & {
      originFeatId?: string;
    }).originFeatId ?? '';

  const currentHumanOriginFeatId =
    (context.draft.identity as typeof context.draft.identity & {
      humanOriginFeatId?: string;
    }).humanOriginFeatId ?? '';

  const isHuman = context.draft.identity.speciesId === 'human';

  const [pendingOriginFeatId, setPendingOriginFeatId] =
    useState(currentOriginFeatId);
  const [pendingHumanOriginFeatId, setPendingHumanOriginFeatId] = useState(
    currentHumanOriginFeatId
  );

  const originFeatOptions = useMemo(() => buildOriginFeatOptions(), []);

  useEffect(() => {
    setPendingOriginFeatId(currentOriginFeatId);
    setPendingHumanOriginFeatId(currentHumanOriginFeatId);
  }, [currentOriginFeatId, currentHumanOriginFeatId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <HoverChoiceField
        label="Origin Feat"
        options={originFeatOptions}
        value={pendingOriginFeatId}
        onChange={(value) => {
          const nextOriginFeatId = Array.isArray(value) ? value[0] ?? '' : value;
          setPendingOriginFeatId(nextOriginFeatId);

          useCharacterStore.setState((state) => ({
            draft: {
              ...state.draft,
              identity: {
                ...state.draft.identity,
                originFeatId: nextOriginFeatId,
              },
            },
          }));
        }}
        onHoverDetail={(detail) => {
          context.setHoverDetail?.(detail ?? null);
        }}
        multiple={false}
        placeholder="Choose an Origin feat"
        instructionText="— Choose your Origin feat —"
        emptyDetail={null}
      />

      {isHuman && (
        <HoverChoiceField
          label="Second Origin Feat"
          options={originFeatOptions}
          value={pendingHumanOriginFeatId}
          onChange={(value) => {
            const nextHumanOriginFeatId = Array.isArray(value)
              ? value[0] ?? ''
              : value;
            setPendingHumanOriginFeatId(nextHumanOriginFeatId);

            useCharacterStore.setState((state) => ({
              draft: {
                ...state.draft,
                identity: {
                  ...state.draft.identity,
                  humanOriginFeatId: nextHumanOriginFeatId,
                },
              },
            }));
          }}
          onHoverDetail={(detail) => {
            context.setHoverDetail?.(detail ?? null);
          }}
          multiple={false}
          placeholder="Choose a second Origin feat"
          instructionText="— Choose your second Origin feat —"
          emptyDetail={null}
        />
      )}
    </div>
  );
}
