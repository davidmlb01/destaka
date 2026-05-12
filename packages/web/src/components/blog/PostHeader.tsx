import Image from 'next/image'
import Link from 'next/link'
import type { PostFrontmatter } from '@/lib/blog/posts'

interface PostHeaderProps {
  post: PostFrontmatter
}

export function PostHeader({ post }: PostHeaderProps) {
  return (
    <header className="mb-8">
      <nav className="flex items-center gap-1.5 text-sm mb-6" aria-label="Breadcrumb">
        <Link
          href="/blog"
          className="font-body transition-colors"
          style={{ color: '#6B7280' }}
        >
          Blog
        </Link>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <Link
          href={`/blog/categoria/${encodeURIComponent(post.category.toLowerCase())}`}
          className="font-body transition-colors hover:underline"
          style={{ color: '#0F2A1F' }}
        >
          {post.category}
        </Link>
      </nav>

      <div className="flex items-center gap-2 mb-4">
        <span
          className="font-body font-semibold text-xs uppercase tracking-wider px-2.5 py-1 rounded"
          style={{
            color: '#0F2A1F',
            background: 'rgba(74, 222, 128, 0.15)',
          }}
        >
          {post.category}
        </span>
        <span className="font-body text-sm" style={{ color: '#6B7280' }}>
          {post.readingTime} min de leitura
        </span>
      </div>

      <h1
        className="font-display font-bold mb-4"
        style={{
          color: '#0F2A1F',
          fontSize: '36px',
          lineHeight: '44px',
        }}
      >
        {post.title}
      </h1>

      <p
        className="font-body text-lg mb-5"
        style={{ color: '#4B5563', lineHeight: '1.6' }}
      >
        {post.description}
      </p>

      <div className="flex items-center gap-3 mb-6">
        <div>
          <p className="font-body font-medium text-sm" style={{ color: '#1A1A1A' }}>
            {post.author}
          </p>
          <p className="font-body text-xs" style={{ color: '#6B7280' }}>
            {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
            {post.updatedAt && post.updatedAt !== post.publishedAt && (
              <>
                {' · Atualizado em '}
                {new Date(post.updatedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </>
            )}
          </p>
        </div>
      </div>

      {post.coverImage && (
        <div className="rounded-xl overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.coverAlt ?? post.title}
            width={720}
            height={405}
            className="w-full h-auto"
            sizes="(max-width: 768px) 100vw, 720px"
            priority
          />
        </div>
      )}
    </header>
  )
}
