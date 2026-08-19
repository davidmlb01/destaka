import { ImageResponse } from 'next/og'

export const alt = 'Destaka Saúde — presença digital para profissionais de saúde'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#071a19',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#14B8A6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: '#071a19',
            }}
          >
            D
          </div>
          <span style={{ color: '#14B8A6', fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>
            Destaka Saúde
          </span>
        </div>

        <h1
          style={{
            color: '#ffffff',
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-2px',
            margin: 0,
            marginBottom: 24,
          }}
        >
          Seu perfil no Google
          <br />
          trabalhando por você.
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 24, margin: 0, lineHeight: 1.5 }}>
          Presença digital no piloto automático para profissionais de saúde.
        </p>

        <div style={{ marginTop: 48, display: 'flex' }}>
          <div
            style={{
              background: '#14B8A6',
              color: '#071a19',
              padding: '14px 28px',
              borderRadius: 8,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Diagnóstico gratuito em 30 segundos
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
