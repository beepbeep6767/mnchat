'use client';
import { useState } from 'react';
import { useProfile } from './school-provider';
import { createClient } from '@/lib/supabase/client';
import { displayDate, displayTime, errorMessage } from '@/lib/helpers';
import type { Message, Post, Profile } from '@/types/database';
export function TimelineItem({ entry, author, table, onDeleted }: { entry: Message | Post; author?: Profile; table: 'messages' | 'posts'; onDeleted: (id:string) => void }) {
  const profile = useProfile(); const own = entry.author_id === profile.id;
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [confirm, setConfirm] = useState(false);
  async function deleteEntry() {
    setBusy(true); setNotice('');
    try { const { error } = await createClient().from(table).delete().eq('id',entry.id); if (error) throw error; onDeleted(entry.id); } catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
  }
  async function giveKudos() {
    setBusy(true); setNotice('');
    try { const { error } = await createClient().rpc('give_kudos',{recipient:entry.author_id}); if (error) throw error; setNotice('ส่งคำขอบคุณแล้ว ♡'); } catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
  }
  return <article className={`${table === 'posts' ? 'glass p-5 sm:p-6' : `flex flex-col ${own ? 'items-end' : 'items-start'}`} min-w-0`}>
    <div className={`mb-2 flex items-center gap-2 text-xs ${own && table === 'messages' ? 'flex-row-reverse' : ''}`}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-pink-100 font-bold text-school-blue">{(author?.username ?? '?').slice(0,1).toUpperCase()}</span><b>{author?.username ?? 'นักเรียน'}</b><span className="text-school-muted">{displayTime(entry.created_at)}{table === 'posts' ? ` · ${displayDate(entry.created_at)}` : ''}</span></div>
    <p className={`${table === 'posts' ? 'my-3 w-full leading-7' : `max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${own ? 'bg-school-pink text-white' : 'border border-blue-100 bg-white'}`} whitespace-pre-wrap break-words [overflow-wrap:anywhere]`}>{entry.content}</p>
    <div className="mt-2 flex gap-2">{own ? (confirm ? <><button disabled={busy} onClick={() => void deleteEntry()} className="text-xs text-rose-700">ยืนยันลบ</button><button onClick={() => setConfirm(false)} className="text-xs text-school-muted">ยกเลิก</button></> : <button onClick={() => setConfirm(true)} className="text-xs text-school-muted">ลบ</button>) : table === 'posts' && <button disabled={busy} onClick={() => void giveKudos()} className="rounded-full bg-pink-50 px-3 py-1.5 text-xs text-school-pink">♡ ขอบคุณเพื่อน</button>}</div>
    {notice && <p role="status" className="mt-2 text-xs text-school-muted">{notice}</p>}
  </article>;
}
