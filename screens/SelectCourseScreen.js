// screens/SelectCourseScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

async function getDistinctGrades() {
  const { data, error } = await supabase
    .from('words')
    .select('grade', { distinct: true })
    .not('grade', 'is', null)
    .order('grade', { ascending: true });

  if (error) throw error;
  // Fallback-Unique + Sort
  const unique = [...new Set((data ?? []).map(r => r.grade))];
  return unique.sort((a, b) => Number(a) - Number(b));
}

async function getDistinctUnits(grade) {
  const { data, error } = await supabase
    .from('words')
    .select('unit', { distinct: true })
    .eq('grade', grade)
    .not('unit', 'is', null)
    .order('unit', { ascending: true });

  if (error) throw error;
  const unique = [...new Set((data ?? []).map(r => r.unit))];
  return unique.sort((a, b) => Number(a) - Number(b));
}

async function getDistinctStations(grade, unit) {
  const { data, error } = await supabase
    .from('words')
    .select('station', { distinct: true })
    .eq('grade', grade)
    .eq('unit', unit)
    .not('station', 'is', null)
    .order('station', { ascending: true });

  if (error) throw error;
  const unique = [...new Set((data ?? []).map(r => r.station))];
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
    (async () => {
      setLoadingGrades(true);
      try {
        const g = await getDistinctGrades();
        setGrades(g);
        if (g.length === 0) Alert.alert('Hinweis', 'Keine Klassen in der Datenbank gefunden.');
      } catch (e) {
        console.error(e);
        Alert.alert('Fehler', 'Konnte Klassen nicht laden.');
      } finally {
        setLoadingGrades(false);
      }
    })();
  }, []);

  // Wenn Klasse geändert → Units laden
  useEffect(() => {
    setUnit(null);
    setStation(null);
    setUnits([]);
    setStations([]);
    if (!grade) return;

    (async () => {
      setLoadingUnits(true);
      try {
        const u = await getDistinctUnits(grade);
        setUnits(u);
        if (u.length === 0) Alert.alert('Hinweis', `Keine Units für Klasse ${grade} gefunden.`);
      } catch (e) {
        console.error(e);
        Alert.alert('Fehler', 'Konnte Units nicht laden.');
      } finally {
        setLoadingUnits(false);
      }
    })();
  }, [grade]);

  // Wenn Unit geändert → Stationen laden
  useEffect(() => {
    setStation(null);
    setStations([]);
    if (!grade || !unit) return;

    (async () => {
      setLoadingStations(true);
      try {
        const s = await getDistinctStations(grade, unit);
        setStations(s);
        if (s.length === 0) Alert.alert('Hinweis', `Keine Stationen für Klasse ${grade}, Unit ${unit} gefunden.`);
      } catch (e) {
        console.error(e);
        Alert.alert('Fehler', 'Konnte Stationen nicht laden.');
      } finally {
        setLoadingStations(false);
      }
    })();
  }, [grade, unit]);

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Klasse wählen</Text>
      {loadingGrades ? (
        <ActivityIndicator />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {grades.map(g => (
            <Pressable
              key={String(g)}
              onPress={() => setGrade(g)}
              style={{
                paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8,
                backgroundColor: g === grade ? '#2e7d32' : '#eeeeee',
              }}
            >
              <Text style={{ color: g === grade ? '#fff' : '#111' }}>{String(g)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {grade && (
        <>
          <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Unit wählen</Text>
          {loadingUnits ? (
            <ActivityIndicator />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {units.map(u => (
                <Pressable
                  key={String(u)}
                  onPress={() => setUnit(u)}
                  style={{
                    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8,
                    backgroundColor: u === unit ? '#1565c0' : '#eeeeee',
                  }}
                >
                  <Text style={{ color: u === unit ? '#fff' : '#111' }}>{String(u)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      {grade && unit && (
        <>
          <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Station wählen</Text>
          {loadingStations ? (
            <ActivityIndicator />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {stations.map(s => (
                <Pressable
                  key={String(s)}
                  onPress={() => setStation(s)}
                  style={{
                    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8,
                    backgroundColor: s === station ? '#6a1b9a' : '#eeeeee',
                  }}
                >
                  <Text style={{ color: s === station ? '#fff' : '#111' }}>{String(s)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <Pressable
        onPress={() => {
          if (!grade || !unit || !station) return;
          // an Quiz übergeben
          nav.navigate('Quiz', { grade, unit, station });
        }}
        disabled={!grade || !unit || !station}
        style={{
          opacity: (!grade || !unit || !station) ? 0.5 : 1,
          paddingVertical: 12, borderRadius: 10, alignItems: 'center',
          backgroundColor: '#111',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>Weiter zum Quiz</Text>
      </Pressable>

      <Pressable onPress={() => nav.goBack()} style={{ marginTop: 16, alignSelf: 'center' }}>
        <Text style={{ color: '#1565c0' }}>Zurück</Text>
      </Pressable>
    </ScreenContainer>
  );
}
