import { useEffect, useMemo, useState } from 'react';

import { applyPatch } from '../../engine/applyPatch';
import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { useCharacterStore } from '../../store/characterStore';
import { getSpeciesOptions, type SpeciesOption } from '../../data/species';
import {
  getLineageOptionsForSpecies,
  type LineageOption,
} from '../../data/lineages';
import {
  getLanguageOptions,
  type LanguageOption,
} from '../../data/languages';
import {
  HoverChoiceField,
  type HoverChoiceOption,
} from '../fields/HoverChoiceField';

function formatPipeList(value: string, chosenLanguageLabel?: string): string {
  return value
    .split('|')
    .map((part) => {
      const trimmed = part.trim();
      if (trimmed === 'Choice' && chosenLanguageLabel) {
        return chosenLanguageLabel;
      }
      return trimmed;
    })
    .join(', ');
}

function renderSpeciesDetail(
  title: string,
  kind: 'Species' | 'Lineage',
  option: {
    size: string;
    speed: string;
    senses: string;
    resistances: string;
    languages: string;
  },
  chosenLanguageLabel?: string
) {
  return (
    <div>
      <div
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          marginBottom: '14px',
          letterSpacing: '0.08em',
          lineHeight: 1,
        }}
      >
        {title}
      </div>

      <div style={{ marginBottom: '12px', lineHeight: 1.5 }}>
        <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
          {kind}
        </span>
      </div>

      <div style={{ marginBottom: '12px', lineHeight: 1.5 }}>
        <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
          Size
        </span>
        <span>{option.size}</span>
      </div>

      <div style={{ marginBottom: '12px', lineHeight: 1.5 }}>
        <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
          Speed
        </span>
        <span>{option.speed}</span>
      </div>

      {option.senses && (
        <div style={{ marginBottom: '12px', lineHeight: 1.5 }}>
          <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
            Senses
          </span>
          <span>{option.senses}</span>
        </div>
      )}

      {option.resistances && (
        <div style={{ marginBottom: '12px', lineHeight: 1.5 }}>
          <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
            Resistances
          </span>
          <span>{formatPipeList(option.resistances)}</span>
        </div>
      )}

      {option.languages && (
        <div style={{ lineHeight: 1.5 }}>
          <span className="h2" style={{ marginRight: '8px', color: '#6e92aa' }}>
            Languages
          </span>
          <span>{formatPipeList(option.languages, chosenLanguageLabel)}</span>
        </div>
      )}
    </div>
  );
}

function speciesHasMeaningfulLineageChoices(lineages: LineageOption[]): boolean {
  if (lineages.length === 0) {
    return false;
  }

  return !(lineages.length === 1 && lineages[0]?.value === 'base');
}

export function SpeciesPicker({ context, onResolve }: TriggerComponentProps) {
  const currentSpeciesId = context.draft.identity.speciesId;
  const currentLineageId = context.draft.identity.lineageId;
  const currentLanguageId = (context.draft.identity as any).languageId as
    | string
    | undefined;

  const [pendingSpeciesId, setPendingSpeciesId] = useState(currentSpeciesId ?? '');
  const [pendingLineageId, setPendingLineageId] = useState(currentLineageId ?? '');
  const [pendingLanguageId, setPendingLanguageId] = useState(currentLanguageId ?? '');

  const [speciesOptions, setSpeciesOptions] = useState<SpeciesOption[] | null>(null);
  const [lineageOptions, setLineageOptions] = useState<LineageOption[] | null>(null);
  const [languageOptions, setLanguageOptions] = useState<LanguageOption[] | null>(null);

  useEffect(() => {
    let mounted = true;

    getSpeciesOptions().then((opts) => {
      if (mounted) {
        setSpeciesOptions(opts);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    getLanguageOptions().then((opts) => {
      if (mounted) {
        setLanguageOptions(opts.filter((option) => option.value !== 'common'));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!pendingSpeciesId) {
      setLineageOptions([]);
      return;
    }

    getLineageOptionsForSpecies(pendingSpeciesId).then((opts) => {
      if (mounted) {
        setLineageOptions(opts);
      }
    });

    return () => {
      mounted = false;
    };
  }, [pendingSpeciesId]);

  const safeSpeciesOptions = speciesOptions ?? [];
  const safeLineageOptions = lineageOptions ?? [];
  const safeLanguageOptions = languageOptions ?? [];

  useEffect(() => {
    if (speciesOptions !== null && safeSpeciesOptions.length === 0) {
      onResolve({ status: 'skip' });
    }
  }, [speciesOptions, safeSpeciesOptions, onResolve]);

  const speciesOptionsById = useMemo(() => {
    return new Map(safeSpeciesOptions.map((option) => [option.value, option]));
  }, [safeSpeciesOptions]);

  const languageOptionsById = useMemo(() => {
    return new Map(safeLanguageOptions.map((option) => [option.value, option]));
  }, [safeLanguageOptions]);

  const selectedLanguageLabel = languageOptionsById.get(pendingLanguageId)?.label;

  const hoverSpeciesOptions = useMemo<HoverChoiceOption[]>(() => {
    return safeSpeciesOptions.map((option) => ({
      value: option.value,
      label: option.label,
      detail: renderSpeciesDetail(option.label, 'Species', option, selectedLanguageLabel),
    }));
  }, [safeSpeciesOptions, selectedLanguageLabel]);

  const hoverLineageOptions = useMemo<HoverChoiceOption[]>(() => {
    return safeLineageOptions.map((option) => ({
      value: option.value,
      label: option.label,
      detail: renderSpeciesDetail(
        `${option.label} ${speciesOptionsById.get(option.speciesId)?.label ?? ''}`.trim(),
        'Lineage',
        option,
        selectedLanguageLabel
      ),
    }));
  }, [safeLineageOptions, selectedLanguageLabel, speciesOptionsById]);

  const lineageFallbackDetail = useMemo(() => {
    const selectedLineage = safeLineageOptions.find(
      (option) => option.value === pendingLineageId
    );

    if (selectedLineage) {
      return renderSpeciesDetail(
        `${selectedLineage.label} ${speciesOptionsById.get(selectedLineage.speciesId)?.label ?? ''}`.trim(),
        'Lineage',
        selectedLineage,
        selectedLanguageLabel
      );
    }

    return renderSpeciesDetail(
      speciesOptionsById.get(pendingSpeciesId)?.label ?? '',
      'Species',
      {
        size: speciesOptionsById.get(pendingSpeciesId)?.size ?? '',
        speed: speciesOptionsById.get(pendingSpeciesId)?.speed ?? '',
        senses: speciesOptionsById.get(pendingSpeciesId)?.senses ?? '',
        resistances: '',
        languages: speciesOptionsById.get(pendingSpeciesId)?.languages ?? '',
      },
      selectedLanguageLabel
    );
  }, [
    pendingLineageId,
    pendingSpeciesId,
    safeLineageOptions,
    selectedLanguageLabel,
    speciesOptionsById,
  ]);

  const hoverLanguageOptions = useMemo<HoverChoiceOption[]>(() => {
    return safeLanguageOptions.map((option) => ({
      value: option.value,
      label: option.label,
      detail: (() => {
        const selectedLineage = safeLineageOptions.find(
          (lineage) => lineage.value === pendingLineageId
        );

        if (selectedLineage) {
          return renderSpeciesDetail(
            `${selectedLineage.label} ${speciesOptionsById.get(selectedLineage.speciesId)?.label ?? ''}`.trim(),
            'Lineage',
            selectedLineage,
            option.label
          );
        }

        return renderSpeciesDetail(
          speciesOptionsById.get(pendingSpeciesId)?.label ?? '',
          'Species',
          {
            size: speciesOptionsById.get(pendingSpeciesId)?.size ?? '',
            speed: speciesOptionsById.get(pendingSpeciesId)?.speed ?? '',
            senses: speciesOptionsById.get(pendingSpeciesId)?.senses ?? '',
            resistances: '',
            languages: speciesOptionsById.get(pendingSpeciesId)?.languages ?? '',
          },
          option.label
        );
      })(),
    }));
  }, [pendingLineageId, pendingSpeciesId, safeLanguageOptions, safeLineageOptions, speciesOptionsById]);

  const showLineageField = speciesHasMeaningfulLineageChoices(safeLineageOptions);

  if (!speciesOptions) {
    return null;
  }

  if (safeSpeciesOptions.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <HoverChoiceField
        label="Species"
        options={hoverSpeciesOptions}
        value={pendingSpeciesId}
        onChange={(value) => {
          const nextSpeciesId = Array.isArray(value) ? value[0] ?? '' : value;
          const speciesChanged = nextSpeciesId !== pendingSpeciesId;
          setPendingSpeciesId(nextSpeciesId);

          if (speciesChanged) {
            setPendingLineageId('');
          }

          useCharacterStore.setState((state) => ({
            draft: applyPatch(state.draft, {
              identity: {
                speciesId: nextSpeciesId || undefined,
                lineageId: speciesChanged ? undefined : state.draft.identity?.lineageId,
              },
            }),
          }));
        }}
        onHoverDetail={(detail) => {
          context.setHoverDetail?.(detail ?? null);
        }}
        multiple={false}
        placeholder="Choose a species"
        instructionText="— Choose a species —"
        emptyDetail={null}
      />

      {pendingSpeciesId && showLineageField && (
        <HoverChoiceField
          key={pendingSpeciesId}
          label="Lineage"
          options={hoverLineageOptions}
          value={pendingLineageId}
          onChange={(value) => {
            const nextLineageId = Array.isArray(value) ? value[0] ?? '' : value;
            setPendingLineageId(nextLineageId);

            useCharacterStore.setState((state) => ({
              draft: applyPatch(state.draft, {
                identity: {
                  lineageId: nextLineageId || undefined,
                },
              }),
            }));
          }}
          onHoverDetail={(detail) => {
            context.setHoverDetail?.(detail ?? null);
          }}
          multiple={false}
          placeholder="Choose a lineage"
          instructionText="— Choose a lineage —"
          emptyDetail={lineageFallbackDetail}
        />
      )}

      {pendingSpeciesId && safeLanguageOptions.length > 0 && (
        <HoverChoiceField
          key={`language-${pendingSpeciesId}`}
          label="Language"
          options={hoverLanguageOptions}
          value={pendingLanguageId}
          onChange={(value) => {
            const nextLanguageId = Array.isArray(value) ? value[0] ?? '' : value;
            setPendingLanguageId(nextLanguageId);

            useCharacterStore.setState((state) => ({
              draft: applyPatch(state.draft, {
                identity: {
                  languageId: nextLanguageId || undefined,
                },
              } as any),
            }));
          }}
          onHoverDetail={(detail) => {
            context.setHoverDetail?.(detail ?? null);
          }}
          multiple={false}
          placeholder="Choose a language"
          instructionText="— Choose a language —"
          emptyDetail={lineageFallbackDetail}
        />
      )}
    </div>
  );
}