export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { PostsContent } from '@/components/dashboard/PostsContent'
import { Badge } from '@/components/ui/Badge'

export default async function PostsPage() {
  const ctx = await getDashboardContext()
  if (!ctx.isSubscriber) redirect('/dashboard/upgrade?feature=posts')

  return (
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
  )
}
