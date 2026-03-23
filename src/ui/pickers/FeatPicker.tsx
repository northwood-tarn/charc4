import { useEffect, useMemo, useState } from 'react';

import featsData from '../../../public/data/feats.json';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { useCharacterStore } from '../../store/characterStore';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

type ToolChoiceEffect = {
  count: number;
  pool: string;
};

type FeatRecord = {
  feat_id: string;
  name: string;
  type: string;
  notes?: string;
  effects?: {
    tool_choices?: ToolChoiceEffect;
  };
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
          <span style={{ color: '#6e92aa', fontWeight: 400 }}>{feat.name}</span>
          {': '}
          {feat.notes}
        </>
      ) : (
        <span style={{ color: '#6e92aa', fontWeight: 400 }}>{feat.name}</span>
      ),
    }));
}

function getOriginFeatById(featId: string): FeatRecord | undefined {
  return (featsData as FeatRecord[]).find((feat) => feat.feat_id === featId);
}

function getToolPoolOptions(pool: string): HoverChoiceOption[] {
  if (pool === 'artisan_tools') {
    return [
      { value: 'alchemers_supplies', label: 'Alchemist’s Supplies' },
      { value: 'brewers_supplies', label: 'Brewer’s Supplies' },
      { value: 'calligraphers_supplies', label: 'Calligrapher’s Supplies' },
      { value: 'carpenters_tools', label: 'Carpenter’s Tools' },
      { value: 'cartographers_tools', label: 'Cartographer’s Tools' },
      { value: 'cobblers_tools', label: 'Cobbler’s Tools' },
      { value: 'cooks_utensils', label: 'Cook’s Utensils' },
      { value: 'glassblowers_tools', label: 'Glassblower’s Tools' },
      { value: 'jewelers_tools', label: 'Jeweler’s Tools' },
      { value: 'leatherworkers_tools', label: 'Leatherworker’s Tools' },
      { value: 'masons_tools', label: 'Mason’s Tools' },
      { value: 'painters_supplies', label: 'Painter’s Supplies' },
      { value: 'potters_tools', label: 'Potter’s Tools' },
      { value: 'smiths_tools', label: 'Smith’s Tools' },
      { value: 'tinkers_tools', label: 'Tinker’s Tools' },
      { value: 'weavers_tools', label: 'Weaver’s Tools' },
      { value: 'woodcarvers_tools', label: 'Woodcarver’s Tools' },
    ];
  }

  if (pool === 'musical_instruments') {
    return [
      { value: 'bagpipes', label: 'Bagpipes' },
      { value: 'drum', label: 'Drum' },
      { value: 'dulcimer', label: 'Dulcimer' },
      { value: 'flute', label: 'Flute' },
      { value: 'horn', label: 'Horn' },
      { value: 'lute', label: 'Lute' },
      { value: 'lyre', label: 'Lyre' },
      { value: 'pan_flute', label: 'Pan Flute' },
      { value: 'shawm', label: 'Shawm' },
      { value: 'viol', label: 'Viol' },
    ];
  }

  return [];
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

  const [pendingOriginToolChoices, setPendingOriginToolChoices] = useState<string[]>(
    []
  );

  const selectedOriginFeat = useMemo(
    () => getOriginFeatById(pendingOriginFeatId),
    [pendingOriginFeatId]
  );

  const originToolChoiceEffect = selectedOriginFeat?.effects?.tool_choices;

  const originToolOptions = useMemo(() => {
    return originToolChoiceEffect
      ? getToolPoolOptions(originToolChoiceEffect.pool)
      : [];
  }, [originToolChoiceEffect]);

  useEffect(() => {
    setPendingOriginToolChoices([]);
  }, [pendingOriginFeatId]);

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
                originFeatToolChoices: undefined,
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

      {originToolChoiceEffect && originToolOptions.length > 0 && (
        <HoverChoiceField
          label="Tool Proficiencies"
          options={originToolOptions}
          value={pendingOriginToolChoices}
          onChange={(value) => {
            const nextValues = Array.isArray(value)
              ? value.slice(0, originToolChoiceEffect.count)
              : value
                ? [value]
                : [];

            setPendingOriginToolChoices(nextValues);

            useCharacterStore.setState((state) => ({
              draft: {
                ...state.draft,
                identity: {
                  ...state.draft.identity,
                  originFeatToolChoices: nextValues,
                },
              },
            }));
          }}
          onHoverDetail={(detail) => {
            context.setHoverDetail?.(detail ?? null);
          }}
          multiple={true}
          placeholder="Choose tool proficiencies"
          instructionText={`— Choose ${originToolChoiceEffect.count} tools —`}
          emptyDetail={null}
        />
      )}

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
