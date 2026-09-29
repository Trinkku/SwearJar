import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, space } from '../theme/tokens';
import { AppText } from './AppText';

interface SettingRowProps {
  label: string;
  hint?: string;
  children: ReactNode;
  layout?: 'inline' | 'stacked';
  last?: boolean;
}

export function SettingRow({
  label,
  hint,
  children,
  layout = 'inline',
  last = false,
}: SettingRowProps) {
  return (
    <View style={[styles.row, layout === 'stacked' && styles.stacked, last && styles.last]}>
      <View style={styles.text}>
        <AppText variant="bodyMedium">{label}</AppText>
        {hint ? (
          <AppText variant="caption" tone="muted">
            {hint}
          </AppText>
        ) : null}
      </View>
      <View style={layout === 'stacked' ? styles.controlStacked : styles.controlInline}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  stacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: space.md,
  },
  last: {
    borderBottomWidth: 0,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  controlInline: {
    alignItems: 'flex-end',
  },
  controlStacked: {
    alignItems: 'stretch',
  },
});
