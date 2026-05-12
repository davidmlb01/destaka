import type { Metadata } from 'next'
import { getAllPosts, getAllCategories } from '@/lib/blog/posts'
import { BlogListClient } from './blog-list-client'

export const metadata: Metadata = {
  title: 'Blog | Destaka',
  description:
    'Artigos sobre presença digital, SEO local e Google Meu Negócio para profissionais de saúde.',
  openGraph: {
    title: 'Blog | Destaka',
    description:
      'Artigos sobre presença digital, SEO local e Google Meu Negócio para profissionais de saúde.',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()
  const categories = getAllCategories()

  return (
    <div className="mx-auto px-5 py-12" style={{ maxWidth: 1080 }}>
      <div className="mb-10">
        <h1
          className="font-display font-bold mb-3"
          style={{ color: '#0F2A1F', fontSize: '36px', lineHeight: '44px' }}
        >
          Blog
        </h1>
        <p
          className="font-body text-lg"
          style={{ color: '#4B5563', lineHeight: '1.6' }}
        >
          Conteúdo prático sobre presença digital para profissionais de saúde.
        </p>
      </div>

      <BlogListClient
        posts={posts.map((p) => p.frontmatter)}
        categories={categories}
      />
    </div>
  )
}
