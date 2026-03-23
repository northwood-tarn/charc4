export type ClassOption = {
  value: string;
  label: string;
  description: string;
  abilityPriority: string;
};

let cachedOptions: ClassOption[] | null = null;

function parseCsv(text: string): ClassOption[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim());
  const idIndex = header.indexOf('id');
  const nameIndex = header.indexOf('name');
  const descriptionIndex = header.indexOf('description');
  const abilityPriorityIndex = header.indexOf('ability_priority');

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
    const cols = lines[i].split(',').map((c) => c.trim());

    const id = cols[idIndex];
    const name = cols[nameIndex];
    const description = cols[descriptionIndex] ?? '';
    const abilityPriority = cols[abilityPriorityIndex] ?? '';

    if (!id || !name) continue;

    options.push({ value: id, label: name, description, abilityPriority });
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