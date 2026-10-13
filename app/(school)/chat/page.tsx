'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/helpers';
import type { Room } from '@/types/database';
import { useTimeline } from '@/lib/use-timeline';
import { Composer } from '@/components/composer';
import { TimelineItem } from '@/components/timeline-item';
import { Status } from '@/components/status';
function Conversation({ room }: { room: Room }) {
  const timeline = useTimeline('messages',room.id); const bottom = useRef<HTMLDivElement>(null); const newest = timeline.entries[0]?.id;
  useEffect(() => { bottom.current?.scrollIntoView({ block:'nearest' }); }, [newest]);
  return <section className="glass flex h-[72dvh] min-h-[450px] min-w-0 flex-col overflow-hidden lg:h-[79dvh]">
    <header className="border-b border-blue-100 bg-white/70 p-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-xl text-school-blue">#</span><div><h1 className="font-bold">{room.name}</h1><p className="mt-1 text-xs text-school-muted">{room.description}</p></div></div></header>
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50/30 to-white/40 p-4 sm:p-6">
      {timeline.hasMore && <button onClick={timeline.loadMore} disabled={timeline.loadingMore} className="soft-button mb-5 w-full">{timeline.loadingMore ? 'กำลังโหลด…' : 'โหลดข้อความก่อนหน้า'}</button>}
      <Status loading={timeline.loading && !timeline.entries.length} error={timeline.error} retry={timeline.reload} empty={!timeline.loading && !timeline.error && !timeline.entries.length ? 'ยังไม่มีข้อความ ลองทักเพื่อนคนแรกเลย ♡' : undefined}/>
      <div className="space-y-5">{[...timeline.entries].reverse().map(entry => <TimelineItem key={entry.id} entry={entry} author={timeline.authors[entry.author_id]} table="messages" onDeleted={timeline.remove}/>)}</div><div ref={bottom}/>
    </div><Composer key={room.id} table="messages" roomId={room.id} onSent={timeline.refresh}/>
  </section>;
}
export default function Page() {
  const [rooms, setRooms] = useState<Room[]>([]); const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data, error: failure } = await createClient().from('rooms').select('*').order('created_at').limit(50); if (failure) throw failure; setRooms(data ?? []); setSelected(previous => previous || data?.[0]?.id || ''); } catch (failure) { setError(errorMessage(failure)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const room = rooms.find(item => item.id === selected);
  return <div className="grid gap-4 lg:grid-cols-[270px_1fr]">
    <aside className="glass p-5"><h2 className="mb-4 text-xl font-bold">แชท</h2><label className="sr-only" htmlFor="search-room">ค้นหาห้อง</label><input id="search-room" value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาห้องสนทนา…" className="field"/>
      <Status loading={loading} error={error} retry={() => void load()} empty={!loading && !error && !rooms.length ? 'ยังไม่มีห้อง กรุณารัน SQL ตั้งค่า' : undefined}/>
      <div className="mt-4 flex gap-2 overflow-x-auto lg:flex-col">{rooms.filter(item => item.name.includes(search.trim())).map(item => <button key={item.id} onClick={() => setSelected(item.id)} className={`shrink-0 rounded-2xl px-4 py-4 text-left text-sm lg:w-full ${selected === item.id ? 'bg-pink-100 text-school-ink' : 'bg-white/50 text-school-muted hover:bg-blue-50'}`}><b># {item.name}</b><span className="mt-1 hidden text-xs lg:block">{item.description}</span></button>)}</div>
      {!loading && rooms.length > 0 && !rooms.some(item => item.name.includes(search.trim())) && <p className="mt-4 text-sm text-school-muted">ไม่พบห้องที่ค้นหา</p>}
    </aside>{room ? <Conversation key={room.id} room={room}/> : <div className="glass flex items-center justify-center p-10 text-school-muted">เลือกห้องเพื่อเริ่มพูดคุย</div>}
  </div>;
}
