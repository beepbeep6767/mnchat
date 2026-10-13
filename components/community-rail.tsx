'use client';
import Link from 'next/link';
import { useTimeline } from '@/lib/use-timeline';
import { displayDate } from '@/lib/helpers';
import { Status } from './status';
export function CommunityRail() {
  const timeline=useTimeline('posts'); const post=timeline.entries[0];
  return <aside className="community-rail"><div className="community-banner"><div><strong>MNChat</strong><p>คุยกันได้ทุกเรื่อง<br/>เพราะที่นี่คือเพื่อนกัน ♡</p></div></div><section className="rail-card"><h2>ชุมชนของพวกเรา <Link href="/honor">ดูอันดับ ›</Link></h2><p className="rail-intro">แบ่งปันความรู้ ช่วยเหลือเพื่อน<br/>และส่งต่อกำลังใจให้กัน ♡</p><Link className="rail-action" href="/feed">ไปที่ฟีดข่าว →</Link></section><section className="rail-card"><h2>โพสต์ล่าสุด <Link href="/feed">ดูทั้งหมด ›</Link></h2><Status loading={timeline.loading&&!post} error={timeline.error} retry={timeline.reload} empty={!timeline.loading&&!timeline.error&&!post?'ยังไม่มีโพสต์ มาแบ่งปันเรื่องราวกัน':undefined}/>{post&&<><div className="rail-author"><span className="letter-avatar">{(timeline.authors[post.author_id]?.username??'?')[0]}</span><div><b>{timeline.authors[post.author_id]?.username??'นักเรียน'}</b><small>{displayDate(post.created_at)}</small></div></div><p className="rail-post">{post.content}</p></>}</section></aside>;
}
