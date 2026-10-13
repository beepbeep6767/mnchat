'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Brand } from './brand';
import { Icon } from './icon';
import { useProfile } from './school-provider';
import { createClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/helpers';
const navigation = [{ href: '/feed', label: 'หน้าแรก / ฟีดข่าว', icon: 'home' }, { href: '/chat', label: 'แชท', icon: 'chat' }, { href: '/honor', label: 'เกียรติยศ', icon: 'crown' }] as const;
export function AppShell({ children }: { children: React.ReactNode }) {
  const profile = useProfile(); const pathname = usePathname(); const router = useRouter();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true); setError('');
    try { const { error: failure } = await createClient().auth.signOut(); if (failure) throw failure; router.replace('/login'); } catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  }
  return <div className="mn-app">
    <header className="mn-header"><div className="mn-header-content"><Brand/><form action="/chat" className="header-search"><Icon name="search"/><input name="q" aria-label="ค้นหาห้องสนทนา" placeholder="ค้นหาห้องสนทนา..."/></form><div className="flex items-center gap-3"><span className="hidden text-right text-sm sm:block"><b>{profile.username}</b><span className="block text-xs text-school-muted">นักเรียน ม.{profile.grade}</span></span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 font-bold text-school-pink">{profile.username.slice(0,1).toUpperCase()}</span><button disabled={busy} onClick={() => void logout()} className="soft-button">ออก</button></div></div></header>
    {error && <p role="alert" className="bg-pink-50 p-3 text-center text-rose-700">{error}</p>}
    <div className="mn-body">
      <aside className="mn-sidebar"><nav className="side-navigation">{navigation.map(item => <Link key={item.href} href={item.href} className={`side-link ${pathname === item.href ? 'active' : ''}`}><Icon name={item.icon} size={28}/>{item.label}</Link>)}</nav><div className="school-poster"><strong>MN<br/><em>School</em></strong><p>“เพื่อนช่วยเพื่อน<br/>สร้างสังคมการเรียนรู้”</p></div><p className="mt-5 px-3 text-[10px] text-school-muted">MNChat 1.0 · MN School Community</p></aside>
      <main className="mn-content enter">{children}</main>
    </div>
    <nav aria-label="เมนูมือถือ" className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-blue-100 bg-white/95 py-3 lg:hidden">{navigation.map(item => <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 px-6 text-xs ${pathname === item.href ? 'font-bold text-school-pink' : 'text-school-muted'}`}><span className="text-2xl">{item.icon}</span>{item.label}</Link>)}</nav>
  </div>;
}
