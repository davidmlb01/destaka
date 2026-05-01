// =============================================================================
// DESTAKA — Structured Logger
// Emite JSON logs pesquisáveis no Vercel Runtime Logs
// =============================================================================

type Level = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  ts: string
  level: Level
  service: string
  msg: string
  [key: string]: unknown
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
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
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
