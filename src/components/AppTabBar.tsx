import type { TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, space } from '../theme/tokens';
import { AppText } from './AppText';

export const TAB_BAR_CONTENT_HEIGHT = MIN_TOUCH_TARGET + space.sm;

interface TabButtonProps extends TabTriggerSlotProps {
  label: string;
}

export const TabButton = forwardRef<View, TabButtonProps>(function TabButton(
  { label, isFocused, ...pressableProps },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      accessibilityRole="tab"
      accessibilityState={{ selected: Boolean(isFocused) }}
      accessibilityLabel={label}
      {...pressableProps}
      style={({ pressed }) => [
        styles.tab,
        isFocused && styles.tabActive,
        pressed && !isFocused && styles.tabPressed,
      ]}
    >
      <AppText
        variant={isFocused ? 'bodyMedium' : 'body'}
        tone={isFocused ? 'default' : 'muted'}
      >
        {label}
      </AppText>
    </Pressable>
  );
});

export const styles = StyleSheet.create({
  tab: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
  },
  tabActive: {
    backgroundColor: colors.surfaceMuted,
  },
  tabPressed: {
    backgroundColor: colors.hairline,
  },
});
