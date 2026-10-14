import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ enabled: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) }, { headers: { 'Cache-Control': 'no-store' } });
}
