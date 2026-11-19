import { parse } from 'node-html-parser'

export function homepagePreheatUrls(html: string, origin: URL) {
  const document = parse(html)
  const urls = new Set<string>([new URL('/', origin).toString()])

  function add(value: string | undefined) {
    if (!value || value.startsWith('#')) return
    try {
      const url = new URL(value, origin)
      if (url.origin !== origin.origin) return
      url.hash = ''
      urls.add(url.toString())
    } catch {
      // Ignore invalid resource URLs in the page markup.
    }
  }

  for (const link of document.querySelectorAll('link[href]')) {
    const rel = (link.getAttribute('rel') || '').split(/\s+/)
    if (rel.some(value => ['stylesheet', 'modulepreload', 'preload', 'prefetch', 'icon'].includes(value))) {
      add(link.getAttribute('href'))
    }
  }
  for (const script of document.querySelectorAll('script[src]')) add(script.getAttribute('src'))
  for (const image of document.querySelectorAll('img[src]')) add(image.getAttribute('src'))
  for (const video of document.querySelectorAll('video[poster]')) add(video.getAttribute('poster'))

  return [...urls]
}
