import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, space } from '../theme/tokens';
import { AppText } from './AppText';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'onDark' | 'quiet';
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function PillButton({
  label,
  onPress,
  tone = 'primary',
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  fullWidth = false,
}: PillButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === 'quiet' ? styles.quiet : styles.filled,
        fullWidth && styles.fullWidth,
        pressed && !disabled && (tone === 'quiet' ? styles.quietPressed : styles.filledPressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <AppText variant="button" tone={tone === 'quiet' ? 'default' : 'onPrimary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: colors.primary,
  },
  filledPressed: {
    backgroundColor: colors.primaryPressed,
  },
  quiet: {
    backgroundColor: colors.surfaceMuted,
  },
  quietPressed: {
    backgroundColor: colors.hairline,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
});
