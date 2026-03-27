
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getClassOptions } from '../data/classes';
import { resolvePool } from '../data/classFeaturePools';
import { getSkillOptions } from '../data/skills';
import { getSpellOptions } from '../data/spells';
import { getSubclassOptionsForClass } from '../data/subclasses';
import { getToolOptions } from '../data/tools';
import { getWeaponOptions } from '../data/weapons';
import { resolveClassFeaturePicker } from '../resolvers/classFeatureResolver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

const DATA_DIR_CANDIDATES = [
  path.join(PROJECT_ROOT, 'public', 'data'),
  path.join(PROJECT_ROOT, 'data', 'public'),
  path.join(PROJECT_ROOT, 'data'),
];

const originalFetch = globalThis.fetch?.bind(globalThis);

async function resolveLocalDataPath(urlPath: string): Promise<string> {
  const relativePath = urlPath.replace(/^\/+/, '');

  for (const baseDir of DATA_DIR_CANDIDATES) {
    const candidate = path.join(baseDir, relativePath.replace(/^data\//, ''));
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(`Could not resolve local data file for ${urlPath}`);
}

function getContentType(filePath: string): string {
  if (filePath.endsWith('.csv')) return 'text/csv';
  if (filePath.endsWith('.json')) return 'application/json';
  return 'text/plain';
}

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  if (typeof url === 'string' && url.startsWith('/data/')) {
    const filePath = await resolveLocalDataPath(url);
    const body = await readFile(filePath, 'utf8');

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': getContentType(filePath),
      },
    });
  }

  if (!originalFetch) {
    throw new Error(`No fetch available for non-local request: ${url}`);
  }

  return originalFetch(input as any, init);
}) as typeof fetch;

type IdentityDraft = {
  classId?: string;
  subclassId?: string;
  level?: number;
  speciesId?: string;
  backgroundId?: string;
};

type ProficienciesDraft = {
  skills?: string[];
  weapons?: string[];
  armor?: string[];
  tools?: string[];
};

type AuditDraft = {
  identity: IdentityDraft;
  proficiencies: ProficienciesDraft;
  classFeatureSelections?: Record<string, string | string[] | undefined>;
  featFollowupSelections?: Record<string, string | string[] | undefined>;
  featSlots?: Array<{ id: string; selectedFeatId?: string }>;
  abilityContributions?: {
    background?: Record<string, number>;
    class?: Record<string, number>;
    other?: Record<string, number>;
  };
  abilities?: Record<string, number>;
};

type ChoiceField = {
  name: string;
  title: string;
  type: string;
  enum?: string[];
  enumNames?: string[];
  maxSelections?: number;
  choice?: {
    count?: number;
    pool?: string;
    options?: Array<{
      value: string;
      label: string;
      detail?: string;
    }>;
  };
};

type PoolOption = {
  value: string;
  label: string;
  detail?: string;
  masteryTrait?: string;
  masteryDetails?: string;
};

type ExpandedOption = {
  value: string;
  label: string;
  detail?: string;
  masteryTrait?: string;
  masteryDetails?: string;
};

type AuditIssueSeverity = 'error' | 'warning';

type AuditIssue = {
  severity: AuditIssueSeverity;
  classId: string;
  subclassId?: string;
  level: number;
  fieldName?: string;
  title?: string;
  message: string;
};

type FieldAuditResult = {
  classId: string;
  subclassId?: string;
  level: number;
  fieldName: string;
  title: string;
  type: string;
  maxSelections?: number;
  source: 'enum' | 'inline-options' | 'pool' | 'none';
  pool?: string;
  optionCount: number;
  spellOptionCount: number;
  weaponMasteryOptionCount: number;
  issues: AuditIssue[];
};

type CombinationSummary = {
  classId: string;
  subclassId?: string;
  level: number;
  fieldCount: number;
  fields: string[];
};

type AuditReport = {
  generatedAt: string;
  combinationCount: number;
  fieldCount: number;
  issueCount: number;
  combinationsWithNoFields: CombinationSummary[];
  fieldResults: FieldAuditResult[];
  issues: AuditIssue[];
};

const LEVELS = Array.from({ length: 20 }, (_, index) => index + 1);


function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function makeBaselineDraft(classId: string, subclassId: string | undefined, level: number): AuditDraft {
  return {
    identity: {
      classId,
      subclassId,
      level,
      speciesId: 'human',
      backgroundId: 'acolyte',
    },
    proficiencies: {
      skills: [],
      weapons: [],
      armor: [],
      tools: [],
    },
    classFeatureSelections: {},
    featFollowupSelections: {},
    featSlots: [],
    abilityContributions: {
      background: {},
      class: {},
      other: {},
    },
    abilities: {
      STR: 10,
      DEX: 10,
      CON: 10,
      INT: 10,
      WIS: 10,
      CHA: 10,
    },
  };
}


function detectSource(field: ChoiceField): FieldAuditResult['source'] {
  if (field.choice?.options?.length) {
    return 'inline-options';
  }

  if (field.enum?.length) {
    return 'enum';
  }

  if (field.choice?.pool) {
    return 'pool';
  }

  return 'none';
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function looksSpellRelated(field: ChoiceField, options: ExpandedOption[], spellIds: Set<string>): boolean {
  if (options.some((option) => spellIds.has(option.value))) {
    return true;
  }

  const poolName = normalizeString(field.choice?.pool);
  const fieldName = normalizeString(field.name);

  return poolName.includes('spell') || fieldName.includes('spell');
}

function looksWeaponMasteryField(field: ChoiceField): boolean {
  const haystack = [field.name, field.title, field.choice?.pool]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes('weapon_mastery') || haystack.includes('weapon mastery');
}

async function expandFieldOptions(field: ChoiceField, draft: AuditDraft): Promise<ExpandedOption[]> {
  if (field.choice?.options?.length) {
    return field.choice.options.map((option) => ({
      value: option.value,
      label: option.label,
      detail: option.detail,
    }));
  }

  if (field.enum?.length) {
    return field.enum.map((value, index) => ({
      value,
      label: field.enumNames?.[index] ?? value,
    }));
  }

  if (typeof field.choice?.pool === 'string' && field.choice.pool.trim()) {
    try {
      const resolved = await resolvePool(field.choice.pool, {
        draft: draft as never,
      });

      return (resolved as PoolOption[]).map((option) => ({
        value: option.value,
        label: option.label,
        detail: option.detail,
        masteryTrait: option.masteryTrait,
        masteryDetails: option.masteryDetails,
      }));
    } catch {
      return [];
    }
  }

  return [];
}

function validateField(
  field: ChoiceField,
  options: ExpandedOption[],
  classId: string,
  subclassId: string | undefined,
  level: number,
  spellIds: Set<string>
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const base = {
    classId,
    subclassId,
    level,
    fieldName: field.name,
    title: field.title,
  };

  if (!field.name?.trim()) {
    issues.push({
      ...base,
      severity: 'error',
      message: 'Field is missing a name.',
    });
  }

  if (!field.title?.trim()) {
    issues.push({
      ...base,
      severity: 'error',
      message: 'Field is missing a title.',
    });
  }

  if (
    field.choice &&
    'pool' in field.choice &&
    field.choice.pool !== undefined &&
    typeof field.choice.pool !== 'string'
  ) {
    issues.push({
      ...base,
      severity: 'error',
      message: 'Field has a non-string pool value.',
    });
  }

  if (field.choice?.count && field.choice.count > 1) {
    if (field.type !== 'array') {
      issues.push({
        ...base,
        severity: 'error',
        message: `Multi-select field reports type \`${field.type}\` instead of \`array\`.`,
      });
    }

    if (field.maxSelections !== field.choice.count) {
      issues.push({
        ...base,
        severity: 'error',
        message: `Multi-select field count is ${field.choice.count} but maxSelections is ${String(field.maxSelections)}.`,
      });
    }
  }

  if (detectSource(field) === 'none') {
    issues.push({
      ...base,
      severity: 'error',
      message: 'Field has no enum, no inline choice options, and no pool.',
    });
  }

  if (detectSource(field) !== 'none' && options.length === 0) {
    issues.push({
      ...base,
      severity: 'error',
      message: 'Field resolved zero options.',
    });
  }

  const emptyValueOptions = options.filter((option) => !option.value?.trim());
  if (emptyValueOptions.length > 0) {
    issues.push({
      ...base,
      severity: 'error',
      message: `${emptyValueOptions.length} option(s) are missing a value.`,
    });
  }

  const emptyLabelOptions = options.filter((option) => !option.label?.trim());
  if (emptyLabelOptions.length > 0) {
    issues.push({
      ...base,
      severity: 'error',
      message: `${emptyLabelOptions.length} option(s) are missing a label.`,
    });
  }

  const duplicateValues = options
    .map((option) => option.value)
    .filter((value, index, values) => values.indexOf(value) !== index);

  if (duplicateValues.length > 0) {
    issues.push({
      ...base,
      severity: 'warning',
      message: `Duplicate option values detected: ${unique(duplicateValues).join(', ')}.`,
    });
  }

  if (looksWeaponMasteryField(field)) {
    const masteryProblems = options.filter(
      (option) => !option.masteryTrait || !option.masteryDetails
    );

    if (masteryProblems.length > 0) {
      issues.push({
        ...base,
        severity: 'warning',
        message: `${masteryProblems.length} weapon mastery option(s) are missing mastery metadata.`,
      });
    }
  }

  if (looksSpellRelated(field, options, spellIds)) {
    const matchingSpellOptions = options.filter((option) => spellIds.has(option.value));

    if (matchingSpellOptions.length === 0) {
      issues.push({
        ...base,
        severity: 'warning',
        message: 'Field looks spell-related but resolved no recognized spell options.',
      });
    }
  }

  return issues;
}

async function auditCombination(
  classId: string,
  subclassId: string | undefined,
  level: number,
  spellIds: Set<string>
): Promise<{ summary: CombinationSummary; fieldResults: FieldAuditResult[]; issues: AuditIssue[] }> {
  const draft = makeBaselineDraft(classId, subclassId, level);
  const resolved = resolveClassFeaturePicker(draft as never);

  if (resolved.status !== 'ready') {
    return {
      summary: {
        classId,
        subclassId,
        level,
        fieldCount: 0,
        fields: [],
      },
      fieldResults: [],
      issues: [],
    };
  }

  const fields = (resolved.fields ?? []) as ChoiceField[];
  const fieldResults: FieldAuditResult[] = [];
  const issues: AuditIssue[] = [];

  for (const field of fields) {
    const options = await expandFieldOptions(field, draft);
    const fieldIssues = validateField(field, options, classId, subclassId, level, spellIds);

    fieldResults.push({
      classId,
      subclassId,
      level,
      fieldName: field.name,
      title: field.title,
      type: field.type,
      maxSelections: field.maxSelections,
      source: detectSource(field),
      pool: field.choice?.pool,
      optionCount: options.length,
      spellOptionCount: options.filter((option) => spellIds.has(option.value)).length,
      weaponMasteryOptionCount: options.filter((option) => Boolean(option.masteryTrait)).length,
      issues: fieldIssues,
    });

    issues.push(...fieldIssues);
  }

  return {
    summary: {
      classId,
      subclassId,
      level,
      fieldCount: fields.length,
      fields: fields.map((field) => field.name),
    },
    fieldResults,
    issues,
  };
}

function printReport(report: AuditReport) {
  const groupedByClass = new Map<string, FieldAuditResult[]>();

  report.fieldResults.forEach((result) => {
    const key = result.classId;
    const existing = groupedByClass.get(key) ?? [];
    existing.push(result);
    groupedByClass.set(key, existing);
  });

  console.log('=== Class Feature Choice Audit ===');
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Class/subclass/level combinations checked: ${report.combinationCount}`);
  console.log(`Choice fields found: ${report.fieldCount}`);
  console.log(`Issues found: ${report.issueCount}`);
  console.log('');

  if (report.combinationsWithNoFields.length > 0) {
    console.log('--- Combinations with no fields ---');
    report.combinationsWithNoFields.slice(0, 50).forEach((entry) => {
      console.log(
        `${entry.classId}${entry.subclassId ? ` / ${entry.subclassId}` : ''} / level ${entry.level}`
      );
    });
    console.log('');
  }

  console.log('--- Field counts by class ---');
  Array.from(groupedByClass.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([classId, results]) => {
      console.log(`${classId}: ${results.length}`);
    });
  console.log('');

  if (report.issues.length > 0) {
    console.log('--- Issues ---');
    report.issues.forEach((issue) => {
      console.log(
        `[${issue.severity.toUpperCase()}] ${issue.classId}${issue.subclassId ? ` / ${issue.subclassId}` : ''} / level ${issue.level}${issue.fieldName ? ` / ${issue.fieldName}` : ''}: ${issue.message}`
      );
    });
    console.log('');
  }

  console.log('--- JSON report ---');
  console.log(JSON.stringify(report, null, 2));
}

export async function auditClassFeatureChoices(): Promise<AuditReport> {
  await Promise.all([
    getSkillOptions(),
    getSpellOptions(),
    getToolOptions(),
    getWeaponOptions(),
  ]);

  const classOptions = await getClassOptions();
  const spellOptions = await getSpellOptions();
  const spellIds = new Set(spellOptions.map((spell) => spell.value));

  const combinationsWithNoFields: CombinationSummary[] = [];
  const fieldResults: FieldAuditResult[] = [];
  const issues: AuditIssue[] = [];
  let combinationCount = 0;

  for (const classOption of classOptions) {
    const subclassOptions = await getSubclassOptionsForClass(classOption.value);
    const normalizedSubclasses = subclassOptions.length > 0
      ? subclassOptions.map((option) => option.value)
      : [undefined];

    for (const subclassId of normalizedSubclasses) {
      for (const level of LEVELS) {
        combinationCount += 1;

        const audited = await auditCombination(classOption.value, subclassId, level, spellIds);

        fieldResults.push(...audited.fieldResults);
        issues.push(...audited.issues);

        if (audited.summary.fieldCount === 0) {
          combinationsWithNoFields.push(audited.summary);
        }
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    combinationCount,
    fieldCount: fieldResults.length,
    issueCount: issues.length,
    combinationsWithNoFields,
    fieldResults,
    issues,
  };
}

void auditClassFeatureChoices()
  .then(async (report) => {
    printReport(report);

    const outputDir = path.join(PROJECT_ROOT, 'audit_output');
    const jsonPath = path.join(outputDir, 'classFeatureAudit.json');
    const textPath = path.join(outputDir, 'classFeatureAudit.txt');

    try {
      await mkdir(outputDir, { recursive: true });
      await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');

      const textSummary = [
        '=== Class Feature Choice Audit ===',
        `Generated: ${report.generatedAt}`,
        `Combinations checked: ${report.combinationCount}`,
        `Fields: ${report.fieldCount}`,
        `Issues: ${report.issueCount}`,
        '',
        '--- Issues ---',
        ...report.issues.map(
          (issue) =>
            `[${issue.severity.toUpperCase()}] ${issue.classId}${
              issue.subclassId ? ` / ${issue.subclassId}` : ''
            } / level ${issue.level}${
              issue.fieldName ? ` / ${issue.fieldName}` : ''
            }: ${issue.message}`
        ),
      ].join('\n');

      await writeFile(textPath, textSummary, 'utf8');

      console.log('');
      console.log(`Audit written to:`);
      console.log(`- ${jsonPath}`);
      console.log(`- ${textPath}`);
    } catch (err) {
      console.error('Failed to write audit output files.');
      console.error(err);
    }
  })
  .catch((error) => {
    console.error('Class feature choice audit failed.');
    console.error(error);
  });