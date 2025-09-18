// lib/supabase.js
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ENV (müssen in Vercel gesetzt sein; lokal via $env:... vor dem Export)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[SUPA] Fehlende ENV: EXPO_PUBLIC_SUPABASE_URL/ANON_KEY');
}

const WebStorageAdapter = {
  getItem: (k) => Promise.resolve(globalThis?.localStorage?.getItem(k) ?? null),
  setItem: (k, v) => Promise.resolve(globalThis?.localStorage?.setItem(k, v)),
  removeItem: (k) => Promise.resolve(globalThis?.localStorage?.removeItem(k)),
};
const NativeStorageAdapter = {
  getItem: (k) => SecureStore.getItemAsync(k),
  setItem: (k, v) => SecureStore.setItemAsync(k, v),
  removeItem: (k) => SecureStore.deleteItemAsync(k),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? WebStorageAdapter : NativeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// --- DIAGNOSE ---
console.log('[SUPA] URL present:', !!supabaseUrl);
console.log('[SUPA] ANON present:', !!supabaseAnonKey);

supabase.auth.onAuthStateChange((event, session) => {
  console.log('[SUPA] auth event:', event, 'session?', !!session);
});
