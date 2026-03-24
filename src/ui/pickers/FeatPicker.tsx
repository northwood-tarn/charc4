import { useEffect, useMemo, useState } from 'react';

import { getSkillOptions } from '../../data/skills';
import { getSpellOptions } from '../../data/spells';
import {
  buildFeatAbilityContribution,
  computeTotalAbilities,
} from '../../builder/abilityContributions';
import { getCachedWeaponOptions, getWeaponOptions } from '../../data/weapons';
import { getToolOptions } from '../../data/tools';
import { getCachedFeatRecords, type FeatRecord } from '../../data/feats';
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

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  }

  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }

  return [];
}

function addValuesToSet(target: Set<string>, value: unknown) {
  asStringArray(value).forEach((entry) => target.add(entry));
}

function isFieldComplete(
  field: { type: string; maxSelections?: number },
  value: string | string[] | undefined
): boolean {
  if (field.type === 'array') {
    if (!Array.isArray(value)) {
      return false;
    }

    if (field.maxSelections) {
      return value.length >= field.maxSelections;
    }

    return value.length > 0;
  }

  return typeof value === 'string' && value.trim().length > 0;
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
    return new Map(getCachedFeatRecords().map((feat) => [feat.feat_id, feat]));
  }, []);

  const slotMap = useMemo(() => {
    return new Map(generatedSlots.map((slot) => [slot.id, slot]));
  }, [generatedSlots]);

  const takenFeatIdsByOtherSlot = useMemo(() => {
    const map = new Map<string, Set<string>>();

    generatedSlots.forEach((slot) => {
      const takenByOthers = new Set(
        generatedSlots
          .filter((candidate) => candidate.id !== slot.id)
          .map((candidate) => candidate.selectedFeatId)
          .filter((featId): featId is string => typeof featId === 'string' && featId.length > 0)
      );

      map.set(slot.id, takenByOthers);
    });

    return map;
  }, [generatedSlots]);

  const weaponOptionById = useMemo(() => {
    return new Map(getCachedWeaponOptions().map((weapon) => [weapon.value, weapon]));
  }, []);

  const aggregatedSkillState = useMemo(() => {
    const proficiency = new Set<string>();
    const expertise = new Set<string>();

    addValuesToSet(proficiency, (context.draft as Record<string, unknown>).skillProficiencies);
    addValuesToSet(expertise, (context.draft as Record<string, unknown>).skillExpertise);

    const proficiencies = (context.draft as Record<string, unknown>).proficiencies;
    if (proficiencies && typeof proficiencies === 'object') {
      addValuesToSet(
        proficiency,
        (proficiencies as Record<string, unknown>).skills
      );
    }

    const expertiseState = (context.draft as Record<string, unknown>).expertise;
    if (expertiseState && typeof expertiseState === 'object') {
      addValuesToSet(
        expertise,
        (expertiseState as Record<string, unknown>).skills
      );
    }

    Object.entries(context.draft.featFollowupSelections ?? {}).forEach(([fieldName, value]) => {
      const entries = asStringArray(value);

      if (fieldName.endsWith('__skill_training_choices')) {
        entries.forEach((entry) => {
          if (proficiency.has(entry) || expertise.has(entry)) {
            expertise.add(entry);
          } else {
            proficiency.add(entry);
          }
        });
        return;
      }

      if (fieldName.endsWith('__proficiency_choices')) {
        entries.forEach((entry) => proficiency.add(entry));
        return;
      }

      if (fieldName.endsWith('__expertise_choices')) {
        entries.forEach((entry) => {
          if (proficiency.has(entry) || expertise.has(entry)) {
            expertise.add(entry);
          }
        });
      }
    });

    return { proficiency, expertise };
  }, [context.draft]);

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
        const isFeatTakenInAnotherSlot = slot
          ? takenFeatIdsByOtherSlot.get(slot.id)?.has(value) ?? false
          : false;
        const weapon = !slot && field.name.endsWith('__weapon_mastery_choices')
          ? weaponOptionById.get(value)
          : undefined;
        const isSkillField =
          !slot &&
          (field.name.endsWith('__skill_training_choices') ||
            field.name.endsWith('__proficiency_choices') ||
            field.name.endsWith('__expertise_choices'));
        const isProficiencyChoiceField = !slot && field.name.endsWith('__proficiency_choices');
        const isExpertiseField = !slot && field.name.endsWith('__expertise_choices');
        const hasSkillProficiency = aggregatedSkillState.proficiency.has(value);
        const hasSkillExpertise = aggregatedSkillState.expertise.has(value);

        return {
          value,
          label: field.enumNames?.[index] ?? value,
          detail: feat
            ? renderFeatDetail(feat)
            : weapon
              ? (
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
                      {weapon.label} ({weapon.masteryTrait})
                    </div>
                    <div style={{ lineHeight: 1.5 }}>{weapon.masteryDetails}</div>
                  </div>
                )
              : null,
          preselected: slot ? isFeatTakenInAnotherSlot : isSkillField ? (hasSkillProficiency || hasSkillExpertise) : false,
          disabled: slot
            ? isFeatTakenInAnotherSlot
            : isExpertiseField
              ? !hasSkillProficiency && !hasSkillExpertise
              : isProficiencyChoiceField
                ? hasSkillProficiency || hasSkillExpertise
                : false,
        } satisfies HoverChoiceOption;
      });

      map.set(field.name, options);
    });

    return map;
  }, [resolved, slotMap, featRecordById, weaponOptionById, aggregatedSkillState, takenFeatIdsByOtherSlot]);

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
  }, [resolved, followupFieldsBySlot, context.draft.featFollowupSelections]);

  const selectedWeaponBySlot = useMemo(() => {
    const map = new Map<string, ReturnType<typeof weaponOptionById.get>>();

    followupFieldsBySlot.forEach((fields, slotId) => {
      const weaponField = fields.find((candidate) =>
        candidate.name.endsWith('__weapon_mastery_choices')
      );

      if (!weaponField) {
        return;
      }

      const selectedWeaponId = (context.draft.featFollowupSelections ?? {})[
        weaponField.name
      ];

      if (typeof selectedWeaponId !== 'string') {
        return;
      }

      const weapon = weaponOptionById.get(selectedWeaponId);
      if (weapon) {
        map.set(slotId, weapon);
      }
    });

    return map;
  }, [followupFieldsBySlot, context.draft.featFollowupSelections, weaponOptionById]);

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

        const fieldComplete = isFieldComplete(
          {
            type: field.type,
            maxSelections: (field as { maxSelections?: number }).maxSelections,
          },
          fieldValue as string | string[] | undefined
        );

        if (!slot && fieldComplete && fieldSummary) {
          return null;
        }

        const options = slot
          ? baseOptions.map((option) => {
              const selectionSummary =
                option.value === slot.selectedFeatId
                  ? followupSummaryBySlot.get(slot.id)
                  : undefined;

              const selectedWeapon =
                option.value === slot.selectedFeatId
                  ? selectedWeaponBySlot.get(slot.id)
                  : undefined;

              return selectionSummary
                ? {
                    ...option,
                    label: appendSummaryToLabel(option.label, selectionSummary),
                    detail: selectedWeapon
                      ? (
                          <>
                            {option.detail ?? null}
                            <div style={{ lineHeight: 1.5, marginTop: '14px' }}>
                              <span
                                className="h2"
                                style={{ marginRight: '8px', color: '#6e92aa' }}
                              >
                                {selectedWeapon.masteryTrait}
                              </span>
                              <span>{selectedWeapon.masteryDetails}</span>
                            </div>
                          </>
                        )
                      : renderCompactedSelectionDetail({
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
            showDualClosedTicks={field.name.endsWith('__expertise_choices')}
            placeholder={`Choose ${field.title.toLowerCase()}`}
            instructionText={`— Choose ${field.title.toLowerCase()} —`}
            emptyDetail={null}
          />
        );
      })}
    </div>
  );
}