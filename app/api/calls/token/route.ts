import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { LIVEKIT_URL: url, LIVEKIT_API_KEY: key, LIVEKIT_API_SECRET: secret } = process.env;
  if (!url || !key || !secret) return NextResponse.json({ error: 'ยังไม่เปิดให้บริการโทร' }, { status: 503 });
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  let callId: string;
  try { callId = (await request.json()).callId; } catch { return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 }); }
  if (typeof callId !== 'string' || !/^[a-f0-9-]{36}$/i.test(callId)) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  const [call, membership] = await Promise.all([
    client.from('calls').select('id,status,created_at').eq('id', callId).maybeSingle(),
    client.from('call_members').select('status').eq('call_id', callId).eq('user_id', user.id).maybeSingle()
  ]);
  if (call.error || membership.error || call.data?.status !== 'active' || membership.data?.status !== 'joined' || Date.now() - new Date(call.data.created_at).getTime() > 2 * 60 * 60 * 1000)
    return NextResponse.json({ error: 'คุณไม่มีสิทธิ์เข้าร่วมสายนี้' }, { status: 403 });
  const token = new AccessToken(key, secret, { identity: user.id, ttl: '10m' });
  token.addGrant({ roomJoin: true, room: `mnchat-${callId}`, canPublish: true, canSubscribe: true });
  return NextResponse.json({ url, token: await token.toJwt() }, { headers: { 'Cache-Control': 'no-store' } });
}
