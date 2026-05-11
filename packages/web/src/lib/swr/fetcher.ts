export const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Erro ao carregar')
    return r.json()
  })
