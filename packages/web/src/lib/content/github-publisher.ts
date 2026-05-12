// =============================================================================
// DESTAKA Content Pipeline — GitHub Publisher
// Cria commit automatico via GitHub REST API para novos arquivos de conteudo.
// Dispara rebuild no Vercel via push na branch main.
// =============================================================================

import { logger } from '@/lib/logger'

const SERVICE = 'content/github-publisher'

interface FileToCommit {
  /** Caminho relativo a raiz do repo (ex: packages/web/content/posts/meu-artigo.mdx) */
  path: string
  /** Conteudo do arquivo em texto */
  content: string
}

interface GitHubBlobResponse {
  sha: string
}

interface GitHubRefResponse {
  object: { sha: string }
}

interface GitHubCommitResponse {
  sha: string
  tree: { sha: string }
}

interface GitHubTreeResponse {
  sha: string
}

interface GitHubCreateCommitResponse {
  sha: string
  html_url: string
}

/**
 * Faz commit de multiplos arquivos na branch main via GitHub REST API.
 *
 * Fluxo:
 * 1. GET ref main (sha do ultimo commit)
 * 2. GET tree do commit atual
 * 3. POST create blob para cada arquivo
 * 4. POST create tree com os novos blobs
 * 5. POST create commit
 * 6. PATCH update ref main
 */
export async function commitContentFiles(
  files: FileToCommit[],
  message: string
): Promise<{ commitSha: string; commitUrl: string }> {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO

  if (!token) {
    throw new Error('GITHUB_TOKEN nao configurado. Commit automatico impossivel.')
  }
  if (!repo) {
    throw new Error('GITHUB_REPO nao configurado (formato: owner/repo).')
  }

  const apiBase = `https://api.github.com/repos/${repo}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }

  logger.info(SERVICE, `iniciando commit de ${files.length} arquivos`, { repo })

  // 1. Busca ref da branch main
  const refRes = await fetch(`${apiBase}/git/ref/heads/main`, { headers })
  if (!refRes.ok) {
    const body = await refRes.text()
    throw new Error(`Falha ao buscar ref main: ${refRes.status} ${body}`)
  }
  const refData = (await refRes.json()) as GitHubRefResponse
  const latestCommitSha = refData.object.sha

  logger.info(SERVICE, `ref main: ${latestCommitSha.slice(0, 8)}`)

  // 2. Busca tree do commit atual
  const commitRes = await fetch(`${apiBase}/git/commits/${latestCommitSha}`, { headers })
  if (!commitRes.ok) {
    const body = await commitRes.text()
    throw new Error(`Falha ao buscar commit: ${commitRes.status} ${body}`)
  }
  const commitData = (await commitRes.json()) as GitHubCommitResponse
  const baseTreeSha = commitData.tree.sha

  // 3. Cria blobs para cada arquivo
  const treeItems: Array<{
    path: string
    mode: '100644'
    type: 'blob'
    sha: string
  }> = []

  for (const file of files) {
    const blobRes = await fetch(`${apiBase}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      }),
    })

    if (!blobRes.ok) {
      const body = await blobRes.text()
      logger.error(SERVICE, `falha ao criar blob: ${file.path}`, { status: blobRes.status, body })
      throw new Error(`Falha ao criar blob para ${file.path}: ${blobRes.status}`)
    }

    const blobData = (await blobRes.json()) as GitHubBlobResponse
    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    })
  }

  logger.info(SERVICE, `${treeItems.length} blobs criados`)

  // 4. Cria nova tree
  const treeRes = await fetch(`${apiBase}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  })

  if (!treeRes.ok) {
    const body = await treeRes.text()
    throw new Error(`Falha ao criar tree: ${treeRes.status} ${body}`)
  }

  const treeData = (await treeRes.json()) as GitHubTreeResponse

  // 5. Cria commit
  const newCommitRes = await fetch(`${apiBase}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [latestCommitSha],
    }),
  })

  if (!newCommitRes.ok) {
    const body = await newCommitRes.text()
    throw new Error(`Falha ao criar commit: ${newCommitRes.status} ${body}`)
  }

  const newCommit = (await newCommitRes.json()) as GitHubCreateCommitResponse

  // 6. Atualiza ref main
  const updateRefRes = await fetch(`${apiBase}/git/refs/heads/main`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: newCommit.sha }),
  })

  if (!updateRefRes.ok) {
    const body = await updateRefRes.text()
    throw new Error(`Falha ao atualizar ref main: ${updateRefRes.status} ${body}`)
  }

  logger.info(SERVICE, `commit criado com sucesso`, {
    sha: newCommit.sha.slice(0, 8),
    url: newCommit.html_url,
    files: files.length,
  })

  return {
    commitSha: newCommit.sha,
    commitUrl: newCommit.html_url,
  }
}
