export type ClassOption = {
  value: string;
  label: string;
  description: string;
  abilityPriority: string;
  skillProfs: string;
};


let cachedOptions: ClassOption[] | null = null;

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

function normalizeSkillId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseCsv(text: string): ClassOption[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvRow(lines[0]).map((h) => h.trim());
  const idIndex = header.indexOf('id');
  const nameIndex = header.indexOf('name');
  const descriptionIndex = header.indexOf('description');
  const abilityPriorityIndex = header.indexOf('ability_priority');
  const skillProfsIndex = header.indexOf('default_skills');

  if (
    idIndex === -1 ||
    nameIndex === -1 ||
    descriptionIndex === -1 ||
    abilityPriorityIndex === -1
  ) {
    return [];
  }

  const options: ClassOption[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]).map((c) => c.trim());

    const id = cols[idIndex];
    const name = cols[nameIndex];
    const description = cols[descriptionIndex] ?? '';
    const abilityPriority = cols[abilityPriorityIndex] ?? '';
    const rawSkillProfs = skillProfsIndex === -1 ? '' : cols[skillProfsIndex] ?? '';
    const skillProfs = rawSkillProfs
      ? rawSkillProfs
          .split('|')
          .map((entry) => normalizeSkillId(entry.trim()))
          .filter((entry) => entry.length > 0)
          .join('|')
      : '';

    if (!id || !name) continue;

    options.push({ value: id, label: name, description, abilityPriority, skillProfs });
  }

  return options;
}

export async function getClassOptions(): Promise<ClassOption[]> {
  if (cachedOptions) return cachedOptions;

  const res = await fetch('/data/classes.csv');
  if (!res.ok) return [];

  const text = await res.text();
  const options = parseCsv(text);

  cachedOptions = options;
  return options;
}