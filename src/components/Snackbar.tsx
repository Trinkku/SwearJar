import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, space } from '../theme/tokens';
import { AppText } from './AppText';

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

interface SnackbarProps {
  message: string;
  action?: SnackbarAction;
  instanceId: string;
  topOffset: number;
}

export function Snackbar({ message, action, instanceId, topOffset }: SnackbarProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [instanceId, progress]);

  const animatedStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }),
      },
    ],
  };

  return (
    <Animated.View
      style={[styles.container, { top: topOffset }, animatedStyle]}
      accessibilityLiveRegion="polite"
      accessible={false}
      pointerEvents="box-none"
    >
      <Animated.View style={styles.bar}>
        <AppText variant="label" tone="onDark" style={styles.message} numberOfLines={2}>
          {message}
        </AppText>

        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            hitSlop={space.sm}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <AppText variant="eyebrow" tone="onDark" style={styles.actionLabel}>
              {action.label}
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.onDarkMuted,
    paddingLeft: space.xl,
    paddingRight: space.sm,
    paddingVertical: space.sm,
    minHeight: MIN_TOUCH_TARGET + space.sm,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  message: {
    flex: 1,
  },
  action: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  actionPressed: {
    backgroundColor: colors.darkPressed,
  },
  actionLabel: {
    letterSpacing: 1.2,
  },
});
