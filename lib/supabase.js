// lib/supabase.js
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Wichtig: in PowerShell vor dem Build setzen:
// $env:EXPO_PUBLIC_SUPABASE_URL = "https://DEINPROJEKT.supabase.co"
// $env:EXPO_PUBLIC_SUPABASE_ANON_KEY = "DEIN_ANON_KEY"
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase ENV fehlen. Setze EXPO_PUBLIC_SUPABASE_URL/ANON_KEY vor dem Export.');
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
