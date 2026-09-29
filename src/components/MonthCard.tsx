import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadow, space } from '../theme/tokens';
import { AppText } from './AppText';

interface MonthCardProps {
  month: string;
  countLabel: string;
  amount: string;
  status: 'open' | 'paid';
  onPress: () => void;
  accessibilityLabel: string;
}

export function MonthCard({
  month,
  countLabel,
  amount,
  status,
  onPress,
  accessibilityLabel,
}: MonthCardProps) {
  const isOpen = status === 'open';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Avaa yksittäiset painallukset kellonaikoineen"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isOpen ? styles.open : styles.paid,
        pressed && (isOpen ? styles.openPressed : styles.paidPressed),
      ]}
    >
      <View style={styles.text}>
        <AppText variant="heading">{month}</AppText>
        <AppText variant="caption" tone="muted">
          {countLabel}
        </AppText>
      </View>

      <View style={styles.meta}>
        <AppText variant="amount">{amount}</AppText>

        {isOpen ? (
          <AppText variant="badge" tone="muted" style={styles.openLabel}>
            Käynnissä
          </AppText>
        ) : (
          <View style={styles.badge}>
            <AppText variant="badge">Maksettu</AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.xl,
    paddingHorizontal: space.xl,
    borderRadius: radius.xl,
    marginBottom: space.md,
  },
  open: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inkSubtle,
    backgroundColor: 'transparent',
  },
  openPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  paid: {
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  paidPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  text: {
    flex: 1,
    gap: space.xs,
  },
  meta: {
    alignItems: 'flex-end',
    gap: space.sm,
  },
  openLabel: {
    paddingVertical: 3,
  },
  badge: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 3,
  },
});
