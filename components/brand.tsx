import Link from 'next/link';
export function Brand({ small = false }: { small?: boolean }) {
  return <Link href="/" aria-label="MNChat หน้าหลัก" className={`mn-brand ${small ? 'mn-brand-small' : ''}`}>
    <svg className="mn-mark" viewBox="0 0 80 80" aria-hidden="true"><defs><linearGradient id="mn-mark-color" x1="0" x2="1" y2="1"><stop stopColor="#169cff"/><stop offset=".48" stopColor="#75d2ff"/><stop offset="1" stopColor="#f49bdd"/></linearGradient></defs><path d="M40 3C19 3 4 17 4 37c0 11 5 21 13 27l-3 12 16-7c24 6 46-10 46-32C76 17 60 3 40 3Z" fill="url(#mn-mark-color)" stroke="white" strokeWidth="1.8"/><path d="M24 24c10-6 24-6 34 1 8 8 6 22-5 27l-17 2-12 9 3-15c-11-5-11-17-3-24Z" fill="white"/><path d="m30 35-4 5 8 8 6-4 6 4 10-11-5-6-7 6-5-4-6 5-3-3Z" fill="#74bbff"/><path d="M45 28c-3-6-11-3-8 3l8 7 8-7c3-6-5-9-8-3Z" fill="#40aaff"/></svg>
    <span><span className="mn-word"><span>MN</span>Chat</span><span className="mn-tag">Connect · Share · Grow Together</span></span>
  </Link>;
}
