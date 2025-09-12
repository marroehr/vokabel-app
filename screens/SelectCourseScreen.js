import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';

const grades = [5,6,7,8,9,10];
const units = [1,2,3,4,5,6];

export default function SelectCourseScreen({ selection, onSelect }) {
  const [grade, setGrade] = useState(selection.grade ?? null);
  const [unit, setUnit] = useState(selection.unit ?? null);

  return (
    <View style={{ padding:24, gap:16 }}>
      <Text style={{ fontSize:20, fontWeight:'600' }}>Klasse wählen</Text>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
        {grades.map(g => <Button key={g} title={`Klasse ${g}`} onPress={() => setGrade(g)} />)}
      </View>

      {grade && (
        <>
          <Text style={{ fontSize:20, fontWeight:'600', marginTop:16 }}>Unit wählen</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
            {units.map(u => <Button key={u} title={`Unit ${u}`} onPress={() => setUnit(u)} />)}
          </View>
        </>
      )}

      <View style={{ marginTop:24 }}>
        <Button title="Weiter zum Quiz" onPress={() => onSelect({ grade, unit })} disabled={!grade || !unit} />
      </View>
    </View>
  );
}
