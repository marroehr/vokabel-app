// screens/QuizScreen.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { supabase } from '../lib/supabase';

// kleines Helferlein zum Mischen
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function QuizScreen() {
  const nav = useNavigation();
  const { params } = useRoute();
  const grade = params?.grade;
  const unit = params?.unit;
  const station = params?.station;

  // Richtung des Quizzes (de->en | en->de)
  const [direction, setDirection] = useState('de2en');

  // Voller Pool
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sequenz-Logik
  const [order, setOrder] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [finished, setFinished] = useState(false);

  // Aktuelle Frage
  const [questionWord, setQuestionWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [picked, setPicked] = useState(null);
  const [checking, setChecking] = useState(false);

  // Punkte
  const [correctCount, setCorrectCount] = useState(0);

  // Review-Daten
  const [attempts, setAttempts] = useState([]);

  // Ergebnis einmalig gesichert?
  const [savedResult, setSavedResult] = useState(false);

  const total = order.length;
  const progressLabel = useMemo(
    () => `${Math.min(currentIdx + (picked !== null ? 1 : 0), total)} / ${total}`,
    [currentIdx, picked, total]
  );

  // Daten für die Auswahl laden
  const fetchPool = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('words') // <-- Plural
        .select('id, de, en')
        .eq('grade', grade)
        .eq('unit', unit)
        .eq('station', station);

      if (error) throw error;

      if (!data || data.length < 4) {
        Alert.alert('Zu wenig Daten', 'Für diese Auswahl gibt es weniger als 4 Vokabeln.');
        setPool([]);
      } else {
        setPool(data);
        const ids = shuffle(data.map(w => w.id));
        setOrder(ids);
        setCurrentIdx(0);
        setFinished(false);
        setCorrectCount(0);
        setPicked(null);
        setAttempts([]);
        setSavedResult(false);
      }
    } catch (e) {
      console.error('fetchPool error', e);
      Alert.alert('Fehler', 'Konnte Vokabeln nicht laden.');
    } finally {
      setLoading(false);
    }
  }, [grade, unit, station]);

  // Frage aufbauen – richtet sich nach "direction"
  const buildQuestion = useCallback(() => {
    if (!pool.length || !order.length || currentIdx >= order.length) {
      setQuestionWord(null);
      setOptions([]);
      setCorrectIndex(null);
      return;
    }
    const currentId = order[currentIdx];
    const correct = pool.find(w => w.id === currentId);
    if (!correct) {
      if (currentIdx + 1 >= order.length) setFinished(true);
      else setCurrentIdx(i => i + 1);
      return;
    }

    const distractors = shuffle(pool.filter(w => w.id !== correct.id)).slice(0, 3);

    const qText = direction === 'de2en' ? correct.de : correct.en;
    const correctText = direction === 'de2en' ? correct.en : correct.de;
    const distractorTexts = distractors.map(d => (direction === 'de2en' ? d.en : d.de));

    const opts = shuffle([correctText, ...distractorTexts]);
    const idx = opts.indexOf(correctText);

    setQuestionWord({ ...correct, qText, correctText });
    setOptions(opts);
    setCorrectIndex(idx);
    setPicked(null);
  }, [pool, order, currentIdx, direction]);

  useEffect(() => { fetchPool(); }, [fetchPool]);
  useEffect(() => { if (!loading && !finished) buildQuestion(); }, [loading, buildQuestion, finished, currentIdx]);
  useEffect(() => {
    if (!pool.length) return;
    const ids = shuffle(pool.map(w => w.id));
    setOrder(ids);
    setCurrentIdx(0);
    setFinished(false);
    setCorrectCount(0);
    setPicked(null);
    setAttempts([]);
    setSavedResult(false);
  }, [direction]); // eslint-disable-line react-hooks/exhaustive-deps

  async function answer(idx) {
    if (picked !== null || !questionWord) return;
    setPicked(idx);
    setChecking(true);
    const isCorrect = idx === correctIndex;

    setAttempts(prev => [
      ...prev,
      {
        id: questionWord.id,
        de: questionWord.de,
        en: questionWord.en,
        qText: questionWord.qText,
        chosenIndex: idx,
        chosenText: options[idx],
        correctIndex,
        correctText: options[correctIndex],
        isCorrect,
        allOptions: options,
        direction,
      },
    ]);

    try {
      await supabase.rpc('record_attempt', { p_word_id: questionWord.id, p_is_correct: isCorrect });
    } catch (e) {
      console.error('record_attempt error', e);
    } finally {
      setChecking(false);
    }

    if (isCorrect) setCorrectCount(c => c + 1);
  }

  function next() {
    if (currentIdx + 1 >= order.length) {
      setFinished(true);
    } else {
      setCurrentIdx(i => i + 1);
    }
  }

  function restart() {
    const ids = shuffle(pool.map(w => w.id));
    setOrder(ids);
    setCurrentIdx(0);
    setFinished(false);
    setCorrectCount(0);
    setPicked(null);
    setAttempts([]);
    setSavedResult(false);
  }

  const percent = useMemo(() => {
    if (!total) return 0;
    return Math.round((correctCount / total) * 100);
  }, [correctCount, total]);

  // Ergebnis einmalig nach Abschluss speichern
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
          mode: direction,
        });

        setSavedResult(true);
      } catch (e) {
        console.error('saveResult error', e);
      }
    })();
  }, [finished, savedResult, total, correctCount, percent, grade, unit, station, direction]);

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 18, color: '#666', marginBottom: 6 }}>
        Klasse {String(grade)} · Unit {String(unit)} · Station {String(station)}
      </Text>

      <Pressable onPress={() => nav.goBack()} style={{ marginBottom: 8, alignSelf: 'flex-start' }}>
        <Text style={{ color: '#1565c0' }}>← Zurück</Text>
      </Pressable>

      {/* Richtungs-Umschalter */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <Pressable
          onPress={() => setDirection('de2en')}
          style={{
            paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
            backgroundColor: direction === 'de2en' ? '#1565c0' : '#e5e7eb'
          }}
        >
          <Text style={{ color: direction === 'de2en' ? '#fff' : '#111' }}>Deutsch → Englisch</Text>
        </Pressable>
        <Pressable
          onPress={() => setDirection('en2de')}
          style={{
            paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
            backgroundColor: direction === 'en2de' ? '#1565c0' : '#e5e7eb'
          }}
        >
          <Text style={{ color: direction === 'en2de' ? '#fff' : '#111' }}>Englisch → Deutsch</Text>
        </Pressable>
      </View>

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
              onPress={() => nav.navigate('Review', { attempts, grade, unit, station, percent, direction })}
              style={{ backgroundColor: '#1565c0', paddingVertical: 10, borderRadius: 8, paddingHorizontal: 14 }}
            >
              <Text style={{ color: '#fff' }}>Ergebnis ansehen</Text>
            </Pressable>

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
      ) : !questionWord ? (
        <Text>Keine Frage verfügbar.</Text>
      ) : (
        <View style={{ gap: 12 }}>
          <Text style={{ color: '#666' }}>Fortschritt: {progressLabel}</Text>

          <Text style={{ fontSize: 24, fontWeight: '700' }}>
            {questionWord.qText}
          </Text>

          {options.map((opt, idx) => {
            const chosen = picked === idx;
            const isCorrect = idx === correctIndex;
            const bg = chosen ? (isCorrect ? '#2e7d32' : '#c62828') : '#eeeeee';
            const fg = chosen ? '#fff' : '#111';
            return (
              <Pressable
                key={idx}
                onPress={() => answer(idx)}
                disabled={checking || picked !== null}
                style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: bg }}
              >
                <Text style={{ color: fg, fontSize: 16 }}>{opt}</Text>
              </Pressable>
            );
          })}

          {picked !== null && picked !== correctIndex && (
            <View style={{ padding: 10, borderRadius: 8, backgroundColor: '#fff3cd', borderWidth: 1, borderColor: '#ffeeba' }}>
              <Text style={{ color: '#7c6f00' }}>
                Richtig wäre: <Text style={{ fontWeight: '700' }}>{options[correctIndex]}</Text>
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <Pressable
              onPress={next}
              disabled={picked === null}
              style={{
                backgroundColor: '#111',
                paddingVertical: 10,
                borderRadius: 8,
                paddingHorizontal: 14,
                opacity: picked === null ? 0.5 : 1
              }}
            >
              <Text style={{ color: '#fff' }}>Nächste</Text>
            </Pressable>

            <Pressable
              onPress={() => nav.navigate('SelectCourse')}
              style={{ backgroundColor: '#616161', paddingVertical: 10, borderRadius: 8, paddingHorizontal: 14 }}
            >
              <Text style={{ color: '#fff' }}>Kurs wechseln</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
