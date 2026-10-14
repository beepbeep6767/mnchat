'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { createClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/helpers';
import type { FriendCall, Profile } from '@/types/database';

type Ticket = { url: string; token: string };

export function FriendCalls({ friends, selected, myId }: { friends: Profile[]; selected: string; myId: string }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [invite, setInvite] = useState<FriendCall | null>(null);
  const [active, setActive] = useState<FriendCall | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const leaving = useRef(false);
  const refresh = useCallback(async () => {
    const client = createClient();
    const memberships = await client.from('call_members').select('call_id,status,updated_at').eq('user_id',myId).in('status',['invited','joined']).order('updated_at',{ascending:false}).limit(15);
    if (memberships.error || !memberships.data?.length) { setInvite(null); return; }
    const ids = memberships.data.map(row => row.call_id);
    const calls = await client.from('calls').select('*').in('id',ids).eq('status','active');
    if (calls.error) return;
    const available = (calls.data ?? []).filter(row => Date.now()-new Date(row.created_at).getTime() < 2*60*60*1000);
    setInvite(available.find(row => memberships.data?.some(member => member.call_id===row.id && member.status==='invited')) ?? null);
    if (active && !available.some(row => row.id===active.id)) { setActive(null); setTicket(null); }
  }, [active,myId]);
  useEffect(() => { void refresh(); const timer=window.setInterval(() => void refresh(),10000); return () => window.clearInterval(timer); },[refresh]);
  useEffect(() => { if (selected) setChosen([selected]); }, [selected]);
  function toggleFriend(id: string) { setChosen(rows => rows.includes(id) ? rows.filter(x => x!==id) : rows.length<3 ? [...rows,id] : rows); }
  async function join(call: FriendCall) {
    const response=await fetch('/api/calls/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({callId:call.id})});
    const data=await response.json();
    if (!response.ok) throw new Error(data.error || 'เข้าร่วมสายไม่ได้');
    setTicket({url:data.url,token:data.token}); setActive(call); setInvite(null);
  }
  async function start(kind: 'audio' | 'video') {
    if (!chosen.length || busy) return;
    setBusy(true); setError('');
    let createdId = '';
    try {
      const client=createClient();
      const created=await client.rpc('start_friend_call',{invitees:chosen,call_kind:kind});
      if (created.error) throw created.error;
      createdId = created.data;
      const call=await client.from('calls').select('*').eq('id',created.data).single();
      if (call.error) throw call.error;
      await join(call.data);
    } catch (failure) {
      if (createdId) await createClient().rpc('leave_friend_call',{target_call:createdId});
      setError(errorMessage(failure));
    }
    finally { setBusy(false); }
  }
  async function respond(accept: boolean) {
    if (!invite || busy) return;
    setBusy(true); setError('');
    try {
      const {error:failure}=await createClient().rpc('respond_friend_call',{target_call:invite.id,accept_call:accept});
      if (failure) throw failure;
      if (accept) await join(invite); else setInvite(null);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function leave() {
    if (!active || leaving.current) return;
    leaving.current = true;
    const callId=active.id; setActive(null); setTicket(null);
    const {error:failure}=await createClient().rpc('leave_friend_call',{target_call:callId});
    if (failure) setError(errorMessage(failure));
    leaving.current = false;
  }
  return <div className="friend-calls">
    {invite && <div className="call-invite" role="alert"><b>{invite.kind==='video'?'วิดีโอคอล':'โทรเสียง'}จากเพื่อน</b><span>คำเชิญใหม่</span><div><button disabled={busy} onClick={() => void respond(true)} className="primary">รับสาย</button><button disabled={busy} onClick={() => void respond(false)} className="soft-button">ปฏิเสธ</button></div></div>}
    <div className="call-choose"><b>ชวนเพื่อนคุย</b><small>เลือกเพื่อนได้ 1–3 คน · รวมคุณสูงสุด 4 คน</small><div className="call-friends">{friends.map(person => <label key={person.id}><input type="checkbox" checked={chosen.includes(person.id)} onChange={() => toggleFriend(person.id)} disabled={!chosen.includes(person.id) && chosen.length>=3}/>{person.username}</label>)}</div><div className="call-buttons"><button type="button" className="soft-button" disabled={busy || !chosen.length || Boolean(active)} onClick={() => void start('audio')}>☎ โทรเสียง</button><button type="button" className="primary" disabled={busy || !chosen.length || Boolean(active)} onClick={() => void start('video')}>▣ วิดีโอคอล</button></div></div>
    {error && <p role="alert" className="call-error">{error}</p>}
    {active && ticket && <div className="call-overlay" role="dialog" aria-modal="true" aria-label={active.kind==='video'?'วิดีโอคอล':'โทรเสียง'}><div className="call-window"><header><b>{active.kind==='video'?'วิดีโอคอล':'โทรเสียง'}กับเพื่อน</b><button type="button" className="soft-button" onClick={() => void leave()}>วางสาย</button></header><LiveKitRoom serverUrl={ticket.url} token={ticket.token} connect audio video={active.kind==='video'} onDisconnected={() => void leave()} onError={failure => setError(errorMessage(failure))} data-lk-theme="default"><VideoConference/></LiveKitRoom></div></div>}
  </div>;
}
