import { supabase } from './supabase';

export async function checkIsAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('Admin-Check Fehler:', error.message);
    return false;
  }
  return data === true;
}
