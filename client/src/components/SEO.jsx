import { useEffect } from 'react'
import { buildPublicUrl } from '../utils/siteUrl'

const DEFAULT_IMAGE = '/vowlink-logo.webp'

const setMeta = (selector, attributeName, attributeValue, content) => {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attributeName, attributeValue)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const setLink = (rel, href) => {
  let tag = document.head.querySelector(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

const SEO = ({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  noindex = false,
}) => {
  useEffect(() => {
    const canonicalUrl = buildPublicUrl(path)
    const imageUrl = image.startsWith('http') ? image : buildPublicUrl(image)

    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')
    setLink('canonical', canonicalUrl)

    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl)
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'VowLink')

    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl)
  }, [description, image, noindex, path, title])

  return null
}

export default SEO
