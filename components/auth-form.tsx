'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Brand } from './brand';
import { createClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/helpers';
type Mode = 'login' | 'signup';
export function AuthForm({ mode }: { mode: Mode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const username = String(fields.get('username') ?? '').trim();
    const password = String(fields.get('password') ?? '');
    setError('');
    if (!/^[A-Za-z0-9_]{4,24}$/.test(username)) return setError('ชื่อผู้ใช้ต้องมี 4–24 ตัวอักษร ใช้ภาษาอังกฤษ ตัวเลข หรือ _');
    if (password.length < 8 || password.length > 128) return setError('รหัสผ่านต้องมี 8–128 ตัวอักษร');
    setBusy(true);
    try {
      const client = createClient();
      const { data, error: failure } = await client.functions.invoke<unknown>('username-auth', {
        body: { action: mode, username, password },
      });
      if (failure) throw failure;
      if (!data || typeof data !== 'object') throw new Error('Invalid auth response');
      if ('error' in data && typeof data.error === 'string') { setError(data.error); return; }
      if (!('access_token' in data) || !('refresh_token' in data)
        || typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string') throw new Error('Invalid auth response');
      const { error: sessionError } = await client.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      if (sessionError) throw sessionError;
      // โหลดหน้าใหม่เพื่อให้ provider และ cookie ใช้ session ล่าสุดพร้อมกัน
      window.location.assign('/feed');
    } catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  }
  return <main className="auth-page">
    <div className={`auth-scene ${mode === 'signup' ? 'auth-signup' : 'auth-login'}`}>
      <header className="auth-top"><Brand/><p>สังคมออนไลน์ของนักเรียน<br/>โรงเรียนมหรรณพาราม</p></header>
      <aside className="auth-story">{mode === 'signup' ? <><h1>มาเป็นส่วนหนึ่ง<br/>ของ <em>MNChat</em> กันเถอะ!</h1><p>สร้างบัญชีเพื่อเริ่มต้นเชื่อมต่อกับเพื่อนใหม่<br/>และร่วมเป็นส่วนหนึ่งของชุมชนโรงเรียน<br/>มหรรณพาราม</p><div className="handwriting">เพื่อนใหม่<br/><span>รอคุณอยู่ ♡</span><br/>นะ! ♡</div></> : <h1 className="login-slogan">เพื่อนดี ๆ<br/>เริ่มต้นได้ที่นี่ ♡<i/></h1>}</aside>
      <section className="auth-card"><div className="card-brand"><Brand/></div>
        <h2 className="text-2xl font-bold">{mode === 'signup' ? 'สมัครสมาชิก' : 'ยินดีต้อนรับกลับมา!'}</h2>
        <p className="mb-8 mt-3 text-sm leading-6 text-school-muted">{mode === 'signup' ? 'ตั้งชื่อผู้ใช้และรหัสผ่านเพื่อเริ่มใช้งาน MNChat' : 'เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านของคุณ'}</p>
        <form onSubmit={submit} className="auth-fields">
          <label className="block text-sm">ชื่อผู้ใช้<input name="username" required pattern="[A-Za-z0-9_]{4,24}" minLength={4} maxLength={24} autoCapitalize="none" spellCheck={false} autoComplete="username" placeholder="ชื่อผู้ใช้ (ภาษาอังกฤษ/ตัวเลข)" className="field"/><span className="mt-1 block text-xs text-school-muted">4–24 ตัวอักษร · ไม่แยกตัวพิมพ์เล็ก/ใหญ่</span></label>
          <label className="block text-sm">รหัสผ่าน<div className="relative mt-2"><input name="password" placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" type={visible ? 'text' : 'password'} required minLength={8} maxLength={128} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="field pr-20"/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} className="absolute right-4 top-4 text-xs text-school-muted">{visible ? 'ซ่อน' : 'แสดง'}</button></div></label>
          {error && <p role="alert" className="rounded-xl bg-pink-50 p-3 text-sm text-rose-700">{error}</p>}
          <button disabled={busy} className="primary auth-submit">{busy ? 'กำลังดำเนินการ…' : mode === 'signup' ? 'สร้างบัญชี →' : 'เข้าสู่ระบบ →'}</button>
        </form>
        {mode === 'signup' && <p className="mt-4 text-xs leading-6 text-school-muted">โปรดจำชื่อผู้ใช้และรหัสผ่านไว้ ระบบนี้ไม่มีการกู้รหัสผ่านทางอีเมล</p>}
        <p className="auth-switch">{mode === 'login' ? 'ยังไม่มีบัญชี? ' : 'มีบัญชีอยู่แล้ว? '}<Link href={mode === 'login' ? '/signup' : '/login'} className="font-bold text-school-pink">{mode === 'login' ? 'สมัครสมาชิกที่นี่' : 'เข้าสู่ระบบที่นี่'} →</Link></p>
      </section>
      <footer className="auth-footer"><span>♧ เชื่อมต่ออย่างปลอดภัย</span><span>♡ พื้นที่ดี ๆ ของเพื่อน</span></footer>
    </div>
  </main>;
}

