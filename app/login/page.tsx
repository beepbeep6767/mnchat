import { AuthForm } from '@/components/auth-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export default async function Page() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (user) redirect('/feed');
  return <AuthForm mode="login"/>;
}

