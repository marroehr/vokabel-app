import React from 'react';
import AdminGate from '../components/AdminGate';
import InnerAdmin from './InnerAdmin'; // dein eigentlicher Inhalt

export default function AdminScreen() {
  return (
    <AdminGate>
      <InnerAdmin />
    </AdminGate>
  );
}
