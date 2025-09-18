// screens/AdminScreen.js
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import AdminGate from '../components/AdminGate';
import WordsManager from './admin/WordsManager';
import UserResults from './admin/UserResults';

const TabButton = ({ label, active, onPress }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: active ? '#111827' : '#e5e7eb',
      marginRight: 8,
    }}
  >
    <Text style={{ color: active ? '#fff' : '#111', fontWeight: '700' }}>{label}</Text>
  </Pressable>
);

export default function AdminScreen() {
  const [tab, setTab] = useState('words'); // 'words' | 'results'
  const title = useMemo(() => (tab === 'words' ? 'Wörter pflegen' : 'Benutzer-Ergebnisse'), [tab]);

  return (
    <AdminGate>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 12 }}>Admin · {title}</Text>

        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <TabButton label="Wörter" active={tab === 'words'} onPress={() => setTab('words')} />
          <TabButton label="Benutzer-Ergebnisse" active={tab === 'results'} onPress={() => setTab('results')} />
        </View>

        <View style={{ flex: 1 }}>
          {tab === 'words' ? <WordsManager /> : <UserResults />}
        </View>
      </View>
    </AdminGate>
  );
}
