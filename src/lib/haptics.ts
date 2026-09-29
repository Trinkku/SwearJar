import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export function tapFeedback(): void {
  if (!isSupported) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function undoFeedback(): void {
  if (!isSupported) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => undefined,
  );
}

export function successFeedback(): void {
  if (!isSupported) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => undefined,
  );
}
