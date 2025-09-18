// App.js
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import SelectCourseScreen from './screens/SelectCourseScreen';
import QuizScreen from './screens/QuizScreen';
import ReviewScreen from './screens/ReviewScreen';
import TestHistoryScreen from './screens/TestHistoryScreen';
import AdminScreen from './screens/AdminScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer theme={DefaultTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Anmeldung' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Start' }} />
        <Stack.Screen name="SelectCourse" component={SelectCourseScreen} options={{ title: 'Kurs wählen' }} />
        <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz' }} />
        <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Auswertung' }} />
        <Stack.Screen name="TestHistory" component={TestHistoryScreen} options={{ title: 'Ergebnisse' }} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin-Bereich' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
