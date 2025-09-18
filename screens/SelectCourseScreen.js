// screens/SelectCourseScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

// Distinct-Helper
async function getDistinctGrades() {
  const { data, error, status } = await supabase
    .from('words')
    .select('grade', { distinct: true })
    .not('grade', 'is', null)
    .order('grade', { ascending: true });

  console.log('[getDistinctGrades] status', status, 'error', error?.message || null, 'rows', data?.length);
  if (error) throw error;

  const unique = [...new Set((data ?? []).map((r) => r.grade))];
  return unique.sort((a, b) => Number(a) - Number(b));
}

async function getDistinctUnits(grade) {
  const { data, error, status } = await supabase
    .from('words')
    .select('unit', { distinct: true })
    .eq('grade', grade)
    .not('unit', 'is', null)
    .order('unit', { ascending: true });

  console.log('[getDistinctUnits] status', status, 'error', error?.message || null, 'rows', data?.length);
  if (error) throw error;

  const unique = [...new Set((data ?? []).map((r) => r.unit))];
  return unique.sort((a, b) => Number(a) - Number(b));
}

async function getDistinctStations(grade, unit) {
  const { data, error, status } = await supabase
    .from('words')
    .select('station', { distinct: true })
    .eq('grade', grade)
    .eq('unit', unit)
    .not('station', 'is', null)
    .order('station', { ascending: true });

  console.log('[getDistinctStations] status', status, 'error', error?.message || null, 'rows', data?.length);
  if (error) throw error;

  const unique = [...new Set((data ?? []).map((r) => r.station))];
  return unique.sort((a, b) => Number(a) - Number(b));
}

export default function SelectCourseScreen() {
  const nav = useNavigation();

  const [grades, setGrades] = useState([]);
  const [units, setUnits] = useState([]);
  const [stations, setStations] = useState([]);

  const [grade, setGrade] = useState(null);
  const [unit, setUnit] = useState(null);
  const [station, setStation] = useState(null);

  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingGrades(true);
      try {
        // 1) Test: words erreichbar?
        const test = await supabase.from('words').select('id, grade').limit(3);
        console.log('[words test] status', test.status, 'error', test.error?.message || null, 'rows', test.data?.length);

        // 2) eigentliche Klassen
        const g = await getDistinctGrades();
        if (!mounted) return;
        setGrades(g);
        console.log('[grades]', g);
        if (g.length === 0) {
          Alert.alert('Hinweis', 'Keine Klassen in der Datenbank gefunden.');
        }
      } catch (e) {
        console.error('[grades load EXC]', e);
        Alert.alert('Fehler', 'Konnte Klassen nicht laden.');
      } finally {
        if (mounted) setLoadingGrades(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setUnit(null);
    setStation(null);
    setUnits([]);
    setStations([]);
    if (!grade) return;

    let mounted = true;
    (async () => {
      setLoadingUnits(true);
      try {
        const u = await getDistinctUnits(grade);
        if (!mounted) return;
        setUnits(u);
        console.log('[units]', u);
        if (u.length === 0) Alert.alert('Hinweis', `Keine Units für Klasse ${grade} gefunden.`);
      } catch (e) {
        console.error('[units load EXC]', e);
        Alert.alert('Fehler', 'Konnte Units nicht laden.');
      } finally {
        if (mounted) setLoadingUnits(false);
      }
    })();
    return () => { mounted = false; };
  }, [grade]);

  useEffect(() => {
    setStation(null);
    setStations([]);
    if (!grade || !unit) return;

    let mounted = true;
    (async () => {
      setLoadingStations(true);
      try {
        const s = await getDistinctStations(grade, unit);
        if (!mounted) return;
        setStations(s);
        console.log('[stations]', s);
        if (s.length === 0) Alert.alert('Hinweis', `Keine Stationen für Klasse ${grade}, Unit ${unit} gefunden.`);
      } catch (e) {
        console.error('[stations load EXC]', e);
        Alert.alert('Fehler', 'Konnte Stationen nicht laden.');
      } finally {
        if (mounted) setLoadingStations(false);
      }
    })();
    return () => { mounted = false; };
  }, [grade, unit]);

  const goQuiz = useCallback(() => {
    if (!grade || !unit || !station) return;
    nav.navigate('Quiz', { grade, unit, station });
  }, [nav, grade, unit, station]);

  const chip = (activeColor, isActive) => ({
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: isActive ? activeColor : '#eeeeee',
  });
  const chipText = (isActive) => ({ color: isActive ? '#fff' : '#111' });
  const sectionTitle = { fontSize: 24, fontWeight: '700', marginBottom: 12 };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 16 }}>Kurs wählen</Text>

        <Text style={sectionTitle}>Klasse wählen</Text>
        {loadingGrades ? (
          <ActivityIndicator />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {grades.map((g) => {
              const active = g === grade;
              return (
                <Pressable key={String(g)} onPress={() => setGrade(g)} style={chip('#2e7d32', active)}>
                  <Text style={chipText(active)}>{String(g)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {grade && (
          <>
            <Text style={sectionTitle}>Unit wählen</Text>
            {loadingUnits ? (
              <ActivityIndicator />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {units.map((u) => {
                  const active = u === unit;
                  return (
                    <Pressable key={String(u)} onPress={() => setUnit(u)} style={chip('#1565c0', active)}>
                      <Text style={chipText(active)}>{String(u)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {grade && unit && (
          <>
            <Text style={sectionTitle}>Station wählen</Text>
            {loadingStations ? (
              <ActivityIndicator />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {stations.map((s) => {
                  const active = s === station;
                  return (
                    <Pressable key={String(s)} onPress={() => setStation(s)} style={chip('#6a1b9a', active)}>
                      <Text style={chipText(active)}>{String(s)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        <Pressable
          onPress={goQuiz}
          disabled={!grade || !unit || !station}
          style={{
            opacity: !grade || !unit || !station ? 0.5 : 1,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            backgroundColor: '#111',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Weiter zum Quiz</Text>
        </Pressable>

        <Pressable onPress={() => nav.goBack()} style={{ marginTop: 16, alignSelf: 'center' }}>
          <Text style={{ color: '#1565c0', fontWeight: '600' }}>Zurück</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
