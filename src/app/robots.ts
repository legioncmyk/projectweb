// Robots.txt configuration for ZallTopUp
// This tells search engine crawlers how to index the site

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/owner/', '/_next/'],
      },
    ],
    sitemap: 'https://zalltopup.com/sitemap.xml',
  }
}
