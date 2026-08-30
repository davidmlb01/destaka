import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  let debugInfo = 'starting'

  try {
    debugInfo = 'creating supabase client'
    const supabase = await createClient()

    debugInfo = 'getting user'
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      debugInfo = `no user: ${authError?.message ?? 'null'}`
      return (
        <div style={{ padding: 40, color: 'white', background: '#071a19', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Dashboard Debug</h1>
          <p>Status: {debugInfo}</p>
          <p style={{ marginTop: 16 }}>
            <a href="/login" style={{ color: '#14B8A6' }}>Ir para login</a>
          </p>
        </div>
      )
    }

    debugInfo = 'querying professional'
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, name, organization_id, role')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (profError) {
      debugInfo = `professional error: ${profError.message} (${profError.code})`
    } else if (!professional) {
      debugInfo = 'no professional row found'
    } else if (!professional.organization_id) {
      debugInfo = 'professional has no organization_id'
    } else {
      debugInfo = `professional found: ${professional.name}, org: ${professional.organization_id}`

      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', professional.organization_id)
        .maybeSingle()

      debugInfo += ` | org name: ${org?.name ?? 'not found'}`
    }

    return (
      <div style={{ padding: 40, color: 'white', background: '#071a19', minHeight: '100vh' }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Dashboard Debug</h1>
        <p>User: {authData.user.email}</p>
        <p>Status: {debugInfo}</p>
        <p style={{ marginTop: 16 }}>
          <a href="/api/auth/signout" style={{ color: '#14B8A6', marginRight: 16 }}>Sair</a>
          <a href="/" style={{ color: '#14B8A6' }}>Home</a>
        </p>
      </div>
    )
  } catch (err) {
    return (
      <div style={{ padding: 40, color: 'white', background: '#071a19', minHeight: '100vh' }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Dashboard Debug - CATCH</h1>
        <p>Last step: {debugInfo}</p>
        <p>Error: {err instanceof Error ? err.message : String(err)}</p>
        <p style={{ marginTop: 8, fontSize: 12, opacity: 0.5 }}>
          {err instanceof Error ? err.stack : ''}
        </p>
        <p style={{ marginTop: 16 }}>
          <a href="/api/auth/signout" style={{ color: '#14B8A6', marginRight: 16 }}>Sair</a>
          <a href="/" style={{ color: '#14B8A6' }}>Home</a>
        </p>
      </div>
    )
  }
}
