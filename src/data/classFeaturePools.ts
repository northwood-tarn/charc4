import { getClassOptions } from './classes';
import { getCachedFeatRecords } from './feats';
import { getLanguageOptions } from './languages';
import { getCachedSkillOptions, getSkillOptions } from './skills';
import { getSubclassOptionsForClass } from './subclasses';
import { getCachedWeaponOptions, getWeaponOptions } from './weapons';

export type ClassFeaturePoolOption = {
  value: string;
  label: string;
  detail?: string;
  masteryTrait?: string;
  masteryDetails?: string;
};

type PoolContext = {
  draft?: unknown;
  [key: string]: unknown;
};

type PoolResolver = (ctx: PoolContext) => Promise<ClassFeaturePoolOption[]>;

type ClassOptionRecord = Record<string, unknown>;

const DEFAULT_CLASS_WEAPON_PROFICIENCY_TOKENS: Record<string, string[]> = {
  ranger: ['simple weapons', 'martial weapons'],
  rogue: ['simple weapons', 'martial weapons'],
};

function uniqueOptions(options: ClassFeaturePoolOption[]): ClassFeaturePoolOption[] {
  const seen = new Set<string>();

  return options.filter((option) => {
    if (!option.value || seen.has(option.value)) {
      return false;
    }

    seen.add(option.value);
    return true;
  });
}

function asOption(
  value: string,
  label?: string,
  extra: Partial<Omit<ClassFeaturePoolOption, 'value' | 'label'>> = {}
): ClassFeaturePoolOption {
  return {
    value,
    label: label ?? value,
    ...extra,
  };
}

function getStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function readFirstStringArray(ctx: PoolContext, paths: string[][]): string[] {
  for (const path of paths) {
    let current: unknown = ctx;

    for (const key of path) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }

      current = (current as Record<string, unknown>)[key];
    }

    const values = getStringArray(current);
    if (values.length > 0) {
      return values;
    }
  }

  return [];
}

async function getClassOptionRecord(classId: string | undefined): Promise<ClassOptionRecord | undefined> {
  if (!classId) {
    return undefined;
  }

  const classOptions = await getClassOptions();
  return classOptions.find((option) => option.value === classId) as unknown as
    | ClassOptionRecord
    | undefined;
}

function getStringArrayFromRecord(
  record: ClassOptionRecord | undefined,
  candidateKeys: string[]
): string[] {
  if (!record) {
    return [];
  }

  for (const key of candidateKeys) {
    const values = getStringArray(record[key]);
    if (values.length > 0) {
      return values;
    }
  }

  return [];
}

function weaponMatchesProficiencyToken(
  weapon: Awaited<ReturnType<typeof getWeaponOptions>>[number],
  token: string
): boolean {
  const normalized = token.trim().toLowerCase().replace(/[_\-\s]+/g, ' ');

  if (!normalized) {
    return false;
  }

  if (normalized === weapon.value.toLowerCase()) {
    return true;
  }

  if (normalized === weapon.label.toLowerCase()) {
    return true;
  }

  if (normalized === 'simple' || normalized === 'simple weapons') {
    return weapon.category === 'simple';
  }

  if (normalized === 'martial' || normalized === 'martial weapons') {
    return weapon.category === 'martial';
  }

  if (
    normalized === 'simple or martial' ||
    normalized === 'simple or martial weapons' ||
    normalized === 'all weapons'
  ) {
    return weapon.category === 'simple' || weapon.category === 'martial';
  }

  if (normalized === 'melee' || normalized === 'melee weapons') {
    return weapon.weaponType === 'melee';
  }

  if (normalized === 'ranged' || normalized === 'ranged weapons') {
    return weapon.weaponType === 'ranged';
  }

  if (
    normalized === 'simple melee' ||
    normalized === 'simple melee weapons'
  ) {
    return weapon.category === 'simple' && weapon.weaponType === 'melee';
  }

  if (
    normalized === 'martial melee' ||
    normalized === 'martial melee weapons'
  ) {
    return weapon.category === 'martial' && weapon.weaponType === 'melee';
  }

  if (
    normalized === 'simple ranged' ||
    normalized === 'simple ranged weapons'
  ) {
    return weapon.category === 'simple' && weapon.weaponType === 'ranged';
  }

  if (
    normalized === 'martial ranged' ||
    normalized === 'martial ranged weapons'
  ) {
    return weapon.category === 'martial' && weapon.weaponType === 'ranged';
  }

  return false;
}

async function getAllSkillOptions(): Promise<ClassFeaturePoolOption[]> {
  let skills = getCachedSkillOptions();

  if (skills.length === 0) {
    skills = await getSkillOptions();
  }

  return uniqueOptions(
    skills.map((skill) =>
      asOption(skill.value, skill.label, {
        detail: skill.description,
      })
    )
  );
}

async function getClassSkillPool(classId: string): Promise<ClassFeaturePoolOption[]> {
  const classOptions = await getClassOptions();
  const classOption = classOptions.find((option) => option.value === classId);

  if (!classOption?.skillProfs) {
    return [];
  }

  const allowedSkillIds = new Set(getStringArray(classOption.skillProfs));
  const allSkills = await getAllSkillOptions();

  return allSkills.filter((skill) => allowedSkillIds.has(skill.value));
}

async function getSubclassPool(classId: string): Promise<ClassFeaturePoolOption[]> {
  const subclasses = await getSubclassOptionsForClass(classId);

  return subclasses.map((subclass) => asOption(subclass.value, subclass.label));
}

async function getLanguagePool(): Promise<ClassFeaturePoolOption[]> {
  const languages = await getLanguageOptions();

  return languages.map((language) => asOption(language.value, language.label));
}

async function getWeaponPool(
  predicate: (weapon: Awaited<ReturnType<typeof getWeaponOptions>>[number]) => boolean
): Promise<ClassFeaturePoolOption[]> {
  let weapons = getCachedWeaponOptions();

  if (weapons.length === 0) {
    weapons = await getWeaponOptions();
  }

  return uniqueOptions(
    weapons.filter(predicate).map((weapon) =>
      asOption(weapon.value, weapon.label, {
        masteryTrait: weapon.masteryTrait,
        masteryDetails: weapon.masteryDetails,
        detail: weapon.masteryDetails,
      })
    )
  );
}

async function getFightingStyleFeatPool(): Promise<ClassFeaturePoolOption[]> {
  const feats = getCachedFeatRecords();

  return uniqueOptions(
    feats
      .filter((feat) => {
        const normalizedType = (feat.type ?? '')
          .trim()
          .toLowerCase()
          .replace(/[_\-\s]+/g, ' ');

        const normalizedId = (feat.feat_id ?? '')
          .trim()
          .toLowerCase()
          .replace(/[_\-\s]+/g, ' ');

        const normalizedName = (feat.name ?? '')
          .trim()
          .toLowerCase()
          .replace(/[_\-\s]+/g, ' ');

        return (
          normalizedType.includes('fighting style') ||
          normalizedId.includes('fighting style') ||
          normalizedName.includes('fighting style')
        );
      })
      .map((feat) => asOption(feat.feat_id, feat.name))
  );
}

async function getOwnedSkillProficienciesWithoutExpertise(
  ctx: PoolContext
): Promise<ClassFeaturePoolOption[]> {
  const classId =
    typeof (ctx.draft as Record<string, unknown> | undefined)?.identity === 'object'
      ? (((ctx.draft as Record<string, unknown>).identity as Record<string, unknown>)
          .classId as string | undefined)
      : undefined;

  const ownedSkillIds = new Set(
    readFirstStringArray(ctx, [
      ['draft', 'skillProficiencies'],
      ['draft', 'proficiencies', 'skills'],
      ['draft', 'derived', 'skillProficiencies'],
      ['skillProficiencies'],
      ['proficiencies', 'skills'],
    ])
  );

  if (ownedSkillIds.size === 0) {
    const classOption = await getClassOptionRecord(classId);
    getStringArrayFromRecord(classOption, [
      'ownedSkillProficiencies',
      'owned_skill_proficiencies',
      'skillProficiencies',
      'skill_proficiencies',
      'skillProfs',
      'skill_profs',
    ]).forEach((skillId) => ownedSkillIds.add(skillId));
  }

  const expertiseSkillIds = new Set(
    readFirstStringArray(ctx, [
      ['draft', 'skillExpertise'],
      ['draft', 'expertise', 'skills'],
      ['draft', 'derived', 'skillExpertise'],
      ['skillExpertise'],
      ['expertise', 'skills'],
    ])
  );

  if (ownedSkillIds.size === 0) {
    return [];
  }

  const allSkills = await getAllSkillOptions();

  return allSkills.filter(
    (skill) => ownedSkillIds.has(skill.value) && !expertiseSkillIds.has(skill.value)
  );
}

async function getProficientWeaponKinds(ctx: PoolContext): Promise<ClassFeaturePoolOption[]> {
  const classId =
    typeof (ctx.draft as Record<string, unknown> | undefined)?.identity === 'object'
      ? (((ctx.draft as Record<string, unknown>).identity as Record<string, unknown>)
          .classId as string | undefined)
      : undefined;

  const proficiencyTokens = new Set(
    readFirstStringArray(ctx, [
      ['draft', 'weaponProficiencies'],
      ['draft', 'proficiencies', 'weapons'],
      ['draft', 'derived', 'weaponProficiencies'],
      ['weaponProficiencies'],
      ['proficiencies', 'weapons'],
    ])
  );

  if (proficiencyTokens.size === 0) {
    const classOption = await getClassOptionRecord(classId);
    getStringArrayFromRecord(classOption, [
      'weaponProficiencies',
      'weapon_proficiencies',
      'weaponProfs',
      'weapon_profs',
      'weapons',
    ]).forEach((token) => proficiencyTokens.add(token));
  }

  if (proficiencyTokens.size === 0 && classId) {
    (DEFAULT_CLASS_WEAPON_PROFICIENCY_TOKENS[classId] ?? []).forEach((token) =>
      proficiencyTokens.add(token)
    );
  }

  if (proficiencyTokens.size === 0) {
    return [];
  }

  let weapons = getCachedWeaponOptions();

  if (weapons.length === 0) {
    weapons = await getWeaponOptions();
  }

  return uniqueOptions(
    weapons
      .filter((weapon) =>
        Array.from(proficiencyTokens).some((token) => weaponMatchesProficiencyToken(weapon, token))
      )
      .map((weapon) =>
        asOption(weapon.value, weapon.label, {
          masteryTrait: weapon.masteryTrait,
          masteryDetails: weapon.masteryDetails,
          detail: weapon.masteryDetails,
        })
      )
  );
}

const classFeaturePools: Record<string, PoolResolver> = {
  barbarian_skills: async () => getClassSkillPool('barbarian'),

  barbarian_subclasses: async () => getSubclassPool('barbarian'),
  bard_subclasses: async () => getSubclassPool('bard'),
  cleric_subclasses: async () => getSubclassPool('cleric'),
  druid_subclasses: async () => getSubclassPool('druid'),
  fighter_subclasses: async () => getSubclassPool('fighter'),
  paladin_subclasses: async () => getSubclassPool('paladin'),
  ranger_subclasses: async () => getSubclassPool('ranger'),
  rogue_subclasses: async () => getSubclassPool('rogue'),
  sorcerer_subclasses: async () => getSubclassPool('sorcerer'),
  warlock_subclasses: async () => getSubclassPool('warlock'),
  wizard_subclasses: async () => getSubclassPool('wizard'),

  languages: async () => getLanguagePool(),

  simple_or_martial_melee_weapon_kinds: async () =>
    getWeaponPool(
      (weapon) =>
        (weapon.category === 'simple' || weapon.category === 'martial') &&
        weapon.weaponType === 'melee'
    ),

  simple_or_martial_weapon_kinds: async () =>
    getWeaponPool(
      (weapon) => weapon.category === 'simple' || weapon.category === 'martial'
    ),

  proficient_weapon_kinds: async (ctx) => getProficientWeaponKinds(ctx),

  owned_skill_proficiencies_without_expertise: async (ctx) =>
    getOwnedSkillProficienciesWithoutExpertise(ctx),

  fighting_style_feats: async () => getFightingStyleFeatPool(),
};

export async function resolvePool(
  poolId: string | undefined,
  ctx: PoolContext = {}
): Promise<ClassFeaturePoolOption[]> {
  if (!poolId) {
    return [];
  }

  const resolver = classFeaturePools[poolId];

  if (!resolver) {
    console.warn(`Unknown class feature pool: ${poolId}`);
    return [];
  }

  return resolver(ctx);
}