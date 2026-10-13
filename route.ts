import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const target = request.nextUrl.searchParams.get('next') === '/update-password' ? '/update-password' : '/feed';
  if (code) {
    try {
      const { error } = await (await createClient()).auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(target, request.url));
    } catch { /* ลิงก์หมดอายุหรือระบบเชื่อมต่อไม่ได้ ให้เริ่มใหม่ */ }
  }
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
