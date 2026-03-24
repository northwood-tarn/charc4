import { useEffect, useMemo, useState } from 'react';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';
import featsData from '../../../public/data/feats.json';

type ToolChoiceEffect = {
  count: number;
  pool: string;
};

type ToolRecord = {
  tool_id: string;
  tool_name: string;
  tool_type: string;
};

type FeatRecord = {
  feat_id: string;
  name: string;
  type: string;
  notes?: string;
  effects?: {
    tool_choices?: ToolChoiceEffect;
  };
};

function parseToolsCsv(csvText: string): ToolRecord[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.slice(1).map((line) => {
    const [tool_id, tool_name, tool_type] = line.split(',');
    return {
      tool_id: tool_id?.trim() ?? '',
      tool_name: tool_name?.trim() ?? '',
      tool_type: tool_type?.trim() ?? '',
    };
  });
}

function getToolPoolOptions(
  pool: string,
  tools: ToolRecord[]
): HoverChoiceOption[] {
  if (pool === 'artisan_tools') {
    return tools
      .filter((t) => t.tool_type === 'artisans_tools')
      .map((t) => ({ value: t.tool_id, label: t.tool_name }));
  }

  if (pool === 'musical_instruments') {
    return tools
      .filter((t) => t.tool_type === 'instrument')
      .map((t) => ({ value: t.tool_id, label: t.tool_name }));
  }

  return [];
}

function renderFeatDetail(feat: FeatRecord) {
  return (
    <div>
      <div
        style={{
          fontSize: '1.2rem',
          fontWeight: 400,
          marginBottom: '14px',
          letterSpacing: '0.08em',
          lineHeight: 1,
          color: '#6e92aa',
        }}
      >
        {feat.name}
      </div>

      {feat.notes && (
        <div style={{ lineHeight: 1.5 }}>
          {feat.notes}
        </div>
      )}
    </div>
  );
}

function getFeatById(id?: string): FeatRecord | undefined {
  return (featsData as FeatRecord[]).find((f) => f.feat_id === id);
}

export function FeatPicker({ context, onResolve }: TriggerComponentProps) {
  const draft = context.draft;
  const identity = draft.identity;

  const [originFeatId, setOriginFeatId] = useState<string | undefined>(
    identity.originFeatId
  );
  const [secondOriginFeatId, setSecondOriginFeatId] = useState<string | undefined>(
    identity.secondOriginFeatId
  );
  const [toolChoices, setToolChoices] = useState<string[]>(
    identity.originFeatToolChoices ?? []
  );
  const [tools, setTools] = useState<ToolRecord[]>([]);

  const speciesId = identity.speciesId;
  const showSecondOriginFeat = speciesId === 'human';

  useEffect(() => {
    let mounted = true;

    fetch('/data/tools.csv')
      .then((r) => r.text())
      .then((csv) => {
        if (!mounted) return;
        setTools(parseToolsCsv(csv));
      })
      .catch(() => {
        if (mounted) setTools([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setOriginFeatId(identity.originFeatId);
  }, [identity.originFeatId]);

  useEffect(() => {
    setToolChoices(identity.originFeatToolChoices ?? []);
  }, [identity.originFeatToolChoices]);

  const originFeatOptions = useMemo<HoverChoiceOption[]>(() => {
    return (featsData as FeatRecord[])
      .filter((feat) => feat.type === 'Origin')
      .map((feat) => ({
        value: feat.feat_id,
        label: feat.name,
        detail: renderFeatDetail(feat),
      }));
  }, []);

  const selectedFeat = useMemo(
    () => getFeatById(originFeatId),
    [originFeatId]
  );

  const toolEffect = selectedFeat?.effects?.tool_choices;

  const toolOptions = useMemo(() => {
    return toolEffect
      ? getToolPoolOptions(toolEffect.pool, tools)
      : [];
  }, [toolEffect, tools]);

  useEffect(() => {
    setToolChoices([]);
  }, [originFeatId]);

  useEffect(() => {
    setSecondOriginFeatId(identity.secondOriginFeatId);
  }, [identity.secondOriginFeatId]);

  useEffect(() => {
    if (showSecondOriginFeat) {
      return;
    }

    if (identity.secondOriginFeatId == null && secondOriginFeatId == null) {
      return;
    }

    setSecondOriginFeatId(undefined);

    onResolve({
      status: 'complete',
      patch: {
        identity: {
          secondOriginFeatId: undefined,
        },
      },
      stayOnNode: true,
    });
  }, [showSecondOriginFeat, identity.secondOriginFeatId, secondOriginFeatId, onResolve]);


  return (
    <div>
      <HoverChoiceField
        label="Origin Feat"
        options={originFeatOptions}
        value={originFeatId}
        onChange={(value) => {
          const next = Array.isArray(value) ? value[0] : value;

          setOriginFeatId(next);

          onResolve({
            status: 'complete',
            patch: {
              identity: {
                originFeatId: next,
                originFeatToolChoices: undefined,
              },
            },
            stayOnNode: true,
          });
        }}
        onHoverDetail={(d) => context.setHoverDetail?.(d ?? null)}
        placeholder="Select an origin feat"
      />

      {showSecondOriginFeat && (
        <HoverChoiceField
          label="Origin Feat (Human)"
          options={originFeatOptions}
          value={secondOriginFeatId}
          onChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;

            setSecondOriginFeatId(next);

            onResolve({
              status: 'complete',
              patch: {
                identity: {
                  secondOriginFeatId: next,
                },
              },
              stayOnNode: true,
            });
          }}
          onHoverDetail={(d) => context.setHoverDetail?.(d ?? null)}
        />
      )}

      {toolEffect && toolOptions.length > 0 && (
        <HoverChoiceField
          label="Tool Proficiencies"
          options={toolOptions}
          value={toolChoices}
          multiple={true}
          instructionText={`— Choose ${toolEffect.count} —`}
          onChange={(value) => {
            const next = Array.isArray(value)
              ? value.slice(0, toolEffect.count)
              : value
              ? [value]
              : [];

            setToolChoices(next);

            onResolve({
              status: 'complete',
              patch: {
                identity: {
                  originFeatToolChoices: next,
                },
              },
              stayOnNode: true,
            });
          }}
          onHoverDetail={(d) => context.setHoverDetail?.(d ?? null)}
          placeholder="Choose tools"
        />
      )}
    </div>
  );
}