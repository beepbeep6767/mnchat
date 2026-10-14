'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/helpers';
import type { FriendRequest, Profile } from '@/types/database';
import { useTimeline } from '@/lib/use-timeline';
import { useProfile } from '@/components/school-provider';
import { Composer } from '@/components/composer';
import { TimelineItem } from '@/components/timeline-item';
import { Status } from '@/components/status';

function Conversation({ friend }: { friend: Profile }) {
  const timeline = useTimeline('messages', friend.id);
  const bottom = useRef<HTMLDivElement>(null);
  const newest = timeline.entries[0]?.id;
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [newest]);
  return <section className="conversation-panel">
    <header className="border-b border-blue-100 bg-white/70 p-5"><div className="flex items-center gap-3"><span className="letter-avatar">{friend.username[0].toUpperCase()}</span><div><h1 className="font-bold">{friend.username}</h1><p className="mt-1 text-xs text-school-muted">เพื่อนของคุณ ♡</p></div></div></header>
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50/30 to-white/40 p-4 sm:p-6">
      {timeline.hasMore && <button onClick={timeline.loadMore} disabled={timeline.loadingMore} className="soft-button mb-5 w-full">{timeline.loadingMore ? 'กำลังโหลด…' : 'โหลดข้อความก่อนหน้า'}</button>}
      <Status loading={timeline.loading && !timeline.entries.length} error={timeline.error} retry={timeline.reload} empty={!timeline.loading && !timeline.error && !timeline.entries.length ? 'ยังไม่มีข้อความ ลองทักเพื่อนคนแรกเลย ♡' : undefined}/>
      <div className="space-y-5">{[...timeline.entries].reverse().map(entry => <TimelineItem key={entry.id} entry={entry} author={timeline.authors[entry.author_id]} table="messages" onDeleted={timeline.remove}/>)}</div><div ref={bottom}/>
    </div><Composer key={friend.id} table="messages" recipientId={friend.id} onSent={timeline.refresh}/>
  </section>;
}

export default function Page() {
  const me = useProfile();
  const [people, setPeople] = useState<Profile[]>([]);
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const client = createClient();
      const requestsResult = await client.from('friend_requests').select('*').or(`requester_id.eq.${me.id},recipient_id.eq.${me.id}`);
      if (requestsResult.error) throw requestsResult.error;
      const rows = requestsResult.data ?? [];
      const outgoingIds = new Set(rows.filter(item => item.requester_id === me.id).map(item => item.recipient_id));
      const friendIds = rows.filter(item => item.recipient_id === me.id && outgoingIds.has(item.requester_id)).map(item => item.requester_id);
      if (friendIds.length) {
        const profilesResult = await client.from('profiles').select('*').in('id', friendIds).order('username');
        if (profilesResult.error) throw profilesResult.error;
        setPeople(profilesResult.data ?? []);
      } else setPeople([]);
      setRequests(rows);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setLoading(false); }
  }, [me.id]);
  useEffect(() => { void load(); setSearch(new URLSearchParams(window.location.search).get('q') ?? ''); }, [load]);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const term = search.trim().replace(/[%_]/g, '\\$&');
      const client = createClient();
      const query = client.from('profiles').select('*').neq('id', me.id).order('username').limit(30);
      const result = await (term ? query.ilike('username', `%${term}%`) : query);
      if (!active) return;
      if (result.error) setError(errorMessage(result.error));
      else setCandidates(result.data ?? []);
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, me.id]);
  useEffect(() => {
    const client = createClient();
    const channel = client.channel(`friends-${me.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => { void load(); }).subscribe();
    return () => { void client.removeChannel(channel); };
  }, [load, me.id]);
  const outgoing = useMemo(() => new Set(requests.filter(item => item.requester_id === me.id).map(item => item.recipient_id)), [requests, me.id]);
  const incoming = useMemo(() => new Set(requests.filter(item => item.recipient_id === me.id).map(item => item.requester_id)), [requests, me.id]);
  const friends = people.filter(person => outgoing.has(person.id) && incoming.has(person.id));
  const friend = friends.find(person => person.id === selected);
  const results = candidates.filter(person => !(outgoing.has(person.id) && incoming.has(person.id)));
  async function addFriend(person: Profile) {
    setBusyId(person.id); setError('');
    try {
      const { error: failure } = await createClient().from('friend_requests').insert({ requester_id: me.id, recipient_id: person.id });
      if (failure && failure.code !== '23505') throw failure;
      await load();
      if (incoming.has(person.id)) setSelected(person.id);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusyId(''); }
  }
  return <div className="chat-workspace">
    <aside className="room-panel"><h2 className="room-heading">เพื่อนและแชท</h2>
      <div className="friend-widget"><h3>เพิ่มเพื่อน ♡</h3><label className="sr-only" htmlFor="search-friend">ค้นหาเพื่อน</label><input id="search-friend" value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อเพื่อน…" className="field room-search"/>
        <p className="friend-hint">เมื่อทั้งสองคนกดเพิ่มเพื่อน แชทส่วนตัวจะเปิดทันที</p>
        <Status loading={loading} error={error} retry={() => void load()}/>
        <div className="friend-results">{results.slice(0, 30).map(person => <div className="friend-result" key={person.id}><span className="letter-avatar">{person.username[0].toUpperCase()}</span><span className="friend-name">{person.username}</span><button type="button" className="soft-button" disabled={busyId === person.id || outgoing.has(person.id)} onClick={() => void addFriend(person)}>{outgoing.has(person.id) ? 'รอเพื่อนเพิ่ม' : incoming.has(person.id) ? 'เพิ่มกลับ' : 'เพิ่มเพื่อน'}</button></div>)}</div>
        {!loading && !results.length && <p className="friend-hint">ไม่พบเพื่อนที่ค้นหา</p>}
      </div>
      <h3 className="friend-list-heading">เพื่อนของฉัน ({friends.length})</h3>
      <div className="room-list">{friends.map(person => <button key={person.id} onClick={() => setSelected(person.id)} className={`room-link ${selected === person.id ? 'selected' : ''}`}><span className="room-avatar">{person.username[0].toUpperCase()}</span><b>{person.username}</b><span className="mt-1 hidden text-xs lg:block">เปิดแชทส่วนตัว</span></button>)}</div>
      {!loading && !friends.length && <p className="friend-hint">ยังไม่มีเพื่อน ค้นหาชื่อแล้วกดเพิ่มเพื่อนเลย</p>}
    </aside>
    {friend ? <Conversation key={friend.id} friend={friend}/> : <div className="glass conversation-empty">เลือกเพื่อนเพื่อเริ่มแชท ♡</div>}
  </div>;
}

