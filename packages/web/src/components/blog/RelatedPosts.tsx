import { PostCard } from './PostCard'
import type { PostFrontmatter } from '@/lib/blog/posts'

interface RelatedPostsProps {
  posts: PostFrontmatter[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null

  return (
    <section className="mt-12 pt-12" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
      <h2
        className="font-display font-semibold mb-6"
        style={{ color: '#0F2A1F', fontSize: '22px', lineHeight: '30px' }}
      >
        Artigos relacionados
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {posts.slice(0, 3).map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
