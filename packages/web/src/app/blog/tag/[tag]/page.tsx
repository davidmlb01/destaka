import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllTags, getPostsByTag } from '@/lib/blog/posts'
import { PostCard } from '@/components/blog/PostCard'

interface PageProps {
  params: Promise<{ tag: string }>
}

export async function generateStaticParams() {
  const tags = getAllTags()
  return tags.map((t) => ({ tag: t.toLowerCase() }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `#${decoded} | Blog Destaka`,
    description: `Artigos com a tag ${decoded}.`,
  }
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const posts = getPostsByTag(decoded)

  return (
    <div className="mx-auto px-5 py-12" style={{ maxWidth: 1080 }}>
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
          <Link
            href="/blog"
            className="font-body transition-colors hover:underline"
            style={{ color: '#6B7280' }}
          >
            Blog
          </Link>
          <span style={{ color: '#D1D5DB' }}>/</span>
          <span className="font-body" style={{ color: '#0F2A1F' }}>
            #{decoded}
          </span>
        </nav>
        <h1
          className="font-display font-bold"
          style={{ color: '#0F2A1F', fontSize: '36px', lineHeight: '44px' }}
        >
          #{decoded}
        </h1>
      </div>

      {posts.length === 0 ? (
        <p className="font-body text-sm" style={{ color: '#6B7280' }}>
          Nenhum artigo com esta tag.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <PostCard key={p.frontmatter.slug} post={p.frontmatter} />
          ))}
        </div>
      )}
    </div>
  )
}
