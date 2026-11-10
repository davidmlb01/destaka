import { PostsContent } from '@/components/dashboard/PostsContent'
import { Badge } from '@/components/ui/Badge'

export default function PostsPage() {
  return (
    <div className="px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-3">Posts</Badge>
        <h1 className="font-display font-semibold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
          Posts Automáticos
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-tertiary)', fontSize: 15, lineHeight: 1.6 }}>
          O Destaka cria e publica posts no seu Google Meu Negócio toda semana. Você escolhe se quer aprovar antes de publicar ou deixar no piloto automático.
        </p>
      </div>
      <PostsContent />
    </div>
  )
}
