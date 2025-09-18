// screens/ReviewScreen.js
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';

export default function ReviewScreen() {
  const nav = useNavigation();
  const { params } = useRoute();
  const attempts = params?.attempts ?? [];
  const grade = params?.grade;
  const unit = params?.unit;
  const station = params?.station;
  const percent = params?.percent ?? 0;

  const [showWrongOnly, setShowWrongOnly] = useState(false);

  const data = useMemo(() => {
    const base = showWrongOnly ? attempts.filter(a => !a.isCorrect) : attempts;
    // kleine, stabile Sortierung: falsch zuerst, dann alphabetisch DE
    return [...base].sort((a, b) => {
      if (a.isCorrect !== b.isCorrect) return a.isCorrect ? 1 : -1;
      return String(a.de).localeCompare(String(b.de), 'de');
    });
  }, [attempts, showWrongOnly]);

  const correctCount = attempts.filter(a => a.isCorrect).length;
  const total = attempts.length;

  const Item = ({ item, index }) => {
    const badge = item.isCorrect ? '✅' : '❌';
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: '#e0e0e0',
          borderRadius: 10,
          padding: 12,
          marginBottom: 10,
          backgroundColor: item.isCorrect ? '#f1f8e9' : '#ffebee',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700' }}>
          {badge} {index + 1}. {item.de}
        </Text>
        <Text style={{ marginTop: 6 }}>
          Deine Antwort: <Text style={{ fontWeight: '700' }}>{item.chosenText}</Text>
        </Text>
        {!item.isCorrect && (
          <Text style={{ marginTop: 2 }}>
            Richtig: <Text style={{ fontWeight: '700' }}>{item.correctText}</Text>
          </Text>
        )}
        <Text style={{ marginTop: 8, color: '#666' }}>
          Optionen: {item.allOptions.join(' · ')}
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 18, color: '#666' }}>
        Klasse {String(grade)} · Unit {String(unit)} · Station {String(station)}
      </Text>
      <Text style={{ fontSize: 24, fontWeight: '800', marginTop: 6 }}>
        Ergebnis: {correctCount} / {total} richtig ({percent}%)
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12, flexWrap: 'wrap' }}>
        <Pressable
          onPress={() => setShowWrongOnly(false)}
          style={{
            paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
            backgroundColor: !showWrongOnly ? '#1565c0' : '#eeeeee',
          }}
        >
          <Text style={{ color: !showWrongOnly ? '#fff' : '#111' }}>Alle</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowWrongOnly(true)}
          style={{
            paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
            backgroundColor: showWrongOnly ? '#1565c0' : '#eeeeee',
          }}
        >
          <Text style={{ color: showWrongOnly ? '#fff' : '#111' }}>Nur falsche</Text>
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => <Item item={item} index={index} />}
        contentContainerStyle={{ paddingBottom: 16 }}
      />

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Pressable
          onPress={() => nav.navigate('Quiz', { grade, unit, station })}
          style={{ backgroundColor: '#111', paddingVertical: 10, borderRadius: 8, paddingHorizontal: 14 }}
        >
          <Text style={{ color: '#fff' }}>Quiz erneut starten</Text>
        </Pressable>
        <Pressable
          onPress={() => nav.navigate('SelectCourse')}
          style={{ backgroundColor: '#616161', paddingVertical: 10, borderRadius: 8, paddingHorizontal: 14 }}
        >
          <Text style={{ color: '#fff' }}>Kurs wechseln</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
