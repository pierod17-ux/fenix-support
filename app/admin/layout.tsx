import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Usa la sessione autenticata: la RLS di technician_profiles consente
  // a ciascun utente di leggere il proprio profilo (auth.uid() = id).
  const { data: profile } = await supabase
    .from('technician_profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name ?? user.email ?? ''

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--background)' }}>
      <AdminSidebar
        role={profile?.role ?? 'technician'}
        displayName={displayName}
      />
      <main style={{
        paddingLeft: 0,
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
      }}
        className="admin-main"
      >
        {children}
      </main>
      <style>{`
        @media (min-width: 768px) {
          .admin-main {
            padding-left: 240px !important;
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
