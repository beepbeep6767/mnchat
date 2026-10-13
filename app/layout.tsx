import type { Metadata } from 'next';
import './globals.css';
import './experience.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'MNChat · เพื่อนดี ๆ เริ่มต้นได้ที่นี่', description: 'พื้นที่พูดคุยและแบ่งปันสำหรับนักเรียนโรงเรียนมหรรณพาราม' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet"/></head><body>{children}</body></html>;
}
