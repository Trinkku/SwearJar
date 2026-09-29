import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, space } from '../theme/tokens';
import { AppText } from './AppText';

interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  valueCaption?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ListRow({
  title,
  subtitle,
  value,
  valueCaption,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: ListRowProps) {
  const content = (
    <>
      <View style={styles.text}>
        <AppText variant="bodyMedium">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {value || valueCaption ? (
        <View style={styles.value}>
          {value ? <AppText variant="bodyMedium">{value}</AppText> : null}
          {valueCaption ? (
            <AppText variant="caption" tone="muted">
              {valueCaption}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  value: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
