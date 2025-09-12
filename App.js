import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthProvider';
import AuthScreen from './screens/AuthScreen';
import SelectCourseScreen from './screens/SelectCourseScreen';
import QuizScreen from './screens/QuizScreen';

function Gate() {
  const { session, loading } = useAuth();
  const [selection, setSelection] = useState({ grade: null, unit: null });

  if (loading) {
    return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator size="large" />
    </View>;
  }
  if (!session) return <AuthScreen />;
  if (!selection.grade || !selection.unit) {
    return <SelectCourseScreen selection={selection} onSelect={setSelection} />;
  }
  return <QuizScreen grade={selection.grade} unit={selection.unit} />;
}

export default function App() {
  return <AuthProvider><Gate /></AuthProvider>;
}
