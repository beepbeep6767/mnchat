import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
export default async function Page() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  redirect(user ? '/feed' : '/login');
}

