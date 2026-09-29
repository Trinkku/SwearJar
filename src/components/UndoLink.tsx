import { Pressable, StyleSheet } from 'react-native';

import { MIN_TOUCH_TARGET, colors, space } from '../theme/tokens';
import { AppText } from './AppText';

interface UndoLinkProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}

export function UndoLink({ label, onPress, disabled = false, accessibilityHint }: UndoLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={space.md}
      style={({ pressed }) => [
        styles.base,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <AppText variant="bodyMedium" style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  label: {
    textDecorationLine: 'underline',
    textDecorationColor: colors.inkMuted,
  },
  pressed: {
    opacity: 0.55,
  },
  disabled: {
    opacity: 0.32,
  },
});
