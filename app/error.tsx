'use client';
import { Status } from '@/components/status';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="min-h-screen p-10"><Status error="โหลดหน้านี้ไม่สำเร็จ กรุณาลองอีกครั้ง" retry={reset}/></main>; }
