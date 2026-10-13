import Link from 'next/link';
export function Brand({ small = false }: { small?: boolean }) {
  return <Link href="/" aria-label="MNChat หน้าหลัก" className="inline-flex items-center gap-3">
    <span className={`${small ? 'h-10 w-10 text-xl' : 'h-14 w-14 text-3xl'} flex items-center justify-center rounded-[35%] bg-gradient-to-br from-school-blue via-sky-300 to-school-pink text-white shadow-lg shadow-blue-200/50`}>♡</span>
    <span><span className={`${small ? 'text-2xl' : 'text-4xl'} font-bold tracking-tight`}><span className="text-school-pink">MN</span><span className="text-school-blue">Chat</span></span><span className="mt-1 block text-[10px] tracking-wide text-school-blue">Connect · Share · Grow Together</span></span>
  </Link>;
}
