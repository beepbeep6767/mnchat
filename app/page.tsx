import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Landing } from '@/components/landing';
export default async function Page() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (user) redirect('/feed');
  return <Landing/>;
}
