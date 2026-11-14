import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const indexHtmlPath = path.join(distDir, 'index.html')

if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')

  // 1. Create 404.html and 200.html fallbacks (used automatically by Vercel, Render Static, Surge, GitHub Pages)
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml)
  fs.writeFileSync(path.join(distDir, '200.html'), indexHtml)

  // 2. Create _redirects for Render Static Site / Netlify / Cloudflare Pages
  fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n')

  // 3. Pre-create static index.html in all client SPA routes so direct reloads return 200 OK everywhere
  const spaRoutes = [
    'auth/login',
    'auth/register',
    'auth/forgot-password',
    'courses',
    'courses/image-to-video',
    'courses/demo-professional-ai-voiceover-consent-based-voice-studio',
    'courses/demo-authorized-ai-character-design-talking-avatars',
    'courses/demo-cinematic-ai-video-production-masterclass',
    'checkout/image-to-video',
    'checkout/demo-professional-ai-voiceover-consent-based-voice-studio',
    'checkout/demo-authorized-ai-character-design-talking-avatars',
    'checkout/demo-cinematic-ai-video-production-masterclass',
    'about',
    'contact',
    'terms',
    'privacy',
    'refund',
    'refund-policy',
    'disclaimer',
    'dashboard',
    'dashboard/learning',
    'dashboard/certificates',
    'dashboard/purchases',
    'dashboard/settings',
    'dashboard/support',
    'admin',
    'admin/dashboard',
    'admin/courses',
    'admin/courses/create',
    'admin/students',
    'admin/orders',
    'admin/reviews',
    'admin/settings',
    'admin/support',
    'admin/coupons',
    'admin/categories',
  ]

  for (const route of spaRoutes) {
    const routeDir = path.join(distDir, route)
    fs.mkdirSync(routeDir, { recursive: true })
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml)
  }

  console.log(`✅ Generated SPA fallback files (404.html, 200.html, _redirects) and ${spaRoutes.length} route entrypoints.`)
}
