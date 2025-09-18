// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { Text, ActivityIndicator, Pressable, Alert } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

async function checkIsAdmin() {
  try {
    const { data, error, status } = await supabase.rpc('is_admin');
    if (error) {
      console.log('[is_admin RPC] status', status, 'error', error.message);
      return false;
    }
    console.log('[is_admin RPC] status', status, 'data', data);
    return data === true;
  } catch (e) {
    console.log('[is_admin EXC]', e?.message);
    return false;
  }
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
        console.log('[getUser] error?', error?.message || null, 'user?', !!user);
        if (error) throw error;
        if (!user) {
          navigation.replace('Auth');
          return;
        }

        const { data: prof, error: pErr, status: pStatus } =
          await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        console.log('[profiles fetch] status', pStatus, 'error', pErr?.message || null, 'name', prof?.full_name);
        setFullName(prof?.full_name || '');

        const admin = await checkIsAdmin();
        setIsAdmin(admin);
      } catch (e) {
        console.error('[Home init error]', e);
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
