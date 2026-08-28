import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default async function KeywordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  const { data: org } = professional?.organization_id
    ? await supabase.from('organizations').select('name').eq('id', professional.organization_id).single()
    : { data: null }

  return (
    <DashboardLayout activeHref="/dashboard/keywords" profileName={org?.name ?? 'Meu Negócio'} userEmail={user.email ?? ''}>
      <div className="px-6 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-white mb-2">Keywords</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Funcionalidade em desenvolvimento.</p>
      </div>
    </DashboardLayout>
  )
}
