// components/ScreenContainer.js
import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Platform } from 'react-native';

export default function ScreenContainer({ children, padded = true }) {
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.style.margin = '0';
      document.body.style.margin = '0';
      document.body.style.overflowX = 'hidden';
      return () => { document.body.style.overflowX = 'auto'; };
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: padded ? 16 : 0,
          alignItems: 'stretch',
        }}
        horizontal={false}
      >
        <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
