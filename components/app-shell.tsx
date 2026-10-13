'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Brand } from './brand';
import { useProfile } from './school-provider';
import { createClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/helpers';
const navigation = [{ href: '/feed', label: 'ฟีดข่าว', icon: '▤' }, { href: '/chat', label: 'ห้องแชท', icon: '☏' }, { href: '/honor', label: 'เกียรติยศ', icon: '♔' }];
export function AppShell({ children }: { children: React.ReactNode }) {
  const profile = useProfile(); const pathname = usePathname(); const router = useRouter();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true); setError('');
    try { const { error: failure } = await createClient().auth.signOut(); if (failure) throw failure; router.replace('/login'); } catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  }
  return <div className="pastel min-h-screen">
    <header className="border-b border-white bg-white/75 px-4 py-5 sm:px-7"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3"><Brand small/><div className="flex items-center gap-3"><span className="hidden text-right text-sm sm:block"><b>{profile.username}</b><span className="block text-xs text-school-muted">นักเรียน ม.{profile.grade}</span></span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 font-bold text-school-pink">{profile.username.slice(0,1).toUpperCase()}</span><button disabled={busy} onClick={() => void logout()} className="soft-button">ออก</button></div></div></header>
    {error && <p role="alert" className="bg-pink-50 p-3 text-center text-rose-700">{error}</p>}
    <div className="mx-auto grid max-w-[1500px] gap-5 px-4 pb-24 pt-5 lg:grid-cols-[200px_1fr] lg:px-7 lg:pb-7">
      <aside className="hidden lg:block"><nav className="space-y-3">{navigation.map(item => <Link key={item.href} href={item.href} className={`flex items-center gap-4 rounded-2xl p-4 text-sm font-bold ${pathname === item.href ? 'bg-school-pink text-white shadow-lg shadow-pink-200/60' : 'text-school-muted hover:bg-white'}`}><span className="text-2xl">{item.icon}</span>{item.label}</Link>)}</nav><div className="mt-8 overflow-hidden rounded-3xl bg-blue-100"><img src="/school.svg" alt="ภาพโรงเรียน" className="w-full"/><p className="p-5 text-center text-sm leading-6 text-school-blue">เพื่อนช่วยเพื่อน<br/>สร้างสังคมการเรียนรู้ ♡</p></div><p className="mt-5 px-3 text-[10px] text-school-muted">MNChat 1.0 · MN School Community</p></aside>
      <main className="min-w-0 enter">{children}</main>
    </div>
    <nav aria-label="เมนูมือถือ" className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-blue-100 bg-white/95 py-3 lg:hidden">{navigation.map(item => <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 px-6 text-xs ${pathname === item.href ? 'font-bold text-school-pink' : 'text-school-muted'}`}><span className="text-2xl">{item.icon}</span>{item.label}</Link>)}</nav>
  </div>;
}
