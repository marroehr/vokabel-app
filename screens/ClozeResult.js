import React from 'react';
import { View, Text, Pressable } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ClozeResult() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const total = params?.total ?? 0;
  const correct = params?.correct ?? 0;
  const pct = total ? Math.round((correct / total) * 100) : 0;

  return (
    <ScreenContainer>
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', gap: 12, padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight:'600' }}>Ergebnis</Text>
        <Text style={{ fontSize: 18 }}>{correct} von {total} richtig</Text>
        <Text style={{ fontSize: 28 }}>{pct}%</Text>

        <Pressable
          onPress={() => navigation.popToTop()}
          style={{ marginTop: 16, backgroundColor:'#007aff', padding: 12, borderRadius: 8, minWidth: 160 }}
        >
          <Text style={{ color:'#fff', textAlign:'center', fontSize: 16 }}>Zurück zum Start</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
