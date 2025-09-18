// screens/SelectCourseScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

// ---- Distinct Loader --------------------------------------------------------
async function getDistinctGrades() {
  const { data, error } = await supabase
    .from('words')
    .select('grade', { distinct: true })
    .not('grade', 'is', null)
    .order('grade', { ascending: true });

  if (error) throw new Error(`getDistinctGrades: ${error.message}`);
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

  if (error) throw new Error(`getDistinctUnits: ${error.message}`);
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

  if (error) throw new Error(`getDistinctStations: ${error.message}`);
  const unique = [...new Set((data ?? []).map(r => r.station))];
  return unique.sort((a, b) => Number(a) - Number(b));
}

// ---- Admin-Check (RPC) ------------------------------------------------------
async function checkIsAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw new Error(`is_admin RPC: ${error.message}`);
  return data === true;
}

// ---- Styles -----------------------------------------------------------------
const chip = (activeColor, isActive) => ({
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 10,
  backgroundColor: isActive ? activeColor : '#eeeeee',
});
const chipText = (isActive) => ({ color: isActive ? '#fff' : '#111' });
const sectionTitle = { fontSize: 24, fontWeight: '700', marginBottom: 12 };

// ---- Component --------------------------------------------------------------
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

  // Diagnose
  const [dbCount, setDbCount] = useState(null);
  const [lastError, setLastError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingGrades(true);
      setLastError('');
      try {
        // Wer bin ich?
        const { data: { user }, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        // Diagnose: Zeilen zählen
        const { count, error: cErr } = await supabase
          .from('words')
          .select('*', { count: 'exact', head: true });
        if (cErr) throw cErr;
        if (mounted) setDbCount(count ?? 0);

        // Klassen laden
        const g = await getDistinctGrades();
        if (!mounted) return;
        setGrades(g);

        // Adminstatus prüfen (nur wenn eingeloggt)
        if (user) {
          const ok = await checkIsAdmin();
          if (mounted) setIsAdmin(ok);
        } else {
          if (mounted) setIsAdmin(false);
        }
      } catch (e) {
        console.error(e);
        const msg = e?.message ?? String(e);
        setLastError(msg);
        Alert.alert('Fehler', msg);
      } finally {
        if (mounted) setLoadingGrades(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Units laden bei Klassenwechsel
  useEffect(() => {
    setUnit(null);
    setStation(null);
    setUnits([]);
    setStations([]);
    if (!grade) return;

    let mounted = true;
    (async () => {
      setLoadingUnits(true);
      setLastError('');
      try {
        const u = await getDistinctUnits(grade);
        if (mounted) setUnits(u);
      } catch (e) {
        console.error(e);
        const msg = e?.message ?? String(e);
        setLastError(msg);
        Alert.alert('Fehler', msg);
      } finally {
        if (mounted) setLoadingUnits(false);
      }
    })();
    return () => { mounted = false; };
  }, [grade]);

  // Stationen laden bei Unitswechsel
  useEffect(() => {
    setStation(null);
    setStations([]);
    if (!grade || !unit) return;

    let mounted = true;
    (async () => {
      setLoadingStations(true);
      setLastError('');
      try {
        const s = await getDistinctStations(grade, unit);
        if (mounted) setStations(s);
      } catch (e) {
        console.error(e);
        const msg = e?.message ?? String(e);
        setLastError(msg);
        Alert.alert('Fehler', msg);
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
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 16 }}>Kurs wählen</Text>

        {/* Diagnose-Info */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: '#666' }}>
            DB rows in <Text style={{ fontWeight: '700' }}>words</Text>: {dbCount ?? '…'}
            {isAdmin ? ' • Admin' : ''}
          </Text>
          {!!lastError && (
            <Text style={{ color: '#b00020', marginTop: 4 }}>Fehler: {lastError}</Text>
          )}
        </View>

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
            opacity: (!grade || !unit || !station) ? 0.5 : 1,
            paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#111',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Weiter zum Quiz</Text>
        </Pressable>

        {/* Admin-Shortcut */}
        {isAdmin && (
          <Pressable
            onPress={() => nav.navigate('Admin')}
            style={{ marginTop: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#0f172a' }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Admin-Bereich</Text>
          </Pressable>
        )}

        <Pressable onPress={() => nav.goBack()} style={{ marginTop: 16, alignSelf: 'center' }}>
          <Text style={{ color: '#1565c0', fontWeight: '600' }}>Zurück</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
