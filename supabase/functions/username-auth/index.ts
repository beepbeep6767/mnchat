import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

const allowedOrigins = new Set(['https://mnolinechat.vercel.app', 'http://localhost:3102', 'http://localhost:3000']);
Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  const cors = {
    'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : 'https://mnolinechat.vercel.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin',
  };
  const reply = (data: Record<string, unknown>, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  if (origin && !allowedOrigins.has(origin)) return reply({ error: 'ไม่อนุญาตเว็บไซต์นี้' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return reply({ error: 'ใช้คำขอ POST เท่านั้น' }, 405);
  try {
    const raw = await request.text();
    if (raw.length > 4096) return reply({ error: 'ข้อมูลยาวเกินไป' });
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object' || !('username' in body) || !('password' in body) || !('action' in body)) {
      return reply({ error: 'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน' });
    }
    const { username, password, action } = body;
    if (typeof username !== 'string' || !/^[A-Za-z0-9_]{4,24}$/.test(username.trim())
      || typeof password !== 'string' || password.length < 8 || password.length > 128
      || (action !== 'signup' && action !== 'login')) return reply({ error: 'ชื่อผู้ใช้ต้องมี 4–24 ตัวอักษร และรหัสผ่าน 8–128 ตัวอักษร' });
    const name = username.trim().toLowerCase();
    const url = Deno.env.get('SUPABASE_URL');
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !secret || !anon) throw new Error('configuration');
    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    // ไม่เก็บ IP หรือชื่อผู้ใช้ตรง ๆ ในตารางจำกัดคำขอ
    const digest = async (value: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret + value)))].map(b => b.toString(16).padStart(2,'0')).join('');
    for (const [key, limit] of [[`ip:${action}:${ip}`, 20], [`name:${action}:${name}`, 10]] as const) {
      const { data, error } = await admin.rpc('consume_auth_attempt', { bucket_key: await digest(key), max_attempts: limit });
      if (error) throw error;
      if (!data) return reply({ error: 'ลองหลายครั้งเกินไป กรุณารอ 10 นาทีแล้วลองใหม่' });
    }
    let email = `${name}@accounts.mnchat.invalid`;
    if (action === 'signup') {
      const { data: ticket, error: ticketError } = await admin.rpc('issue_signup_ticket', { username_value: name });
      if (ticketError || typeof ticket !== 'string') throw ticketError ?? new Error('signup ticket');
      const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true,
        app_metadata: { account_type: 'username' }, user_metadata: { username: username.trim(), signup_ticket: ticket },
      });
      if (error) return reply({ error: 'สมัครไม่สำเร็จ ชื่อผู้ใช้อาจถูกใช้แล้ว หรือรหัสผ่านไม่ผ่านข้อกำหนด' });
    } else {
      // รองรับบัญชีเดิมโดยไม่เปิดเผยอีเมลออกจากเซิร์ฟเวอร์
      const { data: profile, error: profileError } = await admin.from('profiles').select('id').ilike('username', name.replaceAll('_','\\_')).maybeSingle();
      if (profileError) throw profileError;
      if (profile) {
        const { data, error } = await admin.auth.admin.getUserById(profile.id);
        if (error) throw error;
        if (data.user.email) email = data.user.email;
      }
    }
    // ตรวจรหัสผ่านด้วย Supabase Auth ทุกครั้ง ก่อนออก session
    const { data, error } = await auth.auth.signInWithPassword({ email, password });
    if (error || !data.session) return reply({ error: action === 'signup'
      ? 'สร้างบัญชีแล้ว กรุณาลองเข้าสู่ระบบด้วยชื่อและรหัสผ่าน'
      : 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีเดิมยังไม่ยืนยันตัวตน' });
    return reply({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch {
    return reply({ error: 'เชื่อมต่อระบบบัญชีไม่สำเร็จ กรุณาลองใหม่ภายหลัง' });
  }
});
