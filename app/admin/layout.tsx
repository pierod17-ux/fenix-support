import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('technician_profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <AdminSidebar role={profile?.role ?? 'technician'} displayName={profile?.display_name ?? user.email ?? ''} />
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
