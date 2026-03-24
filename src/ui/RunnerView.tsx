import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { applyPatch } from '../engine/applyPatch';
import { getScriptNode } from '../engine/scriptRunner';
import { triggerRegistry } from '../engine/triggerRegistry';
import type { TriggerResult } from '../engine/triggerTypes';
import { useCharacterStore } from '../store/characterStore';
import { DebugPanel } from './DebugPanel';

type BuilderStep = {
  id: string;
  label: string;
};

type HoverDetail = ReactNode;

type TriggerResolveOptions = {
  stayOnNode?: boolean;
};

const BUILDER_STEPS: BuilderStep[] = [
  { id: 'start', label: 'Name' },
  { id: 'after_name', label: 'Background' },
  { id: 'after_background', label: 'Class' },
  { id: 'after_species', label: 'Species' },
  { id: 'after_feats', label: 'Feats' },
  { id: 'after_class_features', label: 'Class Features' },
  { id: 'after_species_features', label: 'Species Features' },
  { id: 'after_spells', label: 'Spells' },
  { id: 'after_gear', label: 'Gear' },
];

function getStepIndex(stepId: string): number {
  const index = BUILDER_STEPS.findIndex((step) => step.id === stepId);
  return index === -1 ? 0 : index;
}

function getNextVisibleStepId(nodeId: string): string | null {
  const visited = new Set<string>();
  let nextId = getScriptNode(nodeId).next;

  while (nextId && !visited.has(nextId)) {
    visited.add(nextId);

    const isBuilderStep = BUILDER_STEPS.some((step) => step.id === nextId);
    if (isBuilderStep) {
      return nextId;
    }

    nextId = getScriptNode(nextId).next;
  }

  return null;
}

export function RunnerView() {
  const [currentNodeId, setCurrentNodeId] = useState('start');
  const [highestUnlockedIndex, setHighestUnlockedIndex] = useState(0);
  const [lastTriggerResult, setLastTriggerResult] = useState<TriggerResult | null>(
    null
  );
  const [hoverDetail, setHoverDetail] = useState<HoverDetail | null>(null);

  const draft = useCharacterStore((state) => state.draft);
  const currentNode = getScriptNode(currentNodeId);
  const currentStepIndex = getStepIndex(currentNodeId);
  const nextVisibleStepId = getNextVisibleStepId(currentNodeId);

  useEffect(() => {
    setHoverDetail(null);
  }, [currentNodeId]);


  const activeStep = useMemo(
    () => BUILDER_STEPS[currentStepIndex] ?? BUILDER_STEPS[0],
    [currentStepIndex]
  );

  const moveToNode = (nodeId: string) => {
    const nextIndex = getStepIndex(nodeId);
    setCurrentNodeId(nodeId);
    setHighestUnlockedIndex((previous) => Math.max(previous, nextIndex));
  };

  const resetBuilder = () => {
    const initialDraft = useCharacterStore.getInitialState().draft;

    useCharacterStore.setState({
      draft: structuredClone(initialDraft),
    });

    setCurrentNodeId('start');
    setHighestUnlockedIndex(0);
    setLastTriggerResult(null);
    setHoverDetail(null);
  };

  const handleTriggerResolve = (result: TriggerResult) => {
    setLastTriggerResult(result);
    const { stayOnNode = false } = result as TriggerResult & TriggerResolveOptions;

    if (result.status === 'error') {
      throw new Error(result.message);
    }

    if (result.status === 'skip') {
      if (result.nextNodeId) {
        moveToNode(result.nextNodeId);
        return;
      }

      if (currentNode.next) {
        moveToNode(currentNode.next);
      }

      return;
    }

    if (result.patch) {
      useCharacterStore.setState((state) => ({
        draft: applyPatch(state.draft, result.patch),
      }));
    }

    if (stayOnNode) {
      return;
    }

    if (result.nextNodeId) {
      moveToNode(result.nextNodeId);
      return;
    }

    if (currentNode.next) {
      moveToNode(currentNode.next);
    }
  };

  let TriggerComponent = null;

  if (currentNode.trigger) {
    TriggerComponent = triggerRegistry[currentNode.trigger];

    if (!TriggerComponent) {
      throw new Error(`No trigger registered for: ${currentNode.trigger}`);
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100%',
        paddingRight: '0',
        boxSizing: 'border-box',
        fontFamily: "Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        letterSpacing: '0.25em',
        paddingBottom: '40px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginTop: '220px',
          marginBottom: '30px',
          marginLeft: '50px',
          marginRight: '50px',
          color: 'rgba(72, 66, 61, 0.92)',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
        }}
      >
        <button
          type="button"
          className="draconic-accent"
          onClick={resetBuilder}
          aria-label="Reset character builder"
          style={{
            fontSize: '6.45rem',
            lineHeight: 1,
            letterSpacing: '0.04em',
            color: '#6e92aa',
            flex: '0 0 96px',
            userSelect: 'none',
            border: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
          }}
        >
          A
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            justifyContent: 'space-between',
            flex: 1,
            minWidth: 0,
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            overflow: 'visible',
            transform: 'translateY(-18px)',
          }}
        >
          {BUILDER_STEPS.map((step, index) => {
            const isActive = step.id === activeStep.id;
            const isUnlocked = index <= highestUnlockedIndex;
            const isImmediateNext = step.id === nextVisibleStepId;
            const isClickable = isUnlocked || isImmediateNext;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (isClickable) {
                    moveToNode(step.id);
                  }
                }}
                disabled={!isClickable}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  cursor: isClickable ? 'pointer' : 'default',
                  color: isActive
                    ? 'rgba(58, 52, 48, 0.98)'
                    : isClickable
                      ? 'rgba(82, 76, 69, 0.84)'
                      : 'rgba(82, 76, 69, 0.42)',
                  fontSize: '1.07rem',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.12em',
                  textTransform: 'lowercase',
                  textDecoration: 'none',
                  boxShadow: 'none',
                  opacity: isClickable ? 1 : 0.6,
                  userSelect: 'none',
                }}
              >
                {step.label.toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          minHeight: 0,
          marginLeft: '160px',
          marginRight: '50px',
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: '48px',
          marginLeft: '160px',
          marginRight: '50px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            flex: '0 0 520px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
        {TriggerComponent && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <style>
              {`
                form button[type="submit"] {
                  display: none;
                }

                form {
                  gap: 10px;
                }

                form label {
                  display: none;
                }

                form input,
                form select,
                form textarea {
                  width: 100%;
                  max-width: 520px;
                  border: 1px solid rgba(112, 104, 96, 0.30);
                  background: rgba(255, 255, 255, 0.14);
                  color: rgba(58, 52, 48, 0.96);
                  padding: 12px 14px;
                  border-radius: 0;
                  font-size: 0.98rem;
                  font-weight: 500;
                  letter-spacing: 0.05em;
                  box-shadow: none;
                  display: block;
                  margin-left: 0;
                }

                form input::placeholder,
                form textarea::placeholder {
                  color: rgba(112, 104, 96, 0.54);
                }

                form input:focus,
                form select:focus,
                form textarea:focus {
                  border-color: rgba(94, 121, 145, 0.58);
                  outline: none;
                }
              `}
            </style>
            <TriggerComponent
              context={{
                trigger: currentNode.trigger,
                draft,
                nextNodeId: currentNode.next,
                setHoverDetail,
              } as any}
              onResolve={handleTriggerResolve}
            />
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: '200px',
          borderLeft: '1px solid rgba(112, 104, 96, 0.20)',
          paddingLeft: '24px',
          color: 'rgba(72, 66, 61, 0.92)',
          fontSize: '0.9rem',
          letterSpacing: '0.06em',
        }}
      >
        {hoverDetail}
      </div>
    </div>

      <DebugPanel
        currentNodeId={currentNodeId}
        currentNode={currentNode}
        draft={draft}
        lastTriggerResult={lastTriggerResult}
      />
    </div>
  );
}