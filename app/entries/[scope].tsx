import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../src/components/AppText';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { ListRow } from '../../src/components/ListRow';
import { Screen } from '../../src/components/Screen';
import {
  formatPeriod,
  formatTime,
  formatWeekdayDate,
  toDate,
} from '../../src/domain/dates';
import {
  entriesOfSettlement,
  groupEntriesByDay,
  memberNameOf,
  openEntries,
  sumCents,
} from '../../src/domain/ledger';
import { formatMoney } from '../../src/domain/money';
import { previewSettlement } from '../../src/domain/settlement';
import { useLedger } from '../../src/state/LedgerProvider';
import { MIN_TOUCH_TARGET, colors, radius, space } from '../../src/theme/tokens';

export default function EntriesScreen() {
  const router = useRouter();
  const { scope } = useLocalSearchParams<{ scope: string }>();
  const { state } = useLedger();
  const { entries, settlements, settings, members } = state;
  const isShared = members.length > 1;

  const isOpenScope = scope === 'open';
  const settlement = useMemo(
    () => settlements.find((item) => item.id === scope) ?? null,
    [settlements, scope],
  );

  const visible = useMemo(() => {
    if (isOpenScope) return openEntries(entries);
    if (settlement !== null) return entriesOfSettlement(entries, settlement.id);
    return [];
  }, [entries, isOpenScope, settlement]);

  const days = useMemo(() => groupEntriesByDay(visible), [visible]);
  const total = useMemo(() => sumCents(visible), [visible]);

  const notFound = !isOpenScope && settlement === null;

  const openPeriod = useMemo(
    () => previewSettlement(entries, new Date()).periodKey,
    [entries],
  );
  const title = isOpenScope
    ? formatPeriod(openPeriod)
    : settlement
      ? formatPeriod(settlement.periodKey)
      : 'Ei löytynyt';
  const eyebrow = isOpenScope ? 'KÄYNNISSÄ' : 'MAKSETTU';

  return (
    <Screen scroll>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Takaisin"
          onPress={() => router.back()}
          hitSlop={space.md}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <AppText variant="button" tone="muted" style={styles.chevron}>
            ‹
          </AppText>
        </Pressable>
      </View>

      {!notFound ? (
        <AppText variant="eyebrow" tone="muted">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="title">{title}</AppText>
      {!notFound ? (
        <AppText variant="body" tone="muted" style={styles.subtitle}>
          {`${formatMoney(total, settings.currency)} · ${
            visible.length === 1 ? '1 kirosana' : `${visible.length} kirosanaa`
          }`}
        </AppText>
      ) : null}

      {notFound ? (
        <EmptyState
          title="Tilitystä ei löytynyt"
          body="Se on voitu poistaa, tai linkki osoittaa vanhaan tietoon."
        />
      ) : null}

      {!notFound && days.length === 0 ? (
        <EmptyState
          title="Ei painalluksia"
          body="Tähän kertyvät yksittäiset kirosanat sitä mukaa kun niitä lisätään."
        />
      ) : null}

      {days.map((day) => (
        <Card key={day.dayKey} style={styles.card}>
          <View style={styles.dayHeader}>
            <AppText variant="label" style={styles.dayTitle}>
              {formatWeekdayDate(day.date)}
            </AppText>
            <AppText variant="label" tone="muted">
              {formatMoney(day.totalCents, settings.currency)}
            </AppText>
          </View>

          {day.entries.map((entry) => {
            const at = toDate(entry.createdAt);
            const amount = formatMoney(entry.amountCents, entry.currency);
            const who = isShared ? memberNameOf(members, entry.userId) : null;

            return (
              <ListRow
                key={entry.id}
                title={formatTime(at)}
                subtitle={who ?? undefined}
                value={amount}
                accessibilityLabel={
                  who
                    ? `Kello ${formatTime(at)}, ${who}, ${amount}`
                    : `Kello ${formatTime(at)}, ${amount}`
                }
              />
            );
          })}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    marginLeft: -space.md,
    marginBottom: space.sm,
  },
  back: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  chevron: {
    fontSize: 32,
    lineHeight: 34,
    marginTop: -4,
  },
  subtitle: {
    marginTop: space.xs,
    marginBottom: space.xl,
  },
  card: {
    marginBottom: space.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    marginBottom: space.xs,
  },
  dayTitle: {
    flex: 1,
  },
});
