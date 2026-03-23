import type { CharacterDraft } from '../engine/types';
import type { ResolvedField, ResolverOutput } from '../schema/types';

const SPELLCASTING_CLASSES = [
  'bard',
  'cleric',
  'druid',
  'paladin',
  'ranger',
  'sorcerer',
  'warlock',
  'wizard',
];

const SPELLCASTING_SUBCLASSES = ['eldritch_knight', 'arcane_trickster'];

const SPELLCASTING_SPECIES = ['elf', 'gnome', 'tiefling'];

const SPELLCASTING_FEATS = [
  'magic_initiate',
  'ritual_caster',
  'fey_touched',
  'shadow_touched',
  'spell_sniper',
  'elemental_adept',
];

function hasSpellAccess(draft: CharacterDraft): boolean {
  const { classId, subclassId, featId, speciesId } = draft.identity;

  return (
    (classId ? SPELLCASTING_CLASSES.includes(classId) : false) ||
    (subclassId ? SPELLCASTING_SUBCLASSES.includes(subclassId) : false) ||
    (featId ? SPELLCASTING_FEATS.includes(featId) : false) ||
    (speciesId ? SPELLCASTING_SPECIES.includes(speciesId) : false)
  );
}

// TEMPORARY SHAPE:
// This resolver currently flattens all spell-granting sources into one selectable list.
// Later it must be replaced by a structured spell model that can represent:
// - class-derived blank spell slots
// - constrained choice slots (for school/list-specific grants)
// - automatically granted named spells
// At that point, this file should compose slot/auto-grant data from upstream sources
// rather than return a single `spellId` field.
function getSpellOptions(draft: CharacterDraft): {
  values: string[];
  labels: string[];
} {
  const { classId, subclassId, featId, speciesId, lineageId } =
    draft.identity;

  const values: string[] = [];
  const labels: string[] = [];

  const addOption = (value: string, label: string) => {
    if (!values.includes(value)) {
      values.push(value);
      labels.push(label);
    }
  };

  if (classId === 'wizard') {
    addOption('magic_missile', 'Magic Missile');
  }

  if (classId === 'bard' || classId === 'cleric') {
    addOption('healing_word', 'Healing Word');
  }

  if (subclassId === 'eldritch_knight') {
    addOption('shield', 'Shield');
  }

  if (subclassId === 'arcane_trickster') {
    addOption('disguise_self', 'Disguise Self');
  }

  if (featId === 'magic_initiate') {
    addOption('light', 'Light');
    addOption('mage_hand', 'Mage Hand');
    addOption('magic_missile', 'Magic Missile');
  }

  if (featId === 'ritual_caster') {
    addOption('detect_magic', 'Detect Magic');
  }

  if (featId === 'fey_touched') {
    addOption('misty_step', 'Misty Step');
  }

  if (featId === 'shadow_touched') {
    addOption('invisibility', 'Invisibility');
  }

  if (featId === 'spell_sniper') {
    addOption('fire_bolt', 'Fire Bolt');
  }

  if (featId === 'elemental_adept') {
    addOption('burning_hands', 'Burning Hands');
  }

  if (speciesId === 'elf') {
    addOption('dancing_lights', 'Dancing Lights');
  }

  if (speciesId === 'gnome') {
    addOption('minor_illusion', 'Minor Illusion');
  }

  if (speciesId === 'tiefling') {
    addOption('thaumaturgy', 'Thaumaturgy');
  }

  if (lineageId === 'abyssal_tiefling') {
    addOption('ray_of_sickness', 'Ray of Sickness');
  }

  if (lineageId === 'chthonic_tiefling') {
    addOption('false_life', 'False Life');
  }

  if (lineageId === 'infernal_tiefling') {
    addOption('fire_bolt', 'Fire Bolt');
  }

  return { values, labels };
}

// TEMPORARY UI CONTRACT:
// The current schema pipeline only supports a standard field list, so spells are exposed
// as one select field for now. Do not expand this single-field approach further; replace it
// later with a dedicated spell module once the rest of the builder is wired end-to-end.
function buildSpellField(draft: CharacterDraft): ResolvedField {
  const { values, labels } = getSpellOptions(draft);

  return {
    name: 'spellId',
    title: 'Choose your spell',
    type: 'string',
    enum: values,
    enumNames: labels,
    required: true,
    widget: 'select',
  };
}

// TEMPORARY GATING:
// `hasSpellAccess` is the correct first-pass gate, but the returned content is not yet the
// final spell-building experience. Later work should preserve this gate while replacing the
// flattened field output with structured spell-slot output.
export function resolveSpellPicker(draft: CharacterDraft): ResolverOutput {
  if (!hasSpellAccess(draft)) {
    return { status: 'skip' };
  }

  return {
    status: 'ready',
    fields: [buildSpellField(draft)],
  };
}
