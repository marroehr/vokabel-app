// screens/SelectCourseScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

// --- Helpers: Distinct-Loader ------------------------------------------------
async function getDistinctGrades() {
  const { data, error } = await supabase
    .from('words')
    .select('grade', { distinct: true })
    .not('grade', 'is', null)
    .order('grade', { ascending: true });

  if (error) throw error;
  const unique = [...new Set((data ?? []).map((r) => r.grade))];
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
  const unique = [...new Set((data ?? []).map((r) => r.unit))];
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
  const unique = [...new Set((data ?? []).map((r) => r.station))];
  return unique.sort((a, b) => Number(a) - Number(b));
}

// --- Admin-Check via RPC -----------------------------------------------------
// In Supabase per SQL angelegt:
// create or replace function public.is_admin() returns boolean ...
async function checkIsAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('Admin-Check Fehler:', error.message);
    return false;
  }
  return data === true;
}

// --- Styles ------------------------------------------------------------------
const chip = (activeColor, isActive) => ({
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 10,
  backgroundColor: isActive ? activeColor : '#eeeeee',
});
const chipText = (isActive) => ({ color: isActive ? '#fff' : '#111' });
const sectionTitle = { fontSize: 24, fontWeight: '700', marginBottom: 12 };

// --- Component ---------------------------------------------------------------
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

  const [isAdmin, setIsAdmin] = useState(false);

  // Initial: Klassen + Adminstatus laden
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingGrades(true);
      try {
        // User geladen? (für RPC)
        const { data: { user } } = await supabase.auth.getUser();

        // Klassen laden
        const g = await getDistinctGrades();
        if (!mounted) return;
        setGrades(g);
        if (g.length === 0) {
          Alert.alert('Hinweis', 'Keine Klassen in der Datenbank gefunden.');
        }

        // Adminstatus nur prüfen, wenn eingeloggt
        if (user) {
          const ok = await checkIsAdmin();
          if (!mounted) return;
          setIsAdmin(ok);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Fehler', 'Konnte Klassen/Adminstatus nicht laden.');
      } finally {
        if (mounted) setLoadingGrades(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Wenn Klasse geändert → Units laden & Auswahl zurücksetzen
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
        if (u.length === 0) {
          Alert.alert('Hinweis', `Keine Units für Klasse ${grade} gefunden.`);
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Fehler', 'Konnte Units nicht laden.');
      } finally {
        if (mounted) setLoadingUnits(false);
      }
    })();
    return () => { mounted = false; };
  }, [grade]);

  // Wenn Unit geändert → Stationen laden & Auswahl zurücksetzen
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
        if (s.length === 0) {
          Alert.alert('Hinweis', `Keine Stationen für Klasse ${grade}, Unit ${unit} gefunden.`);
        }
      } catch (e) {
        console.error(e);
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

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 16 }}>Kurs wählen</Text>

        {/* Klassen */}
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

        {/* Units */}
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

        {/* Stationen */}
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

        {/* Weiter */}
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

        {/* Admin-Bereich (nur sichtbar für Admins) */}
        {isAdmin && (
          <Pressable
            onPress={() => nav.navigate('Admin')}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: '#0f172a',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Admin-Bereich</Text>
          </Pressable>
        )}

        {/* Back */}
        <Pressable onPress={() => nav.goBack()} style={{ marginTop: 16, alignSelf: 'center' }}>
          <Text style={{ color: '#1565c0', fontWeight: '600' }}>Zurück</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
