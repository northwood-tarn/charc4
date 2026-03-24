

export type ToolOption = {
  value: string;
  label: string;
  toolType: string;
};

let cachedToolOptions: ToolOption[] | null = null;

export function getCachedToolOptions(): ToolOption[] {
  return cachedToolOptions ?? [];
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

function parseTools(text: string): ToolOption[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvRow(lines[0]).map((h) => h.trim());
  const idIndex = header.indexOf('tool_id');
  const nameIndex = header.indexOf('tool_name');
  const typeIndex = header.indexOf('tool_type');

  if (idIndex === -1 || nameIndex === -1 || typeIndex === -1) return [];

  return lines.slice(1).flatMap((line) => {
    const cols = parseCsvRow(line);
    const id = cols[idIndex]?.trim();
    const name = cols[nameIndex]?.trim();
    const toolType = cols[typeIndex]?.trim();

    if (!id || !name || !toolType) return [];

    return [{ value: id, label: name, toolType }];
  });
}

async function ensureLoaded(): Promise<void> {
  if (cachedToolOptions) return;

  const res = await fetch('/data/tools.csv');
  if (!res.ok) {
    cachedToolOptions = [];
    return;
  }

  const text = await res.text();
  cachedToolOptions = parseTools(text);
}

export async function getToolOptions(): Promise<ToolOption[]> {
  await ensureLoaded();
  return cachedToolOptions ?? [];
}