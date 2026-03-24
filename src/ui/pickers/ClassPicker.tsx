import { useEffect, useMemo, useState } from 'react';


import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { getClassOptions, type ClassOption } from '../../data/classes';
import { getSubclassOptionsForClass, type SubclassOption } from '../../data/subclasses';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

import {
  buildClassContribution,
  computeTotalAbilities,
  createZeroAbilities,
} from '../../builder/abilityContributions';

type ClassOptionWithAbilityPriority = ClassOption & {
  ability_priority?: string;
  abilityPriority?: string;
  skill_profs?: string;
  skillProfs?: string;
};

function getOptionDescription(option: { description?: string } | null | undefined): string {
  return option?.description ?? '';
}

function parseSkillProfString(value: string | undefined): string[] {
  return value
    ? value
        .split('|')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];
}

function renderClassDetail(
  title: string,
  kind: 'Class' | 'Subclass',
  description: string
) {
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
        {title}
      </div>

      <div style={{ lineHeight: 1.5 }}>
        <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
          {kind}
        </span>
        <span>{description}</span>
      </div>
    </div>
  );
}

export function ClassPicker({ context, onResolve }: TriggerComponentProps) {
  const currentClassId = context.draft.identity?.classId;
  const currentSubclassId = context.draft.identity?.subclassId;
  const currentLevel = context.draft.identity?.level;

  const [pendingClassId, setPendingClassId] = useState(currentClassId ?? '');
  const [pendingSubclassId, setPendingSubclassId] = useState(
    currentSubclassId ?? ''
  );
  const [pendingLevel, setPendingLevel] = useState(
    currentLevel ? String(currentLevel) : '1'
  );

  const [options, setOptions] = useState<ClassOption[] | null>(null);
  const [subclassOptions, setSubclassOptions] = useState<SubclassOption[] | null>(null);

  useEffect(() => {
    let mounted = true;

    getClassOptions().then((opts) => {
      if (mounted) setOptions(opts);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPendingClassId(currentClassId ?? '');
    setPendingSubclassId(currentSubclassId ?? '');
    setPendingLevel(currentLevel ? String(currentLevel) : '1');
  }, [currentClassId, currentSubclassId, currentLevel]);

  useEffect(() => {
    let mounted = true;

    if (!pendingClassId) {
      setSubclassOptions([]);
      return;
    }

    getSubclassOptionsForClass(pendingClassId).then((opts) => {
      if (mounted) setSubclassOptions(opts);
    });

    return () => {
      mounted = false;
    };
  }, [pendingClassId]);

  const safeOptions = options ?? [];
  const safeSubclassOptions = subclassOptions ?? [];

  useEffect(() => {
    if (options !== null && safeOptions.length === 0) {
      onResolve({ status: 'skip' });
    }
  }, [options, safeOptions, onResolve]);

  const classOptionsById = useMemo(() => {
    return new Map(safeOptions.map((option) => [option.value, option]));
  }, [safeOptions]);

  const hoverClassOptions = useMemo<HoverChoiceOption[]>(() => {
    return safeOptions.map((option) => ({
      value: option.value,
      label: option.label,
      detail: renderClassDetail(
        option.label,
        'Class',
        getOptionDescription(option as ClassOption & { description?: string })
      ),
    }));
  }, [safeOptions]);

  const hoverSubclassOptions = useMemo<HoverChoiceOption[]>(() => {
    return safeSubclassOptions.map((option) => ({
      value: option.value,
      label: option.label,
      detail: renderClassDetail(
        option.label,
        'Subclass',
        getOptionDescription(option as SubclassOption & { description?: string })
      ),
    }));
  }, [safeSubclassOptions]);

  const hoverLevelOptions = useMemo<HoverChoiceOption[]>(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const level = String(i + 1);
      return {
        value: level,
        label: level,
      };
    });
  }, []);

  if (!options) {
    return null;
  }

  if (safeOptions.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <HoverChoiceField
        label="Class"
        options={hoverClassOptions}
        value={pendingClassId}
        onChange={(value) => {
          const nextClassId = Array.isArray(value) ? value[0] ?? '' : value;
          const classChanged = nextClassId !== pendingClassId;
          setPendingClassId(nextClassId);

          if (classChanged) {
            setPendingSubclassId('');
          }

          const selectedOption = classOptionsById.get(nextClassId) as
            | ClassOptionWithAbilityPriority
            | undefined;

          const nextClassSkillProficiencies = parseSkillProfString(
            selectedOption?.skill_profs ?? selectedOption?.skillProfs
          );

          const existingSkillProficiencies = context.draft.proficiencies?.skills ?? [];
          const nextSkillProficiencies = Array.from(
            new Set([...existingSkillProficiencies, ...nextClassSkillProficiencies])
          );

          const nextClassContribution = selectedOption
            ? buildClassContribution(
                selectedOption.ability_priority ??
                  selectedOption.abilityPriority ??
                  ''
              )
            : createZeroAbilities();

          const existingContributions = context.draft.abilityContributions;

          const nextAbilityContributions = {
            background: existingContributions.background,
            class: nextClassContribution,
            other: existingContributions.other,
          };

          onResolve({
            status: 'complete',
            patch: {
              identity: {
                classId: nextClassId || undefined,
                subclassId: classChanged
                  ? undefined
                  : context.draft.identity?.subclassId,
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
        placeholder="Choose a class"
        instructionText="— Choose a class —"
        emptyDetail={null}
      />

      {pendingClassId && safeSubclassOptions.length > 0 && (
        <HoverChoiceField
          label="Subclass"
          options={hoverSubclassOptions}
          value={pendingSubclassId}
          onChange={(value) => {
            const nextSubclassId = Array.isArray(value) ? value[0] ?? '' : value;
            setPendingSubclassId(nextSubclassId);

            onResolve({
              status: 'complete',
              patch: {
                identity: {
                  subclassId: nextSubclassId || undefined,
                },
              },
              stayOnNode: true,
            });
          }}
          onHoverDetail={(detail) => {
            context.setHoverDetail?.(detail ?? null);
          }}
          multiple={false}
          placeholder="Choose a subclass"
          instructionText="— Choose a subclass —"
          emptyDetail={
            renderClassDetail(
              classOptionsById.get(pendingClassId)?.label ?? '',
              'Class',
              getOptionDescription(
                classOptionsById.get(pendingClassId) as
                  | (ClassOption & { description?: string })
                  | undefined
              )
            )
          }
        />
      )}

      <HoverChoiceField
        label="Level"
        options={hoverLevelOptions}
        value={pendingLevel}
        onChange={(value) => {
          const nextLevel = Array.isArray(value) ? value[0] ?? '1' : value;
          setPendingLevel(nextLevel);

          onResolve({
            status: 'complete',
            patch: {
              identity: {
                level: Number(nextLevel) || 1,
              },
            },
            stayOnNode: true,
          });
        }}
        onHoverDetail={(detail) => {
          context.setHoverDetail?.(detail ?? null);
        }}
        multiple={false}
        placeholder="Choose a level"
        instructionText="— Choose a level —"
        emptyDetail={null}
      />
    </div>
  );
}