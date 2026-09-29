type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  module: string
  message: string
  orgId?: string
  duration?: number
  [key: string]: unknown
}

function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.module}]`,
    entry.message,
  ]
  if (entry.orgId) parts.push(`org=${entry.orgId}`)
  if (entry.duration !== undefined) parts.push(`${entry.duration}ms`)
  return parts.join(' ')
}

export const logger = {
  info(module: string, message: string, meta?: Record<string, unknown>) {
    console.log(formatLog({ level: 'info', module, message, ...meta }))
  },

  warn(module: string, message: string, meta?: Record<string, unknown>) {
    console.warn(formatLog({ level: 'warn', module, message, ...meta }))
  },

  error(module: string, message: string, meta?: Record<string, unknown>) {
    console.error(formatLog({ level: 'error', module, message, ...meta }))
  },
}
