export type LineageOption = {
  value: string;
  label: string;
  speciesId: string;
  size: string;
  speed: string;
  senses: string;
  resistances: string;
  languages: string;
};

let cachedLineageOptionsBySpecies: Record<string, LineageOption[]> | null = null;

function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i += 1) {
    const char = row[i];

    if (char === '"') {
      const nextChar = row[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function parseLineages(text: string): Record<string, LineageOption[]> {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return {};

  const header = parseCsvRow(lines[0]).map((h) => h.trim());

  const speciesIdIndex = header.indexOf('species_id');
  const lineageIdIndex = header.indexOf('lineage_id');
  const lineageNameIndex = header.indexOf('lineage_name');
  const sizeIndex = header.indexOf('size');
  const speedIndex = header.indexOf('speed');
  const sensesIndex = header.indexOf('senses');
  const resistancesIndex = header.indexOf('resistances');
  const languagesIndex = header.indexOf('languages');

  if (
    speciesIdIndex === -1 ||
    lineageIdIndex === -1 ||
    lineageNameIndex === -1 ||
    sizeIndex === -1 ||
    speedIndex === -1 ||
    sensesIndex === -1 ||
    resistancesIndex === -1 ||
    languagesIndex === -1
  ) {
    return {};
  }

  const results: Record<string, LineageOption[]> = {};
  const seenKeys = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvRow(lines[i]);

    const speciesId = cols[speciesIdIndex]?.trim();
    const lineageId = cols[lineageIdIndex]?.trim();
    const lineageName = cols[lineageNameIndex]?.trim();

    if (!speciesId || !lineageId || !lineageName) continue;

    const dedupeKey = `${speciesId}::${lineageId}`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    if (!results[speciesId]) {
      results[speciesId] = [];
    }

    results[speciesId].push({
      value: lineageId,
      label: lineageName,
      speciesId,
      size: cols[sizeIndex]?.trim() ?? '',
      speed: cols[speedIndex]?.trim() ?? '',
      senses: cols[sensesIndex]?.trim() ?? '',
      resistances: cols[resistancesIndex]?.trim() ?? '',
      languages: cols[languagesIndex]?.trim() ?? '',
    });
  }

  return results;
}

async function ensureLoaded(): Promise<void> {
  if (cachedLineageOptionsBySpecies) return;

  const res = await fetch('/data/species.csv');
  if (!res.ok) {
    cachedLineageOptionsBySpecies = {};
    return;
  }

  const text = await res.text();
  cachedLineageOptionsBySpecies = parseLineages(text);
}

export async function getLineageOptionsForSpecies(
  speciesId: string
): Promise<LineageOption[]> {
  if (!speciesId) return [];

  await ensureLoaded();
  return cachedLineageOptionsBySpecies?.[speciesId] ?? [];
}
