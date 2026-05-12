import { compileMdxContent } from '@/lib/blog/mdx'

interface PostBodyProps {
  content: string
}

export async function PostBody({ content }: PostBodyProps) {
  const rendered = await compileMdxContent(content)

  return (
    <div className="blog-prose font-body" style={{ color: '#1A1A1A' }}>
      {rendered}
    </div>
  )
}
