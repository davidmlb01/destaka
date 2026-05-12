import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

export interface PostFrontmatter {
  title: string
  description: string
  slug: string
  category: string
  tags: string[]
  author: string
  publishedAt: string
  updatedAt: string
  readingTime: number
  coverImage?: string
  coverAlt?: string
  schema: 'article' | 'faq' | 'howto'
  featured: boolean
  relatedPosts: string[]
  faqItems: Array<{ q: string; a: string }>
}

export interface Post {
  frontmatter: PostFrontmatter
  content: string
}

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }
}

export function getAllPosts(): Post[] {
  ensurePostsDir()

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
    const { data, content } = matter(raw)
    const rt = readingTime(content)

    return {
      frontmatter: {
        ...data,
        slug: data.slug ?? file.replace(/\.mdx$/, ''),
        readingTime: Math.ceil(rt.minutes),
        featured: data.featured ?? false,
        relatedPosts: data.relatedPosts ?? [],
        faqItems: data.faqItems ?? [],
        tags: data.tags ?? [],
        schema: data.schema ?? 'article',
      } as PostFrontmatter,
      content,
    }
  })

  return posts.sort(
    (a, b) =>
      new Date(b.frontmatter.publishedAt).getTime() -
      new Date(a.frontmatter.publishedAt).getTime(),
  )
}

export function getPostBySlug(slug: string): Post | null {
  const posts = getAllPosts()
  return posts.find((p) => p.frontmatter.slug === slug) ?? null
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter(
    (p) => p.frontmatter.category.toLowerCase() === category.toLowerCase(),
  )
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) =>
    p.frontmatter.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()),
  )
}

export function getAllCategories(): string[] {
  const posts = getAllPosts()
  const cats = new Set(posts.map((p) => p.frontmatter.category))
  return Array.from(cats).sort()
}

export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tags = new Set(posts.flatMap((p) => p.frontmatter.tags))
  return Array.from(tags).sort()
}
