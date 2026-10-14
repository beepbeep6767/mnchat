'use client';
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/helpers';
import { useProfile } from './school-provider';
import { Icon } from './icon';
export function Composer({ table, recipientId, onSent }: { table: 'messages' | 'posts'; recipientId?: string; onSent: () => Promise<void> }) {
  const profile = useProfile(); const [content, setContent] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [lastSent, setLastSent] = useState(0);
  const max = table === 'messages' ? 2000 : 5000;
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    const text = content.trim(); setError('');
    if (!text || text.length > max) return setError(`กรุณาพิมพ์ 1–${max} ตัวอักษร`);
    if (Date.now()-lastSent < 1000) return setError('กรุณารอ 1 วินาทีก่อนส่งอีกครั้ง');
    setBusy(true);
    try {
      const client = createClient();
      const response = table === 'messages'
        ? await client.from('messages').insert({ content:text, author_id:profile.id, recipient_id:recipientId ?? '' })
        : await client.from('posts').insert({ content:text, author_id:profile.id });
      if (response.error) throw response.error;
      setContent(''); setLastSent(Date.now()); await onSent();
    } catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (table === 'messages' && event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (content.trim() && !busy) form.current?.requestSubmit();
    }
  }
  return <form ref={form} onSubmit={submit} className={`message-composer ${table === 'messages' ? 'chat-composer' : ''}`}>
    <label className="sr-only" htmlFor={`compose-${table}`}>{table === 'messages' ? 'ข้อความแชท' : 'โพสต์ใหม่'}</label>
    <div className="flex items-end gap-3"><textarea id={`compose-${table}`} value={content} disabled={busy} onChange={event => setContent(event.target.value)} onKeyDown={handleKeyDown} maxLength={max} rows={table === 'posts' ? 3 : 1} placeholder={table === 'posts' ? 'วันนี้มีเรื่องอะไรอยากแบ่งปันกับเพื่อน ๆ ?' : 'พิมพ์ข้อความ…'} className="field resize-none"/><button disabled={busy || !content.trim()} className="primary send-button">{busy ? '…' : <><Icon name="send"/><span className="sr-only">ส่งข้อความ</span></>}</button></div>
    <div className="mt-2 flex justify-between text-[11px] text-school-muted"><span>{table === 'messages' ? 'Enter ส่งข้อความ · Shift+Enter ขึ้นบรรทัดใหม่' : 'พื้นที่ดี ๆ เริ่มจากคำพูดดี ๆ ♡'}</span><span>{content.length}/{max}</span></div>
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
  </form>;
}

