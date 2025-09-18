// App.js
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AuthScreen from './screens/AuthScreen';
import SelectCourseScreen from './screens/SelectCourseScreen';
import QuizScreen from './screens/QuizScreen';
import ReviewScreen from './screens/ReviewScreen';
import TestHistoryScreen from './screens/TestHistoryScreen';
import AdminScreen from './screens/AdminScreen';
import TestHistoryScreen from './screens/TestHistoryScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#ffffff' },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerTitleAlign: 'center',
            headerBackTitle: 'Zurück',
          }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Anmeldung', headerShown: false }} />
          <Stack.Screen
            name="SelectCourse"
            component={SelectCourseScreen}
            options={({ navigation }) => ({
              title: 'Kurs wählen',
              headerRight: () => (
                <button
                  onClick={() => navigation.navigate('TestHistory')}
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: '#1565c0',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '6px 10px'
                  }}
                >
                  Verlauf
                </button>
              )
            })}
          />
          <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz' }} />
          <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Ergebnis-Übersicht' }} />
          <Stack.Screen name="TestHistory" component={TestHistoryScreen} options={{ title: 'Mein Verlauf' }} />
		  <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin' }} />
		  <Stack.Screen name="TestHistory" component={TestHistoryScreen} options={{ title: 'Ergebnisse' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
