

export type SkillOption = {
  value: string;
  label: string;
  abilityId: string;
  abilityName: string;
};

let cachedSkillOptions: SkillOption[] | null = null;

export function getCachedSkillOptions(): SkillOption[] {
  return cachedSkillOptions ?? [];
}

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

function parseSkills(text: string): SkillOption[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvRow(lines[0]).map((h) => h.trim());
  const idIndex = header.indexOf('skill_id');
  const nameIndex = header.indexOf('skill_name');
  const abilityIdIndex = header.indexOf('ability_id');
  const abilityNameIndex = header.indexOf('ability_name');

  if (
    idIndex === -1 ||
    nameIndex === -1 ||
    abilityIdIndex === -1 ||
    abilityNameIndex === -1
  ) {
    return [];
  }

  return lines.slice(1).flatMap((line) => {
    const cols = parseCsvRow(line);
    const id = cols[idIndex]?.trim();
    const name = cols[nameIndex]?.trim();
    const abilityId = cols[abilityIdIndex]?.trim();
    const abilityName = cols[abilityNameIndex]?.trim();

    if (!id || !name || !abilityId || !abilityName) return [];

    return [{ value: id, label: name, abilityId, abilityName }];
  });
}

async function ensureLoaded(): Promise<void> {
  if (cachedSkillOptions) return;

  const res = await fetch('/data/skills.csv');
  if (!res.ok) {
    cachedSkillOptions = [];
    return;
  }

  const text = await res.text();
  cachedSkillOptions = parseSkills(text);
}

export async function getSkillOptions(): Promise<SkillOption[]> {
  await ensureLoaded();
  return cachedSkillOptions ?? [];
}