'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { Profile } from '@/types/database';

const FriendCalls = dynamic(() => import('./friend-calls').then(module => module.FriendCalls), { ssr: false });

export function CallAvailability(props: { friends: Profile[]; selected: string; myId: string }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { void fetch('/api/calls/config').then(response => response.json()).then(data => setEnabled(Boolean(data.enabled))).catch(() => setEnabled(false)); }, []);
  return enabled ? <FriendCalls {...props}/> : null;
}
