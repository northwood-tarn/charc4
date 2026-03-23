

export type LanguageOption = {
  value: string;
  label: string;
};

let cachedLanguageOptions: LanguageOption[] | null = null;

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

function parseLanguages(text: string): LanguageOption[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvRow(lines[0]).map((h) => h.trim());
  const idIndex = header.indexOf('id');
  const nameIndex = header.indexOf('name');

  if (idIndex === -1 || nameIndex === -1) return [];

  return lines.slice(1).flatMap((line) => {
    const cols = parseCsvRow(line);
    const id = cols[idIndex]?.trim();
    const name = cols[nameIndex]?.trim();

    if (!id || !name) return [];

    return [{ value: id, label: name }];
  });
}

async function ensureLoaded(): Promise<void> {
  if (cachedLanguageOptions) return;

  const res = await fetch('/data/languages.csv');
  if (!res.ok) {
    cachedLanguageOptions = [];
    return;
  }

  const text = await res.text();
  cachedLanguageOptions = parseLanguages(text);
}

export async function getLanguageOptions(): Promise<LanguageOption[]> {
  await ensureLoaded();
  return cachedLanguageOptions ?? [];
}