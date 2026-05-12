import Link from 'next/link'
import Image from 'next/image'
import type { PostFrontmatter } from '@/lib/blog/posts'

interface PostCardProps {
  post: PostFrontmatter
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article
        className="rounded-xl overflow-hidden transition-all"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {post.coverImage && (
          <div className="aspect-[16/9] overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.coverAlt ?? post.title}
              width={720}
              height={405}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1080px) 50vw, 360px"
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="font-body font-semibold text-xs uppercase tracking-wider px-2.5 py-1 rounded"
              style={{
                color: '#0F2A1F',
                background: 'rgba(74, 222, 128, 0.15)',
              }}
            >
              {post.category}
            </span>
            <span
              className="font-body text-xs"
              style={{ color: '#6B7280' }}
            >
              {post.readingTime} min de leitura
            </span>
          </div>
          <h2
            className="font-display font-semibold text-lg mb-2 transition-colors group-hover:text-green-700"
            style={{ color: '#0F2A1F', lineHeight: '1.3' }}
          >
            {post.title}
          </h2>
          <p
            className="font-body text-sm line-clamp-2"
            style={{ color: '#4B5563', lineHeight: '1.6' }}
          >
            {post.description}
          </p>
          <div
            className="mt-3 pt-3 flex items-center gap-2"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <span className="font-body text-xs" style={{ color: '#6B7280' }}>
              {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span className="font-body text-xs" style={{ color: '#6B7280' }}>
              {post.author}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
