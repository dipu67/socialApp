import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/_next/',
          '/dashboard/',
          '/settings/',
          '/profile/*/edit',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/chat/', '/messages/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/chat/', '/messages/'],
      },
    ],
    sitemap: 'https://chatapp.com/sitemap.xml',
    host: 'https://chatapp.com',
  }
}
