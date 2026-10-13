import type { Metadata } from 'next';
import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'MNChat · เพื่อนดี ๆ เริ่มต้นได้ที่นี่', description: 'พื้นที่พูดคุยและแบ่งปันสำหรับนักเรียนโรงเรียนมหรรณพาราม' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
