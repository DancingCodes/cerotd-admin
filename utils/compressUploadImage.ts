export async function compressUploadImage(file: File): Promise<File> {
  if (file.size > 8 * 1024 * 1024) {
    const message = '原图不能超过 8 MiB，请选择更小的文件。'
    useToast().add({ title: message, color: 'error' })
    throw new Error(message)
  }

  if (!['image/jpeg', 'image/png'].includes(file.type)) return file

  let bitmap: ImageBitmap | undefined
  let canvas: HTMLCanvasElement | undefined
  try {
    bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) return file

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas!.toBlob(resolve, 'image/webp', 0.8)
    })
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
      type: 'image/webp',
      lastModified: file.lastModified
    })
  } catch {
    // Keep uploads working if the browser cannot decode or encode the image.
    return file
  } finally {
    bitmap?.close()
    if (canvas) canvas.width = canvas.height = 1
  }
}
