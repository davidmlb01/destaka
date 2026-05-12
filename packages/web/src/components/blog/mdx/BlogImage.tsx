import Image from 'next/image'

interface BlogImageProps {
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

export function BlogImage({
  src,
  alt,
  caption,
  width = 720,
  height = 405,
}: BlogImageProps) {
  return (
    <figure className="my-6">
      <div className="rounded-lg overflow-hidden">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-auto"
          sizes="(max-width: 768px) 100vw, 720px"
        />
      </div>
      {caption && (
        <figcaption
          className="text-center text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
