

export type SpellOption = {
  value: string;
  label: string;
  level: number;
  school: string;
  classes: string[];
  ritual: boolean;
};

let cachedSpellOptions: SpellOption[] | null = null;

export function getCachedSpellOptions(): SpellOption[] {
  return cachedSpellOptions ?? [];
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

function parseBoolean(value: string | undefined): boolean {
  const normalized = (value ?? '').trim().toLowerCase();
  return (
    normalized === 'true' ||
    normalized === 'yes' ||
    normalized === '1' ||
    normalized === 'y'
  );
}

function parseClasses(value: string | undefined): string[] {
  return (value ?? '')
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseLevel(value: string | undefined): number {
  const parsed = Number((value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseSpells(text: string): SpellOption[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvRow(lines[0]).map((h) => h.trim());

  const idIndex = header.findIndex((column) =>
    ['spell_id', 'id'].includes(column)
  );
  const nameIndex = header.findIndex((column) => column === 'name');
  const levelIndex = header.findIndex((column) =>
    ['level', 'spell_level'].includes(column)
  );
  const schoolIndex = header.findIndex((column) => column === 'school');
  const classesIndex = header.findIndex((column) =>
    ['classes', 'class_list', 'class_lists'].includes(column)
  );
  const ritualIndex = header.findIndex((column) =>
    ['ritual', 'is_ritual'].includes(column)
  );

  if (idIndex === -1 || nameIndex === -1) return [];

  return lines.slice(1).flatMap((line) => {
    const cols = parseCsvRow(line);
    const id = cols[idIndex]?.trim();
    const name = cols[nameIndex]?.trim();

    if (!id || !name) return [];

    return [
      {
        value: id,
        label: name,
        level: parseLevel(levelIndex === -1 ? undefined : cols[levelIndex]),
        school: (schoolIndex === -1 ? '' : cols[schoolIndex])?.trim() ?? '',
        classes: parseClasses(classesIndex === -1 ? undefined : cols[classesIndex]),
        ritual: parseBoolean(ritualIndex === -1 ? undefined : cols[ritualIndex]),
      },
    ];
  });
}

async function ensureLoaded(): Promise<void> {
  if (cachedSpellOptions) return;

  const res = await fetch('/data/spells.csv');
  if (!res.ok) {
    cachedSpellOptions = [];
    return;
  }

  const text = await res.text();
  cachedSpellOptions = parseSpells(text);
}

export async function getSpellOptions(): Promise<SpellOption[]> {
  await ensureLoaded();
  return cachedSpellOptions ?? [];
}