

import { createElement, Fragment, type ReactNode } from 'react';

import type { HoverChoiceOption } from '../fields/HoverChoiceField';

type ResolvedFieldLike = {
  name: string;
  type: string;
  maxSelections?: number;
};

type CompactedFieldSummary = {
  summary: string;
};

type CompactedDetailArgs = {
  baseDetail: ReactNode;
  summary?: string;
};

export function getParentFieldId(fieldName: string): string | null {
  const separatorIndex = fieldName.indexOf('__');
  if (separatorIndex === -1) {
    return null;
  }

  return fieldName.slice(0, separatorIndex);
}

export function getFieldSelectionSummary(
  field: ResolvedFieldLike,
  value: string | string[] | undefined,
  options: HoverChoiceOption[]
): string | null {
  const values = Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === 'string' && value.trim()
      ? [value]
      : [];

  if (!values.length) {
    return null;
  }

  if (field.type === 'array' && field.maxSelections && values.length < field.maxSelections) {
    return null;
  }

  const optionMap = new Map(options.map((option) => [option.value, option.label]));
  const labels = values
    .map((entry) => optionMap.get(entry) ?? entry)
    .filter(Boolean);

  return labels.length ? labels.join(', ') : null;
}

export function groupFollowupFieldsByParent<TField extends { name: string }>(
  fields: TField[]
): Map<string, TField[]> {
  const map = new Map<string, TField[]>();

  fields.forEach((field) => {
    const parentFieldId = getParentFieldId(field.name);
    if (!parentFieldId) {
      return;
    }

    const existing = map.get(parentFieldId) ?? [];
    existing.push(field);
    map.set(parentFieldId, existing);
  });

  return map;
}

export function buildFollowupSummaryByParent<TField extends ResolvedFieldLike>(args: {
  fieldsByParent: Map<string, TField[]>;
  getValue: (fieldName: string) => string | string[] | undefined;
  getOptions: (fieldName: string) => HoverChoiceOption[];
}): Map<string, string> {
  const map = new Map<string, string>();

  args.fieldsByParent.forEach((fields, parentFieldId) => {
    const parts = fields
      .map((field) =>
        getFieldSelectionSummary(field, args.getValue(field.name), args.getOptions(field.name))
      )
      .filter((part): part is string => Boolean(part));

    if (parts.length) {
      map.set(parentFieldId, parts.join(' | '));
    }
  });

  return map;
}

export function appendSummaryToLabel(label: string, summary?: string): string {
  if (!summary) {
    return label;
  }

  return `${label} | ${summary}`;
}

export function buildCompactedFieldSummary(summary?: string): CompactedFieldSummary | null {
  if (!summary) {
    return null;
  }

  return { summary };
}

export function renderCompactedSelectionDetail({
  baseDetail,
  summary,
}: CompactedDetailArgs): ReactNode {
  if (!summary) {
    return baseDetail;
  }

  return createElement(
    Fragment,
    null,
    baseDetail,
    createElement(
      'div',
      { style: { lineHeight: 1.5, marginTop: '14px' } },
      createElement(
        'span',
        { className: 'h2', style: { marginRight: '8px', color: '#6e92aa' } },
        'Selected'
      ),
      createElement('span', null, summary)
    )
  );
}