

import featsData from './feats.json';

export type FeatRecord = {
  feat_id: string;
  name: string;
  type: string;
  min_level: number;
  requirements?: Record<string, unknown>;
  effects?: Record<string, unknown>;
  notes?: string;
};

const cachedFeatRecords: FeatRecord[] = Array.isArray(featsData)
  ? (featsData as FeatRecord[])
  : [];

export function getFeatRecords(): FeatRecord[] {
  return cachedFeatRecords;
}

export function getCachedFeatRecords(): FeatRecord[] {
  return cachedFeatRecords;
}

export function getFeatById(featId: string | undefined): FeatRecord | undefined {
  if (!featId) {
    return undefined;
  }

  return cachedFeatRecords.find((feat) => feat.feat_id === featId);
}