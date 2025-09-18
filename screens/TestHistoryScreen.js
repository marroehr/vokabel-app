// screens/TestHistoryScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, FlatList } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

export default function TestHistoryScreen({ route }) {
  const adminUserId = route?.params?.adminUserId || null;
  const adminFullName = route?.params?.adminFullName || null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let targetUserId = adminUserId;
        if (!targetUserId) {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) throw error;
          if (!user) throw new Error('Nicht eingeloggt.');
          targetUserId = user.id;
        }

        const { data, error: qErr } = await supabase
          .from('test_results') // <-- richtig
          .select('id, grade, unit, station, correct, total, percent, created_at')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (qErr) throw qErr;
        setRows(data ?? []);
      } catch (e) {
        console.error(e);
        Alert.alert('Fehler', e.message || 'Konnte Ergebnisse nicht laden.');
      } finally {
        setLoading(false);
      }
    })();
  }, [adminUserId]);

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 12 }}>
        Testergebnisse {adminUserId ? `· ${adminFullName || ''}` : ''}
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : rows.length === 0 ? (
        <Text>Keine Einträge.</Text>
      ) : (
        <FlatList
          data={rows}
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
    </ScreenContainer>
  );
}
