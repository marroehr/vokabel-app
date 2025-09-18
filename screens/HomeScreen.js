// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, Alert } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

async function checkIsAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('is_admin RPC error:', error.message);
    return false;
  }
  return data === true;
}

const Btn = ({ label, onPress, bg = '#111' }) => (
  <Pressable
    onPress={onPress}
    style={{ backgroundColor: bg, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 }}
  >
    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{label}</Text>
  </Pressable>
);

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) {
          navigation.replace('Auth');
          return;
        }
        // Name (optional)
        const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        setFullName(prof?.full_name || '');
        // Admin?
        const admin = await checkIsAdmin();
        setIsAdmin(admin);
      } catch (e) {
        console.error(e);
        Alert.alert('Fehler', 'Konnte Benutzerstatus nicht laden.');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation]);

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 16 }}>
        Willkommen{fullName ? `, ${fullName}` : ''}!
      </Text>

      <Btn label="Quiz starten" onPress={() => navigation.navigate('SelectCourse')} />

      {isAdmin && (
        <Btn label="Admin-Bereich" bg="#0f172a" onPress={() => navigation.navigate('Admin')} />
      )}

      <Pressable
        onPress={async () => {
          await supabase.auth.signOut();
          navigation.replace('Auth');
        }}
        style={{ marginTop: 12, alignSelf: 'center' }}
      >
        <Text style={{ color: '#1565c0' }}>Abmelden</Text>
      </Pressable>
    </ScreenContainer>
  );
}
