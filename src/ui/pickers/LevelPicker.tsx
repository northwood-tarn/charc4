

import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveLevelPicker } from '../../resolvers/levelResolver';
import { buildSchemaFromFields } from '../../schema/schemaBuilder';

export function LevelPicker({ context, onResolve }: TriggerComponentProps) {
  const currentLevel = context.draft.identity?.level;
  const resolved = resolveLevelPicker(context.draft);

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
      formData={{ level: currentLevel ?? '' }}
      onSubmit={({ formData }) => {
        const level = Number(formData.level);

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              level,
            },
          },
        });
      }}
    />
  );
}