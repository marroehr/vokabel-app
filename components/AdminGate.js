import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { checkIsAdmin } from '../lib/isAdmin';

export default function AdminGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); setLoading(false); return; }
      const ok = await checkIsAdmin();
      if (mounted) { setIsAdmin(ok); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Prüfe Berechtigung…</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          Kein Zugriff. Bitte als Admin anmelden.
        </Text>
      </View>
    );
  }

  return children;
}
