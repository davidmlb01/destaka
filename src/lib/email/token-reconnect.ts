import { resend, FROM } from './index'
import { escapeHtml } from '@/lib/utils/escape-html'
import { getVocab } from '@/lib/vertical-vocab'

interface TokenReconnectParams {
  to: string
  name: string
  specialty?: string | null
}

export async function sendTokenReconnectEmail({ to, name, specialty }: TokenReconnectParams) {
  const vocab = getVocab(specialty)
  const brandSuffix = vocab.brandLabel ? `<span style="font-size:18px;font-weight:300;color:rgba(255,255,255,0.5);letter-spacing:-0.015em;line-height:1;margin-left:4px;">${vocab.brandLabel}</span>` : ''
  const firstName = name.split(' ')[0]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
  const reconnectUrl = `${appUrl}/configuracoes`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:28px 36px;">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:8px;">
              <img src="https://destaka.com.br/email-pin.png" alt="" width="22" height="26" style="display:block;border:0;" />
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.015em;line-height:1;">Destaka</span>
              ${brandSuffix}
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:36px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px;line-height:1.3;">
            ${escapeHtml(firstName)}, seus ${vocab.clientes} não estão te encontrando agora.
          </h1>
          <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 16px;">
            A conexão com o Google foi interrompida. Enquanto estiver desconectado, seu perfil não recebe otimizações e perde visibilidade para novos ${vocab.clientes}.
          </p>

          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:20px;margin:0 0 24px;">
            <p style="font-size:15px;color:#991B1B;margin:0;line-height:1.5;">
              Cada dia sem conexão é um dia em que ${vocab.clientes} buscam o que você oferece e encontram outro profissional. Reconectar leva menos de 1 minuto.
            </p>
          </div>

          <a href="${reconnectUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-top:8px;">
            Reconectar e voltar a atrair ${vocab.clientes}
          </a>

          <p style="font-size:13px;color:#9ca3af;margin:16px 0 0;line-height:1.5;">
            As otimizações geradas ficam salvas como rascunho e serão aplicadas assim que a conexão for restabelecida.
          </p>
        </td></tr>
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
          <p style="font-size:13px;color:#4b5563;margin:0 0 4px;font-weight:500;">${vocab.emailFooter}</p>
          <p style="font-size:11px;color:#9ca3af;margin:0;">Dúvidas? <a href="mailto:suporte@destaka.com.br" style="color:#0f766e;text-decoration:none;">suporte@destaka.com.br</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Seus ${vocab.clientes} não estão te encontrando. Reconecte em 1 minuto`,
    html,
  })
}
