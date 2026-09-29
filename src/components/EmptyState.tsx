import { StyleSheet, View } from 'react-native';

import { space } from '../theme/tokens';
import { AppText } from './AppText';

interface EmptyStateProps {
  title: string;
  body: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View style={styles.root} accessibilityRole="summary">
      <AppText variant="heading" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" tone="muted" style={styles.body}>
        {body}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: space.xxxl,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    gap: space.sm,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    maxWidth: 320,
  },
});
