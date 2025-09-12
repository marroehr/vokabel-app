import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { supabase } from '../lib/supabase';

export default function QuizScreen({ grade, unit }) {
  const [direction, setDirection] = useState('de_to_en'); // 'en_to_de'
  const [q, setQ] = useState(null);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(null);

  const load = async () => {
    setSelected(null); setStatus(null);
    const { data, error } = await supabase.rpc('get_mc_question', {
      p_direction: direction,
      p_grade: grade,
      p_unit: unit,
    });
    if (error) { alert(error.message); return; }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) { alert('Keine Frage für diese Klasse/Unit. Bitte Wörter in Supabase → words eintragen.'); return; }
    const correct0 = Math.max(0, Math.min(3, (row.correct_index ?? 1) - 1));
    setQ({ ...row, correct0 });
  };

  const answer = async (i) => {
    if (!q || selected !== null) return;
    setSelected(i);
    const ok = i === q.correct0;
    setStatus(ok);
    try {
      await supabase.rpc('record_attempt', { p_word_id: q.word_id, p_is_correct: ok });
    } catch {}
  };

  if (!q) {
    return (
      <View style={{ padding:24, gap:12 }}>
        <Text style={{ fontSize:16, marginBottom:8 }}>
          Klasse {grade} · Unit {unit} · Modus {direction==='de_to_en' ? 'DE→EN' : 'EN→DE'}
        </Text>
        <Button title="Frage laden" onPress={load} />
        <Button
          title={direction==='de_to_en' ? 'Modus: DE → EN' : 'Modus: EN → DE'}
          onPress={() => setDirection(d => d==='de_to_en' ? 'en_to_de' : 'de_to_en')}
        />
      </View>
    );
  }

  return (
    <View style={{ padding:24, gap:12 }}>
      <Text style={{ fontSize:16 }}>
        Übersetze: <Text style={{ fontWeight:'700' }}>{q.question}</Text>
      </Text>

      {q.options?.map((opt, idx) => (
        <View key={idx} style={{
          borderWidth:1, borderRadius:8, padding:12, marginVertical:6,
          backgroundColor:
            selected===null ? 'white' :
            idx===q.correct0 ? '#c6f6d5' :
            idx===selected ? '#fed7d7' : 'white'
        }}>
          <Text onPress={() => answer(idx)}>{opt}</Text>
        </View>
      ))}

      {selected!==null && (
        <Text>{status ? '✅ Richtig' : `❌ Falsch. Richtig ist: ${q.options[q.correct0]}`}</Text>
      )}

      <View style={{ flexDirection:'row', gap:12, marginTop:8 }}>
        <Button title="Nächste" onPress={load} />
      </View>
    </View>
  );
}
