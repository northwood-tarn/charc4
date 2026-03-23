import yaml from 'js-yaml';
import scriptRaw from '../script/plain.yaml?raw';

import { TRIGGER_NAMES } from './triggerNames';
import type { ScriptNode } from './types';

const allowedTriggerNames = new Set(Object.values(TRIGGER_NAMES));

function validateScriptNodes(nodes: ScriptNode[]): void {
  const seenIds = new Set<string>();

  for (const node of nodes) {
    if (!node.id || typeof node.id !== 'string') {
      throw new Error('Every script node must have a non-empty string id.');
    }

    if (seenIds.has(node.id)) {
      throw new Error(`Duplicate script node id found: ${node.id}`);
    }

    seenIds.add(node.id);

    if (node.text !== undefined && typeof node.text !== 'string') {
      throw new Error(`Script node "${node.id}" has a non-string text value.`);
    }

    if (node.next !== undefined && typeof node.next !== 'string') {
      throw new Error(`Script node "${node.id}" has a non-string next value.`);
    }

    if (node.trigger !== undefined) {
      if (typeof node.trigger !== 'string') {
        throw new Error(`Script node "${node.id}" has a non-string trigger value.`);
      }

      if (!allowedTriggerNames.has(node.trigger)) {
        throw new Error(
          `Script node "${node.id}" uses unknown trigger: ${node.trigger}`
        );
      }
    }
  }

  for (const node of nodes) {
    if (node.next && !seenIds.has(node.next)) {
      throw new Error(
        `Script node "${node.id}" points to missing next node: ${node.next}`
      );
    }
  }
}

const loadedScript = yaml.load(scriptRaw);

if (!Array.isArray(loadedScript)) {
  throw new Error('Script YAML must load to an array of nodes.');
}

const scriptNodes = loadedScript as ScriptNode[];

validateScriptNodes(scriptNodes);

const nodeMap = new Map(scriptNodes.map((node) => [node.id, node]));

export function getScriptNode(id: string): ScriptNode {
  const node = nodeMap.get(id);
  if (!node) {
    throw new Error(`Script node not found: ${id}`);
  }
  return node;
}