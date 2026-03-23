import type { ReactNode } from 'react';
import type { CharacterDraft } from './types';
import type { TriggerName } from './triggerNames';
import type { DomainPatch } from './domainPatch';

export type TriggerResult =
  | { status: 'complete'; patch?: DomainPatch; nextNodeId?: string }
  | { status: 'skip' }
  | { status: 'error'; message: string };

export type TriggerContext = {
  trigger: TriggerName;
  draft: CharacterDraft;
  nextNodeId?: string;
  setHoverDetail?: (detail: ReactNode | null) => void;
  registerSubmitAction?: (submit: (() => void) | null) => void;
};

export type TriggerComponentProps = {
  context: TriggerContext;
  onResolve: (result: TriggerResult) => void;
};