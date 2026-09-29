import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, shadow, space } from '../theme/tokens';

interface CardProps {
  children: ReactNode;
  tone?: 'surface' | 'dark' | 'muted';
  style?: ViewStyle;
}

export function Card({ children, tone = 'surface', style }: CardProps) {
  return <View style={[styles.base, styles[tone], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: space.xl,
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
  dark: {
    backgroundColor: colors.dark,
    ...shadow.card,
  },
});
