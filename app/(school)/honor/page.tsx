'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/helpers';
import type { Ranking } from '@/types/database';
import { Status } from '@/components/status';
import { useProfile } from '@/components/school-provider';
export default function Page() {
  const profile = useProfile(); const [rows, setRows] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data, error: failure } = await createClient().from('leaderboard').select('*').order('score',{ ascending:false }).order('username').limit(50); if (failure) throw failure; setRows(data ?? []); } catch (failure) { setError(errorMessage(failure)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); },[load]);
  return <section className="glass overflow-hidden"><header className="bg-gradient-to-r from-pink-50 to-blue-50 p-6 sm:p-9"><p className="text-xs tracking-widest text-school-pink">KINDNESS MAKES US GROW</p><h1 className="mt-3 text-3xl font-bold">เกียรติยศของพวกเรา ♔</h1><p className="mt-3 text-sm leading-7 text-school-muted">50 อันดับแรก · ทุกคำขอบคุณมีค่า 10 คะแนน<br/>คะแนนคำนวณในฐานข้อมูลจากคำขอบคุณที่เพื่อนมอบให้</p><button onClick={() => void load()} disabled={loading} className="soft-button mt-4">รีเฟรชอันดับ</button></header>
    <Status loading={loading} error={error} retry={() => void load()} empty={!loading && !error && !rows.length ? 'ยังไม่มีสมาชิกในอันดับ' : undefined}/>
    {!loading && !error && <ol className="divide-y divide-blue-50 p-4 sm:px-8">{rows.map((row,index) => <li key={row.id} className={`flex items-center gap-4 rounded-xl p-4 ${row.id === profile.id ? 'bg-pink-50' : ''}`}><span className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${index < 3 ? 'bg-gradient-to-br from-pink-200 to-blue-200' : 'bg-blue-50 text-school-muted'}`}>{index+1}</span><div className="min-w-0 flex-1"><b className="break-words">{row.username}{row.id === profile.id ? ' (คุณ)' : ''}</b><p className="mt-1 text-xs text-school-muted">มัธยมศึกษาปีที่ {row.grade}</p></div><span className="font-bold text-school-pink">{row.score}<span className="ml-2 text-xs font-normal text-school-muted">คะแนน</span></span></li>)}</ol>}
  </section>;
}
