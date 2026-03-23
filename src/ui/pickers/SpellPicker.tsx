import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import type { TriggerComponentProps } from '../../engine/triggerTypes';
import { resolveSpellPicker } from '../../resolvers/spellResolver';
import { buildSchemaFromFields } from '../../schema/schemaBuilder';

export function SpellPicker({ context, onResolve }: TriggerComponentProps) {
  const currentSpellId = context.draft.identity.spellId;
  const resolved = resolveSpellPicker(context.draft);

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
      formData={{ spellId: currentSpellId ?? '' }}
      onSubmit={({ formData }) => {
        const spellId = String(formData.spellId);

        onResolve({
          status: 'complete',
          patch: {
            identity: {
              spellId,
            },
          },
        });
      }}
    />
  );
}
