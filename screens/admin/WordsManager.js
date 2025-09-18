// screens/admin/WordsManager.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

const inputStyle = {
  borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8
};
const btn = (bg='#2563eb') => ({
  backgroundColor: bg, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8
});
const btnTxt = { color: '#fff', fontWeight: '700' };

export default function WordsManager() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter
  const [grade, setGrade] = useState('');
  const [unit, setUnit] = useState('');
  const [station, setStation] = useState('');

  // Formular
  const [editingId, setEditingId] = useState(null);
  const [de, setDe] = useState('');
  const [en, setEn] = useState('');
  const [level, setLevel] = useState('A1');
  const [category, setCategory] = useState('all');

  // CSV
  const [csvText, setCsvText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('words').select('*').order('id', { ascending: true });

    if (grade) q = q.eq('grade', Number(grade));
    if (unit) q = q.eq('unit', Number(unit));
    if (station) q = q.eq('station', Number(station));

    const { data, error } = await q;
    if (error) Alert.alert('Fehler', error.message);
    setWords(data ?? []);
    setLoading(false);
  }, [grade, unit, station]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setDe(''); setEn(''); setLevel('A1'); setCategory('all');
  };

  const saveWord = async () => {
    if (!de.trim() || !en.trim()) {
      Alert.alert('Validierung', 'Bitte DE und EN ausfüllen.');
      return;
    }

    const payload = {
      de: de.trim(),
      en: en.trim(),
      level: level || 'A1',
      category: category || 'all',
      grade: grade ? Number(grade) : null,
      unit: unit ? Number(unit) : null,
      station: station ? Number(station) : null,
    };

    if (editingId) {
      const { error } = await supabase.from('words').update(payload).eq('id', editingId);
      if (error) return Alert.alert('Fehler', error.message);
      resetForm();
      load();
      return;
    }

    const { error } = await supabase.from('words').insert(payload);
    if (error) return Alert.alert('Fehler', error.message);
    resetForm();
    load();
  };

  const editWord = (w) => {
    setEditingId(w.id);
    setDe(w.de); setEn(w.en);
    setLevel(w.level || 'A1');
    setCategory(w.category || 'all');
  };

  const deleteWord = async (id) => {
    Alert.alert('Löschen?', 'Dieses Wort wirklich löschen?', [
      { text: 'Abbrechen' },
      { text: 'Löschen', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('words').delete().eq('id', id);
          if (error) return Alert.alert('Fehler', error.message);
          load();
        } 
      }
    ]);
  };

  const importCsv = async () => {
    // Format je Zeile: de;en;grade;unit;station;level;category (Separator ; oder ,)
    const rows = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const batch = [];
    for (const row of rows) {
      const p = row.split(/[;,]/).map(x => x.trim());
      const [cde, cen, cgrade, cunit, cstation, clevel, ccategory] = p;
      if (!cde || !cen) continue;
      batch.push({
        de: cde,
        en: cen,
        grade: cgrade ? Number(cgrade) : null,
        unit: cunit ? Number(cunit) : null,
        station: cstation ? Number(cstation) : null,
        level: clevel || 'A1',
        category: ccategory || 'all',
      });
    }
    if (!batch.length) return Alert.alert('CSV', 'Keine gültigen Zeilen gefunden.');

    const { error } = await supabase.from('words').insert(batch);
    if (error) return Alert.alert('Fehler beim Import', error.message);
    setCsvText('');
    load();
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Filter */}
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Filter</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          keyboardType="numeric"
          placeholder="Klasse"
          value={grade}
          onChangeText={setGrade}
          style={[inputStyle, { flex: 1 }]}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Unit"
          value={unit}
          onChangeText={setUnit}
          style={[inputStyle, { flex: 1 }]}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Station"
          value={station}
          onChangeText={setStation}
          style={[inputStyle, { flex: 1 }]}
        />
      </View>
      <Pressable onPress={load} style={btn('#0ea5e9')}>
        <Text style={btnTxt}>Filtern / Aktualisieren</Text>
      </Pressable>

      {/* Formular */}
      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16 }}>
        {editingId ? 'Wort bearbeiten' : 'Neues Wort anlegen'}
      </Text>

      <TextInput placeholder="Deutsch" value={de} onChangeText={setDe} style={inputStyle} />
      <TextInput placeholder="Englisch" value={en} onChangeText={setEn} style={inputStyle} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput placeholder="Level (A1…)" value={level} onChangeText={setLevel} style={[inputStyle, { flex: 1 }]} />
        <TextInput placeholder="Kategorie" value={category} onChangeText={setCategory} style={[inputStyle, { flex: 1 }]} />
      </View>

      <Pressable onPress={saveWord} style={btn('#16a34a')}>
        <Text style={btnTxt}>{editingId ? 'Speichern' : 'Anlegen'}</Text>
      </Pressable>
      {editingId && (
        <Pressable onPress={() => { resetForm(); }} style={btn('#475569')}>
          <Text style={btnTxt}>Abbrechen</Text>
        </Pressable>
      )}

      {/* CSV */}
      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16 }}>CSV-Import</Text>
      <Text style={{ color: '#555', marginBottom: 4 }}>
        Format: <Text style={{ fontWeight: '700' }}>de;en;grade;unit;station;level;category</Text>
      </Text>
      <TextInput
        multiline
        placeholder={'z.B.\nHaus;house;5;1;1;A1;Alltag\nAuto;car;5;1;1;A1;Alltag'}
        value={csvText}
        onChangeText={setCsvText}
        style={[inputStyle, { minHeight: 120, textAlignVertical: 'top' }]}
      />
      <Pressable onPress={importCsv} style={btn('#7c3aed')}>
        <Text style={btnTxt}>CSV importieren</Text>
      </Pressable>

      {/* Liste */}
      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12 }}>
        {loading ? 'Lade…' : `Wörter (${words.length})`}
      </Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12 }}>
              <Text style={{ fontWeight: '700' }}>{item.de} → {item.en}</Text>
              <Text style={{ color: '#555', marginTop: 2 }}>
                Klasse {item.grade ?? '-'} · Unit {item.unit ?? '-'} · Station {item.station ?? '-'}
              </Text>
              <Text style={{ color: '#555' }}>Level {item.level ?? 'A1'} · Kategorie {item.category ?? 'all'}</Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable onPress={() => editWord(item)} style={btn('#0ea5e9')}>
                  <Text style={btnTxt}>Bearbeiten</Text>
                </Pressable>
                <Pressable onPress={() => deleteWord(item.id)} style={btn('#dc2626')}>
                  <Text style={btnTxt}>Löschen</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}
