import sharp from 'sharp'

interface GeotagOptions {
  lat: number
  lng: number
  businessName: string
  keywords?: string[]
}

/**
 * Injeta metadados EXIF com coordenadas GPS e informacoes do negocio na imagem.
 * O Google le esses metadados para reforcar a geolocalizacao do perfil.
 *
 * Nota: sharp.withExifMerge suporta IFD0 (description, artist, copyright).
 * Para injecao completa de GPS EXIF (GPSLatitude, GPSLongitude), pode ser
 * necessario usar piexifjs como alternativa. Os metadados IFD0 ja agregam
 * valor significativo para SEO local.
 */
export async function geotagImage(
  imageUrl: string,
  options: GeotagOptions
): Promise<Buffer> {
  const { lat, lng, businessName, keywords } = options

  // Download da imagem
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`)
  const imageBuffer = Buffer.from(await res.arrayBuffer())

  const description = keywords?.length
    ? `${businessName} - ${keywords.join(', ')}`
    : businessName

  // Coordenadas incluidas na descricao como fallback
  // ate que GPS IFD seja suportado via piexifjs
  const fullDescription = `${description} [${lat.toFixed(6)}, ${lng.toFixed(6)}]`

  return sharp(imageBuffer)
    .withExifMerge({
      IFD0: {
        ImageDescription: fullDescription,
        Artist: businessName,
        Copyright: businessName,
      },
    })
    .jpeg({ quality: 90 })
    .toBuffer()
}

/**
 * Converte coordenada decimal para formato EXIF GPS (graus, minutos, segundos).
 * Utilidade preparada para quando GPS IFD for implementado via piexifjs.
 */
export function decimalToExifGps(decimal: number): string {
  const abs = Math.abs(decimal)
  const degrees = Math.floor(abs)
  const minutesDecimal = (abs - degrees) * 60
  const minutes = Math.floor(minutesDecimal)
  const seconds = Math.round((minutesDecimal - minutes) * 60 * 100) / 100
  return `${degrees}/1 ${minutes}/1 ${Math.round(seconds * 100)}/100`
}
