import { ReviewsContent } from '@/components/dashboard/ReviewsContent'
import { ReviewQRCard } from '@/components/dashboard/ReviewQRCard'
import { Badge } from '@/components/ui/Badge'

export default function ReviewsPage() {
  return (
    <div className="px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <Badge className="mb-3">Avaliações</Badge>
        <h1 className="font-display font-semibold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
          Gestão de Avaliações
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-tertiary)', fontSize: 15, lineHeight: 1.6 }}>
          Responder avaliações rápido melhora seu ranking no Google. O Destaka sugere respostas personalizadas, você revisa e publica.
        </p>
      </div>
      <ReviewQRCard />
      <ReviewsContent />
    </div>
  )
}
