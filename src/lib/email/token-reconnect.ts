import { resend, FROM } from './index'

interface TokenReconnectParams {
  to: string
  name: string
}

export async function sendTokenReconnectEmail({ to, name }: TokenReconnectParams) {
  const firstName = name.split(' ')[0]
  const reconnectUrl = 'https://destaka.com.br/saude/configuracoes'

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#091e2f;padding:24px 32px;">
          <span style="font-family:Outfit,Arial,sans-serif;font-weight:700;font-size:18px;color:#ffffff;letter-spacing:0.5px;">Destaka</span>
          <span style="font-family:Outfit,Arial,sans-serif;font-weight:300;font-size:18px;color:rgba(255,255,255,0.4);letter-spacing:0.5px;margin-left:4px;">Saúde</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#1C1917;margin:0 0 16px;">Olá, ${firstName}!</p>
          <p style="font-size:15px;color:#57534E;line-height:1.6;margin:0 0 24px;">
            Sua conexão com o Google Meu Negócio foi interrompida. Por isso, as otimizações automáticas e posts estão pausados.
          </p>

          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
            <p style="font-size:14px;color:#991B1B;margin:0;line-height:1.5;">
              Isso acontece quando você revoga o acesso nas configurações do Google ou quando as permissões expiram.
              Reconectar é simples e leva menos de 1 minuto.
            </p>
          </div>

          <a href="${reconnectUrl}" style="display:inline-block;background:#0EA5E9;color:#ffffff;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;text-decoration:none;">
            Reconectar agora
          </a>

          <p style="font-size:12px;color:#A8A29E;margin:16px 0 0;line-height:1.5;">
            Enquanto não reconectar, as otimizações geradas ficam salvas como rascunho e serão aplicadas assim que a conexão for reestabelecida.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #E7E5E4;">
          <p style="font-size:11px;color:#A8A29E;margin:0;">Destaka Saúde. Quem te procura, te encontra.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Ação necessária: reconecte sua conta Google',
    html,
  })
}
