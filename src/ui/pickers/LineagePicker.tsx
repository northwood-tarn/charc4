import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveLineagePicker } from '../../resolvers/lineageResolver';
import { buildSchemaFromFields } from '../../schema/schemaBuilder';

export function LineagePicker({ context, onResolve }: TriggerComponentProps) {
  const currentLineageId = context.draft.identity.lineageId;
  const resolved = resolveLineagePicker(context.draft);

  if (resolved.status === 'skip') {
    onResolve({ status: 'skip' });
    return null;
  }

  const { schema, uiSchema } = buildSchemaFromFields(resolved.fields);

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      validator={validator}
      formData={{ lineageId: currentLineageId ?? '' }}
      onSubmit={({ formData }) => {
        const lineageId = String(formData.lineageId);

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              lineageId,
            },
          },
        });
      }}
    />
  );
}
