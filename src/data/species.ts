export type SpeciesOption = {
  value: string;
  label: string;
  size: string;
  speed: string;
  senses: string;
  resistances: string;
  languages: string;
};

let cachedSpeciesOptions: SpeciesOption[] | null = null;

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

function parseSpecies(text: string): SpeciesOption[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvRow(lines[0]).map((h) => h.trim());

  const speciesIdIndex = header.indexOf('species_id');
  const nameIndex = header.indexOf('name');
  const sizeIndex = header.indexOf('size');
  const speedIndex = header.indexOf('speed');
  const sensesIndex = header.indexOf('senses');
  const resistancesIndex = header.indexOf('resistances');
  const languagesIndex = header.indexOf('languages');

  if (
    speciesIdIndex === -1 ||
    nameIndex === -1 ||
    sizeIndex === -1 ||
    speedIndex === -1 ||
    sensesIndex === -1 ||
    resistancesIndex === -1 ||
    languagesIndex === -1
  ) {
    return [];
  }

  const seen = new Set<string>();
  const results: SpeciesOption[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvRow(lines[i]);

    const speciesId = cols[speciesIdIndex]?.trim();
    const name = cols[nameIndex]?.trim();

    if (!speciesId || !name || seen.has(speciesId)) continue;

    seen.add(speciesId);

    results.push({
      value: speciesId,
      label: name,
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
  if (cachedSpeciesOptions) return;

  const res = await fetch('/data/species.csv');
  if (!res.ok) {
    cachedSpeciesOptions = [];
    return;
  }

  const text = await res.text();
  cachedSpeciesOptions = parseSpecies(text);
}

export async function getSpeciesOptions(): Promise<SpeciesOption[]> {
  await ensureLoaded();
  return cachedSpeciesOptions ?? [];
}