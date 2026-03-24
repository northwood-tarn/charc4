import { useEffect, useMemo, useState } from 'react';

import { getSkillOptions } from '../../data/skills';
import { getSpellOptions } from '../../data/spells';
import {
  buildFeatAbilityContribution,
  computeTotalAbilities,
} from '../../builder/abilityContributions';
import { getToolOptions } from '../../data/tools';
import { getWeaponOptions } from '../../data/weapons';
import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { buildFeatSlots, resolveFeatPicker } from '../../resolvers/featResolver';
import {
  appendSummaryToLabel,
  buildFollowupSummaryByParent,
  getFieldSelectionSummary,
  groupFollowupFieldsByParent,
  renderCompactedSelectionDetail,
} from './pickerCompaction';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';
import featsData from '../../../public/data/feats.json';

type FeatRecord = {
  feat_id: string;
  name: string;
  type: string;
  notes?: string;
};

function renderFeatDetail(feat: FeatRecord) {
  return (
    <div>
      <div
        style={{
          fontSize: '1.2rem',
          fontWeight: 400,
          marginBottom: '14px',
          letterSpacing: '0.08em',
          lineHeight: 1,
          color: '#6e92aa',
        }}
      >
        {feat.name}
      </div>

      {feat.notes && <div style={{ lineHeight: 1.5 }}>{feat.notes}</div>}
    </div>
  );
}

function featSlotsEqual(
  left: Array<{ id: string; selectedFeatId?: string }> | undefined,
  right: Array<{ id: string; selectedFeatId?: string }> | undefined
): boolean {
  const safeLeft = left ?? [];
  const safeRight = right ?? [];

  if (safeLeft.length !== safeRight.length) {
    return false;
  }

  return safeLeft.every((slot, index) => {
    const other = safeRight[index];
    return slot.id === other?.id && slot.selectedFeatId === other?.selectedFeatId;
  });
}

export function FeatPicker({ context, onResolve }: TriggerComponentProps) {
  const [supportDataLoaded, setSupportDataLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getToolOptions(),
      getSkillOptions(),
      getSpellOptions(),
      getWeaponOptions(),
    ])
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setSupportDataLoaded(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const resolved = resolveFeatPicker(context.draft);
  const generatedSlots = useMemo(
    () => buildFeatSlots(context.draft),
    [context.draft, supportDataLoaded]
  );

  useEffect(() => {
    if (featSlotsEqual(context.draft.featSlots, generatedSlots)) {
      return;
    }

    const nextOtherContribution = buildFeatAbilityContribution({
      featFollowupSelections: context.draft.featFollowupSelections ?? {},
    });

    const nextAbilityContributions = {
      ...context.draft.abilityContributions,
      other: nextOtherContribution,
    };

    onResolve({
      status: 'complete',
      patch: {
        featSlots: generatedSlots,
        abilityContributions: {
          other: nextOtherContribution,
        },
        abilities: computeTotalAbilities(nextAbilityContributions),
      },
      stayOnNode: true,
    });
  }, [context.draft.featSlots, generatedSlots, onResolve]);

  const featRecordById = useMemo(() => {
    return new Map((featsData as FeatRecord[]).map((feat) => [feat.feat_id, feat]));
  }, []);

  const slotMap = useMemo(() => {
    return new Map(generatedSlots.map((slot) => [slot.id, slot]));
  }, [generatedSlots]);

  const followupFieldsBySlot = useMemo(() => {
    if (resolved.status !== 'ready') {
      return new Map<string, typeof resolved.fields>();
    }

    return groupFollowupFieldsByParent(resolved.fields);
  }, [resolved]);


  const fieldOptionsByName = useMemo(() => {
    const map = new Map<string, HoverChoiceOption[]>();

    if (resolved.status !== 'ready') {
      return map;
    }

    resolved.fields.forEach((field) => {
      const slot = slotMap.get(field.name);

      const options = (field.enum ?? []).map((value, index) => {
        const feat = slot ? featRecordById.get(value) : undefined;

        return {
          value,
          label: field.enumNames?.[index] ?? value,
          detail: feat ? renderFeatDetail(feat) : null,
        } satisfies HoverChoiceOption;
      });

      map.set(field.name, options);
    });

    return map;
  }, [resolved, slotMap, featRecordById]);

  const followupSummaryBySlot = useMemo(() => {
    if (resolved.status !== 'ready') {
      return new Map<string, string>();
    }

    return buildFollowupSummaryByParent({
      fieldsByParent: followupFieldsBySlot,
      getValue: (fieldName) =>
        (context.draft.featFollowupSelections ?? {})[fieldName] as
          | string
          | string[]
          | undefined,
      getOptions: (fieldName) => fieldOptionsByName.get(fieldName) ?? [],
    });
  }, [resolved, followupFieldsBySlot, fieldOptionsByName, context.draft.featFollowupSelections]);

  if (resolved.status === 'skip') {
    onResolve({ status: 'skip' });
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {resolved.fields.map((field) => {
        const slot = slotMap.get(field.name);
        const baseOptions = fieldOptionsByName.get(field.name) ?? [];
        const multiple = field.type === 'array';

        const fieldValue = slot
          ? slot.selectedFeatId ?? ''
          : (context.draft.featFollowupSelections ?? {})[field.name] ?? (multiple ? [] : '');

        const fieldSummary = getFieldSelectionSummary(
          {
            name: field.name,
            type: field.type,
            maxSelections: (field as { maxSelections?: number }).maxSelections,
          },
          fieldValue as string | string[] | undefined,
          baseOptions
        );

        if (!slot && fieldSummary) {
          return null;
        }

        const options = slot
          ? baseOptions.map((option) => {
              const selectionSummary =
                option.value === slot.selectedFeatId
                  ? followupSummaryBySlot.get(slot.id)
                  : undefined;

              return selectionSummary
                ? {
                    ...option,
                    label: appendSummaryToLabel(option.label, selectionSummary),
                    detail: renderCompactedSelectionDetail({
                      baseDetail: option.detail ?? null,
                      summary: selectionSummary,
                    }),
                  }
                : option;
            })
          : baseOptions;

        if (!options.length) {
          return null;
        }

        return (
          <HoverChoiceField
            key={field.name}
            label={field.title}
            options={options}
            value={fieldValue}
            onChange={(nextValue) => {
              if (slot) {
                const selectedFeatId = Array.isArray(nextValue)
                  ? nextValue[0] ?? ''
                  : nextValue;

                const nextFeatSlots = generatedSlots.map((existingSlot) =>
                  existingSlot.id === slot.id
                    ? {
                        ...existingSlot,
                        selectedFeatId: selectedFeatId || undefined,
                      }
                    : existingSlot
                );

                const nextFollowupSelections = Object.fromEntries(
                  Object.keys(context.draft.featFollowupSelections ?? {})
                    .filter((key) => key.startsWith(`${slot.id}__`))
                    .map((key) => [key, undefined])
                );

                const mergedFollowupSelections = {
                  ...(context.draft.featFollowupSelections ?? {}),
                  ...nextFollowupSelections,
                };

                const nextOtherContribution = buildFeatAbilityContribution({
                  featFollowupSelections: mergedFollowupSelections,
                });

                const nextAbilityContributions = {
                  ...context.draft.abilityContributions,
                  other: nextOtherContribution,
                };

                onResolve({
                  status: 'complete',
                  patch: {
                    featSlots: nextFeatSlots,
                    featFollowupSelections: nextFollowupSelections,
                    abilityContributions: {
                      other: nextOtherContribution,
                    },
                    abilities: computeTotalAbilities(nextAbilityContributions),
                  },
                  stayOnNode: true,
                });

                return;
              }

              const mergedFollowupSelections = {
                ...(context.draft.featFollowupSelections ?? {}),
                [field.name]: nextValue,
              };

              const nextOtherContribution = buildFeatAbilityContribution({
                featFollowupSelections: mergedFollowupSelections,
              });

              const nextAbilityContributions = {
                ...context.draft.abilityContributions,
                other: nextOtherContribution,
              };

              onResolve({
                status: 'complete',
                patch: {
                  featFollowupSelections: {
                    [field.name]: nextValue,
                  },
                  abilityContributions: {
                    other: nextOtherContribution,
                  },
                  abilities: computeTotalAbilities(nextAbilityContributions),
                },
                stayOnNode: true,
              });
            }}
            onHoverDetail={(detail) => {
              context.setHoverDetail?.(detail ?? null);
            }}
            multiple={multiple}
            maxSelections={(field as { maxSelections?: number }).maxSelections}
            placeholder={`Choose ${field.title.toLowerCase()}`}
            instructionText={`— Choose ${field.title.toLowerCase()} —`}
            emptyDetail={null}
          />
        );
      })}
    </div>
  );
}