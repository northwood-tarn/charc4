export type BackgroundOption = {
  value: string;
  label: string;
  feat: string;
  asiOptions: string;
  skillProfs: string;
  toolProf: string;
};


let cachedOptions: BackgroundOption[] | null = null;

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

function parseCsv(text: string): BackgroundOption[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const header = parseCsvRow(lines[0]).map((h) => h.trim());
  const idIndex = header.indexOf('id');
  const nameIndex = header.indexOf('name');
  const featIndex = header.indexOf('feat');
  const asiOptionsIndex = header.indexOf('asi_options');
  const skillProfsIndex = header.indexOf('skill_profs');
  const toolProfIndex = header.indexOf('tool_prof');

  if (
    idIndex === -1 ||
    nameIndex === -1 ||
    featIndex === -1 ||
    asiOptionsIndex === -1 ||
    skillProfsIndex === -1 ||
    toolProfIndex === -1
  ) {
    return [];
  }

  const options: BackgroundOption[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]).map((c) => c.trim());

    const id = cols[idIndex];
    const name = cols[nameIndex];
    const feat = cols[featIndex];
    const asiOptions = cols[asiOptionsIndex];
    const rawSkillProfs = cols[skillProfsIndex];
    const skillProfs = rawSkillProfs
      ? rawSkillProfs
          .split('|')
          .map((entry) => normalizeSkillId(entry.trim()))
          .filter((entry) => entry.length > 0)
          .join('|')
      : '';
    const toolProf = cols[toolProfIndex];

    if (!id || !name) continue;

    options.push({
      value: id,
      label: name,
      feat: feat ?? '',
      asiOptions: asiOptions ?? '',
      skillProfs: skillProfs ?? '',
      toolProf: toolProf ?? '',
    });
  }

  return options;
}

export async function getBackgroundOptions(): Promise<BackgroundOption[]> {
  if (cachedOptions) {
    return cachedOptions;
  }

  const res = await fetch('/data/backgrounds.csv');
  if (!res.ok) {
    return [];
  }

  const text = await res.text();
  const options = parseCsv(text);

  cachedOptions = options;
  return options;
}