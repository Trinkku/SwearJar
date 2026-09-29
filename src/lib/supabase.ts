import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabasea ei ole määritetty. Aseta EXPO_PUBLIC_SUPABASE_URL ja EXPO_PUBLIC_SUPABASE_KEY.',
    );
  }

  client ??= createClient(url as string, publishableKey as string, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}

export async function ensureSession(): Promise<string> {
  const supabase = getSupabase();

  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;

  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error || !signedIn.session) {
    throw new Error(
      error?.message ??
        'Anonyymi kirjautuminen epäonnistui. Onko se päällä Supabasen asetuksissa?',
    );
  }

  return signedIn.session.user.id;
}
