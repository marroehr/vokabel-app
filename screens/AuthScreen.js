// screens/AuthScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

export default function AuthScreen({}) {
  const nav = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: '' } },
    });
    setLoading(false);
    if (error) {
      console.error('signup error', error);
      Alert.alert('Signup-Fehler', error.message);
      return;
    }
    Alert.alert('Erfolg', 'Konto erstellt. Du bist eingeloggt (E-Mail-Bestätigung ist deaktiviert).');
    nav.navigate('SelectCourse');
  }

  async function signIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      console.error('login error', error);
      Alert.alert('Login-Fehler', error.message);
      return;
    }
    nav.navigate('SelectCourse');
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
