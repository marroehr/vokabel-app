// screens/AuthScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const nav = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: '' } },
      });
      if (error) throw error;
      Alert.alert('Erfolg', 'Konto erstellt. Du bist eingeloggt.');
      // DIAGNOSE: sofort /words anpingen
      const ping = await supabase.from('words').select('*', { count: 'exact', head: true }).limit(1);
      console.log('[PING after signUp] status', ping.status, 'error', ping.error?.message || null);
      nav.navigate('Home'); // zuerst Home, dort wird Admin geprüft
    } catch (e) {
      console.error('[signup error]', e);
      Alert.alert('Signup-Fehler', e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // DIAGNOSE: sofort /words anpingen
      const ping = await supabase.from('words').select('*', { count: 'exact', head: true }).limit(1);
      console.log('[PING after signIn] status', ping.status, 'error', ping.error?.message || null);
      nav.navigate('Home');
    } catch (e) {
      console.log('[login error]', e);
      Alert.alert('Login-Fehler', e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16 }}>Anmeldung</Text>

      <View style={{ gap: 12 }}>
        <View>
          <Text style={{ marginBottom: 6 }}>E-Mail</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="du@example.com"
            style={{
              borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
              paddingHorizontal: 12, paddingVertical: 10,
            }}
          />
        </View>

        <View>
          <Text style={{ marginBottom: 6 }}>Passwort</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            style={{
              borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
              paddingHorizontal: 12, paddingVertical: 10,
            }}
          />
        </View>

        <Pressable
          onPress={signIn}
          style={{ backgroundColor: '#111', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16 }}>Einloggen</Text>}
        </Pressable>

        <Pressable
          onPress={signUp}
          style={{ backgroundColor: '#1565c0', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>Registrieren</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
