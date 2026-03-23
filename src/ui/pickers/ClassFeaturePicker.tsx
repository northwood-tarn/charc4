import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveClassFeaturePicker } from '../../resolvers/classFeatureResolver';
import { buildSchemaFromFields } from '../../schema/schemaBuilder';

export function ClassFeaturePicker({ context, onResolve }: TriggerComponentProps) {
  const currentClassFeatureId = context.draft.identity.classFeatureId;
  const resolved = resolveClassFeaturePicker(context.draft);

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
      formData={{ classFeatureId: currentClassFeatureId ?? '' }}
      onSubmit={({ formData }) => {
        const classFeatureId = String(formData.classFeatureId);

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              classFeatureId,
            },
          },
        });
      }}
    />
  );
}
