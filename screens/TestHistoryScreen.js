// screens/TestHistoryScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    // dd.mm.yyyy, hh:mm
    return d.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export default function TestHistoryScreen() {
  const nav = useNavigation();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); // alle Treffer
  const [error, setError] = useState(null);

  // Filter
  const [grades, setGrades] = useState([]);
  const [units, setUnits] = useState([]);
  const [stations, setStations] = useState([]);
  const [grade, setGrade] = useState(null);
  const [unit, setUnit] = useState(null);
  const [station, setStation] = useState(null);

  // 1) Distinct-Filter laden (aus test_results)
  useEffect(() => {
    (async () => {
      try {
        // Nur eigene Ergebnisse (RLS erzwingt das ohnehin)
        const { data: gData, error: gErr } = await supabase
          .from('test_results')
          .select('grade', { distinct: true })
          .order('grade', { ascending: true });
        if (gErr) throw gErr;
        setGrades([...new Set((gData ?? []).map(r => r.grade))]);

        const { data: uData, error: uErr } = await supabase
          .from('test_results')
          .select('unit', { distinct: true })
          .order('unit', { ascending: true });
        if (uErr) throw uErr;
        setUnits([...new Set((uData ?? []).map(r => r.unit))]);

        const { data: sData, error: sErr } = await supabase
          .from('test_results')
          .select('station', { distinct: true })
          .order('station', { ascending: true });
        if (sErr) throw sErr;
        setStations([...new Set((sData ?? []).map(r => r.station))]);
      } catch (e) {
        console.error(e);
        // Nicht blockieren, Filter sind optional
      }
    })();
  }, []);

  // 2) Ergebnisse laden mit Filtern
  async function load() {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('test_results')
        .select('id, grade, unit, station, total, correct, percent, created_at', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (grade != null) q = q.eq('grade', grade);
      if (unit != null) q = q.eq('unit', unit);
      if (station != null) q = q.eq('station', station);

      const { data, error } = await q;
      if (error) throw error;

      setRows(data ?? []);
    } catch (e) {
      console.error(e);
      setError('Konnte Verlauf nicht laden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [grade, unit, station]);

  const totalTests = rows.length;
  const avgPercent = useMemo(() => {
    if (!rows.length) return 0;
    const sum = rows.reduce((acc, r) => acc + (r.percent ?? 0), 0);
    return Math.round(sum / rows.length);
  }, [rows]);

  // CSV-Export (nur Web)
  function exportCSV() {
    if (Platform.OS !== 'web') {
      Alert.alert('Export nur im Browser', 'CSV-Download ist aktuell nur im Web verfügbar.');
      return;
    }
    if (!rows.length) {
      Alert.alert('Nichts zu exportieren', 'Keine Einträge im Verlauf.');
      return;
    }
    const header = ['Datum', 'Klasse', 'Unit', 'Station', 'Richtig', 'Gesamt', 'Prozent'];
    const lines = rows.map(r => [
      fmtDate(r.created_at),
      r.grade,
      r.unit,
      r.station,
      r.correct,
      r.total,
      r.percent
    ]);
    const csv = [header, ...lines]
      .map(arr => arr.map(v => {
        const s = String(v ?? '');
        // einfache CSV-Quote
        return `"${s.replace(/"/g, '""')}"`;
      }).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.download = `test_results_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 8 }}>Mein Verlauf</Text>

      {/* Filter */}
      <View style={{ gap: 8, marginBottom: 12 }}>
        <Text style={{ color: '#666' }}>Filter</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {/* Klasse */}
          <Pressable
            onPress={() => setGrade(null)}
            style={{
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
              backgroundColor: grade == null ? '#1565c0' : '#eeeeee'
            }}
          >
            <Text style={{ color: grade == null ? '#fff' : '#111' }}>Alle Klassen</Text>
          </Pressable>
          {grades.map(g => (
            <Pressable
              key={`g-${g}`}
              onPress={() => setGrade(g)}
              style={{
                paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
                backgroundColor: grade === g ? '#1565c0' : '#eeeeee'
              }}
            >
              <Text style={{ color: grade === g ? '#fff' : '#111' }}>Kl. {g}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {/* Unit */}
          <Pressable
            onPress={() => setUnit(null)}
            style={{
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
              backgroundColor: unit == null ? '#1565c0' : '#eeeeee'
            }}
          >
            <Text style={{ color: unit == null ? '#fff' : '#111' }}>Alle Units</Text>
          </Pressable>
          {units.map(u => (
            <Pressable
              key={`u-${u}`}
              onPress={() => setUnit(u)}
              style={{
                paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
                backgroundColor: unit === u ? '#1565c0' : '#eeeeee'
              }}
            >
              <Text style={{ color: unit === u ? '#fff' : '#111' }}>U{u}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {/* Station */}
          <Pressable
            onPress={() => setStation(null)}
            style={{
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
              backgroundColor: station == null ? '#1565c0' : '#eeeeee'
            }}
          >
            <Text style={{ color: station == null ? '#fff' : '#111' }}>Alle Stationen</Text>
          </Pressable>
          {stations.map(s => (
            <Pressable
              key={`s-${s}`}
              onPress={() => setStation(s)}
              style={{
                paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
                backgroundColor: station === s ? '#1565c0' : '#eeeeee'
              }}
            >
              <Text style={{ color: station === s ? '#fff' : '#111' }}>S{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Summary + Actions */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, color: '#333' }}>
          Einträge: <Text style={{ fontWeight: '700' }}>{totalTests}</Text> · Ø {avgPercent}%
        </Text>
        <Pressable
          onPress={exportCSV}
          style={{ backgroundColor: '#111', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff' }}>CSV exportieren</Text>
        </Pressable>
        <Pressable
          onPress={() => nav.navigate('SelectCourse')}
          style={{ backgroundColor: '#616161', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff' }}>Zur Kurswahl</Text>
        </Pressable>
      </View>

      {/* Liste */}
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={{ color: '#c62828' }}>{error}</Text>
      ) : rows.length === 0 ? (
        <Text>Kein Verlauf für die gewählten Filter.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {rows.map((r) => (
            <View
              key={r.id}
              style={{
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 10,
                padding: 12,
                backgroundColor: '#fafafa'
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700' }}>
                {fmtDate(r.created_at)} · Kl. {r.grade} · U{r.unit} · S{r.station}
              </Text>
              <Text style={{ marginTop: 6 }}>
                Ergebnis: <Text style={{ fontWeight: '700' }}>{r.correct}/{r.total}</Text> ({r.percent}%)
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => nav.navigate('Quiz', { grade: r.grade, unit: r.unit, station: r.station })}
                  style={{ backgroundColor: '#1565c0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff' }}>Erneut üben</Text>
                </Pressable>
                <Pressable
                  onPress={() => nav.navigate('SelectCourse')}
                  style={{ backgroundColor: '#616161', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff' }}>Kurs wählen</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
