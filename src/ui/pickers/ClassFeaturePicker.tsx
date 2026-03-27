import { useEffect, useMemo, useState } from 'react';

import type { FeatureSelectionValue } from '../../engine/types';
import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolvePool } from '../../data/classFeaturePools';
import { getCachedWeaponOptions } from '../../data/weapons';
import { resolveClassFeaturePicker } from '../../resolvers/classFeatureResolver';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

type ChoiceField = {
  name: string;
  title: string;
  enum?: string[];
  enumNames?: string[];
  choice?: {
    count?: number;
    options?: Array<{
      value: string;
      label: string;
      detail?: string;
    }>;
    pool?: string;
  };
};

type PoolOption = {
  value: string;
  label: string;
  detail?: string;
  masteryTrait?: string;
  masteryDetails?: string;
};

function normalizePoolOption(option: PoolOption): HoverChoiceOption {
  const label = option.masteryTrait
    ? `${option.label} (${option.masteryTrait})`
    : option.label;

  const detail = option.masteryTrait || option.masteryDetails
    ? renderWeaponMasteryDetail(
        option.label,
        option.masteryTrait,
        option.masteryDetails ?? option.detail
      )
    : option.detail ?? null;

  return {
    value: option.value,
    label,
    detail,
  };
}

function isWeaponMasteryField(fieldName: string): boolean {
  return fieldName.endsWith('__weapon_mastery_choices');
}

function renderWeaponMasteryDetail(label: string, masteryTrait?: string, masteryDetails?: string) {
  if (!masteryTrait && !masteryDetails) {
    return null;
  }

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
        {masteryTrait ? `${label} (${masteryTrait})` : label}
      </div>

      {masteryDetails && <div style={{ lineHeight: 1.5 }}>{masteryDetails}</div>}
    </div>
  );
}

export function ClassFeaturePicker({ context, onResolve }: TriggerComponentProps) {
  const resolved = resolveClassFeaturePicker(context.draft);

  const classId = context.draft.identity?.classId ?? '';
  const subclassId = context.draft.identity?.subclassId ?? '';
  const level = String(context.draft.identity?.level ?? '');
  const skillKey = (context.draft.proficiencies?.skills ?? []).join('|');
  const weaponKey = (context.draft.proficiencies?.weapons ?? []).join('|');
  const armorKey = (context.draft.proficiencies?.armor ?? []).join('|');
  const toolKey = (context.draft.proficiencies?.tools ?? []).join('|');

  const weaponOptionById = useMemo(() => {
    return new Map(getCachedWeaponOptions().map((weapon) => [weapon.value, weapon]));
  }, []);

  const fieldSignature = useMemo(() => {
    if (resolved.status !== 'ready') {
      return resolved.status;
    }

    return resolved.fields
      .map((rawField) => {
        const field = rawField as ChoiceField;
        const optionSignature = (field.choice?.options ?? [])
          .map((option) => `${option.value}:${option.label}:${option.detail ?? ''}`)
          .join('|');

        return [
          field.name,
          field.title,
          field.type,
          field.choice?.count ?? '',
          field.choice?.pool ?? '',
          (field.enum ?? []).join('|'),
          (field.enumNames ?? []).join('|'),
          optionSignature,
        ].join('::');
      })
      .join('||');
  }, [resolved]);

  const buildOptionsForField = (field: ChoiceField): HoverChoiceOption[] => {
    if (field.choice?.options?.length) {
      return field.choice.options.map((option) =>
        normalizePoolOption(option as PoolOption)
      );
    }

    if (field.enum?.length) {
      return field.enum.map((value, index) => {
        const weapon = isWeaponMasteryField(field.name)
          ? weaponOptionById.get(value)
          : undefined;

        return {
          value,
          label: weapon
            ? `${weapon.label} (${weapon.masteryTrait})`
            : field.enumNames?.[index] ?? value,
          detail: weapon
            ? renderWeaponMasteryDetail(
                weapon.label,
                weapon.masteryTrait,
                weapon.masteryDetails
              )
            : null,
        } satisfies HoverChoiceOption;
      });
    }

    return [];
  };

  const [poolOptionsByField, setPoolOptionsByField] = useState<Record<string, HoverChoiceOption[]>>({});
  const [poolResolvedByField, setPoolResolvedByField] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadPoolOptions() {
      if (resolved.status !== 'ready') {
        setPoolOptionsByField({});
        setPoolResolvedByField({});
        return;
      }

      const nextOptionsByField: Record<string, HoverChoiceOption[]> = {};
      const nextResolvedByField: Record<string, boolean> = {};

      for (const rawField of resolved.fields) {
        const field = rawField as ChoiceField;

        if (field.choice?.pool) {
          const resolvedOptions = await resolvePool(field.choice.pool, {
            draft: {
              identity: {
                classId: context.draft.identity?.classId,
                subclassId: context.draft.identity?.subclassId,
                level: context.draft.identity?.level,
              },
              proficiencies: {
                skills: context.draft.proficiencies?.skills,
                weapons: context.draft.proficiencies?.weapons,
                armor: context.draft.proficiencies?.armor,
                tools: context.draft.proficiencies?.tools,
              },
            } as typeof context.draft,
          });

          if (cancelled) {
            return;
          }

          nextOptionsByField[field.name] = (resolvedOptions as PoolOption[]).map(normalizePoolOption);
          nextResolvedByField[field.name] = true;
          continue;
        }

        nextOptionsByField[field.name] = buildOptionsForField(field);
        nextResolvedByField[field.name] = true;
      }

      if (cancelled) {
        return;
      }

      setPoolOptionsByField(nextOptionsByField);
      setPoolResolvedByField(nextResolvedByField);
    }

    void loadPoolOptions();

    return () => {
      cancelled = true;
    };
  }, [resolved.status, fieldSignature, classId, subclassId, level, skillKey, weaponKey, armorKey, toolKey, weaponOptionById]);

  if (resolved.status === 'skip') {
    onResolve({ status: 'skip' });
    return null;
  }

  if (resolved.status !== 'ready') {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {resolved.fields.map((rawField) => {
        const field = rawField as ChoiceField;
        const options = poolOptionsByField[field.name] ?? buildOptionsForField(field);
        const poolResolved = poolResolvedByField[field.name] ?? !field.choice?.pool;

        if (!poolResolved || options.length === 0) {
          return null;
        }

        const selectionCount = field.choice?.count ?? 1;
        const isMultiple = selectionCount > 1;
        const currentValue = context.draft.classFeatureSelections?.[field.name];

        return (
          <HoverChoiceField
            key={field.name}
            label={field.title === 'Weapon Mastery Improvement' ? 'Additional Weapon Mastery' : field.title}
            options={options}
            value={currentValue ?? (isMultiple ? [] : '')}
            onChange={(value) => {
              const selection: FeatureSelectionValue = isMultiple
                ? Array.isArray(value)
                  ? value
                  : value
                    ? [value]
                    : []
                : Array.isArray(value)
                  ? value[0] ?? ''
                  : value;

              onResolve({
                status: 'complete',
                patch: {
                  classFeatureSelections: {
                    [field.name]: selection,
                  },
                },
                stayOnNode: true,
              });
            }}
            onHoverDetail={(detail) => {
              context.setHoverDetail?.(detail ?? null);
            }}
            multiple={isMultiple}
            maxSelections={isMultiple ? selectionCount : undefined}
            placeholder={`Choose ${field.title}`}
            instructionText={
              isMultiple ? `Choose ${selectionCount} options` : 'Choose one option'
            }
            emptyDetail={null}
          />
        );
      })}
    </div>
  );
}
