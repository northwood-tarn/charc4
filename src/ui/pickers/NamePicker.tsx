import { useEffect } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';


import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveNamePicker } from '../../resolvers/nameResolver';
import { buildSchemaFromFields } from '../../schema/schemaBuilder';

export function NamePicker({ context, onResolve }: TriggerComponentProps) {
  const currentName = context.draft.identity?.name;
  const resolved = resolveNamePicker(context.draft);
  const shouldSkip = resolved.status === 'skip';

  useEffect(() => {
    if (shouldSkip) {
      onResolve({ status: 'skip' });
    }
  }, [shouldSkip, onResolve]);

  if (shouldSkip) {
    return null;
  }

  const { schema, uiSchema } = buildSchemaFromFields(resolved.fields);

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      validator={validator}
      formData={{ name: currentName ?? '' }}
      onChange={({ formData }) => {
        const name = String(formData?.name ?? '');

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              name,
            },
          },
          stayOnNode: true,
        });
      }}
      onKeyDownCapture={(event) => {
        if (event.key !== 'Enter') {
          return;
        }

        event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
        form.requestSubmit();
      }}
      onSubmit={({ formData }) => {
        const name = String(formData.name ?? '').trim();

        if (!name) {
          return;
        }

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              name,
            },
          },
        });
      }}
    />
  );
}
