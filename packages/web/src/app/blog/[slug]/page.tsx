import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts'
import { PostHeader } from '@/components/blog/PostHeader'
import { PostBody } from '@/components/blog/PostBody'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { ShareButtons } from '@/components/blog/ShareButtons'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { StickyMobileCTA } from '@/components/blog/StickyMobileCTA'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((p) => ({ slug: p.frontmatter.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const fm = post.frontmatter
  const url = `${SITE_URL}/blog/${fm.slug}`

  return {
    title: `${fm.title} | Destaka Blog`,
    description: fm.description,
    alternates: { canonical: url },
    openGraph: {
      title: fm.title,
      description: fm.description,
      url,
      type: 'article',
      publishedTime: fm.publishedAt,
      modifiedTime: fm.updatedAt ?? fm.publishedAt,
      authors: [fm.author],
      images: fm.coverImage ? [{ url: fm.coverImage, alt: fm.coverAlt ?? fm.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: fm.title,
      description: fm.description,
      images: fm.coverImage ? [fm.coverImage] : [],
    },
  }
}

function buildJsonLd(post: NonNullable<ReturnType<typeof getPostBySlug>>) {
  const fm = post.frontmatter
  const url = `${SITE_URL}/blog/${fm.slug}`

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 2, name: fm.category, item: `${SITE_URL}/blog/categoria/${encodeURIComponent(fm.category.toLowerCase())}` },
      { '@type': 'ListItem', position: 3, name: fm.title, item: url },
    ],
  }

  const schemas: Record<string, unknown>[] = [
    { '@context': 'https://schema.org', ...breadcrumb },
  ]

  if (fm.schema === 'article' || fm.schema === 'howto') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: fm.title,
      description: fm.description,
      url,
      datePublished: fm.publishedAt,
      dateModified: fm.updatedAt ?? fm.publishedAt,
      author: { '@type': 'Organization', name: fm.author },
      publisher: { '@type': 'Organization', name: 'Destaka', url: SITE_URL },
      ...(fm.coverImage ? { image: fm.coverImage } : {}),
    })
  }

  if (fm.schema === 'faq' && fm.faqItems?.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: fm.faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    })
  }

  if (fm.schema === 'howto') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: fm.title,
      description: fm.description,
    })
  }

  return schemas
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const fm = post.frontmatter
  const url = `${SITE_URL}/blog/${fm.slug}`
  const jsonLd = buildJsonLd(post)

  // Related posts
  const allPosts = getAllPosts()
  const related = fm.relatedPosts.length > 0
    ? fm.relatedPosts
        .map((s) => allPosts.find((p) => p.frontmatter.slug === s))
        .filter(Boolean)
        .map((p) => p!.frontmatter)
    : allPosts
        .filter(
          (p) =>
            p.frontmatter.slug !== fm.slug &&
            p.frontmatter.category === fm.category,
        )
        .slice(0, 3)
        .map((p) => p.frontmatter)

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <article className="mx-auto px-5 py-12" style={{ maxWidth: 1080 }}>
        <div className="flex gap-12">
          {/* Main content */}
          <div className="min-w-0 flex-1" style={{ maxWidth: 720 }}>
            <PostHeader post={fm} />
            <PostBody content={post.content} />
            <ShareButtons url={url} title={fm.title} />

            {fm.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {fm.tags.map((tag) => (
                  <a
                    key={tag}
                    href={`/blog/tag/${encodeURIComponent(tag.toLowerCase())}`}
                    className="font-body text-xs px-2.5 py-1 rounded-lg transition-colors"
                    style={{
                      background: 'rgba(0,0,0,0.04)',
                      color: '#6B7280',
                    }}
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            )}

            <RelatedPosts posts={related} />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block flex-shrink-0" style={{ width: 280 }}>
            <TableOfContents content={post.content} />
          </aside>
        </div>

        {/* Mobile TOC + CTA */}
        <div className="lg:hidden">
          <TableOfContents content={post.content} />
        </div>
      </article>

      <StickyMobileCTA />
    </>
  )
}
