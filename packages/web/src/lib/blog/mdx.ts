import { compileMDX } from 'next-mdx-remote/rsc'
import { Callout } from '@/components/blog/mdx/Callout'
import { StatCard } from '@/components/blog/mdx/StatCard'
import { CTABox } from '@/components/blog/mdx/CTABox'
import { BlogImage } from '@/components/blog/mdx/BlogImage'
import { FAQ } from '@/components/blog/mdx/FAQ'

const components = {
  Callout,
  StatCard,
  CTABox,
  BlogImage,
  FAQ,
}

export async function compileMdxContent(source: string) {
  const { content } = await compileMDX({
    source,
    components,
    options: {
      parseFrontmatter: false,
    },
  })

  return content
}
