// screens/TestHistoryScreen.js
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, Alert, FlatList } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

function formatMode(mode) {
  if (!mode) return 'Unbekannt';
  if (mode === 'cloze') return 'Lückentext';
  if (mode === 'de2en') return 'MC: DE→EN';
  if (mode === 'en2de') return 'MC: EN→DE';
  return String(mode);
}

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
          .from('test_results')
          .select('id, grade, unit, station, correct, total, percent, mode, created_at') // <- mode dazu
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
          renderItem={({ item }) => {
            const pct = Math.round(Number(item.percent ?? 0));
            return (
              <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12 }}>
                {/* Kopfzeile: Kurs + Mode-Badge */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700' }}>
                    Klasse {item.grade} · Unit {item.unit} · Station {item.station}
                  </Text>
                  <View style={{ backgroundColor: '#eef2ff', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 }}>
                    <Text style={{ color: '#3730a3', fontWeight: '700' }}>{formatMode(item.mode)}</Text>
                  </View>
                </View>

                <Text style={{ marginTop: 6 }}>
                  {item.correct}/{item.total} richtig · {pct}%
                </Text>

                <Text style={{ color: '#6b7280', marginTop: 4 }}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}
