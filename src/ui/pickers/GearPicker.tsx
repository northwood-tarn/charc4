import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveGearPicker } from '../../resolvers/gearResolver';
import { buildSchemaFromFields } from '../../schema/schemaBuilder';

export function GearPicker({ context, onResolve }: TriggerComponentProps) {
  const currentGearId = context.draft.identity?.gearId;
  const resolved = resolveGearPicker(context.draft);

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
      formData={{ gearId: currentGearId ?? '' }}
      onSubmit={({ formData }) => {
        const gearId = String(formData.gearId);

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              gearId,
            },
          },
        });
      }}
    />
  );
}