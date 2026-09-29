import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../src/components/AppText';
import { Card } from '../../src/components/Card';
import { ChoiceChips, type Choice } from '../../src/components/ChoiceChips';
import { MemberEditor } from '../../src/components/MemberEditor';
import { PillButton } from '../../src/components/PillButton';
import { Screen } from '../../src/components/Screen';
import { SettingRow } from '../../src/components/SettingRow';
import { Stepper } from '../../src/components/Stepper';
import { TextField } from '../../src/components/TextField';
import { formatDate } from '../../src/domain/dates';
import { CURRENCIES, CURRENCY_CODES, formatMoney, speakMoney } from '../../src/domain/money';
import { upcomingSettlementDate } from '../../src/domain/settlement';
import { DEFAULT_SETTINGS, type CurrencyCode } from '../../src/domain/types';
import { useLedger } from '../../src/state/LedgerProvider';
import { colors, radius, space } from '../../src/theme/tokens';

const PRICE_STEP_CENTS = 5;
const MIN_PRICE_CENTS = 5;
const MAX_PRICE_CENTS = 1000;

const CURRENCY_CHOICES: Choice<CurrencyCode>[] = CURRENCY_CODES.map((code) => ({
  value: code,
  label: `${CURRENCIES[code].symbol} ${code}`,
  spokenLabel: CURRENCIES[code].label,
}));

export default function SettingsScreen() {
  const {
    state,
    updateSettings,
    saveMembers,
    isShared,
    inviteCode,
    deviceCount,
    maxDevices,
    joinKassa,
    rotateCode,
  } = useLedger();
  const { settings, members } = state;

  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const nextSettlement = formatDate(upcomingSettlementDate(settings, new Date()));

  const describe = (cause: unknown): string =>
    cause instanceof Error ? cause.message : 'Jotain meni pieleen. Yritä uudelleen.';

  const run = async (task: () => Promise<string>): Promise<void> => {
    setBusy(true);
    setNotice(null);
    try {
      setNotice(await task());
    } catch (cause) {
      setNotice(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  const handleRotate = () =>
    void run(async () => {
      await rotateCode();
      return 'Kutsukoodi vaihdettu. Vanha koodi ei enää toimi.';
    });

  const handleJoin = () =>
    void run(async () => {
      await joinKassa(joinCode.trim().toUpperCase());
      setJoinCode('');
      return 'Liityit kassaan.';
    });

  const deviceHint =
    deviceCount !== null && maxDevices !== null
      ? `${deviceCount}/${maxDevices} laitetta liittynyt. Syötä tämä kumppanin puhelimeen.`
      : 'Syötä tämä kumppanin puhelimeen.';

  return (
    <Screen scroll>
      <AppText variant="title" style={styles.title}>
        Asetukset
      </AppText>

      {isShared && inviteCode !== null ? (
        <Card style={styles.card}>
          <SettingRow label="Kutsukoodi" hint={deviceHint} layout="stacked">
            <View style={styles.code}>
              <AppText variant="amount" accessibilityLabel={inviteCode.split('').join(' ')}>
                {inviteCode}
              </AppText>
            </View>
            <PillButton
              label="Vaihda koodi"
              tone="quiet"
              onPress={handleRotate}
              disabled={busy}
              accessibilityHint="Vanhalla koodilla ei pääse enää liittymään"
              style={styles.action}
            />
          </SettingRow>

          <SettingRow
            label="Liity toiseen kassaan"
            hint="Korvaa tämän laitteen kassan. Nykyinen kassa jää muille laitteille."
            layout="stacked"
            last
          >
            <TextField
              label="Toisen kassan kutsukoodi"
              value={joinCode}
              placeholder="ABC234"
              onChangeText={(value) => setJoinCode(value.toUpperCase())}
              maxLength={6}
            />
            <PillButton
              label="Liity"
              tone="quiet"
              onPress={handleJoin}
              disabled={busy || joinCode.trim().length < 6}
              style={styles.action}
            />
          </SettingRow>

          {notice !== null ? (
            <View style={styles.notice} accessibilityLiveRegion="polite">
              <AppText variant="label">{notice}</AppText>
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <SettingRow
          label="Kirosanan hinta"
          hint={`Oletus ${formatMoney(DEFAULT_SETTINGS.priceCents, settings.currency)}. Koskee vain uusia lisäyksiä.`}
          layout="stacked"
        >
          <Stepper
            label="Kirosanan hinta"
            value={settings.priceCents}
            display={formatMoney(settings.priceCents, settings.currency)}
            spokenValue={speakMoney(settings.priceCents, settings.currency)}
            min={MIN_PRICE_CENTS}
            max={MAX_PRICE_CENTS}
            step={PRICE_STEP_CENTS}
            onChange={(priceCents) => void updateSettings({ priceCents })}
          />
        </SettingRow>

        <SettingRow label="Tilityspäivä" hint={`Seuraava ${nextSettlement}`} layout="stacked">
          <Stepper
            label="Tilityspäivä"
            value={settings.settlementDay}
            display={`${settings.settlementDay}.`}
            spokenValue={`Kuukauden ${settings.settlementDay}. päivä`}
            min={1}
            max={31}
            step={1}
            onChange={(settlementDay) => void updateSettings({ settlementDay })}
          />
        </SettingRow>

        <SettingRow
          label="Valuutta"
          hint="Vaikuttaa näyttömuotoon. Vanhat tapahtumat säilyttävät oman valuuttansa."
          layout="stacked"
        >
          <ChoiceChips
            groupLabel="Valuutta"
            choices={CURRENCY_CHOICES}
            selected={settings.currency}
            onSelect={(currency) => void updateSettings({ currency })}
          />
        </SettingRow>

        <SettingRow
          label="Kassan jäsenet"
          hint="Useampi jäsen antaa jokaiselle oman painikkeen etusivulle."
          layout="stacked"
        >
          <MemberEditor members={members} onChange={(next) => void saveMembers(next)} />
        </SettingRow>

        <SettingRow label="Sovelluksen nimi" layout="stacked" last>
          <TextField
            label="Sovelluksen nimi"
            value={settings.appName}
            placeholder={DEFAULT_SETTINGS.appName}
            onChangeText={(appName) => void updateSettings({ appName })}
          />
        </SettingRow>
      </Card>

      <AppText variant="caption" tone="muted" style={styles.footnote}>
        {isShared
          ? 'Kassa synkkautuu laitteisiin, jotka ovat liittyneet kutsukoodilla.'
          : 'Tiedot tallennetaan vain tähän laitteeseen.'}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: space.xl,
  },
  code: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
  },
  action: {
    marginTop: space.md,
    alignSelf: 'flex-start',
  },
  notice: {
    marginHorizontal: space.lg,
    marginBottom: space.lg,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
  },
  card: {
    paddingVertical: space.sm,
  },
  footnote: {
    marginTop: space.lg,
    paddingHorizontal: space.lg,
    textAlign: 'center',
  },
});
