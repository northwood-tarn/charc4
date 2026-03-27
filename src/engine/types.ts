import type { AbilityBlock, AbilityContributions } from '../builder/abilityContributions';
import type { TriggerName } from './triggerNames';

export type ScriptNode = {
  id: string;
  text?: string;
  trigger?: TriggerName;
  next?: string;
};

export type FeatSlotKind = 'origin' | 'general';

export type FeatPool = 'origin' | 'general';

export type FeatSlotSource =
  | 'base_origin'
  | 'human_origin_bonus'
  | 'level_progression';

export type FeatSlot = {
  id: string;
  label: string;
  kind: FeatSlotKind;
  levelGranted: number;
  featPool: FeatPool;
  source: FeatSlotSource;
  selectedFeatId?: string;
};

export type FeatFollowupSelectionValue = string | string[];

export type FeatFollowupSelections = Record<string, FeatFollowupSelectionValue | undefined>;

export type FeatureSelectionValue = string | string[];

export type FeatureSelections = Record<string, FeatureSelectionValue | undefined>;

export type CharacterIdentity = {
  name?: string;
  classId?: string;
  subclassId?: string;
  level?: number;
  backgroundId?: string;
  speciesId?: string;
  lineageId?: string;
  languageId?: string;
};

export type CharacterDraft = {
  identity: CharacterIdentity;
  abilities: AbilityBlock;
  abilityContributions: AbilityContributions;
  featSlots: FeatSlot[];
  featFollowupSelections: FeatFollowupSelections;
  classFeatureSelections: FeatureSelections;
  speciesFeatureSelections: FeatureSelections;
};