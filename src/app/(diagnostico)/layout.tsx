import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isActiveSubscriber } from '@/lib/subscription'

export default async function DiagnosticoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Assinantes vao direto pro dashboard
  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (professional?.organization_id) {
    const isSubscriber = await isActiveSubscriber(professional.organization_id)
    if (isSubscriber) redirect('/dashboard')
  }

  return <>{children}</>
}
