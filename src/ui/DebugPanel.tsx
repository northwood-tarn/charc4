import { useMemo, useEffect, useState } from 'react';

import type { CharacterDraft, FeatureSelectionValue } from '../engine/types';

type DebugPanelProps = {
  draft: CharacterDraft;
};

export function DebugPanel({ draft }: DebugPanelProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const identity = (draft as CharacterDraft & {
    identity?: {
      name?: string;
      backgroundId?: string;
      classId?: string;
      subclassId?: string;
      level?: number;
      speciesId?: string;
      lineageId?: string;
      languageId?: string;
    };
  }).identity;

  const proficiencies = (draft as CharacterDraft & {
    proficiencies?: {
      skills?: string[];
      savingThrows?: string[];
      tools?: string[];
      weapons?: string[];
      armor?: string[];
    };
  }).proficiencies;

  const abilities = (draft as CharacterDraft & {
    abilities?: Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA', number>>;
  }).abilities ?? {};

  const featSlots = (draft as CharacterDraft & {
    featSlots?: Array<{
      id: string;
      selectedFeatId?: string;
    }>;
  }).featSlots ?? [];

  const featFollowupSelections = (draft as CharacterDraft & {
    featFollowupSelections?: Record<string, string | string[] | undefined>;
  }).featFollowupSelections ?? {};

  const classFeatureSelections = (draft as CharacterDraft & {
    classFeatureSelections?: Record<string, FeatureSelectionValue | undefined>;
  }).classFeatureSelections ?? {};

  const getList = (value: unknown): string => {
    if (!value) return 'none';
    if (Array.isArray(value)) return value.join(', ') || 'none';
    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k)
        .join(', ') || 'none';
    }
    return String(value);
  };

  const getSelectionEntries = (
    value: Record<string, string | string[] | FeatureSelectionValue | undefined>
  ): string => {
    const entries = Object.entries(value)
      .filter(([, selection]) => {
        if (Array.isArray(selection)) {
          return selection.length > 0;
        }
        return typeof selection === 'string' ? selection.trim().length > 0 : Boolean(selection);
      })
      .map(([key, selection]) => {
        const rendered = Array.isArray(selection)
          ? selection.join(', ')
          : String(selection);
        return `${key}: ${rendered}`;
      });

    return entries.length > 0 ? entries.join(' | ') : 'none';
  };

  const getFeatSlotSummary = (): string => {
    const entries = featSlots
      .filter((slot) => typeof slot.selectedFeatId === 'string' && slot.selectedFeatId.length > 0)
      .map((slot) => `${slot.id}: ${slot.selectedFeatId}`);

    return entries.length > 0 ? entries.join(' | ') : 'none';
  };

  const spellsByLevel = (draft as any).spellsByLevel ?? {};

  if (!visible) return null;

  return (
    <aside
      style={{
        position: 'fixed',
        right: '12px',
        bottom: '12px',
        width: '364px',
        maxHeight: '504px',
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
      <div style={{ marginBottom: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Character
      </div>

      <div><span style={{ fontWeight: 600 }}>Name:</span> {identity?.name ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Class:</span> {identity?.classId ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Subclass:</span> {identity?.subclassId ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Level:</span> {identity?.level ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Background:</span> {identity?.backgroundId ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Species:</span> {identity?.speciesId ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Lineage:</span> {identity?.lineageId ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Language Choice:</span> {identity?.languageId ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Size:</span> {(draft as any).size ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Speed:</span> {(draft as any).speed ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Languages:</span> {getList((draft as any).languages)}</div>

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Abilities
      </div>

      <div><span style={{ fontWeight: 600 }}>STR:</span> {abilities.STR ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>DEX:</span> {abilities.DEX ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>CON:</span> {abilities.CON ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>INT:</span> {abilities.INT ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>WIS:</span> {abilities.WIS ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>CHA:</span> {abilities.CHA ?? '—'}</div>

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Proficiencies
      </div>

      <div><span style={{ fontWeight: 600 }}>Saving Throws:</span> {getList(proficiencies?.savingThrows)}</div>
      <div><span style={{ fontWeight: 600 }}>Skills:</span> {getList(proficiencies?.skills)}</div>
      <div><span style={{ fontWeight: 600 }}>Expertise:</span> {getList((draft as any).expertise)}</div>
      <div><span style={{ fontWeight: 600 }}>Tools:</span> {getList(proficiencies?.tools)}</div>
      <div><span style={{ fontWeight: 600 }}>Weapons:</span> {getList(proficiencies?.weapons)}</div>
      <div><span style={{ fontWeight: 600 }}>Armor:</span> {getList(proficiencies?.armor)}</div>

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Feats
      </div>

      <div><span style={{ fontWeight: 600 }}>Feat Slots:</span> {getFeatSlotSummary()}</div>
      <div><span style={{ fontWeight: 600 }}>Feat Followups:</span> {getSelectionEntries(featFollowupSelections)}</div>

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Combat
      </div>

      <div><span style={{ fontWeight: 600 }}>AC:</span> {(draft as any).ac ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Initiative:</span> {(draft as any).initiative ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>HP Max:</span> {(draft as any).hpMax ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Hit Dice:</span> {(draft as any).hitDice ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Weapon Mastery:</span> {getList((draft as any).weaponMastery)}</div>

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Spellcasting
      </div>

      <div><span style={{ fontWeight: 600 }}>Ability:</span> {(draft as any).spellcastingAbility ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Save DC:</span> {(draft as any).spellSaveDC ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Attack Bonus:</span> {(draft as any).spellAttackBonus ?? '—'}</div>

      {Object.entries(spellsByLevel).map(([level, spells]) => (
        <div key={level}>
          {level}: {Array.isArray(spells) ? spells.join(', ') : '—'}
        </div>
      ))}

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Defenses
      </div>

      <div><span style={{ fontWeight: 600 }}>Resistances:</span> {getList((draft as any).resistances)}</div>
      <div><span style={{ fontWeight: 600 }}>Immunities:</span> {getList((draft as any).immunities)}</div>
      <div><span style={{ fontWeight: 600 }}>Conditions:</span> {getList((draft as any).conditionImmunities)}</div>

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Movement & Senses
      </div>

      <div><span style={{ fontWeight: 600 }}>Walk:</span> {(draft as any).speed ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Climb:</span> {(draft as any).climbSpeed ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Swim:</span> {(draft as any).swimSpeed ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Fly:</span> {(draft as any).flySpeed ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Senses:</span> {getList((draft as any).senses)}</div>

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Resources
      </div>

      <div>{getList((draft as any).resources)}</div>

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Selections
      </div>

      <div><span style={{ fontWeight: 600 }}>Fighting Style:</span> {(draft as any).fightingStyle ?? '—'}</div>
      <div><span style={{ fontWeight: 600 }}>Class Feature Choices:</span> {getSelectionEntries(classFeatureSelections)}</div>
      <div><span style={{ fontWeight: 600 }}>Choices:</span> {getList((draft as any).choices)}</div>

      <div style={{ marginTop: '0.75rem', fontWeight: 800, textDecoration: 'underline' }}>
        Features
      </div>

      <div>{getList((draft as any).features)}</div>
    </aside>
  );
}