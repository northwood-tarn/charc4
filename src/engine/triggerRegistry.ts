import type { TriggerName } from './triggerNames';
import type { TriggerComponentProps } from './triggerTypes';

import { NamePicker } from '../ui/pickers/NamePicker';
import { BackgroundPicker } from '../ui/pickers/BackgroundPicker';
import { ClassPicker } from '../ui/pickers/ClassPicker';
import { LevelPicker } from '../ui/pickers/LevelPicker';
import { SpeciesPicker } from '../ui/pickers/SpeciesPicker';
import { LineagePicker } from '../ui/pickers/LineagePicker';
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
  LEVEL_PICKER: LevelPicker,
  SPECIES_PICKER: SpeciesPicker,
  LINEAGE_PICKER: LineagePicker,
  FEAT_PICKER: FeatPicker,
  CLASS_FEATURE_PICKER: ClassFeaturePicker,
  SPECIES_FEATURE_PICKER: SpeciesFeaturePicker,
  SPELL_PICKER: SpellPicker,
  GEAR_PICKER: GearPicker,
};