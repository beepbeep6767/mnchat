'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/components/school-provider';
import { errorMessage } from '@/lib/helpers';
import type { SiteRatingCount } from '@/types/database';

export default function Page() {
  const profile = useProfile();
  const [counts, setCounts] = useState<SiteRatingCount[]>([]);
  const [mine, setMine] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const client = createClient();
      const [all, own] = await Promise.all([
        client.from('site_rating_counts').select('*'),
        client.from('site_ratings').select('stars').eq('user_id', profile.id).maybeSingle()
      ]);
      if (all.error) throw all.error;
      if (own.error) throw own.error;
      setCounts(all.data ?? []); setMine(own.data?.stars ?? null);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setLoading(false); }
  }, [profile.id]);
  useEffect(() => { void load(); }, [load]);
  async function vote(stars: number) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const client = createClient();
      const { error: failure } = mine === null
        ? await client.from('site_ratings').insert({ user_id: profile.id, stars })
        : await client.from('site_ratings').update({ stars, updated_at: new Date().toISOString() }).eq('user_id', profile.id);
      if (failure) throw failure;
      await load();
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  const total = counts.reduce((sum, row) => sum + row.votes, 0);
  return <section className="glass ratings-page"><span className="ratings-eyebrow">เสียงจากชุมชน MNChat</span><h1>ให้ดาวกับ MNChat ♡</h1><p className="ratings-intro">เลือกคะแนน 1–5 ดาวได้หนึ่งครั้งต่อบัญชี และเปลี่ยนใจแก้คะแนนได้ตลอด</p>
    {error && <div role="alert" className="ratings-error">{error} <button type="button" onClick={() => void load()}>ลองอีกครั้ง</button></div>}
    <div className="ratings-stars" role="group" aria-label="ให้คะแนน MNChat">{[1,2,3,4,5].map(stars => <button key={stars} type="button" disabled={busy || loading} onClick={() => void vote(stars)} aria-label={`ให้ ${stars} ดาว`} aria-pressed={mine === stars} className={mine === stars ? 'chosen' : ''}>★<span>{stars} ดาว</span></button>)}</div>
    <p className="ratings-current" aria-live="polite">{loading ? 'กำลังโหลดคะแนน…' : mine ? `คะแนนของคุณ: ${mine} ดาว` : 'คุณยังไม่ได้ให้คะแนน'}</p>
    <div className="ratings-results"><h2>ผลโหวตจากสมาชิก <span>{total} คน</span></h2>{[5,4,3,2,1].map(stars => { const votes = counts.find(row => row.stars === stars)?.votes ?? 0; return <div className="ratings-row" key={stars}><span>{stars} ★</span><div className="ratings-track"><div style={{ width: total ? `${votes / total * 100}%` : '0%' }}/></div><b>{votes} คน</b></div>; })}</div>
  </section>;
}
