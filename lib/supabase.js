import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// HIER DEINE WERTE EINTRAGEN:
const supabaseUrl = 'https://xvngpqvchjhgvdbaydvl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bmdwcXZjaGpoZ3ZkYmF5ZHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODIyMjYsImV4cCI6MjA3MzI1ODIyNn0.K3WGM2xJnJPB2WElrFhWAYpxH8xmskzEUljYeByMgZo';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Adapter: Web = localStorage, Mobile = SecureStore
const WebStorageAdapter = {
  getItem: (k) => Promise.resolve(globalThis.localStorage?.getItem(k) ?? null),
  setItem: (k, v) => Promise.resolve(globalThis.localStorage?.setItem(k, v)),
  removeItem: (k) => Promise.resolve(globalThis.localStorage?.removeItem(k)),
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
