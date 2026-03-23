import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import type { ResolvedField } from './types';

export function buildSchemaFromFields(fields: ResolvedField[]): {
  schema: RJSFSchema;
  uiSchema: UiSchema;
} {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  const uiSchema: UiSchema = {};

  for (const field of fields) {
    properties[field.name] = {
      type: field.type,
      title: field.title,
      enum: field.enum,
      enumNames: field.enumNames,
      description: field.description,
    };

    if (field.required) {
      required.push(field.name);
    }

    if (field.widget) {
      uiSchema[field.name] = {
        'ui:widget': field.widget,
      };
    }
  }

  return {
    schema: {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    },
    uiSchema,
  };
}