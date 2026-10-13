'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/helpers';
export default function Page() {
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget);
    if (data.get('password') !== data.get('confirm')) return setNotice('รหัสผ่านไม่ตรงกัน');
    setBusy(true); setNotice('');
    try {
      const { error } = await createClient().auth.updateUser({ password: String(data.get('password')) });
      if (error) throw error; setNotice('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
    } catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
  }
  return <main className="pastel flex min-h-screen items-center justify-center p-5"><form onSubmit={submit} className="glass w-full max-w-md space-y-5 p-8"><h1 className="text-2xl font-bold">ตั้งรหัสผ่านใหม่</h1><label className="block">รหัสผ่านใหม่<input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field mt-2"/></label><label className="block">ยืนยันรหัสผ่าน<input name="confirm" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field mt-2"/></label><p role="status" className="text-sm">{notice}</p><button disabled={busy} className="primary w-full">{busy ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่าน'}</button><Link href="/login" className="block text-center text-school-blue">กลับไปเข้าสู่ระบบ</Link></form></main>;
}
