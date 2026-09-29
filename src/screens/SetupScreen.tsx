import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { ChoiceChips, type Choice } from '../components/ChoiceChips';
import { PillButton } from '../components/PillButton';
import { TextField } from '../components/TextField';
import { DEFAULT_SETTINGS, MAX_MEMBERS } from '../domain/types';
import { useLedger } from '../state/LedgerProvider';
import { colors, radius, space } from '../theme/tokens';

const PLACEHOLDERS = ['Minä', 'Toinen', 'Kolmas', 'Neljäs'];

const COUNT_CHOICES: Choice<string>[] = Array.from({ length: MAX_MEMBERS }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
  spokenLabel: index === 0 ? 'Yksi henkilö' : `${index + 1} henkilöä`,
}));

const MODE_CHOICES: Choice<'create' | 'join'>[] = [
  { value: 'create', label: 'Uusi kassa' },
  { value: 'join', label: 'Liity koodilla' },
];

export function SetupScreen() {
  const { createKassa, joinKassa, isShared } = useLedger();
  const [mode, setMode] = useState<'create' | 'join' | null>(isShared ? null : 'create');
  const [count, setCount] = useState(2);
  const [names, setNames] = useState<string[]>(PLACEHOLDERS.slice(0, MAX_MEMBERS));
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setName = (index: number, value: string) =>
    setNames((current) => current.map((name, i) => (i === index ? value : name)));

  const describe = (cause: unknown): string =>
    cause instanceof Error ? cause.message : 'Jotain meni pieleen. Yritä uudelleen.';

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const memberNames = Array.from({ length: count }, (_, index) =>
        names[index].trim() || PLACEHOLDERS[index],
      );
      await createKassa(DEFAULT_SETTINGS.appName, memberNames);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    setBusy(true);
    setError(null);
    try {
      await joinKassa(code.trim().toUpperCase());
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="eyebrow" tone="muted">
          TERVETULOA
        </AppText>
        <AppText variant="title" style={styles.title}>
          Kenelle kassa?
        </AppText>
        <AppText variant="body" tone="muted" style={styles.lead}>
          Yhdelle riittää yksi nappi. Useammalle jokainen saa omansa, jolloin
          historiasta näkee kenen kirosanasta on kyse.
        </AppText>

        {isShared ? (
          <View style={styles.section}>
            <ChoiceChips
              groupLabel="Uusi kassa vai liittyminen"
              choices={MODE_CHOICES}
              selected={mode}
              onSelect={(value) => {
                setMode(value);
                setError(null);
              }}
            />
          </View>
        ) : null}

        {mode === null ? (
          <View style={styles.section}>
            <AppText variant="body" tone="muted">
              Valitse kumpi: perustatko uuden kassan vai liitytkö kumppanin
              kassaan kutsukoodilla.
            </AppText>
          </View>
        ) : mode === 'create' ? (
          <>
            <View style={styles.section}>
              <AppText variant="label" style={styles.sectionLabel}>
                Montako henkilöä
              </AppText>
              <ChoiceChips
                groupLabel="Henkilöiden määrä"
                choices={COUNT_CHOICES}
                selected={String(count)}
                onSelect={(value) => setCount(Number(value))}
              />
            </View>

            <View style={styles.section}>
              <AppText variant="label" style={styles.sectionLabel}>
                {count === 1 ? 'Nimi' : 'Nimet'}
              </AppText>

              <View style={styles.fields}>
                {Array.from({ length: count }, (_, index) => (
                  <TextField
                    key={index}
                    label={`Henkilö ${index + 1}`}
                    value={names[index]}
                    placeholder={PLACEHOLDERS[index]}
                    onChangeText={(value) => setName(index, value)}
                    maxLength={20}
                  />
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <AppText variant="label" style={styles.sectionLabel}>
              Kutsukoodi
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.sectionHint}>
              Kuusi merkkiä, jonka näet toisen puhelimen Asetuksista.
            </AppText>
            <TextField
              label="Kutsukoodi"
              value={code}
              placeholder="ABC234"
              onChangeText={(value) => setCode(value.toUpperCase())}
              maxLength={6}
            />
          </View>
        )}

        {error !== null ? (
          <View style={styles.error} accessibilityLiveRegion="polite">
            <AppText variant="label">{error}</AppText>
          </View>
        ) : null}

        {mode !== null ? (
          <PillButton
            label={mode === 'create' ? 'Aloita' : 'Liity kassaan'}
            onPress={() => void (mode === 'create' ? handleCreate() : handleJoin())}
            disabled={busy || (mode === 'join' && code.trim().length < 6)}
            fullWidth
            accessibilityHint={
              mode === 'create'
                ? 'Luo kassan ja avaa etusivun'
                : 'Liittyy olemassa olevaan kassaan'
            }
            style={styles.start}
          />
        ) : null}

        <AppText variant="caption" tone="muted" style={styles.footnote}>
          {isShared
            ? 'Nimiä voi muuttaa myöhemmin Asetuksissa. Kassa synkkautuu molempiin puhelimiin.'
            : 'Nimiä voi muuttaa myöhemmin Asetuksissa.'}
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: space.xl,
    paddingTop: space.xxxl + space.xl,
    paddingBottom: space.xxxl,
  },
  title: {
    marginTop: space.xs,
  },
  lead: {
    marginTop: space.md,
  },
  section: {
    marginTop: space.xxl,
  },
  sectionLabel: {
    marginBottom: space.md,
  },
  sectionHint: {
    marginTop: -space.sm,
    marginBottom: space.md,
  },
  error: {
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
  },
  fields: {
    gap: space.md,
  },
  start: {
    marginTop: space.xxl,
  },
  footnote: {
    marginTop: space.lg,
    textAlign: 'center',
  },
});
