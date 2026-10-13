'use client';
import { useTimeline } from '@/lib/use-timeline';
import { Composer } from '@/components/composer';
import { TimelineItem } from '@/components/timeline-item';
import { Status } from '@/components/status';
export default function Page() {
  const timeline = useTimeline('posts');
  return <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
    <section className="min-w-0"><div className="glass mb-5 overflow-hidden"><div className="p-6"><p className="text-xs tracking-widest text-school-pink">THE SCHOOL FEED</p><h1 className="mt-2 text-2xl font-bold">เรื่องราวของพวกเรา ♡</h1><p className="mt-2 text-sm text-school-muted">แบ่งปันความรู้ เรื่องสนุก และกำลังใจให้กัน</p></div><Composer table="posts" onSent={timeline.refresh}/></div>
      <Status loading={timeline.loading && !timeline.entries.length} error={timeline.error} retry={timeline.reload} empty={!timeline.loading && !timeline.error && !timeline.entries.length ? 'ยังไม่มีโพสต์ มาเป็นคนแรกที่แบ่งปันเรื่องราวกัน' : undefined}/>
      <div className="space-y-4">{timeline.entries.map(entry => <TimelineItem key={entry.id} entry={entry} author={timeline.authors[entry.author_id]} table="posts" onDeleted={timeline.remove}/>)}</div>
      {timeline.hasMore && <button disabled={timeline.loadingMore} onClick={timeline.loadMore} className="soft-button mt-5 w-full">{timeline.loadingMore ? 'กำลังโหลด…' : 'ดูโพสต์ก่อนหน้า'}</button>}
    </section><aside className="hidden space-y-5 xl:block"><div className="glass overflow-hidden"><img src="/school.svg" alt="ภาพวาดโรงเรียน"/><div className="p-5"><h2 className="font-bold">เพราะที่นี่คือเพื่อนกัน</h2><p className="mt-2 text-sm leading-6 text-school-muted">คุยกันได้ทุกเรื่อง ด้วยความสุภาพและเคารพกัน</p></div></div><div className="glass p-5"><h2 className="font-bold">ส่งต่อคำขอบคุณ ♡</h2><p className="mt-3 text-sm leading-7 text-school-muted">กด “ขอบคุณเพื่อน” เมื่อโพสต์มีประโยชน์ เพื่อนจะได้ 10 คะแนนเกียรติยศ ให้ได้คนละ 1 ครั้งต่อวัน สูงสุด 5 คนต่อวัน</p></div></aside>
  </div>;
}
