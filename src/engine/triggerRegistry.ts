import type { TriggerName } from './triggerNames';
import type { TriggerComponentProps } from './triggerTypes';

import { NamePicker } from '../ui/pickers/NamePicker';
import { BackgroundPicker } from '../ui/pickers/BackgroundPicker';
import { ClassPicker } from '../ui/pickers/ClassPicker';
import { SpeciesPicker } from '../ui/pickers/SpeciesPicker';
import { FeatPicker } from '../ui/pickers/FeatPicker';
import { ClassFeaturePicker } from '../ui/pickers/ClassFeaturePicker';
import { SpeciesFeaturePicker } from '../ui/pickers/SpeciesFeaturePicker';
import { SpellPicker } from '../ui/pickers/SpellPicker';
import { GearPicker } from '../ui/pickers/GearPicker';


type TriggerRegistry = Partial<
  Record<TriggerName, React.ComponentType<TriggerComponentProps>>
>;

export const triggerRegistry: TriggerRegistry = {
  NAME_PICKER: NamePicker,
  BACKGROUND_PICKER: BackgroundPicker,
  CLASS_PICKER: ClassPicker,
  SPECIES_PICKER: SpeciesPicker,
  FEAT_PICKER: FeatPicker,
  CLASS_FEATURE_PICKER: ClassFeaturePicker,
  SPECIES_FEATURE_PICKER: SpeciesFeaturePicker,
  SPELL_PICKER: SpellPicker,
  GEAR_PICKER: GearPicker,
};