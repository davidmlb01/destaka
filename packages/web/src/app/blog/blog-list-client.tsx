'use client'

import { useState, useMemo } from 'react'
import { PostCard } from '@/components/blog/PostCard'
import { BlogSearch } from '@/components/blog/BlogSearch'
import { CategoryFilter } from '@/components/blog/CategoryFilter'
import type { PostFrontmatter } from '@/lib/blog/posts'

interface BlogListClientProps {
  posts: PostFrontmatter[]
  categories: string[]
}

export function BlogListClient({ posts, categories }: BlogListClientProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = posts

    if (activeCategory) {
      result = result.filter(
        (p) => p.category.toLowerCase() === activeCategory.toLowerCase(),
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    return result
  }, [posts, search, activeCategory])

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="sm:w-72">
          <BlogSearch onSearch={setSearch} />
        </div>
        <div className="flex-1">
          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p
            className="font-body text-sm"
            style={{ color: '#6B7280' }}
          >
            Nenhum artigo encontrado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </>
  )
}
