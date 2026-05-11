import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { KeywordsContent } from '@/components/dashboard/KeywordsContent'
import { Badge } from '@/components/ui/Badge'

export default async function KeywordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/saude/login')

  const { data: profiles } = await supabase
    .from('gmb_profiles').select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)

  if (!profiles?.length) redirect('/saude/onboarding')
  const profile = profiles[0]

  return (
    <DashboardLayout activeHref="/saude/dashboard/keywords" profileName={profile.name} userEmail={user.email ?? ''}>
      <div className="px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <Badge className="mb-3">Keywords</Badge>
          <h1 className="font-display font-extrabold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
            Palavras-chave de Busca
          </h1>
          <p className="mt-2" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.6 }}>
            Veja como os pacientes encontram seu perfil no Google e descubra novas oportunidades de palavras-chave.
          </p>
        </div>
        <KeywordsContent />
      </div>
    </DashboardLayout>
  )
}
