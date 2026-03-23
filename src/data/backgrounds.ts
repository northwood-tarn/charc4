export type BackgroundOption = {
  value: string;
  label: string;
  feat: string;
  asiOptions: string;
  skillProfs: string;
  toolProf: string;
};

let cachedOptions: BackgroundOption[] | null = null;

function parseCsv(text: string): BackgroundOption[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const header = lines[0].split(',').map((h) => h.trim());
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
    const cols = lines[i].split(',').map((c) => c.trim());

    const id = cols[idIndex];
    const name = cols[nameIndex];
    const feat = cols[featIndex];
    const asiOptions = cols[asiOptionsIndex];
    const skillProfs = cols[skillProfsIndex];
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