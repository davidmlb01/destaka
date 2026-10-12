import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const VIP_EMAILS = (process.env.VIP_BYPASS_EMAILS ?? '').split(',').filter(Boolean)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // VIP bypass (testing/admin)
  const isVip = !!user.email && VIP_EMAILS.includes(user.email)

  if (!isVip) {
    // Verifica se usuario tem role admin
    const serviceClient = await createServiceClient()
    const { data: userData } = await serviceClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') redirect('/dashboard')
  }

  return <>{children}</>
}
