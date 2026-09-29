import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabButton } from '../../src/components/AppTabBar';
import { colors, space } from '../../src/theme/tokens';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.slot} />

      <TabList style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <TabTrigger name="kassa" href="/" asChild>
          <TabButton label="Kassa" />
        </TabTrigger>

        <TabTrigger name="historia" href="/history" asChild>
          <TabButton label="Historia" />
        </TabTrigger>

        <TabTrigger name="asetukset" href="/settings" asChild>
          <TabButton label="Asetukset" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    minHeight: 0,
  },
  slot: {
    flex: 1,
    minHeight: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: space.sm,
    paddingHorizontal: space.md,
  },
});
