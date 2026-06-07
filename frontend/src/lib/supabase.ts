import { createClient, type AuthError, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function hasRealEnvValue(value: string | undefined) {
  return Boolean(value && value.trim() && !value.startsWith('replace-with-') && !value.includes('placeholder'));
}

export const isSupabaseConfigured = hasRealEnvValue(supabaseUrl) && hasRealEnvValue(supabaseAnonKey);

const missingSupabaseError = {
  name: 'SupabaseConfigurationError',
  message: 'Supabase credentials are not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  status: 500,
} as AuthError;

function createMissingSupabaseClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: missingSupabaseError }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: missingSupabaseError }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: null, error: missingSupabaseError }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
    },
    from: () => {
      throw new Error(missingSupabaseError.message);
    },
  } as unknown as SupabaseClient<Database>;
}

if (!isSupabaseConfigured) {
  console.error(
    'Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase Project Settings > API.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createMissingSupabaseClient();
