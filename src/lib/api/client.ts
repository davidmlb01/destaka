export async function apiFetch<T>(url: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string }
      return { error: err.error ?? 'Erro inesperado' }
    }
    const data = await res.json() as T
    return { data }
  } catch {
    return { error: 'Erro de conexão' }
  }
}
