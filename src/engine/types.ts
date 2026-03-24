import type { AbilityBlock, AbilityContributions } from '../builder/abilityContributions';
import type { TriggerName } from './triggerNames';

export type ScriptNode = {
  id: string;
  text?: string;
  trigger?: TriggerName;
  next?: string;
};

export type CharacterIdentity = {
  name?: string;
  classId?: string;
  subclassId?: string;
  level?: number;
  backgroundId?: string;
  speciesId?: string;
  lineageId?: string;
  languageId?: string;
  originFeatId?: string;
  secondOriginFeatId?: string;
  originFeatToolChoices?: string[];
  classFeatureId?: string;
  speciesFeatureId?: string;
};

export type CharacterDraft = {
  identity: CharacterIdentity;
  abilities: AbilityBlock;
  abilityContributions: AbilityContributions;
};