// screens/admin/UserResults.js
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const inputStyle = {
  borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8
};
const btn = (bg = '#2563eb') => ({
  backgroundColor: bg, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8
});
const btnTxt = { color: '#fff', fontWeight: '700' };

export default function UserResults() {
  const nav = useNavigation();

  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // 1) Benutzerliste laden (aus profiles)
  useEffect(() => {
    (async () => {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .order('full_name', { ascending: true });
        if (error) throw error;
        setUsers(data ?? []);
      } catch (e) {
        console.error(e);
        Alert.alert('Fehler', 'Benutzerliste konnte nicht geladen werden.');
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = (q ?? '').toLowerCase();
    if (!s) return users;
    return users.filter(u => (u.full_name || '').toLowerCase().includes(s) || u.id.includes(s));
  }, [q, users]);

  // 2) Ergebnisse des ausgewählten Users laden
  const loadResults = async (userId) => {
    if (!userId) return;
    setLoadingResults(true);
    try {
      const { data, error } = await supabase
        .from('test_results') // <-- richtig
        .select('id, grade, unit, station, correct, total, percent, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResults(data ?? []);
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Ergebnisse konnten nicht geladen werden.');
    } finally {
      setLoadingResults(false);
    }
  };

  const openAsUser = () => {
    if (!selectedUser) return;
    nav.navigate('TestHistory', { adminUserId: selectedUser.id, adminFullName: selectedUser.full_name });
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Benutzer auswählen</Text>

      <TextInput
        placeholder="Suche nach Name oder ID"
        value={q}
        onChangeText={setQ}
        style={inputStyle}
      />

      {loadingUsers ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 220, marginBottom: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          renderItem={({ item }) => {
            const active = selectedUser?.id === item.id;
            return (
              <Pressable
                onPress={() => { setSelectedUser(item); loadResults(item.id); }}
                style={{
                  padding: 10, borderRadius: 8, borderWidth: 1,
                  borderColor: active ? '#111827' : '#e5e7eb',
                  backgroundColor: active ? '#f1f5f9' : '#fff'
                }}
              >
                <Text style={{ fontWeight: '700' }}>{item.full_name || '(ohne Name)'}</Text>
                <Text style={{ color: '#6b7280' }}>{item.id}</Text>
              </Pressable>
            );
          }}
        />
      )}

      {selectedUser && (
        <>
          <Pressable onPress={openAsUser} style={btn('#0f172a')}>
            <Text style={btnTxt}>„Wie Benutzer“ ansehen</Text>
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 8 }}>
            Ergebnisse von {selectedUser.full_name || '(ohne Name)'}
          </Text>

          {loadingResults ? (
            <ActivityIndicator />
          ) : results.length === 0 ? (
            <Text style={{ marginTop: 8 }}>Keine Ergebnisse vorhanden.</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontWeight: '700' }}>
                    Klasse {item.grade} · Unit {item.unit} · Station {item.station}
                  </Text>
                  <Text style={{ marginTop: 4 }}>
                    {item.correct}/{item.total} richtig · {Math.round(Number(item.percent))}%
                  </Text>
                  <Text style={{ color: '#6b7280', marginTop: 4 }}>
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}
