import sharp from 'sharp'
import piexif from 'piexifjs'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

interface GeotagOptions {
  lat: number
  lng: number
  businessName: string
  keywords?: string[]
}

function adminDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Converte coordenada decimal para formato EXIF GPS (rational array).
 * Formato: [[degrees, 1], [minutes, 1], [seconds*100, 100]]
 */
function decimalToExifRational(decimal: number): [[number, number], [number, number], [number, number]] {
  const abs = Math.abs(decimal)
  const degrees = Math.floor(abs)
  const minutesDecimal = (abs - degrees) * 60
  const minutes = Math.floor(minutesDecimal)
  const seconds = (minutesDecimal - minutes) * 60
  return [[degrees, 1], [minutes, 1], [Math.round(seconds * 100), 100]]
}

const ALLOWED_IMAGE_HOSTS = [
  'instagram.com', 'cdninstagram.com', 'fbcdn.net',
  'scontent.cdninstagram.com', 'scontent-', // scontent-gru1-1.cdninstagram.com
  'googleusercontent.com', 'googleapis.com',
  'supabase.co', // Supabase Storage
]

function validateImageUrl(url: string): void {
  const parsed = new URL(url)
  const allowed = ALLOWED_IMAGE_HOSTS.some(h => parsed.hostname.endsWith(h) || parsed.hostname.includes(h))
  if (!allowed) {
    throw new Error(`[geotag] Blocked fetch to untrusted host: ${parsed.hostname}`)
  }
}

/**
 * Injeta metadados EXIF com coordenadas GPS reais (GPSLatitude, GPSLongitude)
 * e informacoes do negocio na imagem. O Google le esses metadados para
 * reforcar a geolocalizacao do perfil no ranking local.
 */
export async function geotagImage(
  imageUrl: string,
  options: GeotagOptions
): Promise<Buffer> {
  const { lat, lng, businessName, keywords } = options

  validateImageUrl(imageUrl)
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`)
  const imageBuffer = Buffer.from(await res.arrayBuffer())

  const description = keywords?.length
    ? `${businessName} - ${keywords.join(', ')}`
    : businessName

  // Converte para JPEG via sharp (garante formato compativel com piexif)
  const jpegBuffer = await sharp(imageBuffer)
    .jpeg({ quality: 90 })
    .toBuffer()

  // Converte buffer para binary string para piexifjs
  const jpegBinary = jpegBuffer.toString('binary')

  // Carrega EXIF existente ou cria novo
  let exifObj: Record<string, Record<string, unknown>>
  try {
    exifObj = piexif.load(jpegBinary)
  } catch {
    exifObj = { '0th': {}, 'Exif': {}, 'GPS': {}, '1st': {} }
  }

  // IFD0: descricao, artista, copyright
  exifObj['0th'] = exifObj['0th'] || {}
  exifObj['0th'][piexif.ImageIFD.ImageDescription] = description
  exifObj['0th'][piexif.ImageIFD.Artist] = businessName
  exifObj['0th'][piexif.ImageIFD.Copyright] = businessName

  // GPS IFD: coordenadas reais
  exifObj['GPS'] = exifObj['GPS'] || {}
  exifObj['GPS'][piexif.GPSIFD.GPSLatitude] = decimalToExifRational(lat)
  exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S'
  exifObj['GPS'][piexif.GPSIFD.GPSLongitude] = decimalToExifRational(lng)
  exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W'

  // Serializa e injeta EXIF no JPEG
  const exifBytes = piexif.dump(exifObj)
  const geotaggedBinary = piexif.insert(exifBytes, jpegBinary)

  return Buffer.from(geotaggedBinary, 'binary')
}

/**
 * Busca coordenadas do perfil GBP da org, aplica geotag na imagem,
 * faz upload para Supabase Storage e retorna a URL publica.
 * Se qualquer etapa falhar, retorna a imageUrl original (fallback seguro).
 */
export async function geotagAndUpload(
  orgId: string,
  imageUrl: string
): Promise<string> {
  try {
    const db = adminDb()

    const { data: profile } = await db
      .from('gbp_profiles')
      .select('name, latitude, longitude')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (!profile?.latitude || !profile?.longitude) {
      return imageUrl
    }

    const { data: org } = await db
      .from('organizations')
      .select('specialty')
      .eq('id', orgId)
      .maybeSingle()

    const keywords = org?.specialty ? [org.specialty as string] : undefined

    const buffer = await geotagImage(imageUrl, {
      lat: profile.latitude,
      lng: profile.longitude,
      businessName: profile.name ?? 'Negocio',
      keywords,
    })

    const fileName = `${orgId}/${Date.now()}.jpg`
    const { error: uploadError } = await db.storage
      .from('post-images')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('[geotag] Upload falhou:', uploadError.message)
      return imageUrl
    }

    const { data: publicUrl } = db.storage.from('post-images').getPublicUrl(fileName)
    return publicUrl.publicUrl
  } catch (err) {
    console.error('[geotag] Fallback para imagem original:', err)
    return imageUrl
  }
}
