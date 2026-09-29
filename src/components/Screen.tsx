import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '../theme/tokens';

interface ScreenProps {
  children?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  bottomInset?: number;
}

export function Screen({ children, scroll = false, contentStyle, bottomInset = 0 }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + space.lg,
    paddingBottom: insets.bottom + bottomInset + space.xl,
  };

  if (scroll) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.root, styles.content, padding, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: space.xl,
  },
});
