import type { CharacterDraft } from '../engine/types';

// Central ability contribution system
// All ability math flows through here

export type AbilityKey =
  | 'STR'
  | 'DEX'
  | 'CON'
  | 'INT'
  | 'WIS'
  | 'CHA';

export type AbilityBlock = Record<AbilityKey, number>;

export type AbilityContributions = {
  background: AbilityBlock;
  class: AbilityBlock;
  other: AbilityBlock; // feats, ASIs, future systems
};

const ABILITY_ID_TO_KEY: Record<string, AbilityKey> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
};

function normalizeAbilitySelection(value: string | string[] | undefined): AbilityKey[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => ABILITY_ID_TO_KEY[String(entry).trim().toLowerCase()])
      .filter((entry): entry is AbilityKey => Boolean(entry));
  }

  if (typeof value === 'string' && value.trim()) {
    const mapped = ABILITY_ID_TO_KEY[value.trim().toLowerCase()];
    return mapped ? [mapped] : [];
  }

  return [];
}

// ---------- BASE ----------

export function createZeroAbilities(): AbilityBlock {
  return {
    STR: 0,
    DEX: 0,
    CON: 0,
    INT: 0,
    WIS: 0,
    CHA: 0,
  };
}

// ---------- BUILDERS ----------

// Background: +2 first, +1 second
export function buildBackgroundContribution(asiOptions: string): AbilityBlock {
  const block = createZeroAbilities();
  const parts = asiOptions.split('|').map((p) => p.trim() as AbilityKey);

  if (parts[0]) block[parts[0]] += 2;
  if (parts[1]) block[parts[1]] += 1;

  return block;
}

// Class: assign standard array by priority
export function buildClassContribution(priority: string): AbilityBlock {
  const block = createZeroAbilities();
  const order = priority.split('|').map((p) => p.trim() as AbilityKey);

  const STANDARD = [15, 14, 13, 12, 10, 8];

  order.forEach((ability, i) => {
    block[ability] = STANDARD[i] ?? 0;
  });

  return block;
}

// Generic future contribution (feats, ASIs, etc.)
export function buildFlatBonusContribution(
  bonuses: Partial<AbilityBlock>
): AbilityBlock {
  const block = createZeroAbilities();

  (Object.keys(bonuses) as AbilityKey[]).forEach((key) => {
    block[key] = bonuses[key] ?? 0;
  });

  return block;
}

export function buildFeatAbilityContribution(
  draft: Pick<CharacterDraft, 'featFollowupSelections'>
): AbilityBlock {
  const block = createZeroAbilities();

  Object.entries(draft.featFollowupSelections).forEach(([fieldName, value]) => {
    if (
      !fieldName.endsWith('__ability_score_choices') &&
      !fieldName.includes('__ability_score_choice_')
    ) {
      return;
    }

    const selectedAbilities = normalizeAbilitySelection(value);
    selectedAbilities.forEach((ability) => {
      block[ability] += 1;
    });
  });

  return block;
}

// ---------- MERGE ----------

export function sumAbilityBlocks(...blocks: AbilityBlock[]): AbilityBlock {
  const result = createZeroAbilities();

  for (const block of blocks) {
    (Object.keys(result) as AbilityKey[]).forEach((key) => {
      result[key] += block[key] ?? 0;
    });
  }

  return result;
}

export function computeTotalAbilities(
  contributions: AbilityContributions
): AbilityBlock {
  return sumAbilityBlocks(
    contributions.background,
    contributions.class,
    contributions.other
  );
}