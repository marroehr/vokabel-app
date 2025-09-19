// screens/ClozeQuizScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const normalize = (s) => {
  if (!s) return '';
  let t = s.trim().toLowerCase();
  t = t
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?()"']/g, '');
  return t;
};

// Akzeptiert ";" oder "|" als Trenner, generiert zudem Umlaut-Varianten
const toSolutions = (text) => {
  if (!text || !text.trim()) return [];
  const parts = text
    .split(/[;|]/)
    .map(s => s.trim())
    .filter(Boolean);

  const set = new Set();
  parts.forEach(x => {
    set.add(x);
    set.add(
      x
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
    );
  });
  return Array.from(set);
};

const buildPrompt = (row, direction, hasClozeEn = false) => {
  if (direction === 'en->de') {
    if (row.cloze_de && row.cloze_de.includes('___')) return row.cloze_de;
    return `Setze das **deutsche** Wort für **${row.en}** ein: ___`;
  } else {
    if (hasClozeEn && row.cloze_en && row.cloze_en.includes('___')) return row.cloze_en;
    return `Setze das **englische** Wort für **${row.de}** ein: ___`;
  }
};

export default function ClozeQuizScreen() {
  const nav = useNavigation();
  const { params } = useRoute();
  const grade = params?.grade;
  const unit = params?.unit;
  const station = params?.station;

  // Richtung: 'en->de' (Standard) oder 'de->en'
  const [direction, setDirection] = useState(params?.direction === 'de->en' ? 'de->en' : 'en->de');

  const [pool, setPool] = useState([]);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [finished, setFinished] = useState(false);

  const [current, setCurrent] = useState(null);
  const [answer, setAnswer] = useState('');
  const [locked, setLocked] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [savedResult, setSavedResult] = useState(false);

  const total = order.length;
  const progressLabel = useMemo(
    () => `${Math.min(currentIdx + (locked ? 1 : 0), total)} / ${total}`,
    [currentIdx, locked, total]
  );

  // Optional: falls du cloze_en in der DB hast → true setzen und unten in selectCols mit auswählen
  const HAS_CLOZE_EN_COLUMN = false;

  const fetchPool = useCallback(async () => {
    setLoading(true);
    try {
      const selectCols = 'id,de,en,grade,unit,station,cloze_de' + (HAS_CLOZE_EN_COLUMN ? ',cloze_en' : '');
      const { data, error } = await supabase
        .from('words')
        .select(selectCols)
        .eq('grade', grade)
        .eq('unit', unit)
        .eq('station', station);

      if (error) throw error;

      if (!data || data.length < 1) {
        Alert.alert('Keine Daten', 'Für diese Auswahl wurden keine Einträge gefunden.');
        setPool([]);
        setOrder([]);
        setFinished(true);
      } else {
        setPool(data);
        const ids = shuffle(data.map(w => w.id));
        setOrder(ids);
        setCurrentIdx(0);
        setFinished(false);
        setCorrectCount(0);
        setAttempts([]);
        setSavedResult(false);
        setAnswer('');
        setLocked(false);
      }
    } catch (e) {
      console.error('fetchPool error', e);
      Alert.alert('Fehler', 'Konnte Lückentexte nicht laden.');
    } finally {
      setLoading(false);
    }
  }, [grade, unit, station]);

  useEffect(() => { fetchPool(); }, [fetchPool]);

  const buildTask = useCallback(() => {
    if (!pool.length || !order.length || currentIdx >= order.length) {
      setCurrent(null);
      return;
    }
    const id = order[currentIdx];
    const row = pool.find(w => w.id === id);
    if (!row) {
      if (currentIdx + 1 >= order.length) setFinished(true);
      else setCurrentIdx(i => i + 1);
      return;
    }

    const prompt = buildPrompt(row, direction, HAS_CLOZE_EN_COLUMN);

    const primarySource = direction === 'en->de' ? row.de : row.en;
    const primarySolution =
      (primarySource || '')
        .split(/[;|]/)
        .map(s => s.trim())
        .filter(Boolean)[0] || '';

    const solutions = toSolutions(direction === 'en->de' ? row.de : row.en);

    setCurrent({ ...row, prompt, solutions, primarySolution });
    setAnswer('');
    setLocked(false);
  }, [pool, order, currentIdx, direction]);

  useEffect(() => {
    if (!loading && !finished) buildTask();
  }, [loading, finished, currentIdx, buildTask, direction]);

  const check = useCallback(() => {
    if (!current || locked) return;
    const userN = normalize(answer);
    const ok = current.solutions.some(sol => normalize(sol) === userN);

    setAttempts(prev => [
      ...prev,
      {
        id: current.id,
        de: current.de,
        en: current.en,
        prompt: current.prompt,
        user: answer,
        solution: current.primarySolution || current.solutions[0] || '',
        isCorrect: ok,
        direction
      }
    ]);

    if (ok) setCorrectCount(c => c + 1);
    setLocked(true);
  }, [current, answer, locked, direction]);

  const next = useCallback(() => {
    if (currentIdx + 1 >= order.length) {
      setFinished(true);
    } else {
      setCurrentIdx(i => i + 1);
    }
  }, [currentIdx, order.length]);

  const restart = useCallback(() => {
    if (!pool.length) return;
    const ids = shuffle(pool.map(w => w.id));
    setOrder(ids);
    setCurrentIdx(0);
    setFinished(false);
    setCorrectCount(0);
    setAttempts([]);
    setSavedResult(false);
    setAnswer('');
    setLocked(false);
  }, [pool]);

  const percent = useMemo(() => {
    if (!total) return 0;
    return Math.round((correctCount / total) * 100);
  }, [correctCount, total]);

  // --- Sprachwechsel-Schutz / Neustart-Logik ---

  // Wechsel nur erlaubt, wenn noch nichts beantwortet wurde
  const canSwitchDirection = useMemo(() => {
    return !loading && !finished && attempts.length === 0 && currentIdx === 0 && !locked;
  }, [loading, finished, attempts.length, currentIdx, locked]);

  const restartWithDirection = useCallback((dir) => {
    setDirection(dir);
    if (!pool.length) return;
    const ids = shuffle(pool.map(w => w.id));
    setOrder(ids);
    setCurrentIdx(0);
    setFinished(false);
    setCorrectCount(0);
    setAttempts([]);
    setSavedResult(false);
    setAnswer('');
    setLocked(false);
  }, [pool]);

  const handleDirectionChange = useCallback((dir) => {
    if (direction === dir) return;
    if (canSwitchDirection) {
      setDirection(dir); // useEffect/ buildTask reagieren auf direction
    } else {
      Alert.alert(
        'Richtung wechseln?',
        'Du hast schon Fragen beantwortet. Beim Wechsel wird der Test von vorne begonnen.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Neu starten', style: 'destructive', onPress: () => restartWithDirection(dir) }
        ]
      );
    }
  }, [direction, canSwitchDirection, restartWithDirection]);

  // Ergebnis speichern
  useEffect(() => {
    if (!finished || savedResult || total === 0) return;
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;
        if (!user) return;

        await supabase.from('test_results').insert({
          user_id: user.id,
          user_email: user.email ?? null,
          grade,
          unit,
          station,
          total,
          correct: correctCount,
          percent,
          mode: direction === 'en->de' ? 'cloze-en->de' : 'cloze-de->en',
        });

        setSavedResult(true);
      } catch (e) {
        console.error('saveResult error', e);
      }
    })();
  }, [finished, savedResult, total, correctCount, percent, grade, unit, station, direction]);

  const DirectionToggle = () => (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
      <Pressable
        onPress={() => handleDirectionChange('en->de')}
        disabled={!canSwitchDirection && direction !== 'en->de'}
        style={{
          paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
          opacity: (!canSwitchDirection && direction !== 'en->de') ? 0.5 : 1,
          backgroundColor: direction === 'en->de' ? '#1565c0' : '#e0e0e0'
        }}
      >
        <Text style={{ color: direction === 'en->de' ? '#fff' : '#111' }}>Englisch → Deutsch</Text>
      </Pressable>
      <Pressable
        onPress={() => handleDirectionChange('de->en')}
        disabled={!canSwitchDirection && direction !== 'de->en'}
        style={{
          paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
          opacity: (!canSwitchDirection && direction !== 'de->en') ? 0.5 : 1,
          backgroundColor: direction === 'de->en' ? '#1565c0' : '#e0e0e0'
        }}
      >
        <Text style={{ color: direction === 'de->en' ? '#fff' : '#111' }}>Deutsch → Englisch</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 18, color: '#666', marginBottom: 6 }}>
        Klasse {String(grade)} · Unit {String(unit)} · Station {String(station)}
      </Text>

      <Pressable onPress={() => nav.goBack()} style={{ marginBottom: 8, alignSelf: 'flex-start' }}>
        <Text style={{ color: '#1565c0' }}>← Zurück</Text>
      </Pressable>

      <DirectionToggle />

      {loading ? (
        <ActivityIndicator />
      ) : finished ? (
        <View style={{ gap: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 26, fontWeight: '800' }}>Ergebnis</Text>
          <Text style={{ fontSize: 20 }}>
            {correctCount} von {total} richtig ({percent}%)
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Pressable
              onPress={restart}
              style={{ backgroundColor: '#111', paddingVertical: 10, borderRadius: 8, paddingHorizontal: 14 }}
            >
              <Text style={{ color: '#fff' }}>Nochmal starten</Text>
            </Pressable>

            <Pressable
              onPress={() => nav.navigate('SelectCourse')}
              style={{ backgroundColor: '#616161', paddingVertical: 10, borderRadius: 8, paddingHorizontal: 14 }}
            >
              <Text style={{ color: '#fff' }}>Kurs wechseln</Text>
            </Pressable>
          </View>
        </View>
      ) : !current ? (
        <Text>Keine Aufgabe verfügbar.</Text>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ gap: 12 }}>
            <Text style={{ color: '#666' }}>Fortschritt: {progressLabel}</Text>

            <Text style={{ fontSize: 24, fontWeight: '700', textAlign: 'center' }}>
              {current.prompt}
            </Text>

            {!locked && (
              <>
                <TextInput
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="Antwort hier eingeben"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
                    paddingVertical: 12, paddingHorizontal: 14, fontSize: 18, textAlign: 'center'
                  }}
                />
                <Pressable
                  onPress={check}
                  style={{ backgroundColor: '#1565c0', paddingVertical: 10, borderRadius: 8, paddingHorizontal: 14 }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center' }}>Prüfen</Text>
                </Pressable>
              </>
            )}

            {locked && (
              <View style={{ gap: 10, alignItems: 'center' }}>
                {attempts[attempts.length - 1]?.isCorrect ? (
                  <Text style={{ fontSize: 18, color: '#2e7d32' }}>✅ Richtig!</Text>
                ) : (
                  <>
                    <Text style={{ fontSize: 18, color: '#c62828' }}>❌ Falsch</Text>
                    <Text style={{ fontSize: 16 }}>
                      Lösung: <Text style={{ fontWeight: '700' }}>{attempts[attempts.length - 1]?.solution}</Text>
                    </Text>
                  </>
                )}
                <Pressable
                  onPress={next}
                  style={{ backgroundColor: '#111', paddingVertical: 10, borderRadius: 8, paddingHorizontal: 14, minWidth: 140 }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center' }}>Nächste</Text>
                </Pressable>
              </View>
            )}

            <Text style={{ textAlign: 'center', opacity: 0.6, marginTop: 8 }}>
              Tipp: Umlaute/ß tolerant (ae/oe/ue/ss). Mehrere Lösungen mit „;“ oder „|“ trennen.
            </Text>
          </View>
        </KeyboardAvoidingView>
      )}
    </ScreenContainer>
  );
}
