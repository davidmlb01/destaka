// =============================================================================
// DESTAKA — Structured Logger
// Emite JSON logs pesquisáveis no Vercel Runtime Logs.
// Erros críticos disparam alerta no Slack via SLACK_WEBHOOK_URL.
// =============================================================================

type Level = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  ts: string
  level: Level
  service: string
  msg: string
  [key: string]: unknown
}

function notifySlack(service: string, msg: string, data?: Record<string, unknown>): void {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return

  const text = [
    `🔴 *ERRO — Destaka Produção*`,
    `*Serviço:* \`${service}\``,
    `*Mensagem:* ${msg}`,
    data ? `*Dados:* \`\`\`${JSON.stringify(data, null, 2).slice(0, 800)}\`\`\`` : null,
  ].filter(Boolean).join('\n')

  // fire-and-forget — não bloqueia o caller
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch(() => {
    // falha silenciosa — o Slack não pode derrubar o app
  })
}

function emit(level: Level, service: string, msg: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    service,
    msg,
    ...data,
  }
  const line = JSON.stringify(entry)
  if (level === 'error') {
    console.error(line)
    if (process.env.NODE_ENV === 'production') {
      notifySlack(service, msg, data)
    }
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  info: (service: string, msg: string, data?: Record<string, unknown>) =>
    emit('info', service, msg, data),
  warn: (service: string, msg: string, data?: Record<string, unknown>) =>
    emit('warn', service, msg, data),
  error: (service: string, msg: string, data?: Record<string, unknown>) =>
    emit('error', service, msg, data),
  debug: (service: string, msg: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', service, msg, data)
  },
}
