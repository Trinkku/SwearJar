import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../src/components/AppText';
import { PillButton } from '../src/components/PillButton';
import { Screen } from '../src/components/Screen';
import { monthNameGenitive, parsePeriodKey } from '../src/domain/dates';
import { formatMoney, speakMoney } from '../src/domain/money';
import { previewSettlement } from '../src/domain/settlement';
import { successFeedback } from '../src/lib/haptics';
import { useLedger } from '../src/state/LedgerProvider';
import { useSnackbar } from '../src/state/SnackbarProvider';
import { MIN_TOUCH_TARGET, colors, radius, space } from '../src/theme/tokens';

export default function SettleScreen() {
  const router = useRouter();
  const { state, settleNow } = useLedger();
  const { show } = useSnackbar();

  const preview = useMemo(
    () => previewSettlement(state.entries, new Date()),
    [state.entries],
  );

  const { month } = parsePeriodKey(preview.periodKey);
  const total = formatMoney(preview.totalCents, state.settings.currency);
  const isEmpty = preview.entryCount === 0;

  const handleSettle = async () => {
    const settled = await settleNow();
    if (settled === null) return;
    successFeedback();
    router.back();
    show({
      message: `${formatMoney(settled, state.settings.currency)} merkitty maksetuksi`,
    });
  };

  return (
    <Screen>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sulje"
          onPress={() => router.back()}
          hitSlop={space.md}
          style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
        >
          <AppText variant="button" tone="muted">
            ✕
          </AppText>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <AppText variant="heading" tone="muted">
          {`${capitalise(monthNameGenitive(month))} saldo`}
        </AppText>

        <AppText
          variant="display"
          accessibilityLabel={speakMoney(preview.totalCents, state.settings.currency)}
          adjustsFontSizeToFit
          numberOfLines={1}
          style={styles.total}
        >
          {total}
        </AppText>

        <AppText variant="body" tone="muted">
          {preview.entryCount === 1 ? '1 kirosana' : `${preview.entryCount} kirosanaa`}
        </AppText>
      </View>

      <View style={styles.footer}>
        <AppText variant="caption" tone="muted" style={styles.note}>
          Merkintä nollaa kassan ja siirtää kuukauden historiaan. Rahaa ei siirretä
          sovelluksessa, joten muistathan maksaa sen Mobilepaylla.
        </AppText>

        <PillButton
          label="Merkitse maksetuksi"
          onPress={() => void handleSettle()}
          disabled={isEmpty}
          fullWidth
          accessibilityHint={
            isEmpty ? 'Kassa on tyhjä, ei tilitettävää' : 'Nollaa kassan ja tallentaa kuukauden historiaan'
          }
        />
      </View>
    </Screen>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  close: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    backgroundColor: colors.surfaceMuted,
  },
  summary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  total: {
    marginVertical: space.sm,
  },
  footer: {
    gap: space.lg,
  },
  note: {
    textAlign: 'center',
    paddingHorizontal: space.lg,
  },
});
