import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, space } from '../theme/tokens';
import { AppText } from './AppText';

interface StepperProps {
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  spokenValue?: string;
}

export function Stepper({
  value,
  display,
  min,
  max,
  step,
  onChange,
  label,
  spokenValue,
}: StepperProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <View
      style={styles.root}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: spokenValue ?? display }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') increment();
        if (event.nativeEvent.actionName === 'decrement') decrement();
      }}
    >
      <StepButton
        glyph="−"
        label={`Vähennä: ${label}`}
        onPress={decrement}
        disabled={value <= min}
      />

      <AppText variant="bodyMedium" style={styles.value}>
        {display}
      </AppText>

      <StepButton
        glyph="+"
        label={`Lisää: ${label}`}
        onPress={increment}
        disabled={value >= max}
      />
    </View>
  );
}

function StepButton({
  glyph,
  label,
  onPress,
  disabled,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <AppText variant="button" tone={disabled ? 'subtle' : 'default'}>
        {glyph}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    padding: space.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  buttonPressed: {
    backgroundColor: colors.hairline,
  },
  buttonDisabled: {
    backgroundColor: 'transparent',
  },
  value: {
    minWidth: 72,
    textAlign: 'center',
  },
});
