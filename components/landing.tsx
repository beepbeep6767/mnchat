'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

type DemoMessage = { id: number; from: 'visitor' | 'demo'; text: string };
const replies = ['สวัสดี! ยินดีต้อนรับสู่ MNChat 🌸', 'ลองสมัครสมาชิกแล้วชวนเพื่อนมาแชทกันได้เลย ♡', 'ที่นี่มีฟีดข่าวและแชทส่วนตัวสำหรับเพื่อน ๆ'];

export function Landing() {
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<DemoMessage[]>([{ id: 0, from: 'demo', text: 'สวัสดี! ลองพิมพ์ข้อความเพื่อดูตัวอย่างแชทได้เลย 🌸' }]);
  useEffect(() => { setDark(window.localStorage.getItem('mnchat-theme') === 'dark'); }, []);
  function toggleTheme() { setDark(value => { window.localStorage.setItem('mnchat-theme', value ? 'light' : 'dark'); return !value; }); }
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const text = draft.trim(); if (!text) return;
    setMessages(rows => [...rows, { id: Date.now(), from: 'visitor', text }, { id: Date.now() + 1, from: 'demo', text: replies[rows.filter(row => row.from === 'visitor').length % replies.length] }]);
    setDraft('');
  }
  return <div className={`landing ${dark ? 'landing-dark' : ''}`}>
    <header className="landing-header"><div className="landing-wrap landing-top"><Link href="/" className="landing-logo" aria-label="MNChat หน้าแรก"><span className="landing-logo-mark">♡</span><span>MN<span>Chat</span></span></Link><nav className={menu ? 'landing-nav open' : 'landing-nav'} aria-label="เมนูหลัก"><a href="#about" onClick={() => setMenu(false)}>หน้าแรก</a><a href="#demo" onClick={() => setMenu(false)}>ทดลองแชท</a><a href="#community" onClick={() => setMenu(false)}>ชุมชน</a><a href="#contact" onClick={() => setMenu(false)}>ติดต่อเรา</a></nav><div className="landing-actions"><button type="button" onClick={toggleTheme} aria-label={dark ? 'ใช้ธีมสว่าง' : 'ใช้ธีมมืด'} className="landing-theme">{dark ? '☀' : '☾'}</button><Link href="/login" className="landing-login">เข้าสู่ระบบ</Link><button type="button" onClick={() => setMenu(value => !value)} aria-expanded={menu} aria-label="เปิดเมนู" className="landing-menu">☰</button></div></div></header>
    <main><section id="about" className="landing-hero landing-wrap"><div className="landing-hero-copy"><span className="landing-eyebrow">CONNECT · SHARE · GROW TOGETHER</span><h1>เพื่อนดี ๆ เริ่มต้นได้<span>ที่นี่ ♡</span></h1><p>พื้นที่พูดคุยและแบ่งปันของนักเรียน รู้จักเพื่อนใหม่ผ่านการเพิ่มเพื่อน คุยกันแบบส่วนตัว และส่งต่อเรื่องดี ๆ บนฟีดข่าว</p><div className="landing-cta"><Link href="/signup" className="landing-primary">เริ่มต้นใช้งาน <span aria-hidden="true">↗</span></Link><Link href="/login" className="landing-secondary">ฉันมีบัญชีแล้ว</Link></div></div><div className="landing-preview" aria-label="ตัวอย่างหน้าตา MNChat"><div className="landing-preview-top"><span className="landing-avatar">M</span><div><b>MNChat</b><small>พื้นที่ดี ๆ ของเพื่อน</small></div><span className="landing-live">● ออนไลน์</span></div><div className="landing-preview-note">วันนี้มีเรื่องอะไรอยากแบ่งปันกับเพื่อน ๆ ?</div><div className="landing-preview-bubble">สวัสดีเพื่อน ๆ วันนี้ใครมีเรื่องดี ๆ มาเล่าบ้าง 🌸</div><div className="landing-preview-bubble second">ยินดีที่ได้รู้จักทุกคนเลย ♡</div></div></section>
      <div className="landing-school-band"><div className="landing-wrap">✦ พื้นที่ของนักเรียนโรงเรียนมหรรณพาราม ✦</div></div>
      <section id="demo" className="landing-section landing-wrap"><div className="landing-section-heading"><span>ลองคุยกันก่อน</span><h2>ทดลองแชทกับ MNChat</h2><p>ตัวอย่างนี้ตอบกลับด้วยข้อความที่กำหนดไว้ ไม่ใช่ AI และไม่บันทึกข้อความของคุณ</p></div><div className="landing-demo"><div className="landing-demo-header"><span className="landing-avatar">♡</span><div><b>เพื่อนตัวอย่าง</b><small>แชทจำลอง</small></div></div><div className="landing-demo-messages" aria-live="polite">{messages.map(message => <p key={message.id} className={message.from === 'visitor' ? 'landing-demo-me' : 'landing-demo-them'}>{message.text}</p>)}</div><form onSubmit={send} className="landing-demo-form"><input value={draft} onChange={event => setDraft(event.target.value)} maxLength={280} aria-label="พิมพ์ข้อความตัวอย่าง" placeholder="พิมพ์ข้อความที่นี่…"/><button type="submit" disabled={!draft.trim()}>ส่ง ↗</button></form></div></section>
      <section id="community" className="landing-community"><div className="landing-wrap landing-community-inner"><div><span className="landing-eyebrow">เสียงจากสมาชิก</span><h2>ชุมชนที่เราเติบโตไปด้วยกัน</h2><p>สมาชิกที่เข้าสู่ระบบสามารถให้คะแนน MNChat ได้ 1–5 ดาว ดูจำนวนโหวตจริงของแต่ละระดับ และปรับคะแนนของตนเองได้</p></div><Link href="/ratings" className="landing-primary">ดูผลโหวตและให้ดาว ↗</Link></div></section>
      <section id="contact" className="landing-contact landing-wrap"><div><span className="landing-eyebrow">CONTACT</span><h2>ติดต่อเรา</h2><p>ติดตามข่าวสารและพูดคุยกับ MNChat ผ่าน Instagram</p></div><div className="landing-instagram"><span className="landing-instagram-icon">◎</span><div><b>Instagram</b><small>ช่องทางติดต่อจะประกาศที่นี่</small></div></div></section></main>
    <footer className="landing-footer"><div className="landing-wrap"><b>MNChat ♡</b><span>© 2026 MNChat · Connect · Share · Grow Together</span></div></footer>
  </div>;
}
