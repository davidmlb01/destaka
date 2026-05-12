import { Feed } from 'feed'
import { getAllPosts } from './posts'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

export function generateRssFeed(): string {
  const posts = getAllPosts()

  const feed = new Feed({
    title: 'Destaka Blog',
    description:
      'Conteudo sobre presenca digital, SEO local e Google Meu Negocio para profissionais de saude.',
    id: `${SITE_URL}/blog`,
    link: `${SITE_URL}/blog`,
    language: 'pt-BR',
    image: `${SITE_URL}/icon.svg`,
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `Todos os direitos reservados ${new Date().getFullYear()}, Destaka`,
    feedLinks: {
      rss2: `${SITE_URL}/blog/feed.xml`,
    },
    author: {
      name: 'Destaka',
      link: SITE_URL,
    },
  })

  for (const post of posts) {
    const fm = post.frontmatter
    feed.addItem({
      title: fm.title,
      id: `${SITE_URL}/blog/${fm.slug}`,
      link: `${SITE_URL}/blog/${fm.slug}`,
      description: fm.description,
      date: new Date(fm.updatedAt ?? fm.publishedAt),
      published: new Date(fm.publishedAt),
      author: [{ name: fm.author }],
      category: [{ name: fm.category }],
    })
  }

  return feed.rss2()
}
