// screens/InnerAdmin.js
import React from 'react';
import { View, Text } from 'react-native';

export default function InnerAdmin() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
        Admin Bereich
      </Text>
      <Text>Hier kannst du später deine Admin-Funktionen einbauen.</Text>
    </View>
  );
}
