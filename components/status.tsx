export function Status({ loading, error, empty, retry }: { loading?: boolean; error?: string; empty?: string; retry?: () => void }) {
  if (loading) return <div role="status" className="p-8 text-center text-school-muted"><span className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-100 border-t-school-blue"/><p>กำลังโหลด…</p></div>;
  if (error) return <div role="alert" className="m-4 rounded-2xl bg-pink-50 p-4 text-sm text-rose-700">{error}{retry && <button onClick={retry} className="ml-3 underline">ลองใหม่</button>}</div>;
  if (empty) return <p className="p-8 text-center text-sm text-school-muted">{empty}</p>;
  return null;
}
