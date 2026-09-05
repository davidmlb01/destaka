import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { PostsContent } from '@/components/dashboard/PostsContent'
import { Badge } from '@/components/ui/Badge'

export default async function PostsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await supabase
    .from('professionals').select('id, name, organization_id').eq('user_id', user.id).maybeSingle()

  if (!professional?.organization_id) redirect('/onboarding')

  const { data: org } = await supabase
    .from('organizations').select('name').eq('id', professional.organization_id).single()

  const profileName = org?.name ?? 'Meu Perfil'

  return (
    <DashboardLayout activeHref="/dashboard/posts" profileName={profileName} userEmail={user.email ?? ''}>
      <div className="px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <Badge className="mb-3">Posts</Badge>
          <h1 className="font-display font-extrabold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
            Posts Automáticos
          </h1>
          <p className="mt-2" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.6 }}>
            O Destaka cria e publica posts no seu Google Meu Negócio toda semana. Você escolhe se quer aprovar antes de publicar ou deixar no piloto automático.
          </p>
        </div>
        <PostsContent />
      </div>
    </DashboardLayout>
  )
}
