'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brand } from './brand';
import { createClient } from '@/lib/supabase/client';
import { errorMessage, schoolEmail } from '@/lib/helpers';
type Mode = 'login' | 'signup' | 'reset';
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');
    setNotice(''); setError('');
    if (!schoolEmail(email)) return setError('กรุณาใช้อีเมลโรงเรียนที่ลงท้ายด้วย @mh.ac.th');
    if (mode === 'signup' && password !== data.get('confirm')) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
    setBusy(true);
    try {
      const client = createClient();
      if (mode === 'signup') {
        const username = String(data.get('username') ?? '').trim();
        if (!/^[A-Za-z0-9_]{4,24}$/.test(username)) throw new Error('username_invalid');
        const { error: failure } = await client.auth.signUp({ email, password, options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username, grade: Number(data.get('grade')), full_name: String(data.get('full_name') ?? '').trim() }
        } });
        if (failure) throw failure;
        setNotice('หากอีเมลนี้สมัครได้ ระบบจะส่งลิงก์ยืนยันให้ กรุณาตรวจกล่องจดหมายและสแปม');
      } else if (mode === 'reset') {
        const { error: failure } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/update-password` });
        if (failure) throw failure;
        setNotice('หากมีบัญชีนี้ ระบบจะส่งลิงก์เปลี่ยนรหัสผ่านให้ทางอีเมล');
      } else {
        const { error: failure } = await client.auth.signInWithPassword({ email, password });
        if (failure) throw failure;
        router.replace('/feed'); router.refresh();
      }
    } catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  }
  return <main className="pastel flex min-h-screen items-center justify-center p-4 md:p-8">
    <div className="glass grid w-full max-w-6xl overflow-hidden lg:grid-cols-[1.05fr_1fr]">
      <aside className="school-scene relative hidden min-h-[720px] overflow-hidden p-10 lg:block">
        <Brand/><div className="relative z-10 mt-14"><p className="text-xs font-bold uppercase tracking-[.25em] text-blue-600">MAHANNAPARAM COMMUNITY</p><h1 className="mt-5 text-4xl font-bold leading-relaxed text-white drop-shadow">เพื่อนดี ๆ<br/>เริ่มต้นได้ที่นี่ <span className="text-pink-200">♡</span></h1><p className="mt-4 max-w-xs text-sm leading-7 text-blue-800">พื้นที่เล็ก ๆ สำหรับแบ่งปันเรื่องราว<br/>พบเพื่อนใหม่ และเติบโตไปด้วยกัน</p></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/school.svg" alt="ภาพวาดโรงเรียนและต้นไม้สีชมพู" className="absolute bottom-0 left-0 w-full"/>
        <p className="absolute bottom-6 left-10 text-xs text-blue-800">สำหรับนักเรียนโรงเรียนมหรรณพาราม</p>
      </aside>
      <section className="px-6 py-10 sm:px-12"><div className="mb-9 lg:hidden"><Brand/></div>
        <p className="mb-2 text-xs font-bold tracking-widest text-school-pink">YOUR SCHOOL. YOUR SPACE.</p>
        <h2 className="text-2xl font-bold">{mode === 'signup' ? 'มาเป็นส่วนหนึ่งของ MNChat ♡' : mode === 'reset' ? 'ลืมรหัสผ่าน?' : 'ยินดีต้อนรับกลับมา!'}</h2>
        <p className="mb-8 mt-3 text-sm leading-6 text-school-muted">{mode === 'signup' ? 'สร้างบัญชี แล้วเริ่มต้นเรื่องราวดี ๆ กับเพื่อน' : mode === 'reset' ? 'รับลิงก์เปลี่ยนรหัสผ่านทางอีเมลโรงเรียน' : 'เข้าสู่ระบบเพื่อเชื่อมต่อกับเพื่อน ๆ ของคุณ'}</p>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && <><label className="block text-sm">ชื่อผู้ใช้<input name="username" required pattern="[A-Za-z0-9_]{4,24}" minLength={4} maxLength={24} autoComplete="username" placeholder="ภาษาอังกฤษ ตัวเลข หรือ _" className="field mt-2"/><span className="mt-1 block text-xs text-school-muted">4–24 ตัวอักษร</span></label><label className="block text-sm">ระดับชั้น<select name="grade" required defaultValue="" className="field mt-2"><option value="" disabled>เลือกระดับชั้น</option>{[1,2,3,4,5,6].map(grade => <option key={grade} value={grade}>มัธยมศึกษาปีที่ {grade}</option>)}</select></label><label className="block text-sm">ชื่อที่แสดง (ไม่บังคับ)<input name="full_name" maxLength={80} autoComplete="name" className="field mt-2"/></label></>}
          <label className="block text-sm">อีเมลโรงเรียน<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="yourname@mh.ac.th" className="field mt-2"/></label>
          {mode !== 'reset' && <label className="block text-sm">รหัสผ่าน<div className="relative mt-2"><input name="password" type={visible ? 'text' : 'password'} required minLength={8} maxLength={128} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="field pr-20"/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} className="absolute right-4 top-4 text-xs text-school-muted">{visible ? 'ซ่อน' : 'แสดง'}</button></div></label>}
          {mode === 'signup' && <label className="block text-sm">ยืนยันรหัสผ่าน<input name="confirm" type={visible ? 'text' : 'password'} required minLength={8} maxLength={128} autoComplete="new-password" className="field mt-2"/></label>}
          {mode === 'login' && <div className="text-right"><Link href="/reset-password" className="text-xs text-school-blue">ลืมรหัสผ่าน?</Link></div>}
          {error && <p role="alert" className="rounded-xl bg-pink-50 p-3 text-sm text-rose-700">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{notice}</p>}
          <button disabled={busy} className="primary w-full">{busy ? 'กำลังดำเนินการ…' : mode === 'signup' ? 'สร้างบัญชี →' : mode === 'reset' ? 'ส่งลิงก์เปลี่ยนรหัสผ่าน →' : 'เข้าสู่ระบบ →'}</button>
        </form>
        <p className="mt-8 text-center text-sm text-school-muted">{mode === 'login' ? 'ยังไม่มีบัญชี? ' : 'มีบัญชีอยู่แล้ว? '}<Link href={mode === 'login' ? '/signup' : '/login'} className="font-bold text-school-pink">{mode === 'login' ? 'สมัครสมาชิกที่นี่' : 'เข้าสู่ระบบที่นี่'} →</Link></p>
        <p className="mt-8 text-center text-[11px] text-school-muted">อีเมลโรงเรียนเท่านั้น · ยืนยันอีเมลก่อนใช้งาน</p>
      </section>
    </div>
  </main>;
}
