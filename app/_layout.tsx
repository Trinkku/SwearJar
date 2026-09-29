import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SetupScreen } from '../src/screens/SetupScreen';
import { LedgerProvider, useLedger } from '../src/state/LedgerProvider';
import { SaveErrorWatcher } from '../src/state/SaveErrorWatcher';
import { SnackbarProvider } from '../src/state/SnackbarProvider';
import { colors } from '../src/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <LedgerProvider>
        <SnackbarProvider>
          <View style={styles.root}>
            <StatusBar style="dark" />
            <SaveErrorWatcher />
            <AppNavigator />
          </View>
        </SnackbarProvider>
      </LedgerProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const { status, state } = useLedger();

  if (status === 'loading') return null;
  if (state.members.length === 0) return <SetupScreen />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="settle"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="entries/[scope]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    ...Platform.select({
      web: { height: '100dvh' as unknown as number, overflow: 'hidden' },
      default: {},
    }),
  },
});
