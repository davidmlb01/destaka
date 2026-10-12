import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResendClient(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured')
    _resend = new Resend(apiKey)
  }
  return _resend
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return (getResendClient() as never)[prop]
  },
})
