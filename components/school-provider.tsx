'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { errorMessage, schoolEmail } from '@/lib/helpers';
import type { Profile } from '@/types/database';
import { Status } from './status';
const Context = createContext<Profile | null>(null);
export function useProfile() { const profile = useContext(Context); if (!profile) throw new Error('Profile unavailable'); return profile; }
export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const client = createClient(); const { data, error: authError } = await client.auth.getUser();
      if (authError && authError.name !== 'AuthSessionMissingError') throw authError;
      if (!data.user) { router.replace('/login'); return; }
      if (!schoolEmail(data.user.email ?? '') || !data.user.email_confirmed_at) throw new Error('school_email');
      const { data: result, error: failure } = await client.from('profiles').select('*').eq('id', data.user.id).single();
      if (failure) throw failure; setProfile(result);
    } catch (failure) { setError(errorMessage(failure)); } finally { setLoading(false); }
  }, [router]);
  useEffect(() => {
    void load();
    let unsubscribe: (() => void) | undefined;
    try { const { data } = createClient().auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') { setProfile(null); router.replace('/login'); } }); unsubscribe = () => data.subscription.unsubscribe(); } catch { /* load แสดงข้อผิดพลาดการตั้งค่าแล้ว */ }
    return () => unsubscribe?.();
  }, [load, router]);
  if (!profile) return <main className="pastel min-h-screen p-10"><Status loading={loading} error={error} retry={() => void load()}/></main>;
  return <Context.Provider value={profile}>{children}</Context.Provider>;
}
