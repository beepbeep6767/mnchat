'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from './supabase/client';
import { errorMessage } from './helpers';
import type { Message, Post, Profile } from '@/types/database';
type Entry = Message | Post;
const PAGE_SIZE = 30;
export function useTimeline(table: 'messages' | 'posts', roomId?: string) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [authors, setAuthors] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false); const [loadingMore, setLoadingMore] = useState(false);
  const cursor = useRef<Entry | undefined>(undefined); const busy = useRef(false);
  const generation = useRef(0); const [revision, setRevision] = useState(0);
  const merge = useCallback((rows: Entry[]) => setEntries(previous => {
    const combined = new Map(previous.map(row => [row.id, row])); rows.forEach(row => combined.set(row.id, row));
    return Array.from(combined.values()).sort((a,b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
  }), []);
  const fetchPage = useCallback(async (older = false) => {
    if (table === 'messages' && !roomId) { setLoading(false); return; }
    if (older && busy.current) return;
    const current = generation.current;
    if (older) { busy.current = true; setLoadingMore(true); } else setLoading(true); setError('');
    try {
      const client = createClient();
      const source = table === 'messages'
        ? client.from('messages').select('*').eq('room_id', roomId ?? '')
        : client.from('posts').select('*');
      let query = source.order('created_at', { ascending:false }).order('id', { ascending:false }).limit(PAGE_SIZE);
      if (older && cursor.current) {
        const row = cursor.current;
        query = query.or(`created_at.lt.${row.created_at},and(created_at.eq.${row.created_at},id.lt.${row.id})`);
      }
      const { data, error: failure } = await query;
      if (failure) throw failure;
      if (current !== generation.current) return;
      const rows: Entry[] = data ?? [];
      const ids = [...new Set(rows.map(row => row.author_id))];
      if (ids.length) {
        const { data: profiles, error: profileError } = await client.from('profiles').select('*').in('id', ids);
        if (profileError) throw profileError;
        if (current !== generation.current) return;
        setAuthors(previous => ({ ...previous, ...Object.fromEntries((profiles ?? []).map(profile => [profile.id, profile])) }));
      }
      merge(rows);
      if (older || !cursor.current) {
        setHasMore(rows.length === PAGE_SIZE);
        cursor.current = rows.at(-1);
      }
    } catch (failure) { if (current === generation.current) setError(errorMessage(failure)); }
    finally { if (current === generation.current) { if (older) { busy.current = false; setLoadingMore(false); } else setLoading(false); } }
  }, [table, roomId, merge]);
  useEffect(() => {
    generation.current += 1; busy.current = false; cursor.current = undefined;
    setEntries([]); setAuthors({}); setHasMore(false); setLoadingMore(false);
    void fetchPage();
    let active = true; let cleanup: (() => void) | undefined;
    try {
      const client = createClient();
      const channel = client.channel(`timeline-${table}-${roomId ?? 'feed'}`)
        .on('postgres_changes', { event: 'INSERT', schema:'public', table, ...(roomId ? { filter:`room_id=eq.${roomId}` } : {}) }, () => { if (active) void fetchPage(); })
        .on('postgres_changes', { event: 'DELETE', schema:'public', table }, payload => {
          if (active && typeof payload.old.id === 'string') setEntries(previous => previous.filter(row => row.id !== payload.old.id));
        })
        .subscribe(status => {
          if (!active) return;
          if (status === 'SUBSCRIBED') void fetchPage();
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setError('Realtime เชื่อมต่อไม่ได้ กดลองใหม่เพื่อเชื่อมต่ออีกครั้ง');
        });
      cleanup = () => { void client.removeChannel(channel).then(result => { if (result !== 'ok') console.warn('Realtime cleanup incomplete'); }).catch(() => console.warn('Realtime cleanup failed')); };
    } catch (failure) { setError(errorMessage(failure)); }
    return () => { active = false; generation.current += 1; cleanup?.(); };
  }, [fetchPage, table, roomId, revision]);
  const remove = (id: string) => setEntries(previous => previous.filter(row => row.id !== id));
  return { entries, authors, loading, error, hasMore, loadingMore, loadMore: () => void fetchPage(true), reload: () => setRevision(value => value+1), refresh: () => fetchPage(), remove };
}
