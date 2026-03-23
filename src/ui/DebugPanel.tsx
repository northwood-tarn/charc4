import { useMemo } from 'react';

import type { CharacterDraft, ScriptNode } from '../engine/types';
import type { TriggerResult } from '../engine/triggerTypes';

type DebugPanelProps = {
  currentNodeId: string;
  currentNode: ScriptNode;
  draft: CharacterDraft;
  lastTriggerResult?: TriggerResult | null;
};

export function DebugPanel({
  currentNodeId,
  currentNode,
  draft,
  lastTriggerResult,
}: DebugPanelProps) {
  const draftJson = useMemo(() => JSON.stringify(draft, null, 2), [draft]);
  const resultJson = useMemo(
    () => JSON.stringify(lastTriggerResult ?? null, null, 2),
    [lastTriggerResult]
  );

  const abilitySummary = useMemo(() => {
    const abilities = (draft as CharacterDraft & {
      abilities?: Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA', number>>;
    }).abilities ?? {
      STR: 0,
      DEX: 0,
      CON: 0,
      INT: 0,
      WIS: 0,
      CHA: 0,
    };

    return ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
      .map((key) => `${key} ${abilities[key as keyof typeof abilities] ?? 0}`)
      .join(' · ');
  }, [draft]);

  return (
    <aside
      style={{
        position: 'fixed',
        right: '12px',
        bottom: '12px',
        width: '260px',
        maxHeight: '360px',
        overflow: 'auto',
        marginTop: 0,
        padding: '1rem',
        border: '1px solid #444',
        background: '#111',
        color: '#ddd',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: 1.4,
        boxSizing: 'border-box',
        zIndex: 9999,
      }}
    >
      <div style={{ marginBottom: '0.75rem' }}>
        <strong>Debug</strong>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <div>
          <strong>currentNodeId:</strong> {currentNodeId}
        </div>
        <div>
          <strong>trigger:</strong> {currentNode.trigger ?? 'none'}
        </div>
        <div>
          <strong>next:</strong> {currentNode.next ?? 'none'}
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div>
          <strong>lastTriggerResult:</strong>
        </div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{resultJson}</pre>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div>
          <strong>abilities:</strong>
        </div>
        <div>{abilitySummary}</div>
      </div>

      <div>
        <div>
          <strong>draft:</strong>
        </div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{draftJson}</pre>
      </div>
    </aside>
  );
}