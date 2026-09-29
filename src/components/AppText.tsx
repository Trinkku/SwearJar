import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, type as typeScale } from '../theme/tokens';

type Variant = keyof typeof typeScale;
type Tone = 'default' | 'muted' | 'subtle' | 'onDark' | 'onDarkMuted' | 'primary' | 'onPrimary';

const TONES: Record<Tone, string> = {
  default: colors.ink,
  muted: colors.inkMuted,
  subtle: colors.inkSubtle,
  onDark: colors.onDark,
  onDarkMuted: colors.onDarkMuted,
  primary: colors.primary,
  onPrimary: colors.onPrimary,
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
}

export function AppText({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      style={[styles.base, typeScale[variant], { color: TONES[tone] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
