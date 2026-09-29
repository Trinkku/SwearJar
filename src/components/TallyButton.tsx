import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { colors, shadow, type } from '../theme/tokens';
import { AppText } from './AppText';

interface TallyButtonProps {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  size: number;
}

export function TallyButton({ label, accessibilityLabel, onPress, size }: TallyButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <DecorativeRings size={size} />

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          onPressIn={() => animateTo(0.94)}
          onPressOut={() => animateTo(1)}
          style={({ pressed }) => [
            styles.button,
            { width: size, height: size, borderRadius: size / 2 },
            pressed && styles.buttonPressed,
          ]}
        >
          <AppText
            style={[type.button, styles.label, { fontSize: Math.round(size * 0.115) }]}
            tone="onPrimary"
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {label}
          </AppText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function DecorativeRings({ size }: { size: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
      {[1.16, 1.34, 1.54].map((factor, index) => {
        const ringSize = size * factor;
        return (
          <View
            key={ringSize}
            style={[
              styles.ring,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
                marginLeft: -ringSize / 2,
                marginTop: -ringSize / 2,
                opacity: 0.9 - index * 0.25,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ring,
  },
  button: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.button,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  label: {
    letterSpacing: 0.2,
  },
});
