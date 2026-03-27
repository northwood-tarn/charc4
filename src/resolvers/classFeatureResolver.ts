import type { CharacterDraft } from '../engine/types';
import type {
  ChoiceComponent,
  ChoiceOption,
  ChoicePayload,
  ResolvedField,
  ResolverOutput,
} from '../schema/types';

import barbarianFeatures from '../data/classes/barbarianFeatures.json';
import bardFeatures from '../data/classes/bardFeatures.json';
import clericFeatures from '../data/classes/clericFeatures.json';
import druidFeatures from '../data/classes/druidFeatures.json';
import fighterFeatures from '../data/classes/fighterFeatures.json';
import monkFeatures from '../data/classes/monkFeatures.json';
import paladinFeatures from '../data/classes/paladinFeatures.json';
import rangerFeatures from '../data/classes/rangerFeatures.json';
import rogueFeatures from '../data/classes/rogueFeatures.json';
import sorcererFeatures from '../data/classes/sorcererFeatures.json';
import warlockFeatures from '../data/classes/warlockFeatures.json';
import wizardFeatures from '../data/classes/wizardFeatures.json';

type LevelValuePair<T> = {
  level: number;
  value: T;
};

type ClassFeatureOption = {
  id: string;
  label?: string;
  description?: string;
  detail?: string;
  details?: string;
  notes?: string;
  text?: string;
  derived_effects?: unknown;
};

type ClassFeatureChoiceComponent = ChoiceComponent;

type ClassFeatureChoice = {
  kind?: string;
  count?: number;
  count_by_level?: LevelValuePair<number>[];
  options?: ClassFeatureOption[];
  pool?: string;
  components?: ClassFeatureChoiceComponent[];
};

type ClassFeatureDefinition = {
  id: string;
  name: string;
  description?: string;
  level: number;
  type: string;
  choice?: ClassFeatureChoice;
};

type SubclassFeatureBlock = {
  features?: ClassFeatureDefinition[];
};

type ClassFeatureFile = {
  class_id: string;
  features?: ClassFeatureDefinition[];
  subclasses?: Record<string, SubclassFeatureBlock>;
};

function getSelectedSubclassId(draft: CharacterDraft): string | undefined {
  const identity = (draft as CharacterDraft & {
    identity?: {
      subclassId?: string;
      subclass_id?: string;
    };
  }).identity;

  return identity?.subclassId ?? identity?.subclass_id;
}

function isChoiceFeature(feature: ClassFeatureDefinition): boolean {
  if (feature.type !== 'choice' || !feature.choice) {
    return false;
  }

  const hasInlineOptions = Array.isArray(feature.choice.options) && feature.choice.options.length > 0;
  const hasPool = typeof feature.choice.pool === 'string' && feature.choice.pool.trim().length > 0;

  return hasInlineOptions || hasPool;
}

function isEligibleByLevel(feature: ClassFeatureDefinition, level: number): boolean {
  return feature.level <= level;
}

function isAlreadyResolved(
  feature: ClassFeatureDefinition,
  subclassId: string | undefined
): boolean {
  return feature.choice?.kind === 'subclass' && Boolean(subclassId);
}

function getChoiceCount(feature: ClassFeatureDefinition, level: number): number {
  const levelCounts = feature.choice?.count_by_level;

  if (Array.isArray(levelCounts) && levelCounts.length > 0) {
    const eligibleEntries = levelCounts
      .filter((entry) => typeof entry.level === 'number' && entry.level <= level)
      .sort((left, right) => left.level - right.level);

    if (eligibleEntries.length > 0) {
      return eligibleEntries[eligibleEntries.length - 1]?.value ?? 1;
    }
  }

  return feature.choice?.count ?? 1;
}

function getOptionDetail(option: ClassFeatureOption): string | undefined {
  return option.description
    ?? option.detail
    ?? option.details
    ?? option.notes
    ?? option.text;
}

function getInlineOptions(
  feature: ClassFeatureDefinition
): ChoiceOption[] | undefined {
  const options = feature.choice?.options;

  if (!Array.isArray(options) || options.length === 0) {
    return undefined;
  }

  return options
    .filter((option) => Boolean(option.id))
    .map((option) => ({
      value: option.id,
      label: option.label ?? option.id,
      detail: getOptionDetail(option),
    }));
}

type ClassFeatureResolvedField = Omit<ResolvedField, 'type' | 'maxSelections'> & {
  type: 'string' | 'array';
  maxSelections?: number;
  description?: string;
  choice: ChoicePayload;
};

const CLASS_FEATURES_BY_ID: Record<string, ClassFeatureFile> = {
  barbarian: barbarianFeatures as ClassFeatureFile,
  bard: bardFeatures as ClassFeatureFile,
  cleric: clericFeatures as ClassFeatureFile,
  druid: druidFeatures as ClassFeatureFile,
  fighter: fighterFeatures as ClassFeatureFile,
  monk: monkFeatures as ClassFeatureFile,
  paladin: paladinFeatures as ClassFeatureFile,
  ranger: rangerFeatures as ClassFeatureFile,
  rogue: rogueFeatures as ClassFeatureFile,
  sorcerer: sorcererFeatures as ClassFeatureFile,
  warlock: warlockFeatures as ClassFeatureFile,
  wizard: wizardFeatures as ClassFeatureFile,
};

const CHOICE_FIELD_CACHE = new Map<string, ClassFeatureResolvedField[]>();

function buildChoiceField(
  feature: ClassFeatureDefinition,
  level: number,
  source: 'class' | 'subclass',
  subclassId?: string
): ClassFeatureResolvedField {
  const count = getChoiceCount(feature, level);
  const options = getInlineOptions(feature);
  const hasInlineOptions = Array.isArray(options) && options.length > 0;
  const hasPool = typeof feature.choice?.pool === 'string' && feature.choice.pool.trim().length > 0;

  if (!hasInlineOptions && !hasPool) {
    throw new Error(`Invalid choice feature: ${feature.id} has no options or pool.`);
  }

  return {
    name: feature.id,
    title: feature.name,
    type: count > 1 ? 'array' : 'string',
    maxSelections: count > 1 ? count : undefined,
    enum: options?.map((option) => option.value),
    enumNames: options?.map((option) => option.label),
    description: feature.description,
    choice: {
      featureId: feature.id,
      featureLevel: feature.level,
      description: feature.description,
      kind: feature.choice?.kind,
      count,
      pool: feature.choice?.pool,
      components: feature.choice?.components,
      options,
      source,
      subclassId,
    },
  };
}

function getCoreChoiceFields(
  classFeatureFile: ClassFeatureFile,
  level: number,
  subclassId: string | undefined
): ClassFeatureResolvedField[] {
  return (classFeatureFile.features ?? [])
    .filter((feature) => isChoiceFeature(feature))
    .filter((feature) => isEligibleByLevel(feature, level))
    .filter((feature) => !isAlreadyResolved(feature, subclassId))
    .map((feature) => buildChoiceField(feature, level, 'class'));
}

function getSubclassChoiceFields(
  classFeatureFile: ClassFeatureFile,
  level: number,
  subclassId: string | undefined
): ClassFeatureResolvedField[] {
  if (!subclassId) {
    return [];
  }

  const subclassFeatures = classFeatureFile.subclasses?.[subclassId]?.features ?? [];

  return subclassFeatures
    .filter((feature) => isChoiceFeature(feature))
    .filter((feature) => isEligibleByLevel(feature, level))
    .filter((feature) => !isAlreadyResolved(feature, subclassId))
    .map((feature) => buildChoiceField(feature, level, 'subclass', subclassId));
}

function getChoiceFields(
  classId: string,
  level: number,
  subclassId: string | undefined
): ClassFeatureResolvedField[] {
  const classFeatureFile = CLASS_FEATURES_BY_ID[classId];

  if (!classFeatureFile) {
    return [];
  }

  const cacheKey = `${classId}__${level}__${subclassId ?? ''}`;
  const cached = CHOICE_FIELD_CACHE.get(cacheKey);

  if (cached) {
    return cached;
  }

  const fields = [
    ...getCoreChoiceFields(classFeatureFile, level, subclassId),
    ...getSubclassChoiceFields(classFeatureFile, level, subclassId),
  ];

  CHOICE_FIELD_CACHE.set(cacheKey, fields);
  return fields;
}

export function resolveClassFeaturePicker(draft: CharacterDraft): ResolverOutput {
  const classId = draft.identity?.classId;
  const level = draft.identity?.level ?? 1;
  const subclassId = getSelectedSubclassId(draft);

  if (!classId) {
    return { status: 'skip' as const };
  }

  const fields = getChoiceFields(classId, level, subclassId);

  if (fields.length === 0) {
    return { status: 'skip' as const };
  }

  return {
    status: 'ready' as const,
    fields,
  };
}
