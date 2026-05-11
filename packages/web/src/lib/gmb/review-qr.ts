// =============================================================================
// DESTAKA — QR Code para Reviews do Google
// Gera link direto para avaliação + QR code SVG
// =============================================================================

/**
 * Retorna o link direto de avaliação no Google para um determinado placeId.
 */
export function getReviewLink(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`
}
