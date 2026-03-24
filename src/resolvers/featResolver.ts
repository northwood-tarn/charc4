import featsData from '../../public/data/feats.json';

import { getCachedSkillOptions } from '../data/skills';
import { getCachedToolOptions } from '../data/tools';
import { getCachedSpellOptions } from '../data/spells';
import { getCachedWeaponOptions } from '../data/weapons';

import type { CharacterDraft, FeatSlot } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

type ToolChoiceEffect = {
  count: number;
  pool: string;
};

type ProficiencyChoiceEffect = {
  count: number;
  pools: string[];
};

type ResistanceChoiceEffect = {
  choice: number;
  options: string[];
};

type SpellGrantEffect = {
  kind: 'fixed' | 'choice';
  count?: number | string;
  level?: number | number[];
  schools?: string[];
  classes?: string[];
  ritual_only?: boolean;
  spells?: string[];
};

type AbilityScoreChoiceEffect = {
  points: number;
  count: number;
  options: string[];
  per_choice_max: number;
  allow_same_choice_twice: boolean;
  score_cap: number;
};

type SkillTrainingChoiceEffect = {
  count: number;
  options: string[];
  upgrade_if_proficient: boolean;
};


type ExpertiseChoiceEffect = {
  count: number;
  pools: string[];
  require_proficiency: boolean;
};

type WeaponMasteryChoiceEffect = {
  count: number;
  pool: string;
  reassignable_after_long_rest: boolean;
};

type FeatRecord = {
  feat_id: string;
  name: string;
  type: string;
  notes?: string;
  effects?: {
    tool_choices?: ToolChoiceEffect;
    proficiency_choices?: ProficiencyChoiceEffect;
    resistances?: ResistanceChoiceEffect;
    spell_grants?: SpellGrantEffect[];
    ability_score_choices?: AbilityScoreChoiceEffect;
    skill_training_choices?: SkillTrainingChoiceEffect;
    expertise_choices?: ExpertiseChoiceEffect;
    weapon_mastery_choices?: WeaponMasteryChoiceEffect;
  };
};
export type ResolvedFeatSpellGrant = {
  slotId: string;
  featId: string;
  grantIndex: number;
  spellIds: string[];
  fixed: boolean;
};
function getFeatById(id?: string): FeatRecord | undefined {
  if (!id) {
    return undefined;
  }

  return (featsData as FeatRecord[]).find((feat) => feat.feat_id === id);
}
function asStringArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value];
  }

  return [];
}
function buildToolChoiceField(slot: FeatSlot, effect: ToolChoiceEffect): ResolvedField {
  const toolOptions = getCachedToolOptions();

  let filteredOptions = toolOptions;

  if (effect.pool === 'artisan_tools') {
    filteredOptions = toolOptions.filter((tool) => tool.toolType === 'artisans_tools');
  } else if (effect.pool === 'musical_instruments') {
    filteredOptions = toolOptions.filter((tool) => tool.toolType === 'instrument');
  }

  return {
    name: `${slot.id}__tool_choices`,
    title: 'Tool Proficiencies',
    type: effect.count > 1 ? 'array' : 'string',
    enum: filteredOptions.map((tool) => tool.value),
    enumNames: filteredOptions.map((tool) => tool.label),
    required: true,
    widget: 'hoverChoice',
  };
}

function buildProficiencyChoiceField(
  slot: FeatSlot,
  effect: ProficiencyChoiceEffect
): ResolvedField {
  const options: Array<{ value: string; label: string }> = [];

  if (effect.pools.includes('skills')) {
    options.push(
      ...getCachedSkillOptions().map((skill) => ({
        value: skill.value,
        label: skill.label,
      }))
    );
  }

  if (effect.pools.includes('tools')) {
    options.push(
      ...getCachedToolOptions().map((tool) => ({
        value: tool.value,
        label: tool.label,
      }))
    );
  }

  return {
    name: `${slot.id}__proficiency_choices`,
    title: 'Proficiencies',
    type: effect.count > 1 ? 'array' : 'string',
    enum: options.map((option) => option.value),
    enumNames: options.map((option) => option.label),
    required: true,
    widget: 'hoverChoice',
  };
}

function buildResistanceChoiceField(
  slot: FeatSlot,
  effect: ResistanceChoiceEffect
): ResolvedField {
  return {
    name: `${slot.id}__resistance_choice`,
    title: 'Resistance',
    type: effect.choice > 1 ? 'array' : 'string',
    enum: effect.options,
    enumNames: effect.options.map((option) =>
      option
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ),
    required: true,
    widget: 'hoverChoice',
  };
}

function normalizeLevels(level: number | number[] | undefined): number[] {
  if (Array.isArray(level)) {
    return level;
  }

  if (typeof level === 'number') {
    return [level];
  }

  return [];
}

function buildSpellGrantChoiceField(
  slot: FeatSlot,
  grant: SpellGrantEffect,
  index: number
): ResolvedField | null {
  if (grant.kind !== 'choice') {
    return null;
  }

  const allowedLevels = normalizeLevels(grant.level);

  const spellOptions = getCachedSpellOptions()
    .filter((spell) => {
      if (allowedLevels.length && !allowedLevels.includes(spell.level)) {
        return false;
      }

      if (grant.schools?.length) {
        const normalizedSchool = spell.school.trim().toLowerCase();
        if (!grant.schools.map((school) => school.toLowerCase()).includes(normalizedSchool)) {
          return false;
        }
      }

      if (grant.classes?.length) {
        const normalizedSpellClasses = spell.classes.map((spellClass) => spellClass.toLowerCase());
        const allowedClasses = grant.classes.map((spellClass) => spellClass.toLowerCase());
        if (!allowedClasses.some((allowedClass) => normalizedSpellClasses.includes(allowedClass))) {
          return false;
        }
      }

      if (grant.ritual_only && !spell.ritual) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    name: `${slot.id}__spell_grant_${index}`,
    title: 'Spells',
    type: grant.count === 1 ? 'string' : 'array',
    enum: spellOptions.map((spell) => spell.value),
    enumNames: spellOptions.map((spell) => spell.label),
    required: true,
    widget: 'hoverChoice',
  };
}

function buildAbilityScoreChoiceFields(
  slot: FeatSlot,
  effect: AbilityScoreChoiceEffect
): ResolvedField[] {
  const enumNames = effect.options.map((ability) => ability.toUpperCase());

  if (effect.count <= 1) {
    return [
      {
        name: `${slot.id}__ability_score_choices`,
        title: 'Ability Score',
        type: 'string',
        enum: effect.options,
        enumNames,
        required: true,
        widget: 'hoverChoice',
      },
    ];
  }

  if (effect.allow_same_choice_twice) {
    return Array.from({ length: effect.count }, (_, index) => ({
      name: `${slot.id}__ability_score_choice_${index}`,
      title: `Ability Score ${index + 1}`,
      type: 'string',
      enum: effect.options,
      enumNames,
      required: true,
      widget: 'hoverChoice',
    }));
  }

  return [
    {
      name: `${slot.id}__ability_score_choices`,
      title: 'Ability Scores',
      type: 'array',
      enum: effect.options,
      enumNames,
      required: true,
      widget: 'hoverChoice',
    },
  ];
}

function buildSkillTrainingChoiceField(
  slot: FeatSlot,
  effect: SkillTrainingChoiceEffect
): ResolvedField {
  const skillOptions = getCachedSkillOptions()
    .filter((skill) => effect.options.includes(skill.value))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    name: `${slot.id}__skill_training_choices`,
    title: 'Skill',
    type: effect.count > 1 ? 'array' : 'string',
    enum: skillOptions.map((skill) => skill.value),
    enumNames: skillOptions.map((skill) => skill.label),
    required: true,
    widget: 'hoverChoice',
  };
}


function buildExpertiseChoiceField(
  slot: FeatSlot,
  effect: ExpertiseChoiceEffect
): ResolvedField {
  const options: Array<{ value: string; label: string }> = [];

  if (effect.pools.includes('skills')) {
    options.push(
      ...getCachedSkillOptions().map((skill) => ({
        value: skill.value,
        label: skill.label,
      }))
    );
  }

  if (effect.pools.includes('tools')) {
    options.push(
      ...getCachedToolOptions().map((tool) => ({
        value: tool.value,
        label: tool.label,
      }))
    );
  }

  return {
    name: `${slot.id}__expertise_choices`,
    title: 'Expertise',
    type: effect.count > 1 ? 'array' : 'string',
    enum: options.map((option) => option.value),
    enumNames: options.map((option) => option.label),
    required: true,
    widget: 'hoverChoice',
  };
}

function buildWeaponMasteryChoiceField(
  slot: FeatSlot,
  effect: WeaponMasteryChoiceEffect
): ResolvedField {
  const weaponOptions = effect.pool === 'weapons'
    ? getCachedWeaponOptions().sort((a, b) => a.label.localeCompare(b.label))
    : [];

  return {
    name: `${slot.id}__weapon_mastery_choices`,
    title: 'Weapon Mastery',
    type: effect.count > 1 ? 'array' : 'string',
    enum: weaponOptions.map((weapon) => weapon.value),
    enumNames: weaponOptions.map((weapon) => weapon.label),
    required: true,
    widget: 'hoverChoice',
  };
}

function buildFollowupFields(featSlots: FeatSlot[]): ResolvedField[] {
  const fields: ResolvedField[] = [];

  featSlots.forEach((slot) => {
    const feat = getFeatById(slot.selectedFeatId);
    if (!feat?.effects) {
      return;
    }

    if (feat.effects.tool_choices) {
      fields.push(buildToolChoiceField(slot, feat.effects.tool_choices));
    }

    if (feat.effects.proficiency_choices) {
      fields.push(buildProficiencyChoiceField(slot, feat.effects.proficiency_choices));
    }

    if (feat.effects.resistances) {
      fields.push(buildResistanceChoiceField(slot, feat.effects.resistances));
    }

    if (feat.effects.spell_grants?.length) {
      feat.effects.spell_grants.forEach((grant, index) => {
        const field = buildSpellGrantChoiceField(slot, grant, index);
        if (field) {
          fields.push(field);
        }
      });
    }

    if (feat.effects.ability_score_choices) {
      fields.push(
        ...buildAbilityScoreChoiceFields(slot, feat.effects.ability_score_choices)
      );
    }

    if (feat.effects.skill_training_choices) {
      fields.push(
        buildSkillTrainingChoiceField(slot, feat.effects.skill_training_choices)
      );
    }

    if (feat.effects.expertise_choices) {
      fields.push(
        buildExpertiseChoiceField(slot, feat.effects.expertise_choices)
      );
    }

    if (feat.effects.weapon_mastery_choices) {
      fields.push(
        buildWeaponMasteryChoiceField(slot, feat.effects.weapon_mastery_choices)
      );
    }
  });

  return fields;
}
export function resolveFeatSpellGrants(draft: CharacterDraft): ResolvedFeatSpellGrant[] {
  const featSlots = buildFeatSlots(draft);
  const grants: ResolvedFeatSpellGrant[] = [];

  featSlots.forEach((slot) => {
    const feat = getFeatById(slot.selectedFeatId);
    if (!feat?.feat_id || !feat.effects?.spell_grants?.length) {
      return;
    }

    feat.effects.spell_grants.forEach((grant, index) => {
      if (grant.kind === 'fixed') {
        const spellIds = grant.spells?.filter(Boolean) ?? [];

        if (!spellIds.length) {
          return;
        }

        grants.push({
          slotId: slot.id,
          featId: feat.feat_id,
          grantIndex: index,
          spellIds,
          fixed: true,
        });

        return;
      }

      const fieldName = `${slot.id}__spell_grant_${index}`;
      const spellIds = asStringArray((draft.featFollowupSelections ?? {})[fieldName]);

      if (!spellIds.length) {
        return;
      }

      grants.push({
        slotId: slot.id,
        featId: feat.feat_id,
        grantIndex: index,
        spellIds,
        fixed: false,
      });
    });
  });

  return grants;
}

const LEVEL_FEAT_LEVELS = [4, 8, 12, 16, 19] as const;

function getFeatPoolOptions(slot: FeatSlot): FeatRecord[] {
  const allFeats = featsData as FeatRecord[];

  if (slot.kind === 'origin') {
    return allFeats
      .filter((feat) => feat.type === 'Origin')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  if (slot.levelGranted === 19) {
    return allFeats
      .filter((feat) => feat.type === 'Epic Boon')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return allFeats
    .filter((feat) => feat.type === 'Origin' || feat.type === 'General')
    .sort((a, b) => a.name.localeCompare(b.name));
}

function mergeSelectedFeatId(slot: Omit<FeatSlot, 'selectedFeatId'>, draft: CharacterDraft): FeatSlot {
  const existingSlot = (draft.featSlots ?? []).find((existing) => existing.id === slot.id);

  return {
    ...slot,
    selectedFeatId: existingSlot?.selectedFeatId,
  };
}

export function buildFeatSlots(draft: CharacterDraft): FeatSlot[] {
  const slots: FeatSlot[] = [];
  const level = draft.identity.level ?? 1;

  slots.push(
    mergeSelectedFeatId(
      {
        id: 'origin_1',
        label: 'Origin Feat',
        kind: 'origin',
        levelGranted: 1,
        featPool: 'origin',
        source: 'base_origin',
      },
      draft
    )
  );

  if (draft.identity.speciesId === 'human') {
    slots.push(
      mergeSelectedFeatId(
        {
          id: 'origin_human_1',
          label: 'Origin Feat (Human)',
          kind: 'origin',
          levelGranted: 1,
          featPool: 'origin',
          source: 'human_origin_bonus',
        },
        draft
      )
    );
  }

  LEVEL_FEAT_LEVELS.forEach((grantedLevel) => {
    if (level < grantedLevel) {
      return;
    }

    slots.push(
      mergeSelectedFeatId(
        {
          id: `level_${grantedLevel}`,
          label:
            grantedLevel === 19
              ? 'Epic Boon'
              : `Feat (Level ${grantedLevel})`,
          kind: 'general',
          levelGranted: grantedLevel,
          featPool: 'general',
          source: 'level_progression',
        },
        draft
      )
    );
  });

  return slots;
}

function buildFeatSlotField(slot: FeatSlot): ResolvedField {
  const poolOptions = getFeatPoolOptions(slot);

  return {
    name: slot.id,
    title: slot.label,
    type: 'string',
    enum: poolOptions.map((feat) => feat.feat_id),
    enumNames: poolOptions.map((feat) => feat.name),
    required: true,
    widget: 'hoverChoice',
  };
}

export function resolveFeatPicker(draft: CharacterDraft): ResolverOutput {
  const featSlots = buildFeatSlots(draft);

  if (!featSlots.length) {
    return {
      status: 'skip',
      fields: [],
    };
  }

  return {
    status: 'ready',
    fields: [...featSlots.map(buildFeatSlotField), ...buildFollowupFields(featSlots)],
  };
}
