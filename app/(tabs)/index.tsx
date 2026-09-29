import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '../../src/components/AppText';
import { MemberButton } from '../../src/components/MemberButton';
import { Screen } from '../../src/components/Screen';
import { SettlementBanner } from '../../src/components/SettlementBanner';
import { TallyButton } from '../../src/components/TallyButton';
import { UndoLink } from '../../src/components/UndoLink';
import { formatDate, formatPeriodUpper, periodKeyOf } from '../../src/domain/dates';
import {
  balanceCents,
  countInPeriod,
  lastUndoableEntry,
  totalsByMember,
} from '../../src/domain/ledger';
import { formatMoney, speakMoney } from '../../src/domain/money';
import { isSettlementDue, upcomingSettlementDate } from '../../src/domain/settlement';
import { DEFAULT_SETTINGS } from '../../src/domain/types';
import { tapFeedback, undoFeedback } from '../../src/lib/haptics';
import { useLedger } from '../../src/state/LedgerProvider';
import { useSnackbar } from '../../src/state/SnackbarProvider';
import { space } from '../../src/theme/tokens';

export default function KassaScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { state, status, addSwear, undoEntry, undoLast } = useLedger();
  const { show } = useSnackbar();

  const { settings, entries, members } = state;

  const now = new Date();
  const currentPeriod = periodKeyOf(now);

  const balance = useMemo(() => balanceCents(entries), [entries]);
  const swearCount = useMemo(
    () => countInPeriod(entries, currentPeriod),
    [entries, currentPeriod],
  );
  const canUndo = useMemo(() => lastUndoableEntry(entries) !== null, [entries]);
  const shares = useMemo(() => totalsByMember(entries, members), [entries, members]);
  const overdue = useMemo(
    () => isSettlementDue(entries, settings, now),
    [entries, settings],
  );

  const buttonSize = Math.round(Math.min(260, width * 0.58, height * 0.3));

  const price = formatMoney(settings.priceCents, settings.currency);
  const nextSettlement = formatDate(upcomingSettlementDate(settings, now));
  const isShared = members.length > 1;

  const handleUndoLast = async () => {
    const undone = await undoLast();
    if (undone === null) return;
    undoFeedback();
    show({ message: `${formatMoney(undone, settings.currency)} poistettu kassasta` });
  };

  const handleAdd = async (memberId: string, memberName: string) => {
    const entry = await addSwear(memberId);
    if (entry === null) return;
    tapFeedback();

    const amount = formatMoney(entry.amountCents, entry.currency);
    show({
      message: isShared
        ? `${memberName}: +${amount} lisätty kassaan`
        : `+${amount} lisätty kassaan`,
      action: {
        label: 'KUMOA',
        onPress: () => {
          void (async () => {
            const undone = await undoEntry(entry.id);
            if (undone === null) return;
            undoFeedback();
            show({
              message: `${formatMoney(undone, settings.currency)} poistettu kassasta`,
            });
          })();
        },
      },
    });
  };

  if (status === 'loading') return <Screen />;

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="eyebrow" tone="muted">
          {formatPeriodUpper(currentPeriod)}
        </AppText>
        <AppText variant="title">{settings.appName.trim() || DEFAULT_SETTINGS.appName}</AppText>
      </View>

      <View style={styles.balance}>
        <AppText
          variant="display"
          accessibilityLabel={`Kassassa ${speakMoney(balance, settings.currency)}`}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatMoney(balance, settings.currency)}
        </AppText>
        <AppText variant="body" tone="muted">
          {swearCount === 1 ? '1 kirosana tässä kuussa' : `${swearCount} kirosanaa tässä kuussa`}
        </AppText>

        {isShared ? (
          <AppText variant="caption" tone="subtle" style={styles.shares}>
            {shares
              .map((share) => `${share.member.name} ${formatMoney(share.totalCents, settings.currency)}`)
              .join('  ·  ')}
          </AppText>
        ) : null}
      </View>

      <View style={[styles.action, isShared && styles.actionShared]}>
        {isShared ? (
          members.map((member) => (
            <MemberButton
              key={member.id}
              name={member.name}
              price={`+ ${price}`}
              onPress={() => void handleAdd(member.id, member.name)}
              accessibilityLabel={`${member.name}: lisää kirosana, ${speakMoney(settings.priceCents, settings.currency)}`}
            />
          ))
        ) : (
          <TallyButton
            label={`+ ${price}`}
            accessibilityLabel={`Lisää kirosana, ${speakMoney(settings.priceCents, settings.currency)}`}
            onPress={() => void handleAdd(members[0].id, members[0].name)}
            size={buttonSize}
          />
        )}
      </View>

      <View style={styles.undo}>
        <UndoLink
          label="Kumoa viimeisin maksu"
          onPress={() => void handleUndoLast()}
          disabled={!canUndo}
          accessibilityHint={
            canUndo ? 'Poistaa viimeisimmän lisäyksen kassasta' : 'Ei kumottavaa lisäystä'
          }
        />
      </View>

      <SettlementBanner
        eyebrow={overdue ? 'TILITYS MYÖHÄSSÄ' : 'SEURAAVA TILITYS'}
        value={nextSettlement}
        actionLabel="Suorita maksu"
        onPress={() => router.push('/settle')}
        highlighted={overdue}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: space.xs,
  },
  balance: {
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xxl,
  },
  shares: {
    marginTop: space.xs,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  actionShared: {
    alignItems: 'stretch',
  },
  undo: {
    marginBottom: space.xl,
  },
});
