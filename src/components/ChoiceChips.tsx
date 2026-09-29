import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, space } from '../theme/tokens';
import { AppText } from './AppText';

export interface Choice<T extends string> {
  value: T;
  label: string;
  spokenLabel?: string;
}

interface ChoiceChipsProps<T extends string> {
  choices: Choice<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  groupLabel: string;
}

export function ChoiceChips<T extends string>({
  choices,
  selected,
  onSelect,
  groupLabel,
}: ChoiceChipsProps<T>) {
  return (
    <View style={styles.root} accessibilityRole="radiogroup" accessibilityLabel={groupLabel}>
      {choices.map((choice) => {
        const isSelected = choice.value === selected;
        return (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={choice.spokenLabel ?? choice.label}
            onPress={() => onSelect(choice.value)}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && !isSelected && styles.chipPressed,
            ]}
          >
            <AppText variant="label" tone={isSelected ? 'onPrimary' : 'default'}>
              {choice.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET + space.lg,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipPressed: {
    backgroundColor: colors.hairline,
  },
});
