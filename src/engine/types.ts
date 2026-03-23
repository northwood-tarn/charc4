import type { TriggerName } from './triggerNames';

export type ScriptNode = {
  id: string;
  text?: string;
  trigger?: TriggerName;
  next?: string;
};

export type CharacterDraft = {
  identity: {
    classId?: string;
  };
};