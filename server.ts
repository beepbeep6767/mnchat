import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('ยังไม่ได้ตั้งค่า Supabase');
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: { getAll: () => store.getAll(), setAll: values => {
      values.forEach(({ name, value, options }) => store.set(name, value, options));
    } }
  });
}
