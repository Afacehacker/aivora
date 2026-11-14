import { Helmet } from 'react-helmet-async'

export default function SEO({
  title = 'AIVORA — AI Creative Education Platform',
  description = 'Master AI tools and unlock your creative potential with AIVORA.',
  image = '/og-image.png',
  url = '',
}) {
  const fullTitle = title.includes('AIVORA') ? title : `${title} | AIVORA`
  const fullUrl = `${import.meta.env.VITE_APP_URL || ''}${url}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
