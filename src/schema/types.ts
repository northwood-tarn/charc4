export type ChoiceComponent = {
  kind: string;
  count?: number;
  source?: string;
};

export type ChoiceOption = {
  value: string;
  label: string;
  detail?: string;
};

export type ChoicePayload = {
  featureId: string;
  featureLevel: number;
  description?: string;
  kind?: string;
  count: number;
  pool?: string;
  components?: ChoiceComponent[];
  options?: ChoiceOption[];
  source: 'class' | 'subclass';
  subclassId?: string;
};

export type ResolvedField = {
  name: string;
  title: string;
type: 'string' | 'array';
maxSelections?: number;
  enum?: string[];
  enumNames?: string[];
  description?: string;
  choice?: ChoicePayload;
};