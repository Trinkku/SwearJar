import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadow, space, type } from '../theme/tokens';
import { AppText } from './AppText';

interface MemberButtonProps {
  name: string;
  price: string;
  onPress: () => void;
  accessibilityLabel: string;
}

export function MemberButton({ name, price, onPress, accessibilityLabel }: MemberButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <View style={styles.text}>
          <AppText variant="heading" tone="onPrimary" numberOfLines={1}>
            {name}
          </AppText>
        </View>

        <AppText style={[type.button, styles.price]} tone="onPrimary">
          {price}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    marginBottom: space.md,
    ...shadow.button,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
  text: {
    flex: 1,
  },
  price: {
    fontSize: 22,
    lineHeight: 28,
  },
});
