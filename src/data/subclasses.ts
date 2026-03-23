export type SubclassOption = {
  value: string; // subclass_id
  label: string; // subclass name
  description: string;
};

let cache: Record<string, SubclassOption[]> | null = null;

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

function parseCsv(text: string): Record<string, SubclassOption[]> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return {};

  const header = parseCsvRow(lines[0]).map((h) => h.trim());

  const classIdIndex = header.indexOf('class_id');
  const subclassIdIndex = header.indexOf('subclass_id');
  const subclassNameIndex = header.indexOf('subclass_name');
  const descriptionIndex = header.indexOf('description');

  if (
    classIdIndex === -1 ||
    subclassIdIndex === -1 ||
    subclassNameIndex === -1 ||
    descriptionIndex === -1
  ) {
    return {};
  }

  const output: Record<string, SubclassOption[]> = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);

    const classId = cols[classIdIndex]?.trim();
    const subclassId = cols[subclassIdIndex]?.trim();
    const subclassName = cols[subclassNameIndex]?.trim();
    const description = (cols[descriptionIndex]?.trim() ?? '').replace(/^"|"$/g, '');

    if (!classId || !subclassId || !subclassName) continue;

    if (!output[classId]) {
      output[classId] = [];
    }

    output[classId].push({
      value: subclassId,
      label: subclassName,
      description,
    });
  }

  return output;
}

export async function getSubclassOptionsForClass(
  classId: string
): Promise<SubclassOption[]> {
  if (!classId) return [];

  if (!cache) {
    const res = await fetch('/data/subclasses.csv');
    if (!res.ok) return [];

    const text = await res.text();
    cache = parseCsv(text);
  }

  return cache[classId] ?? [];
}