import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '../theme/tokens';
import { AppText } from './AppText';
import { Card } from './Card';
import { PillButton } from './PillButton';

interface SettlementBannerProps {
  eyebrow: string;
  value: string;
  actionLabel: string;
  onPress: () => void;
  disabled?: boolean;
  highlighted?: boolean;
}

export function SettlementBanner({
  eyebrow,
  value,
  actionLabel,
  onPress,
  disabled = false,
  highlighted = false,
}: SettlementBannerProps) {
  return (
    <Card tone="dark" style={StyleSheet.flatten([styles.card, highlighted && styles.highlighted])}>
      <View style={styles.row}>
        <View style={styles.text}>
          <AppText variant="eyebrow" tone="onDarkMuted">
            {eyebrow}
          </AppText>
          <AppText variant="heading" tone="onDark" style={styles.value}>
            {value}
          </AppText>
        </View>

        <PillButton
          label={actionLabel}
          onPress={onPress}
          disabled={disabled}
          accessibilityHint="Avaa tilityksen yhteenvedon"
          style={styles.action}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: space.lg,
    paddingHorizontal: space.xl,
    borderRadius: radius.xl,
  },
  highlighted: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  text: {
    flex: 1,
    gap: space.xs,
  },
  value: {
    marginTop: 2,
  },
  action: {
    paddingHorizontal: space.lg,
  },
});
