declare module 'piexifjs' {
  const ImageIFD: Record<string, number>
  const ExifIFD: Record<string, number>
  const GPSIFD: Record<string, number>
  function load(data: string): Record<string, Record<string, unknown>>
  function dump(exifObj: Record<string, Record<string, unknown>>): string
  function insert(exifBytes: string, jpegData: string): string
  export default { ImageIFD, ExifIFD, GPSIFD, load, dump, insert }
}
