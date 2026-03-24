import { useEffect, useMemo, useState } from 'react';


import {
  buildBackgroundContribution,
  computeTotalAbilities,
  createZeroAbilities,
} from '../../builder/abilityContributions';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { getBackgroundOptions, type BackgroundOption } from '../../data/backgrounds';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

function renderBackgroundDetail(option: BackgroundOption) {
  return (
    <div>
      <div
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          marginBottom: '14px',
          letterSpacing: '0.08em',
          lineHeight: 1,
        }}
      >
        {option.label}
      </div>

      <div style={{ marginBottom: '12px', lineHeight: 1.5 }}>
        <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
          Feat granted
        </span>
        <span>{option.feat}</span>
      </div>

      <div style={{ marginBottom: '12px', lineHeight: 1.5 }}>
        <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
          Ability score hierarchy
        </span>
        <span>{option.asiOptions.replace(/\|/g, ', ')}</span>
      </div>

      <div style={{ marginBottom: '12px', lineHeight: 1.5 }}>
        <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
          Skill proficiencies
        </span>
        <span>{option.skillProfs.replace(/\|/g, ', ')}</span>
      </div>

      <div style={{ lineHeight: 1.5 }}>
        <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
          Tool proficiencies
        </span>
        <span>{option.toolProf}</span>
      </div>
    </div>
  );
}

export function BackgroundPicker({ context, onResolve }: TriggerComponentProps) {
  const currentBackgroundId = context.draft.identity.backgroundId;

  const [pendingBackgroundId, setPendingBackgroundId] = useState(
    currentBackgroundId ?? ''
  );

  const [options, setOptions] = useState<BackgroundOption[] | null>(null);

  useEffect(() => {
    let mounted = true;

    getBackgroundOptions().then((opts) => {
      if (mounted) setOptions(opts);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPendingBackgroundId(currentBackgroundId ?? '');
  }, [currentBackgroundId]);

  const safeOptions = options ?? [];

  const optionsById = useMemo(() => {
    return new Map(safeOptions.map((option) => [option.value, option]));
  }, [safeOptions]);

  const hoverOptions = useMemo<HoverChoiceOption[]>(() => {
    return safeOptions.map((option) => ({
      value: option.value,
      label: option.label,
      detail: renderBackgroundDetail(option),
    }));
  }, [safeOptions]);

  useEffect(() => {
    if (options !== null && safeOptions.length === 0) {
      onResolve({ status: 'skip' });
    }
  }, [options, safeOptions, onResolve]);

  if (!options) {
    return null;
  }

  if (safeOptions.length === 0) {
    return null;
  }

  return (
    <div>
      <HoverChoiceField
        label="Background"
        options={hoverOptions}
        value={pendingBackgroundId}
        onChange={(value) => {
          const nextBackgroundId = Array.isArray(value) ? value[0] ?? '' : value;
          setPendingBackgroundId(nextBackgroundId);

          const selectedOption = optionsById.get(nextBackgroundId);

          const nextSkillProficiencies = selectedOption?.skillProfs
            ? selectedOption.skillProfs
                .split('|')
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
            : [];

          const nextBackgroundContribution = selectedOption
            ? buildBackgroundContribution(selectedOption.asiOptions)
            : createZeroAbilities();

          const existingContributions = context.draft.abilityContributions;

          const nextAbilityContributions = {
            background: nextBackgroundContribution,
            class: existingContributions.class,
            other: existingContributions.other,
          };

          onResolve({
            status: 'complete',
            patch: {
              identity: {
                backgroundId: nextBackgroundId || undefined,
              },
              proficiencies: {
                skills: nextSkillProficiencies,
              },
              abilityContributions: nextAbilityContributions,
              abilities: computeTotalAbilities(nextAbilityContributions),
            },
            stayOnNode: true,
          });
        }}
        onHoverDetail={(detail) => {
          context.setHoverDetail?.(detail ?? null);
        }}
        multiple={false}
        placeholder="Choose a background"
        instructionText="— Choose a background —"
        emptyDetail={null}
      />
    </div>
  );
}
