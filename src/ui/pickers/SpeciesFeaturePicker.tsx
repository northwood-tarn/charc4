import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveSpeciesFeaturePicker } from '../../resolvers/speciesFeatureResolver';
import { buildSchemaFromFields } from '../../schema/schemaBuilder';

export function SpeciesFeaturePicker({ context, onResolve }: TriggerComponentProps) {
  const currentSpeciesFeatureId = context.draft.identity.speciesFeatureId;
  const resolved = resolveSpeciesFeaturePicker(context.draft);

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
      formData={{ speciesFeatureId: currentSpeciesFeatureId ?? '' }}
      onSubmit={({ formData }) => {
        const speciesFeatureId = String(formData.speciesFeatureId);

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              speciesFeatureId,
            },
          },
        });
      }}
    />
  );
}
