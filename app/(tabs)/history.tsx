import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '../../src/components/AppText';
import { EmptyState } from '../../src/components/EmptyState';
import { MonthCard } from '../../src/components/MonthCard';
import { Screen } from '../../src/components/Screen';
import { monthName, parsePeriodKey } from '../../src/domain/dates';
import { openEntries, sumCents } from '../../src/domain/ledger';
import { formatMoney } from '../../src/domain/money';
import { previewSettlement, sortSettlementsNewestFirst } from '../../src/domain/settlement';
import { useLedger } from '../../src/state/LedgerProvider';
import { space } from '../../src/theme/tokens';

function countLabel(count: number): string {
  return count === 1 ? '1 kirosana' : `${count} kirosanaa`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { state } = useLedger();
  const { entries, settlements, settings } = state;

  const open = useMemo(() => openEntries(entries), [entries]);
  const openTotal = useMemo(() => sumCents(open), [open]);
  const openPeriod = useMemo(
    () => previewSettlement(entries, new Date()).periodKey,
    [entries],
  );
  const past = useMemo(() => sortSettlementsNewestFirst(settlements), [settlements]);

  const openMonth = monthName(parsePeriodKey(openPeriod).month);
  const openAmount = formatMoney(openTotal, settings.currency);
  const hasNothing = open.length === 0 && past.length === 0;

  return (
    <Screen scroll>
      <AppText variant="eyebrow" tone="muted">
        TILITETYT KUUKAUDET
      </AppText>
      <AppText variant="title" style={styles.title}>
        Historia
      </AppText>

      {hasNothing ? (
        <EmptyState
          title="Ei vielä mitään"
          body="Kun lisäät ensimmäisen kirosanan, se ilmestyy tähän päivämäärän ja kellonajan kanssa."
        />
      ) : null}

      {open.length > 0 ? (
        <MonthCard
          month={openMonth}
          countLabel={countLabel(open.length)}
          amount={openAmount}
          status="open"
          onPress={() => router.push('/entries/open')}
          accessibilityLabel={`${openMonth}, ${openAmount}, ${countLabel(open.length)}, käynnissä`}
        />
      ) : null}

      {past.map((settlement) => {
        const month = monthName(parsePeriodKey(settlement.periodKey).month);
        const amount = formatMoney(settlement.totalCents, settlement.currency);
        return (
          <MonthCard
            key={settlement.id}
            month={month}
            countLabel={countLabel(settlement.entryCount)}
            amount={amount}
            status="paid"
            onPress={() => router.push(`/entries/${settlement.id}`)}
            accessibilityLabel={`${month}, ${amount}, ${countLabel(settlement.entryCount)}, maksettu`}
          />
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: space.xs,
    marginBottom: space.xl,
  },
});
