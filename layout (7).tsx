import { SchoolProvider } from '@/components/school-provider';
import { AppShell } from '@/components/app-shell';
export default function Layout({ children }: { children: React.ReactNode }) { return <SchoolProvider><AppShell>{children}</AppShell></SchoolProvider>; }
