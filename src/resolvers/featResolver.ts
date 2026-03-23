import featsData from '../../public/data/feats.json';

import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

type FeatRecord = {
  feat_id: string;
  name: string;
  type: string;
  notes?: string;
};

function buildOriginFeatField(name: 'originFeatId' | 'humanOriginFeatId'): ResolvedField {
  const originFeats = (featsData as FeatRecord[])
    .filter((feat) => feat.type === 'Origin')
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    name,
    title: name === 'humanOriginFeatId' ? 'Choose your second Origin feat' : 'Choose your Origin feat',
    type: 'string',
    enum: originFeats.map((feat) => feat.feat_id),
    enumNames: originFeats.map((feat) => feat.name),
    required: true,
    widget: 'hoverChoice',
  };
}

export function resolveFeatPicker(draft: CharacterDraft): ResolverOutput {
  const fields: ResolvedField[] = [buildOriginFeatField('originFeatId')];

  if (draft.identity?.speciesId === 'human') {
    fields.push(buildOriginFeatField('humanOriginFeatId'));
  }

  return {
    status: 'ready',
    fields,
  };
}
